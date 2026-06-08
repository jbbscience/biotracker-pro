import { trialsCache } from './cache.js';

// NCBI E-utilities — free, no API key required (3 req/sec limit)
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const TTL = 24 * 60 * 60 * 1000;

export interface PubMedPublication {
  pmid: string;
  title: string;
  abstract: string;
  journal: string;
  pubDate: string;
  phase: string;       // extracted from title/abstract
  drugName: string;    // extracted from title
  ticker: string;
  url: string;
}

// Key drug/compound terms per ticker to focus PubMed searches
const DRUG_TERMS: Record<string, string[]> = {
  LLY:  ['tirzepatide', 'donanemab', 'retatrutide', 'orforglipron', 'maziticaxen', 'mirikizumab'],
  NVO:  ['semaglutide', 'cagrilintide', 'CagriSema', 'amycretin', 'monlunabant'],
  AMGN: ['sotorasib', 'olomorasib', 'MariTide', 'AMG-133', 'rocatinlimab', 'tarlatamab'],
  GILD: ['lenacapavir', 'seladelpar', 'filgotinib', 'magrolimab', 'bulevirtide'],
  REGN: ['dupilumab', 'linvoseltamab', 'fianlimab', 'itepekimab', 'odronextamab'],
  VRTX: ['suzetrigine', 'inaxaplin', 'VX-880', 'VX-990', 'povetacicept'],
  MRNA: ['mRNA-4157', 'mRNA-1345', 'mRNA-1283', 'mRNA-1010', 'mRNA-1189'],
  BNTX: ['BNT111', 'BNT323', 'BNT211', 'BNT122', 'BNT116'],
  BIIB: ['lecanemab', 'opicinumab', 'BIIB080', 'felzartamab', 'tofersen'],
  ILMN: ['GRAIL', 'Galleri', 'cfDNA', 'fragmentomics'],
  ALNY: ['vutrisiran', 'zilebesiran', 'fitusiran', 'eplontersen', 'ALN-HBV02'],
  BMRN: ['vosoritide', 'BMN-307', 'BMN-255', 'BMN-351', 'BMN-293'],
  INCY: ['retifanlimab', 'parsaclisib', 'zilurgisertib', 'tafasitamab', 'axatilimab'],
  NBIX: ['crinecerfont', 'luvadaxistat', 'NBI-1070770', 'NBI-845'],
  SRPT: ['SRP-9001', 'SRP-5051', 'SRP-6004', 'casimersen', 'golodirsen'],
  EXAS: ['Cologuard', 'cfDNA colorectal', 'multi-cancer early detection', 'Oncotype DX'],
  SGEN: ['enfortumab', 'tucatinib', 'tisotumab', 'ladiratuzumab'],
  HZNP: ['teprotumumab', 'pegloticase', 'daxdilimab', 'KRYS-01'],
  UTHR: ['treprostinil', 'ralinepag', 'sotatercept', 'RemoPro'],
  ARGX: ['efgartigimod', 'cusatuzumab', 'ARGX-117', 'ARGX-119'],
  IONS: ['eplontersen', 'donidalorsen', 'IONIS-FB-LRx', 'tofersen', 'ION839'],
  EXEL: ['cabozantinib', 'zanzalintinib', 'XL092'],
  TWST: ['Twist library', 'synthetic antibody', 'biopharma DNA'],
  NTLA: ['NTLA-2001', 'NTLA-2002', 'nexiguran', 'NTLA-5001'],
  CRSP: ['exa-cel', 'CTX112', 'CTX001', 'CTX130', 'CTX131'],
};

function extractPhase(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('phase 3') || lower.includes('phase iii') || lower.includes('phase-3')) return 'Phase III';
  if (lower.includes('phase 2') || lower.includes('phase ii') || lower.includes('phase-2'))  return 'Phase II';
  if (lower.includes('phase 1') || lower.includes('phase i')  || lower.includes('phase-1'))  return 'Phase I';
  if (lower.includes('first-in-human') || lower.includes('dose escalation'))                  return 'Phase I';
  return '';
}

function extractDrugName(title: string, drugs: string[]): string {
  const lower = title.toLowerCase();
  return drugs.find(d => lower.includes(d.toLowerCase())) ?? '';
}

async function searchPubMed(query: string): Promise<string[]> {
  const url = `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=15&retmode=json&sort=pub+date`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`PubMed esearch ${res.status}`);
  const json = await res.json() as { esearchresult?: { idlist?: string[] } };
  return json.esearchresult?.idlist ?? [];
}

async function fetchSummaries(ids: string[]): Promise<Record<string, unknown>[]> {
  if (!ids.length) return [];
  const url = `${BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`PubMed esummary ${res.status}`);
  const json = await res.json() as { result?: Record<string, unknown> };
  const result = json.result ?? {};
  return ids.map(id => (result[id] as Record<string, unknown>) ?? {}).filter(r => r.uid);
}

export async function fetchPublicationsForTicker(ticker: string): Promise<PubMedPublication[]> {
  const cacheKey = `pubmed_${ticker}`;
  const cached = trialsCache.get(cacheKey);
  if (cached) return cached as PubMedPublication[];

  const drugs = DRUG_TERMS[ticker];
  if (!drugs?.length) return [];

  const drugQuery = drugs.slice(0, 6).join(' OR '); // top 6 drugs
  const query = `(${drugQuery}) AND ("clinical trial"[pt] OR "phase"[tiab]) AND 2022:2026[dp]`;

  try {
    const ids = await searchPubMed(query);
    await new Promise(r => setTimeout(r, 400)); // respect 3 req/sec
    const summaries = await fetchSummaries(ids);

    const pubs: PubMedPublication[] = summaries.map(s => {
      const title = String(s.title ?? '');
      const source = String(s.source ?? '');
      const pubdate = String(s.pubdate ?? '');
      const pmid = String(s.uid ?? '');
      const text = title;

      return {
        pmid,
        title: title.replace(/\.$/, ''),
        abstract: '',
        journal: source,
        pubDate: pubdate,
        phase: extractPhase(text),
        drugName: extractDrugName(title, drugs),
        ticker,
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      };
    }).filter(p => p.pmid);

    trialsCache.set(cacheKey, pubs, TTL);
    return pubs;
  } catch (err) {
    console.warn(`[PubMed] Failed for ${ticker}:`, (err as Error).message);
    return [];
  }
}

export async function fetchAllPublications(): Promise<PubMedPublication[]> {
  const cacheKey = 'pubmed_all';
  const cached = trialsCache.get(cacheKey);
  if (cached) return cached as PubMedPublication[];

  const all: PubMedPublication[] = [];
  const tickers = Object.keys(DRUG_TERMS);

  for (const ticker of tickers) {
    try {
      const pubs = await fetchPublicationsForTicker(ticker);
      all.push(...pubs);
      await new Promise(r => setTimeout(r, 450)); // stay under 3 req/sec (2 calls per ticker)
    } catch (err) {
      console.warn(`[PubMed] Failed for ${ticker}:`, (err as Error).message);
    }
  }

  trialsCache.set(cacheKey, all, TTL);
  console.log(`[PubMed] Fetched ${all.length} publications across ${tickers.length} companies`);
  return all;
}
