import { useState, useEffect } from 'react';
import { FlaskConical, Search, RefreshCw, ExternalLink, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useStore } from '../../store/useStore';
import { PIPELINE_STATIC } from '../../data/staticData';
import type { PipelineDrug, LiveTrial, PubMedPub, LivePipelineResponse } from '../../types';
import clsx from 'clsx';
import { apiFetch } from '../../utils/api';

// ── Phase config ──────────────────────────────────────────────────────────────
const STATIC_PHASES = ['Discovery', 'Phase I', 'Phase II', 'Phase III', 'BLA/NDA', 'Approved'] as const;
type StaticPhase = typeof STATIC_PHASES[number];

const PHASE_COLORS: Record<string, string> = {
  'Discovery': '#475569', 'Phase I': '#f97316', 'Phase II': '#a855f7',
  'Phase III': '#3b82f6', 'Phase IV': '#06b6d4', 'BLA/NDA': '#00d4aa', 'Approved': '#22c55e',
};
const PHASE_CLASS: Record<string, string> = {
  'Approved': 'phase-approved', 'BLA/NDA': 'phase-bla', 'Phase III': 'phase-3',
  'Phase II': 'phase-2', 'Phase I': 'phase-1', 'Phase IV': 'phase-1', 'Discovery': 'phase-discovery',
};

const STATUS_COLOR: Record<string, string> = {
  'Recruiting':       'text-green-400',
  'Active':           'text-blue-400',
  'Starting Soon':    'text-yellow-400',
  'Completed':        'text-gray-400',
  'Terminated':       'text-red-400',
  'Withdrawn':        'text-red-600',
  'Enrolling (Invite)': 'text-teal-400',
};

