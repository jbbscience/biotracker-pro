import { briefCache } from './cache.js';

const TTL = 30 * 60 * 1000; // 30 minutes

export interface MarketBrief {
  summary: string;
  outlook: 'Bullish' | 'Bearish' | 'Mixed';
  themes: string[];
  watchItems: { label: string; detail: string }[];
  generatedAt: string;
}

export interface NewsInput {
  headline: string;
  category: string;
  sentiment: string;
  source: string;
  date: string;
  tickers: string[];
}

// Ticker → primary focus area for theme derivation
const TICKER_FOCUS: Record<string, string> = {
  LLY: 'GLP-1', NVO: 'GLP-1', MRNA: 'mRNA', BNTX: 'mRNA',
  BIIB: "Alzheimer's", CRSP: 'Gene Editing', NTLA: 'Gene Editing',
  AMGN: 'Oncology', GILD: 'HIV/Oncology', REGN: 'Immunology',
  VRTX: 'Rare Disease', ALNY: 'RNAi', ARGX: 'Autoimmune',
  BMRN: 'Rare Disease', INCY: 'Oncology', SRPT: 'Gene Therapy',
  NBIX: 'Neurology', UTHR: 'Pulmonary', IONS: 'Antisense',
  EXEL: 'Oncology', ILMN: 'Genomics', EXAS: 'Diagnostics',
};

function scoreArticle(a: NewsInput): number {
  const catScore: Record<string, number> = { FDA: 5, MA: 4, Clinical: 4, Earnings: 3, Analyst: 2, General: 1 };
  const sentScore = a.sentiment !== 'Neutral' ? 1.4 : 0.8;
  const ageMs = Date.now() - new Date(a.date).getTime();
  const recencyScore = Math.max(0, 1 - ageMs / (48 * 3600 * 1000));
  return (catScore[a.category] ?? 1) * sentScore * (0.4 + recencyScore);
}

