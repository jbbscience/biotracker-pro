import { trialsCache } from './cache.js';

const BASE = 'https://clinicaltrials.gov/api/v2/studies';
const TTL = 12 * 60 * 60 * 1000; // 12-hour cache (was daily)

const SPONSOR_MAP: Record<string, string> = {
  LLY:  'Eli Lilly',
  NVO:  'Novo Nordisk',
  AMGN: 'Amgen',
  GILD: 'Gilead Sciences',
  REGN: 'Regeneron',
  VRTX: 'Vertex Pharmaceuticals',
  MRNA: 'Moderna',
  BNTX: 'BioNTech',
  BIIB: 'Biogen',
  ILMN: 'Illumina',
  ALNY: 'Alnylam',
  BMRN: 'BioMarin',
  INCY: 'Incyte',
  NBIX: 'Neurocrine',
  SRPT: 'Sarepta',
  EXAS: 'Exact Sciences',
  SGEN: 'Seagen',
  HZNP: 'Horizon Therapeutics',
  UTHR: 'United Therapeutics',
  ARGX: 'argenx',
  IONS: 'Ionis Pharmaceuticals',
  EXEL: 'Exelixis',
  TWST: 'Twist Bioscience',
  NTLA: 'Intellia',
  CRSP: 'CRISPR Therapeutics',
};

// Map CT.gov phase strings → our canonical phase labels
function normalizePhase(phases: string[]): string {
  if (!phases.length) return 'N/A';
  const joined = phases.join(',');
  if (joined.includes('PHASE4'))              return 'Phase IV';
  if (joined.includes('PHASE3'))              return 'Phase III';
  if (joined.includes('PHASE2'))              return 'Phase II';
  if (joined.includes('EARLY_PHASE1') || joined.includes('PHASE1')) return 'Phase I';
  return 'N/A';
}

// Human-readable status
function normalizeStatus(raw: string): string {
  const map: Record<string, string> = {
    RECRUITING:               'Recruiting',
    ACTIVE_NOT_RECRUITING:    'Active',
    NOT_YET_RECRUITING:       'Starting Soon',
    COMPLETED:                'Completed',
    TERMINATED:               'Terminated',
    WITHDRAWN:                'Withdrawn',
    SUSPENDED:                'Suspended',
    ENROLLING_BY_INVITATION:  'Enrolling (Invite)',
    UNKNOWN_STATUS:           'Unknown',
  };
  return map[raw] ?? raw;
}

export interface ClinicalTrial {
  nctId: string;
  nctUrl: string;
  title: string;
  briefSummary: string;
  status: string;
  statusRaw: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  sponsor: string;
  startDate: string;
  completionDate: string;
  enrollment: number;
  ticker: string;
  source: 'clinicaltrials';
}

async function fetchTrialsForTicker(ticker: string): Promise<ClinicalTrial[]> {
  const sponsor = SPONSOR_MAP[ticker];
  if (!sponsor) return [];

  const allStudies: Record<string, unknown>[] = [];
  let nextPageToken: string | undefined;

  // Paginate up to 3 pages (150 studies) per company
  for (let page = 0; page < 3; page++) {
    const params = new URLSearchParams({
      'query.spons': sponsor,
      pageSize: '50',
      // No status filter — include ALL statuses (active, completed, terminated, etc.)
      fields: [
        'NCTId', 'BriefTitle', 'BriefSummary', 'OverallStatus', 'Phase',
        'Condition', 'InterventionName', 'StartDate', 'PrimaryCompletionDate',
        'EnrollmentCount', 'LeadSponsorName',
      ].join(','),
    });

    if (nextPageToken) params.set('pageToken', nextPageToken);

    const res = await fetch(`${BASE}?${params}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) throw new Error(`CT.gov ${res.status}`);
    const json = await res.json() as { studies?: Record<string, unknown>[]; nextPageToken?: string };
    const studies = json.studies ?? [];
    allStudies.push(...studies);

    if (!json.nextPageToken || studies.length < 50) break;
    nextPageToken = json.nextPageToken;
    await new Promise(r => setTimeout(r, 300));
  }

  return allStudies.map(s => {
    const proto = (s.protocolSection ?? {}) as Record<string, Record<string, unknown>>;
    const id       = proto.identificationModule ?? {};
    const status   = proto.statusModule ?? {};
    const design   = proto.designModule ?? {};
    const conds    = proto.conditionsModule ?? {};
    const intv     = proto.armsInterventionsModule ?? {};
    const spons    = proto.sponsorCollaboratorsModule ?? {};
    const descr    = proto.descriptionModule ?? {};

    const nctId = String(id.nctId ?? '');
    const statusRaw = String(status.overallStatus ?? '');

    return {
      nctId,
      nctUrl: nctId ? `https://clinicaltrials.gov/study/${nctId}` : '',
      title: String(id.briefTitle ?? ''),
      briefSummary: String(descr.briefSummary ?? '').slice(0, 400).trim(),
      status: normalizeStatus(statusRaw),
      statusRaw,
      phase: normalizePhase((design.phases as string[]) ?? []),
      conditions: (conds.conditions as string[]) ?? [],
      interventions: ((intv.interventions as Record<string, unknown>[]) ?? []).map(i => String(i.name ?? '')),
      sponsor: String((spons.leadSponsor as Record<string, unknown>)?.name ?? ''),
      startDate: String((status.startDateStruct as Record<string, unknown>)?.date ?? ''),
      completionDate: String((status.primaryCompletionDateStruct as Record<string, unknown>)?.date ?? ''),
      enrollment: Number((design.enrollmentInfo as Record<string, unknown>)?.count ?? 0),
      ticker,
      source: 'clinicaltrials' as const,
    };
  });
}

export async function fetchAllTrials(): Promise<ClinicalTrial[]> {
  const cacheKey = 'all_trials_v2';
  const cached = trialsCache.get(cacheKey);
  if (cached) return cached as ClinicalTrial[];

  const all: ClinicalTrial[] = [];
  for (const ticker of Object.keys(SPONSOR_MAP)) {
    try {
      const trials = await fetchTrialsForTicker(ticker);
      all.push(...trials);
      await new Promise(r => setTimeout(r, 250));
    } catch (err) {
      console.warn(`[ClinicalTrials] Failed for ${ticker}:`, (err as Error).message);
    }
  }

  // Deduplicate by NCT ID
  const seen = new Set<string>();
  const unique = all.filter(t => { if (seen.has(t.nctId)) return false; seen.add(t.nctId); return true; });

  trialsCache.set(cacheKey, unique, TTL);
  console.log(`[ClinicalTrials] Fetched ${unique.length} studies across all phases`);
  return unique;
}

export async function fetchTrialsForCompany(ticker: string): Promise<ClinicalTrial[]> {
  const cacheKey = `trials_v2_${ticker}`;
  const cached = trialsCache.get(cacheKey);
  if (cached) return cached as ClinicalTrial[];

  try {
    const trials = await fetchTrialsForTicker(ticker);
    trialsCache.set(cacheKey, trials, TTL);
    return trials;
  } catch (err) {
    console.warn(`[ClinicalTrials] Failed for ${ticker}:`, (err as Error).message);
    return [];
  }
}
