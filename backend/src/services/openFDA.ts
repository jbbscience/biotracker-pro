import { fdaCache } from './cache.js';

const BASE = 'https://api.fda.gov';
const TTL = 60 * 60 * 1000; // 1 hour

export interface FDADrugEvent {
  applicationNumber: string;
  sponsorName: string;
  brandName: string;
  genericName: string;
  approvalDate: string;
  productType: string;
  route: string;
  activeIngredient: string;
  ticker?: string;
}

export interface FDACalendarEvent {
  id: string;
  companyTicker: string;
  companyName: string;
  drugName: string;
  milestoneType: 'PDUFA' | 'AdCom' | 'CRL Response' | 'Phase III Result' | 'NDA Filing' | 'Approved';
  date: string;
  indication: string;
  significance: 'High' | 'Medium' | 'Low';
  notes: string;
  source: 'live';
  applicationNumber?: string;
}

// Maps OpenFDA sponsor name fragments → ticker + display name
const SPONSOR_TICKER: Array<{ patterns: RegExp[]; ticker: string; companyName: string }> = [
  { ticker: 'LLY',  companyName: 'Eli Lilly',            patterns: [/eli.lilly/i, /lilly/i] },
  { ticker: 'NVO',  companyName: 'Novo Nordisk',          patterns: [/novo.nordisk/i, /novo nordisk/i] },
  { ticker: 'AMGN', companyName: 'Amgen',                 patterns: [/amgen/i] },
  { ticker: 'GILD', companyName: 'Gilead Sciences',       patterns: [/gilead/i] },
  { ticker: 'REGN', companyName: 'Regeneron',             patterns: [/regeneron/i] },
  { ticker: 'VRTX', companyName: 'Vertex Pharmaceuticals',patterns: [/vertex/i] },
  { ticker: 'MRNA', companyName: 'Moderna',               patterns: [/moderna/i] },
  { ticker: 'BNTX', companyName: 'BioNTech',              patterns: [/biontech/i] },
  { ticker: 'BIIB', companyName: 'Biogen',                patterns: [/biogen/i] },
  { ticker: 'ALNY', companyName: 'Alnylam',               patterns: [/alnylam/i] },
  { ticker: 'BMRN', companyName: 'BioMarin',              patterns: [/biomarin/i] },
  { ticker: 'INCY', companyName: 'Incyte',                patterns: [/incyte/i] },
  { ticker: 'NBIX', companyName: 'Neurocrine',            patterns: [/neurocrine/i] },
  { ticker: 'SRPT', companyName: 'Sarepta',               patterns: [/sarepta/i] },
  { ticker: 'EXAS', companyName: 'Exact Sciences',        patterns: [/exact.sciences/i] },
  { ticker: 'HZNP', companyName: 'Horizon Therapeutics',  patterns: [/horizon/i] },
  { ticker: 'UTHR', companyName: 'United Therapeutics',   patterns: [/united.therapeutics/i] },
  { ticker: 'ARGX', companyName: 'argenx',                patterns: [/argenx/i] },
  { ticker: 'IONS', companyName: 'Ionis Pharmaceuticals', patterns: [/ionis/i] },
  { ticker: 'EXEL', companyName: 'Exelixis',              patterns: [/exelixis/i] },
  { ticker: 'CRSP', companyName: 'CRISPR Therapeutics',   patterns: [/crispr.therapeutics/i] },
  { ticker: 'NTLA', companyName: 'Intellia',              patterns: [/intellia/i] },
];

function matchTicker(sponsorName: string): { ticker: string; companyName: string } | null {
  for (const entry of SPONSOR_TICKER) {
    if (entry.patterns.some(p => p.test(sponsorName))) {
      return { ticker: entry.ticker, companyName: entry.companyName };
    }
  }
  return null;
}