function topN<T>(map: Map<T, number>, n: number): [T, number][] {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function generateMarketBriefFromData(articles: NewsInput[]): MarketBrief {
  const cacheKey = 'market_brief_rule';
  const cached = briefCache.get(cacheKey);
  if (cached) return cached as unknown as MarketBrief;

  const now = Date.now();
  // Focus on last 48h for recency; fall back to all if sparse
  const recent48 = articles.filter(a => now - new Date(a.date).getTime() < 48 * 3600 * 1000);
  const pool = recent48.length >= 10 ? recent48 : articles.slice(0, 50);

  // ── Sentiment counts ─────────────────────────────────────────────────────
  const pos = pool.filter(a => a.sentiment === 'Positive').length;
  const neg = pool.filter(a => a.sentiment === 'Negative').length;
  const neu = pool.filter(a => a.sentiment === 'Neutral').length;
  const total = pool.length || 1;
  const posRatio = pos / total;

  // ── Outlook ──────────────────────────────────────────────────────────────
  let outlook: MarketBrief['outlook'];
  if (posRatio >= 0.55) outlook = 'Bullish';
  else if (neg > pos) outlook = 'Bearish';
  else outlook = 'Mixed';

  // ── Category distribution ─────────────────────────────────────────────
  const catMap = new Map<string, number>();
  for (const a of pool) catMap.set(a.category, (catMap.get(a.category) ?? 0) + 1);
  const topCats = topN(catMap, 4);
  const topCat = topCats[0]?.[0] ?? 'General';
  const topCatCount = topCats[0]?.[1] ?? 0;

  // ── Ticker frequency ─────────────────────────────────────────────────
  const tickerMap = new Map<string, number>();
  for (const a of pool) {
    for (const t of a.tickers) tickerMap.set(t, (tickerMap.get(t) ?? 0) + 1);
  }
  const topTickers = topN(tickerMap, 5).map(([t]) => t);

  // ── Themes ───────────────────────────────────────────────────────────────
  const themes: string[] = [];

  // Category-driven themes
  const fdaCount = catMap.get('FDA') ?? 0;
  const clinCount = catMap.get('Clinical') ?? 0;
  const maCount = catMap.get('MA') ?? 0;
  const earnCount = catMap.get('Earnings') ?? 0;
  const analCount = catMap.get('Analyst') ?? 0;

  const fdaPos = pool.filter(a => a.category === 'FDA' && a.sentiment === 'Positive').length;
  const fdaNeg = pool.filter(a => a.category === 'FDA' && a.sentiment === 'Negative').length;

  if (fdaCount >= 2) themes.push(fdaNeg > fdaPos ? 'Regulatory Headwinds' : fdaPos > fdaNeg ? 'FDA Tailwinds' : 'FDA Activity');
  if (clinCount >= 2) themes.push('Clinical Readouts');
  if (maCount >= 2)   themes.push('M&A Activity');
  if (earnCount >= 2) themes.push('Earnings Season');
  if (analCount >= 3) {
    const analPos = pool.filter(a => a.category === 'Analyst' && a.sentiment === 'Positive').length;
    themes.push(analPos >= 2 ? 'Analyst Upgrades' : 'Analyst Coverage');
  }

  // Ticker-driven themes
  const focusCounts = new Map<string, number>();
  for (const t of topTickers) {
    const focus = TICKER_FOCUS[t];
    if (focus) focusCounts.set(focus, (focusCounts.get(focus) ?? 0) + (tickerMap.get(t) ?? 1));
  }
  const topFocus = topN(focusCounts, 2);
  for (const [focus] of topFocus) {
    const label = focus === 'GLP-1' ? 'GLP-1 Momentum'
      : focus === 'Gene Editing' ? 'Gene Editing Wave'
      : focus === 'mRNA' ? 'mRNA Pipeline'
      : focus === 'Oncology' ? 'Oncology Focus'
      : focus === 'Rare Disease' ? 'Rare Disease'
      : focus === 'Immunology' ? 'Immunology Space'
      : focus;
    if (!themes.includes(label)) themes.push(label);
  }

  // Ensure at least 3 themes
  if (themes.length < 3) {
    const fallbacks = ['Biotech Sector', 'Drug Development', 'Pipeline News', 'Sector Rotation'];
    for (const f of fallbacks) {
      if (themes.length >= 3) break;
      if (!themes.includes(f)) themes.push(f);
    }
  }

  // ── Summary sentences ────────────────────────────────────────────────────
  const outlookWord = outlook === 'Bullish' ? 'positive' : outlook === 'Bearish' ? 'cautious' : 'mixed';
  const posRatioPct = Math.round(posRatio * 100);
  const topTickerStr = topTickers.slice(0, 3).join(', ');

  const s1 = `Biopharma sentiment is ${outlookWord} across the last 48 hours, with ${pos} positive and ${neg} negative headlines out of ${total} stories tracked — a ${posRatioPct}% positivity rate.`;

  let s2: string;
  if (topCat === 'FDA') {
    s2 = `FDA-related news leads the tape with ${topCatCount} items${topTickerStr ? `, and ${topTickerStr} generating the most coverage` : ''}, suggesting active regulatory review activity.`;
  } else if (topCat === 'Clinical') {
    s2 = `Clinical trial updates are the dominant theme with ${topCatCount} stories${topTickerStr ? ` — ${topTickerStr} are most in focus` : ''}, signaling an active data readout period.`;
  } else if (topCat === 'MA') {
    s2 = `M&A activity is driving headlines with ${topCatCount} deal-related stories${topTickerStr ? `, with ${topTickerStr} in play` : ''}, pointing to sector consolidation pressure.`;
  } else if (topCat === 'Earnings') {
    s2 = `Earnings results are the dominant catalyst with ${topCatCount} stories${topTickerStr ? ` — ${topTickerStr} reporting` : ''}, with guidance commentary likely to set near-term tone.`;
  } else {
    s2 = `Coverage is broad-based across ${topCats.length} categories${topTickerStr ? `, with ${topTickerStr} attracting the most attention` : ''}.`;
  }

  let s3: string;
  if (outlook === 'Bearish') {
    s3 = `The negative tilt warrants caution — watch for regulatory decisions and trial data as potential inflection points before adding sector exposure.`;
  } else if (outlook === 'Bullish') {
    s3 = `Momentum appears constructive; follow-through in FDA approvals and Phase III readouts could extend the positive trend into the near term.`;
  } else {
    s3 = `The split tape calls for stock-specific positioning — highest-conviction setups remain in names with near-term binary catalysts in the ${themes[0] ?? 'clinical'} space.`;
  }

  const summary = `${s1} ${s2} ${s3}`;

  // ── Watch items (top 3 scored articles, diverse categories) ──────────────
  const scored = pool
    .map(a => ({ a, score: scoreArticle(a) }))
    .sort((x, y) => y.score - x.score);

  const watchItems: MarketBrief['watchItems'] = [];
  const usedCats = new Set<string>();
  const usedTickers = new Set<string>();

  for (const { a } of scored) {
    if (watchItems.length >= 3) break;
    // Prefer category diversity
    if (usedCats.has(a.category) && watchItems.length < 2) continue;
    // Avoid repeating same ticker
    const mainTicker = a.tickers[0];
    if (mainTicker && usedTickers.has(mainTicker)) continue;

    const label = mainTicker
      ? `${mainTicker} · ${a.category}`
      : a.category;

    watchItems.push({ label, detail: a.headline });
    usedCats.add(a.category);
    if (mainTicker) usedTickers.add(mainTicker);
  }

  // Fill if sparse
  while (watchItems.length < 3 && scored.length > watchItems.length) {
    const { a } = scored[watchItems.length];
    watchItems.push({
      label: a.tickers[0] ? `${a.tickers[0]} · ${a.category}` : a.category,
      detail: a.headline,
    });
  }

  const brief: MarketBrief = {
    summary,
    outlook,
    themes: themes.slice(0, 5),
    watchItems,
    generatedAt: new Date().toISOString(),
  };

  briefCache.set(cacheKey, brief as unknown as Record<string, unknown>, TTL);
  console.log(`[MarketBrief] Generated rule-based: ${brief.outlook}, themes: ${brief.themes.join(', ')}`);
  return brief;
}