function fmtB(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PhaseBadge({ phase }: { phase: string }) {
  return <span className={clsx('badge', PHASE_CLASS[phase] ?? 'phase-discovery')}>{phase}</span>;
}

function SourceBadge({ source }: { source: 'static' | 'clinicaltrials' | 'pubmed' }) {
  if (source === 'clinicaltrials') return (
    <span className="text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded px-1 py-0.5">CT.gov</span>
  );
  if (source === 'pubmed') return (
    <span className="text-[9px] bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded px-1 py-0.5">PubMed</span>
  );
  return (
    <span className="text-[9px] bg-gray-500/15 text-gray-500 border border-gray-600/30 rounded px-1 py-0.5">Curated</span>
  );
}

// ── Static drug row ───────────────────────────────────────────────────────────
function StaticRow({ drug, onSelect }: { drug: PipelineDrug; onSelect: (t: string) => void }) {
  return (
    <tr className="border-b border-terminal-border/30 hover:bg-white/5 transition-colors">
      <td className="px-3 py-2">
        <button onClick={() => onSelect(drug.companyTicker)} className="text-terminal-accent font-bold hover:underline text-xs">{drug.companyTicker}</button>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium text-terminal-text text-xs">{drug.drugName}</div>
        <div className="text-terminal-muted text-[10px]">{drug.genericName}</div>
      </td>
      <td className="px-3 py-2 text-terminal-text text-xs max-w-[160px] truncate">{drug.indication}</td>
      <td className="px-3 py-2 text-terminal-muted text-xs max-w-[130px] truncate">{drug.mechanism}</td>
      <td className="px-3 py-2 text-center"><PhaseBadge phase={drug.phase} /></td>
      <td className="px-3 py-2 text-xs text-yellow-400 text-right whitespace-nowrap">{drug.expectedDataDate ?? '—'}</td>
      <td className="px-3 py-2 text-xs text-right text-terminal-accent">{drug.estimatedPeakSales ? fmtB(drug.estimatedPeakSales) : '—'}</td>
      <td className="px-3 py-2 text-center"><SourceBadge source="static" /></td>
      <td className="px-3 py-2"></td>
    </tr>
  );
}

// ── Live trial row ────────────────────────────────────────────────────────────
function LiveRow({ trial, onSelect }: { trial: LiveTrial; onSelect: (t: string) => void }) {
  const drug = trial.interventions[0] ?? trial.title.split(' ')[0] ?? '—';
  const indication = trial.conditions.slice(0, 2).join(', ') || trial.title;
  return (
    <tr className="border-b border-terminal-border/30 hover:bg-white/5 transition-colors">
      <td className="px-3 py-2">
        <button onClick={() => onSelect(trial.ticker)} className="text-terminal-accent font-bold hover:underline text-xs">{trial.ticker}</button>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium text-terminal-text text-xs truncate max-w-[140px]" title={trial.title}>{drug}</div>
        <div className="text-terminal-muted text-[10px] truncate max-w-[140px]">{trial.nctId}</div>
      </td>
      <td className="px-3 py-2 text-terminal-text text-xs max-w-[160px] truncate" title={indication}>{indication}</td>
      <td className="px-3 py-2 text-terminal-muted text-xs">
        {trial.enrollment > 0 ? `n=${trial.enrollment.toLocaleString()}` : '—'}
      </td>
      <td className="px-3 py-2 text-center"><PhaseBadge phase={trial.phase || 'N/A'} /></td>
      <td className="px-3 py-2 text-xs text-right whitespace-nowrap">
        <span className={STATUS_COLOR[trial.status] ?? 'text-gray-400'}>{trial.status}</span>
        {trial.completionDate && <div className="text-[10px] text-terminal-muted">{trial.completionDate}</div>}
      </td>
      <td className="px-3 py-2 text-right text-terminal-muted text-xs">—</td>
      <td className="px-3 py-2 text-center"><SourceBadge source="clinicaltrials" /></td>
      <td className="px-3 py-2 text-center">
        {trial.nctUrl && (
          <a href={trial.nctUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
            <ExternalLink size={11} />
          </a>
        )}
      </td>
    </tr>
  );
}

// ── PubMed row ────────────────────────────────────────────────────────────────
function PubMedRow({ pub, onSelect }: { pub: PubMedPub; onSelect: (t: string) => void }) {
  return (
    <tr className="border-b border-terminal-border/30 hover:bg-white/5 transition-colors">
      <td className="px-3 py-2">
        <button onClick={() => onSelect(pub.ticker)} className="text-terminal-accent font-bold hover:underline text-xs">{pub.ticker}</button>
      </td>
      <td className="px-3 py-2">
        <div className="font-medium text-terminal-text text-xs">{pub.drugName || '—'}</div>
        <div className="text-terminal-muted text-[10px]">PMID {pub.pmid}</div>
      </td>
      <td className="px-3 py-2 text-terminal-text text-xs max-w-[160px] truncate" title={pub.title}>{pub.title}</td>
      <td className="px-3 py-2 text-terminal-muted text-xs truncate max-w-[100px]">{pub.journal}</td>
      <td className="px-3 py-2 text-center"><PhaseBadge phase={pub.phase || '?'} /></td>
      <td className="px-3 py-2 text-xs text-right text-terminal-muted">{pub.pubDate}</td>
      <td className="px-3 py-2 text-right text-terminal-muted text-xs">—</td>
      <td className="px-3 py-2 text-center"><SourceBadge source="pubmed" /></td>
      <td className="px-3 py-2 text-center">
        <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300">
          <BookOpen size={11} />
        </a>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function PipelineDashboard() {
  const { companies, selectTicker } = useStore();

  const [liveData, setLiveData] = useState<LivePipelineResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const [tab, setTab]             = useState<'all' | 'static' | 'trials' | 'pubmed'>('all');
  const [filterPhase, setFilterPhase] = useState<string>('All');
  const [filterTicker, setFilterTicker] = useState('All');
  const [search, setSearch]       = useState('');

  async function fetchLive(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch('/api/pipeline/live');
      if (res.ok) {
        setLiveData(await res.json());
        setLastFetch(new Date());
      }
    } catch (e) {
      console.warn('[Pipeline] fetch failed', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLive(); }, []);

  const staticDrugs: PipelineDrug[] = PIPELINE_STATIC;
  const trials: LiveTrial[]   = liveData?.trials ?? [];
  const pubs: PubMedPub[]     = liveData?.publications ?? [];

  // All unique tickers across all sources
  const allTickers = Array.from(new Set([
    ...staticDrugs.map(d => d.companyTicker),
    ...trials.map(t => t.ticker),
    ...pubs.map(p => p.ticker),
  ])).sort();

  const allPhases = ['All', ...STATIC_PHASES, 'Phase IV', 'N/A'];

  // Filter helpers
  const matchesTicker = (t: string) => filterTicker === 'All' || t === filterTicker;
  const matchesPhase  = (p: string) => filterPhase === 'All' || p === filterPhase;
  const matchesSearch = (text: string) => {
    const q = search.toLowerCase();
    return !q || text.toLowerCase().includes(q);
  };

  const filteredStatic = staticDrugs.filter(d =>
    matchesTicker(d.companyTicker) &&
    matchesPhase(d.phase) &&
    matchesSearch(`${d.drugName} ${d.indication} ${d.companyTicker}`)
  );

  const filteredTrials = trials.filter(t =>
    matchesTicker(t.ticker) &&
    matchesPhase(t.phase || 'N/A') &&
    matchesSearch(`${t.interventions.join(' ')} ${t.conditions.join(' ')} ${t.ticker} ${t.title}`)
  );

  const filteredPubs = pubs.filter(p =>
    matchesTicker(p.ticker) &&
    matchesPhase(p.phase || '?') &&
    matchesSearch(`${p.drugName} ${p.title} ${p.ticker}`)
  );

  // Phase distribution for chart — merge all sources
  const phaseCounts = allPhases.filter(p => p !== 'All').map(phase => ({
    phase,
    static: staticDrugs.filter(d => d.phase === phase).length,
    trials: trials.filter(t => (t.phase || 'N/A') === phase).length,
    pubs:   pubs.filter(p => (p.phase || '?') === phase).length,
  })).filter(p => p.static + p.trials + p.pubs > 0);

  const nearTerm = staticDrugs
    .filter(d => d.expectedDataDate && d.phase !== 'Approved')
    .sort((a, b) => (a.expectedDataDate ?? '') < (b.expectedDataDate ?? '') ? -1 : 1)
    .slice(0, 10);

  const approvedCount  = staticDrugs.filter(d => d.phase === 'Approved').length;
  const lateStageCount = staticDrugs.filter(d => ['Phase III', 'BLA/NDA'].includes(d.phase)).length;
  const totalPeakSales = staticDrugs.reduce((s, d) => s + (d.estimatedPeakSales ?? 0), 0);
  const totalPrograms  = staticDrugs.length + trials.length + pubs.length;

  const showStatic  = tab === 'all' || tab === 'static';
  const showTrials  = tab === 'all' || tab === 'trials';
  const showPubmed  = tab === 'all' || tab === 'pubmed';

  const totalVisible = (showStatic ? filteredStatic.length : 0)
    + (showTrials ? filteredTrials.length : 0)
    + (showPubmed ? filteredPubs.length : 0);

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2 flex-shrink-0">
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">TOTAL PROGRAMS</div>
          <div className="text-2xl font-bold text-terminal-text">{totalPrograms}</div>
          <div className="text-terminal-muted text-xs">3 sources merged</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">LIVE TRIALS</div>
          <div className="text-2xl font-bold text-blue-400">{trials.length}</div>
          <div className="text-terminal-muted text-xs">{loading ? 'loading…' : lastFetch ? 'ClinicalTrials.gov' : '—'}</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">PUBLICATIONS</div>
          <div className="text-2xl font-bold text-orange-400">{pubs.length}</div>
          <div className="text-terminal-muted text-xs">PubMed 2022–2026</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">LATE STAGE (Ph3+)</div>
          <div className="text-2xl font-bold text-terminal-accent">
            {lateStageCount + trials.filter(t => t.phase === 'Phase III').length}
          </div>
          <div className="text-terminal-muted text-xs">near-term catalysts</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">EST. PEAK SALES</div>
          <div className="text-2xl font-bold text-terminal-accent">{fmtB(totalPeakSales)}</div>
          <div className="text-terminal-muted text-xs">curated programs</div>
        </div>
      </div>

      <div className="flex gap-3 flex-1 overflow-hidden min-h-0">

        {/* Left sidebar */}
        <div className="flex flex-col gap-3 w-64 flex-shrink-0">
          <div className="card p-3">
            <div className="text-terminal-muted text-xs font-bold mb-3 tracking-wider">PIPELINE BY PHASE</div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phaseCounts} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis type="category" dataKey="phase" tick={{ fill: '#94a3b8', fontSize: 10 }} width={68} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 4, fontSize: 11 }}
                    formatter={(v, name) => [v, name === 'static' ? 'Curated' : name === 'trials' ? 'CT.gov' : 'PubMed']}
                  />
                  <Bar dataKey="static" stackId="a" radius={[0, 0, 0, 0]}>
                    {phaseCounts.map(e => <Cell key={e.phase} fill={PHASE_COLORS[e.phase] ?? '#475569'} />)}
                  </Bar>
                  <Bar dataKey="trials" stackId="a" fill="#3b82f6" opacity={0.6} />
                  <Bar dataKey="pubs" stackId="a" fill="#f97316" opacity={0.5} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-3 flex-1 overflow-auto min-h-0">
            <div className="text-terminal-muted text-xs font-bold mb-3 tracking-wider">UPCOMING DATA</div>
            <div className="space-y-2">
              {nearTerm.map(d => (
                <div key={d.id} className="border-b border-terminal-border/30 pb-2 last:border-0">
                  <div className="flex justify-between items-start">
                    <button onClick={() => selectTicker(d.companyTicker)} className="text-terminal-accent text-xs font-bold hover:underline">{d.companyTicker}</button>
                    <span className="text-yellow-400 text-xs">{d.expectedDataDate}</span>
                  </div>
                  <div className="text-terminal-text text-xs">{d.drugName}</div>
                  <div className="text-terminal-muted text-xs truncate">{d.indication}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main table area */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">

          {/* Tabs + filters */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {/* Source tabs */}
            {([
              { key: 'all',     label: `All (${totalPrograms})` },
              { key: 'static',  label: `Curated (${staticDrugs.length})` },
              { key: 'trials',  label: `CT.gov (${trials.length})` },
              { key: 'pubmed',  label: `PubMed (${pubs.length})` },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={clsx('px-3 py-1.5 rounded text-xs transition-colors font-medium',
                  tab === t.key ? 'bg-terminal-accent text-terminal-bg' : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
                )}>{t.label}</button>
            ))}

            <div className="w-px h-4 bg-terminal-border mx-1" />

            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-terminal-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Drug, indication, ticker…"
                className="bg-terminal-surface border border-terminal-border rounded pl-7 pr-3 py-1.5 text-xs text-terminal-text placeholder:text-terminal-muted focus:outline-none focus:border-terminal-accent w-44" />
            </div>

            {/* Ticker filter */}
            <select value={filterTicker} onChange={e => setFilterTicker(e.target.value)}
              className="bg-terminal-surface border border-terminal-border text-xs text-terminal-text rounded px-2 py-1.5 focus:outline-none focus:border-terminal-accent">
              <option value="All">All tickers</option>
              {allTickers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Phase filter */}
            <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)}
              className="bg-terminal-surface border border-terminal-border text-xs text-terminal-text rounded px-2 py-1.5 focus:outline-none focus:border-terminal-accent">
              {allPhases.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <button onClick={() => fetchLive()} disabled={loading}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white border border-gray-700 rounded px-2 py-1.5 transition-colors disabled:opacity-40">
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            </button>

            <span className="ml-auto text-terminal-muted text-xs">{totalVisible} programs</span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto card min-h-0">
            {loading && !liveData ? (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-600">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Fetching live trial data from ClinicalTrials.gov + PubMed…</span>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-terminal-surface border-b border-terminal-border z-10">
                  <tr className="text-terminal-muted">
                    <th className="text-left px-3 py-2">TICKER</th>
                    <th className="text-left px-3 py-2">DRUG / ID</th>
                    <th className="text-left px-3 py-2">INDICATION / TITLE</th>
                    <th className="text-left px-3 py-2">MECHANISM / SIZE</th>
                    <th className="text-center px-3 py-2">PHASE</th>
                    <th className="text-right px-3 py-2">DATE / STATUS</th>
                    <th className="text-right px-3 py-2">PEAK SALES</th>
                    <th className="text-center px-3 py-2">SOURCE</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {showStatic && filteredStatic.map(d => (
                    <StaticRow key={`static-${d.id}`} drug={d} onSelect={selectTicker} />
                  ))}
                  {showTrials && filteredTrials.map(t => (
                    <LiveRow key={`trial-${t.nctId}`} trial={t} onSelect={selectTicker} />
                  ))}
                  {showPubmed && filteredPubs.map(p => (
                    <PubMedRow key={`pub-${p.pmid}`} pub={p} onSelect={selectTicker} />
                  ))}
                  {totalVisible === 0 && (
                    <tr><td colSpan={9} className="py-12 text-center text-gray-600">No programs match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