// Format YYYYMMDD → YYYY-MM-DD
function formatFDADate(raw: string): string {
  if (!raw || raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

const SPONSOR_SEARCH: Record<string, string> = {
  LLY:  'Eli+Lilly',
  NVO:  'Novo+Nordisk',
  AMGN: 'Amgen',
  GILD: 'Gilead',
  REGN: 'Regeneron',
  VRTX: 'Vertex',
  MRNA: 'Moderna',
  BIIB: 'Biogen',
  ALNY: 'Alnylam',
  BMRN: 'Biomarin',
  ARGX: 'argenx',
  CRSP: 'CRISPR',
  NTLA: 'Intellia',
  INCY: 'Incyte',
  NBIX: 'Neurocrine',
  SRPT: 'Sarepta',
  HZNP: 'Horizon',
  UTHR: 'United+Therapeutics',
  IONS: 'Ionis',
  EXEL: 'Exelixis',
};

export async function fetchApprovedDrugs(ticker: string): Promise<FDADrugEvent[]> {
  const cacheKey = `fda_drugs_${ticker}`;
  const cached = fdaCache.get(cacheKey);
  if (cached) return cached as FDADrugEvent[];

  const sponsor = SPONSOR_SEARCH[ticker];
  if (!sponsor) return [];

  try {
    const url = `${BASE}/drug/drugsfda.json?search=sponsor_name:${sponsor}&limit=10`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OpenFDA ${res.status}`);

    const json = await res.json() as { results?: Record<string, unknown>[] };
    const results = json.results ?? [];

    const drugs: FDADrugEvent[] = results.flatMap(r => {
      const products = (r.products as Record<string, unknown>[]) ?? [];
      return products.map(p => ({
        applicationNumber: String(r.application_number ?? ''),
        sponsorName: String(r.sponsor_name ?? ''),
        brandName: String(p.brand_name ?? ''),
        genericName: String(p.active_ingredients?.toString() ?? ''),
        approvalDate: String((r.submissions as Record<string, unknown>[])?.[0]?.submission_status_date ?? ''),
        productType: String(p.dosage_form ?? ''),
        route: String(p.route ?? ''),
        activeIngredient: String((p.active_ingredients as Record<string, unknown>[])?.[0]?.name ?? ''),
        ticker,
      }));
    });

    fdaCache.set(cacheKey, drugs, TTL);
    return drugs.slice(0, 10);
  } catch (err) {
    console.warn(`[OpenFDA] Failed for ${ticker}:`, (err as Error).message);
    return [];
  }
}

export async function fetchRecentApprovals(): Promise<FDADrugEvent[]> {
  const cacheKey = 'fda_recent_approvals';
  const cached = fdaCache.get(cacheKey);
  if (cached) return cached as FDADrugEvent[];

  try {
    const url = `${BASE}/drug/drugsfda.json?search=submissions.submission_status_date:[20250101+TO+20261231]+AND+submissions.submission_type:ORIG&limit=25&sort=submissions.submission_status_date:desc`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`OpenFDA ${res.status}`);

    const json = await res.json() as { results?: Record<string, unknown>[] };
    const results = json.results ?? [];

    const drugs: FDADrugEvent[] = results.map(r => {
      const products = (r.products as Record<string, unknown>[])?.[0] ?? {};
      return {
        applicationNumber: String(r.application_number ?? ''),
        sponsorName: String(r.sponsor_name ?? ''),
        brandName: String(products.brand_name ?? ''),
        genericName: String((products.active_ingredients as Record<string, unknown>[])?.[0]?.name ?? ''),
        approvalDate: String((r.submissions as Record<string, unknown>[])?.[0]?.submission_status_date ?? ''),
        productType: String(products.dosage_form ?? ''),
        route: String(products.route ?? ''),
        activeIngredient: String((products.active_ingredients as Record<string, unknown>[])?.[0]?.name ?? ''),
      };
    });

    fdaCache.set(cacheKey, drugs, TTL);
    console.log(`[OpenFDA] Fetched ${drugs.length} recent approvals`);
    return drugs;
  } catch (err) {
    console.warn('[OpenFDA] Recent approvals fetch failed:', (err as Error).message);
    return [];
  }
}

// Fetch live calendar events: recent approvals + upcoming PDUFAs for tracked companies
export async function fetchFDACalendarEvents(): Promise<FDACalendarEvent[]> {
  const cacheKey = 'fda_calendar_events';
  const cached = fdaCache.get(cacheKey);
  if (cached) return cached as FDACalendarEvent[];

  const events: FDACalendarEvent[] = [];

  try {
    // 1. Recent approvals from tracked companies (2025-2026) → Approved milestones
    const approvalUrl = `${BASE}/drug/drugsfda.json?search=submissions.submission_status_date:[20250101+TO+20261231]+AND+submissions.submission_status:AP+AND+submissions.submission_type:ORIG&limit=50&sort=submissions.submission_status_date:desc`;
    const approvalRes = await fetch(approvalUrl, { signal: AbortSignal.timeout(10000) });

    if (approvalRes.ok) {
      const json = await approvalRes.json() as { results?: Record<string, unknown>[] };
      for (const r of json.results ?? []) {
        const sponsorName = String(r.sponsor_name ?? '');
        const match = matchTicker(sponsorName);
        if (!match) continue;

        const submissions = (r.submissions as Record<string, unknown>[]) ?? [];
        const apSub = submissions.find(s =>
          String(s.submission_status) === 'AP' &&
          String(s.submission_type) === 'ORIG' &&
          String(s.submission_status_date ?? '').startsWith('202')
        );
        if (!apSub) continue;

        const products = (r.products as Record<string, unknown>[])?.[0] ?? {};
        const brandName = String(products.brand_name ?? '');
        const activeIng = String((products.active_ingredients as Record<string, unknown>[])?.[0]?.name ?? '');
        const appNum = String(r.application_number ?? '');
        const rawDate = String(apSub.submission_status_date ?? '');
        const date = formatFDADate(rawDate);

        if (!date || brandName === 'UNKNOWN' || !brandName) continue;

        events.push({
          id: `live_ap_${appNum}`,
          companyTicker: match.ticker,
          companyName: match.companyName,
          drugName: brandName || activeIng,
          milestoneType: 'Approved',
          date,
          indication: '',
          significance: 'High',
          notes: `FDA approved ${brandName || activeIng} (${appNum}). Active ingredient: ${activeIng}.`,
          source: 'live',
          applicationNumber: appNum,
        });
      }
      console.log(`[OpenFDA] Found ${events.filter(e => e.milestoneType === 'Approved').length} tracked-company approvals`);
    }
  } catch (err) {
    console.warn('[OpenFDA] Calendar approvals fetch failed:', (err as Error).message);
  }

  try {
    // 2. Pending NDA/BLA applications with PDUFA dates in 2026 → PDUFA milestones
    const pdufaUrl = `${BASE}/drug/drugsfda.json?search=submissions.pdufa_goal_date:[20260101+TO+20261231]+AND+submissions.submission_type:ORIG&limit=50`;
    const pdufaRes = await fetch(pdufaUrl, { signal: AbortSignal.timeout(10000) });

    if (pdufaRes.ok) {
      const json = await pdufaRes.json() as { results?: Record<string, unknown>[] };
      for (const r of json.results ?? []) {
        const sponsorName = String(r.sponsor_name ?? '');
        const match = matchTicker(sponsorName);
        if (!match) continue;

        const submissions = (r.submissions as Record<string, unknown>[]) ?? [];
        const pdufaSub = submissions.find(s =>
          String(s.submission_type) === 'ORIG' &&
          String(s.pdufa_goal_date ?? '').startsWith('2026')
        );
        if (!pdufaSub) continue;

        const products = (r.products as Record<string, unknown>[])?.[0] ?? {};
        const brandName = String(products.brand_name ?? '');
        const activeIng = String((products.active_ingredients as Record<string, unknown>[])?.[0]?.name ?? '');
        const appNum = String(r.application_number ?? '');
        const rawDate = String(pdufaSub.pdufa_goal_date ?? '');
        const date = formatFDADate(rawDate);

        if (!date || (!brandName && !activeIng)) continue;

        // Skip if we already have an approval event for this app
        if (events.some(e => e.applicationNumber === appNum)) continue;

        const reviewPriority = String(pdufaSub.review_priority ?? 'STANDARD');
        events.push({
          id: `live_pdufa_${appNum}`,
          companyTicker: match.ticker,
          companyName: match.companyName,
          drugName: brandName || activeIng,
          milestoneType: 'PDUFA',
          date,
          indication: '',
          significance: reviewPriority === 'PRIORITY' ? 'High' : 'Medium',
          notes: `FDA PDUFA date for ${brandName || activeIng} (${appNum}). ${reviewPriority === 'PRIORITY' ? 'Priority Review.' : 'Standard Review.'}`,
          source: 'live',
          applicationNumber: appNum,
        });
      }
      console.log(`[OpenFDA] Found ${events.filter(e => e.milestoneType === 'PDUFA').length} upcoming PDUFA dates`);
    }
  } catch (err) {
    console.warn('[OpenFDA] Calendar PDUFA fetch failed:', (err as Error).message);
  }

  fdaCache.set(cacheKey, events, TTL);
  console.log(`[OpenFDA] Calendar: ${events.length} total live events`);
  return events;
}
