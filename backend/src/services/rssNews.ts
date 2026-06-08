import Parser from 'rss-parser';
import { newsCache } from './cache.js';

const TTL = 20 * 60 * 1000; // 20 minutes

const parser = new Parser({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; BioTrackerPro/1.0; +https://biotrackerpro.com)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: { item: ['media:content', 'media:thumbnail', 'content:encoded'] },
});

// ── Feeds ──────────────────────────────────────────────────────────────────────
// Google News RSS: free, no API key, searches any query
const GN = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

const RSS_FEEDS = [
  // Curated pharma trade press
  { url: 'https://www.biopharmadive.com/feeds/news/', source: 'BioPharma Dive' },
  { url: GN('Fierce Biotech biopharma drug FDA clinical trial'), source: 'Google News: Biotech' },
  { url: 'https://endpts.com/feed/', source: 'Endpoints News' },
  { url: 'https://www.statnews.com/category/pharma/feed/', source: 'STAT News' },
  { url: 'https://www.healio.com/rss/hematology-oncology', source: 'Healio Oncology' },

  // Government sources (always free, official)
  { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml', source: 'FDA Press' },
  { url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/new-and-generic-drug-approvals/rss.xml', source: 'FDA Drug Approvals' },
  { url: GN('FDA drug approval NDA BLA PDUFA 2025 2026'), source: 'Google News: Drug Approvals' },
  { url: GN('FDA clinical hold complete response letter drug recall 2025'), source: 'Google News: FDA Safety' },

  // Google News topic feeds (broad sector coverage)
  { url: GN('FDA drug approval biotech 2025'), source: 'Google News: FDA' },
  { url: GN('GLP-1 obesity drug semaglutide tirzepatide clinical trial'), source: 'Google News: GLP-1' },
  { url: GN('CRISPR gene therapy clinical trial results'), source: 'Google News: Gene Therapy' },
  { url: GN('cancer oncology drug FDA approval clinical trial'), source: 'Google News: Oncology' },
  { url: GN('biotech pharmaceutical earnings revenue guidance 2025'), source: 'Google News: Earnings' },
  { url: GN('biotech merger acquisition deal partnership 2025'), source: 'Google News: M&A' },
];

// ── Company keyword map ───────────────────────────────────────────────────────
const TICKERS = [
  'LLY', 'NVO', 'AMGN', 'GILD', 'REGN', 'VRTX', 'MRNA', 'BNTX', 'BIIB', 'ILMN',
  'ALNY', 'BMRN', 'INCY', 'NBIX', 'SRPT', 'EXAS', 'SGEN', 'HZNP', 'UTHR', 'ARGX',
  'IONS', 'EXEL', 'TWST', 'NTLA', 'CRSP',
];

const COMPANY_NAMES: Record<string, string[]> = {
  LLY:  ['Eli Lilly', 'Lilly', 'tirzepatide', 'Mounjaro', 'Zepbound', 'donanemab', 'Kisunla', 'retatrutide', 'orforglipron', 'LY3298176'],
  NVO:  ['Novo Nordisk', 'semaglutide', 'Ozempic', 'Wegovy', 'Rybelsus', 'CagriSema', 'cagrilintide', 'NovoCare'],
  AMGN: ['Amgen', 'sotorasib', 'Lumakras', 'MariTide', 'AMG 133', 'olomorasib', 'denosumab', 'Prolia', 'Repatha', 'evolocumab'],
  GILD: ['Gilead', 'Biktarvy', 'bictegravir', 'Yescarta', 'axicabtagene', 'lenacapavir', 'Sunlenca', 'filgotinib'],
  REGN: ['Regeneron', 'Dupixent', 'dupilumab', 'EYLEA', 'aflibercept', 'linvoseltamab', 'itepekimab', 'Kevzara'],
  VRTX: ['Vertex', 'Trikafta', 'elexacaftor', 'suzetrigine', 'Journavx', 'VX-548', 'VX-880', 'inaxaplin'],
  MRNA: ['Moderna', 'mRNA-4157', 'mRNA-1345', 'mresvia', 'mRNA-1010'],
  BNTX: ['BioNTech', 'BNT111', 'BNT323', 'BNT211', 'Comirnaty'],
  BIIB: ['Biogen', 'Leqembi', 'lecanemab', 'Skyclarys', 'opicinumab', 'BIIB'],
  ILMN: ['Illumina', 'NovaSeq', 'GRAIL', 'Galleri', 'sequencing platform'],
  ALNY: ['Alnylam', 'vutrisiran', 'Amvuttra', 'inclisiran', 'Leqvio', 'zilebesiran', 'fitusiran', 'Alnylam Pharmaceuticals'],
  BMRN: ['BioMarin', 'Roctavian', 'vosoritide', 'Voxzogo', 'BMN'],
  INCY: ['Incyte', 'Jakafi', 'ruxolitinib', 'Zynyz', 'retifanlimab', 'Opzelura'],
  NBIX: ['Neurocrine', 'Ingrezza', 'valbenazine', 'crinecerfont'],
  SRPT: ['Sarepta', 'Elevidys', 'SRP-9001', 'Duchenne', 'casimersen', 'Amondys'],
  EXAS: ['Exact Sciences', 'Cologuard', 'Oncotype', 'DX'],
  SGEN: ['Seagen', 'Padcev', 'Adcetris', 'enfortumab', 'tucatinib', 'Tukysa'],
  HZNP: ['Horizon Therapeutics', 'Tepezza', 'teprotumumab', 'Krystexxa'],
  UTHR: ['United Therapeutics', 'Tyvaso', 'treprostinil', 'Remodulin', 'Unituxin'],
  ARGX: ['argenx', 'Vyvgart', 'efgartigimod', 'ARGX'],
  IONS: ['Ionis', 'Spinraza', 'nusinersen', 'eplontersen', 'Waylivra'],
  EXEL: ['Exelixis', 'cabozantinib', 'Cabometyx', 'Cometriq'],
  TWST: ['Twist Bioscience', 'synthetic DNA', 'synthetic biology'],
  NTLA: ['Intellia', 'NTLA-2001', 'nexiguran', 'NTLA-2002'],
  CRSP: ['CRISPR Therapeutics', 'Casgevy', 'CTX112', 'exa-cel', 'CTX001'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractTickers(text: string): string[] {
  const lower = text.toLowerCase();
  return TICKERS.filter(t => {
    const terms = COMPANY_NAMES[t] ?? [];
    return terms.some(term => lower.includes(term.toLowerCase()));
  });
}

function classifyCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('fda') || lower.includes('approval') || lower.includes('approved') || lower.includes('pdufa') || lower.includes('nda') || lower.includes('bla') || lower.includes('clearance')) return 'FDA';
  if (lower.includes('phase') || lower.includes('trial') || lower.includes('clinical') || lower.includes('efficacy') || lower.includes('endpoint') || lower.includes('placebo') || lower.includes('cohort')) return 'Clinical';
  if (lower.includes('earning') || lower.includes('revenue') || lower.includes('guidance') || lower.includes('quarterly') || lower.includes('q1') || lower.includes('q2') || lower.includes('q3') || lower.includes('q4') || lower.includes('sales')) return 'Earnings';
  if (lower.includes('acqui') || lower.includes('merger') || lower.includes('deal') || lower.includes('partnership') || lower.includes('collaborat') || lower.includes('licens') || lower.includes('buyout')) return 'MA';
  if (lower.includes('upgrade') || lower.includes('downgrade') || lower.includes('price target') || lower.includes('analyst') || lower.includes('overweight') || lower.includes('underweight') || lower.includes('initiat')) return 'Analyst';
  return 'General';
}

function classifySentiment(text: string): 'Positive' | 'Negative' | 'Neutral' {
  const pos = ['approved', 'approval', 'positive', 'success', 'successful', 'effective', 'superior', 'breakthrough', 'upgrade', 'beat', 'raises', 'benefit', 'significant reduction', 'improved', 'met primary', 'granted', 'cleared', 'milestone', 'accelerated'];
  const neg = ['failed', 'failure', 'rejected', 'decline', 'miss', 'downgrade', 'concern', 'risk', 'withdraw', 'withdrawn', 'safety', 'adverse', 'negative', 'cut', 'discontinue', 'missed', 'did not meet', 'complete response letter', 'CRL'];
  const lower = text.toLowerCase();
  const posScore = pos.filter(w => lower.includes(w)).length;
  const negScore = neg.filter(w => lower.includes(w)).length;
  if (posScore > negScore) return 'Positive';
  if (negScore > posScore) return 'Negative';
  return 'Neutral';
}

function cleanSummary(raw: string | undefined): string {
  if (!raw) return '';
  // Strip HTML tags
  const stripped = raw.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  // First 280 chars ending at a word boundary
  if (stripped.length <= 280) return stripped;
  const cut = stripped.slice(0, 280);
  return cut.slice(0, cut.lastIndexOf(' ') + 1).trim() + '…';
}

function safeString(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object' && '_' in (val as object)) return String((val as { _: unknown })._);
  return '';
}

export interface RSSNewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  date: string;
  url: string;
  tickers: string[];
  category: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export interface DailyDigestEntry {
  ticker: string;
  companyName: string;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
  topHeadlines: string[];
  latestDate: string;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchFeed(url: string, source: string, fallbackUrl?: string): Promise<RSSNewsItem[]> {
  const tryUrl = async (feedUrl: string): Promise<RSSNewsItem[]> => {
    const parsed = await parser.parseURL(feedUrl);
    const items = (parsed.items ?? []).slice(0, 20);
    const results: RSSNewsItem[] = [];

    for (const item of items) {
      try {
        const headline = safeString(item.title);
        const rawSummary = (item as unknown as Record<string, unknown>)['content:encoded'] as string
          ?? item.contentSnippet ?? item.summary ?? '';
        const summary = cleanSummary(rawSummary);
        const text = `${headline} ${summary}`;
        const tickers = extractTickers(text);
        const id = safeString(item.guid) || safeString(item.link) || `${source}-${headline.slice(0, 40)}`;

        results.push({
          id,
          headline,
          summary,
          source,
          date: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          url: safeString(item.link),
          tickers,
          category: classifyCategory(text),
          sentiment: classifySentiment(text),
        });
      } catch {
        // skip malformed items
      }
    }
    return results;
  };

  try {
    return await tryUrl(url);
  } catch (err) {
    if (fallbackUrl) {
      try {
        console.log(`[RSS] Trying fallback URL for ${source}`);
        return await tryUrl(fallbackUrl);
      } catch (err2) {
        throw err2;
      }
    }
    throw err;
  }
}

export async function fetchRSSNews(): Promise<RSSNewsItem[]> {
  const cacheKey = 'rss_news';
  const cached = newsCache.get(cacheKey);
  if (cached) return cached as RSSNewsItem[];

  const allItems: RSSNewsItem[] = [];
  let successCount = 0;

  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchFeed(feed.url, feed.source, (feed as { fallbackUrl?: string }).fallbackUrl);
      allItems.push(...items);
      successCount++;
      console.log(`[RSS] ✓ ${feed.source}: ${items.length} items`);
    } catch (err) {
      console.warn(`[RSS] ✗ ${feed.source}:`, (err as Error).message.slice(0, 80));
    }
    await new Promise(r => setTimeout(r, 250));
  }

  // Deduplicate by headline, keep newest per headline
  const seen = new Map<string, RSSNewsItem>();
  for (const item of allItems) {
    const key = item.headline.toLowerCase().trim();
    const existing = seen.get(key);
    if (!existing || new Date(item.date) > new Date(existing.date)) {
      seen.set(key, item);
    }
  }

  const unique = Array.from(seen.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  newsCache.set(cacheKey, unique, TTL);
  console.log(`[RSS] Done: ${unique.length} unique items from ${successCount}/${RSS_FEEDS.length} feeds`);
  return unique;
}

export function buildDailyDigest(items: RSSNewsItem[]): DailyDigestEntry[] {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // last 24 hours
  const todayItems = items.filter(i => new Date(i.date).getTime() > cutoff);

  const map = new Map<string, DailyDigestEntry>();

  for (const item of todayItems) {
    for (const ticker of item.tickers) {
      if (!map.has(ticker)) {
        const names: Record<string, string> = {
          LLY: 'Eli Lilly', NVO: 'Novo Nordisk', AMGN: 'Amgen', GILD: 'Gilead', REGN: 'Regeneron',
          VRTX: 'Vertex', MRNA: 'Moderna', BNTX: 'BioNTech', BIIB: 'Biogen', ILMN: 'Illumina',
          ALNY: 'Alnylam', BMRN: 'BioMarin', INCY: 'Incyte', NBIX: 'Neurocrine', SRPT: 'Sarepta',
          EXAS: 'Exact Sciences', SGEN: 'Seagen', HZNP: 'Horizon', UTHR: 'United Therapeutics',
          ARGX: 'argenx', IONS: 'Ionis', EXEL: 'Exelixis', TWST: 'Twist Bioscience',
          NTLA: 'Intellia', CRSP: 'CRISPR Therapeutics',
        };
        map.set(ticker, { ticker, companyName: names[ticker] ?? ticker, count: 0, positive: 0, negative: 0, neutral: 0, topHeadlines: [], latestDate: item.date });
      }
      const entry = map.get(ticker)!;
      entry.count++;
      if (item.sentiment === 'Positive') entry.positive++;
      else if (item.sentiment === 'Negative') entry.negative++;
      else entry.neutral++;
      if (entry.topHeadlines.length < 3) entry.topHeadlines.push(item.headline);
      if (new Date(item.date) > new Date(entry.latestDate)) entry.latestDate = item.date;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
