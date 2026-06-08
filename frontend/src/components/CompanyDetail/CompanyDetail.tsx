import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Star, StarOff, TrendingUp, TrendingDown, Building, MapPin, Users, Calendar, ExternalLink, BookOpen, FlaskConical, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useStore } from '../../store/useStore';
import { PIPELINE_STATIC } from '../../data/staticData';
import { generatePriceHistory, filterHistory } from '../../utils/priceHistory';
import type { PipelineDrug, LiveTrial, PubMedPub } from '../../types';
import clsx from 'clsx';
import { apiFetch } from '../../utils/api';

type Range = '1D' | '5D' | '1M' | '6M' | '1Y' | '5Y' | 'Max';
type PipelineTab = 'curated' | 'trials' | 'publications';

function fmt(n: number, d = 2) { return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtB(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

const PHASE_ORDER = ['Discovery', 'Phase I', 'Phase II', 'Phase III', 'BLA/NDA', 'Approved'];
const PHASE_CLASS: Record<string, string> = {
  'Approved': 'phase-approved', 'BLA/NDA': 'phase-bla',
  'Phase III': 'phase-3', 'Phase II': 'phase-2',
  'Phase I': 'phase-1', 'Discovery': 'phase-discovery',
};

const CT_PHASE_ORDER = ['Phase IV', 'Phase III', 'Phase II', 'Phase I', 'N/A'];

const STATUS_CLASS: Record<string, string> = {
  'Recruiting':       'bg-green-500/15 text-green-400 border-green-500/30',
  'Active':           'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Starting Soon':    'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Completed':        'bg-terminal-muted/15 text-terminal-muted border-terminal-border/40',
  'Terminated':       'bg-red-500/15 text-red-400 border-red-500/30',
  'Withdrawn':        'bg-red-500/10 text-red-400/70 border-red-500/20',
  'Enrolling (Invite)': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge border text-[10px]', STATUS_CLASS[status] ?? 'bg-terminal-muted/10 text-terminal-muted border-terminal-border/30')}>
      {status}
    </span>
  );
}

export function CompanyDetail() {
  const { selectedTicker, setView, companies, watchlist, addToWatchlist, removeFromWatchlist } = useStore();
  const co = companies.find(c => c.ticker === selectedTicker);
  const [range, setRange] = useState<Range>('1Y');
  const [tab, setTab] = useState<'chart' | 'fundamentals' | 'pipeline'>('chart');
  const [pipelineTab, setPipelineTab] = useState<PipelineTab>('curated');
  const [trials, setTrials] = useState<LiveTrial[]>([]);
  const [publications, setPublications] = useState<PubMedPub[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveFetched, setLiveFetched] = useState(false);

  const history = useMemo(() => co ? generatePriceHistory(co.basePrice, 1260, co.ticker) : [], [co?.ticker]);
  const chartData = useMemo(() => filterHistory(history, range).map(p => ({ date: p.date, price: p.close })), [history, range]);

  const fetchLivePipeline = () => {
    if (!selectedTicker) return;
    setLiveLoading(true);
    apiFetch(`/api/pipeline/live/${selectedTicker}`)
      .then(r => r.json())
      .then((data: { trials: LiveTrial[]; publications: PubMedPub[] }) => {
        setTrials(data.trials ?? []);
        setPublications(data.publications ?? []);
        setLiveFetched(true);
      })
      .catch(() => {})
      .finally(() => setLiveLoading(false));
  };

  useEffect(() => {
    if (tab === 'pipeline' && !liveFetched && selectedTicker) {
      fetchLivePipeline();
    }
  }, [tab, liveFetched, selectedTicker]);

  // Reset live data when ticker changes
  useEffect(() => {
    setLiveFetched(false);
    setTrials([]);
    setPublications([]);
    setPipelineTab('curated');
  }, [selectedTicker]);

  if (!co) return null;

  const inWL = watchlist.includes(co.ticker);
  const drugs = PIPELINE_STATIC.filter((d: PipelineDrug) => d.companyTicker === co.ticker);
  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const isUp = co.changePercent >= 0;
  const upside = ((co.priceTarget - co.price) / co.price) * 100;
  const totalPipeline = drugs.length + trials.length + publications.length;

  const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
    if (active && Array.isArray(payload) && payload.length) {
      const price = (payload[0] as { value: number }).value;
      return (
        <div className="card px-3 py-2 text-xs">
          <div className="text-terminal-muted">{label as string}</div>
          <div className="text-terminal-text font-bold num">${fmt(price)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Header */}
      <div className="card p-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button onClick={() => setView('dashboard')}
              className="flex items-center gap-1 text-terminal-muted hover:text-terminal-accent text-xs mt-1 transition-colors">
              <ArrowLeft size={14} /> Back
            </button>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-terminal-accent">{co.ticker}</span>
                <span className="text-terminal-muted">·</span>
                <span className="text-sm text-terminal-text">{co.name}</span>
                <button onClick={() => inWL ? removeFromWatchlist(co.ticker) : addToWatchlist(co.ticker)}
                  className={clsx('transition-colors', inWL ? 'text-yellow-400' : 'text-terminal-dim hover:text-yellow-400')}>
                  {inWL ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                </button>
              </div>
              <div className="flex gap-2 mt-1">
                {co.focusTags.map(t => (
                  <span key={t} className="bg-terminal-border/50 text-terminal-muted px-2 py-0.5 rounded text-[11px]">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-terminal-text num">${fmt(co.price)}</div>
            <div className={clsx('flex items-center justify-end gap-1 text-lg font-bold num', isUp ? 'up' : 'down')}>
              {isUp ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              {isUp ? '+' : ''}{fmt(co.change)} ({isUp ? '+' : ''}{fmt(co.changePercent)}%)
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-6 gap-4 mt-4 pt-4 border-t border-terminal-border">
          {[
            { label: 'MKT CAP', value: fmtB(co.marketCap) },
            { label: '52W HIGH', value: `$${fmt(co.week52High)}` },
            { label: '52W LOW', value: `$${fmt(co.week52Low)}` },
            { label: 'ANALYST', value: co.analystRating, color: co.analystRating === 'Buy' ? 'up' : co.analystRating === 'Sell' ? 'down' : 'neutral' },
            { label: 'TARGET', value: `$${fmt(co.priceTarget)}` },
            { label: 'UPSIDE', value: `${upside >= 0 ? '+' : ''}${fmt(upside)}%`, color: upside >= 0 ? 'up' : 'down' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-terminal-muted text-xs">{stat.label}</div>
              <div className={clsx('font-bold text-sm num', stat.color ?? 'text-terminal-text')}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-shrink-0">
        {(['chart', 'fundamentals', 'pipeline'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-4 py-1.5 rounded text-xs capitalize transition-colors',
              tab === t ? 'bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30' : 'text-terminal-muted hover:text-terminal-text'
            )}>
            {t === 'pipeline'
              ? `Pipeline (${liveFetched ? totalPipeline : drugs.length}${liveFetched ? '' : '+'})`
              : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        {tab === 'chart' && (
          <div className="card p-4 h-full flex flex-col">
            <div className="flex gap-1 mb-4">
              {(['1D', '5D', '1M', '6M', '1Y', '5Y', 'Max'] as Range[]).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={clsx('px-2 py-1 rounded text-xs transition-colors',
                    range === r ? 'bg-terminal-accent text-terminal-bg font-bold' : 'text-terminal-muted hover:text-terminal-text'
                  )}>
                  {r}
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={v => { const d = new Date(v); return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getDate()}`; }}
                    interval="preserveStartEnd" />
                  <YAxis domain={[minPrice * 0.98, maxPrice * 1.02]} tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={v => `$${fmt(v, 0)}`} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={co.basePrice} stroke="#64748b" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="price" stroke={isUp ? '#22c55e' : '#ef4444'}
                    fill="url(#priceGrad)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === 'fundamentals' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <h3 className="text-terminal-muted text-xs font-bold mb-3 tracking-wider">VALUATION</h3>
              <div className="space-y-2">
                {[
                  { label: 'P/E Ratio', value: co.pe ? fmt(co.pe, 1) + 'x' : 'N/A (negative EPS)' },
                  { label: 'P/S Ratio', value: fmt(co.ps, 1) + 'x' },
                  { label: 'EV/EBITDA', value: co.evEbitda ? fmt(co.evEbitda, 1) + 'x' : 'N/A' },
                  { label: 'Debt / Equity', value: fmt(co.debtToEquity, 2) + 'x' },
                  { label: 'Market Cap', value: fmtB(co.marketCap) },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-1 border-b border-terminal-border/20">
                    <span className="text-terminal-muted">{r.label}</span>
                    <span className="text-terminal-text font-medium num">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-terminal-muted text-xs font-bold mb-3 tracking-wider">FINANCIALS</h3>
              <div className="space-y-2">
                {[
                  { label: 'Revenue (TTM)', value: fmtB(co.revenue) },
                  { label: 'Revenue Growth', value: `${co.revenueGrowth >= 0 ? '+' : ''}${fmt(co.revenueGrowth)}%`, color: co.revenueGrowth >= 0 ? 'up' : 'down' },
                  { label: 'Net Income', value: co.netIncome ? fmtB(co.netIncome) : 'Unprofitable', color: co.netIncome && co.netIncome > 0 ? 'up' : 'down' },
                  { label: 'R&D % Revenue', value: `${fmt(co.rdPercent)}%` },
                  { label: 'Cash Runway', value: co.cashRunway + ' quarters' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-1 border-b border-terminal-border/20">
                    <span className="text-terminal-muted">{r.label}</span>
                    <span className={clsx('font-medium num', r.color ?? 'text-terminal-text')}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-terminal-muted text-xs font-bold mb-3 tracking-wider">ANALYST CONSENSUS</h3>
              <div className="space-y-2">
                {[
                  { label: 'Rating', value: co.analystRating, color: co.analystRating === 'Buy' ? 'up' : co.analystRating === 'Sell' ? 'down' : 'neutral' },
                  { label: 'Price Target', value: `$${fmt(co.priceTarget)}` },
                  { label: 'Upside / Downside', value: `${upside >= 0 ? '+' : ''}${fmt(upside)}%`, color: upside >= 0 ? 'up' : 'down' },
                  { label: 'Institutional Own.', value: `${fmt(co.institutionalOwnership)}%` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-1 border-b border-terminal-border/20">
                    <span className="text-terminal-muted">{r.label}</span>
                    <span className={clsx('font-medium num', r.color ?? 'text-terminal-text')}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-terminal-muted text-xs font-bold mb-3 tracking-wider">COMPANY INFO</h3>
              <div className="space-y-2">
                {[
                  { icon: <Building size={12} />, label: 'HQ', value: co.hq },
                  { icon: <Users size={12} />, label: 'Employees', value: co.employees.toLocaleString() },
                  { icon: <Calendar size={12} />, label: 'Founded', value: String(co.founded) },
                  { icon: <MapPin size={12} />, label: 'Focus', value: co.focusArea },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-start py-1 border-b border-terminal-border/20 gap-4">
                    <span className="flex items-center gap-1 text-terminal-muted shrink-0">{r.icon} {r.label}</span>
                    <span className="text-terminal-text text-right">{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-terminal-border text-terminal-muted text-xs leading-relaxed">
                {co.description}
              </div>
            </div>
          </div>
        )}

        {tab === 'pipeline' && (
          <div className="space-y-3">
            {/* Pipeline sub-tabs */}
            <div className="flex items-center gap-2">
              <button onClick={() => setPipelineTab('curated')}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors',
                  pipelineTab === 'curated' ? 'bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30' : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
                )}>
                <FlaskConical size={11} /> Curated ({drugs.length})
              </button>
              <button onClick={() => setPipelineTab('trials')}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors',
                  pipelineTab === 'trials' ? 'bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30' : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
                )}>
                <ExternalLink size={11} /> CT.gov ({liveLoading ? '…' : trials.length})
              </button>
              <button onClick={() => setPipelineTab('publications')}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors',
                  pipelineTab === 'publications' ? 'bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30' : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
                )}>
                <BookOpen size={11} /> PubMed ({liveLoading ? '…' : publications.length})
              </button>
              {liveFetched && (
                <button onClick={fetchLivePipeline} disabled={liveLoading}
                  className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs border border-terminal-border/50 text-terminal-muted hover:text-terminal-text transition-colors disabled:opacity-50">
                  <RefreshCw size={10} className={liveLoading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              )}
            </div>

            {/* Loading state */}
            {liveLoading && pipelineTab !== 'curated' && (
              <div className="card p-8 text-center">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-terminal-accent" />
                <div className="text-terminal-muted text-xs">Fetching live data from ClinicalTrials.gov & PubMed…</div>
              </div>
            )}

            {/* Curated pipeline */}
            {pipelineTab === 'curated' && (
              drugs.length === 0 ? (
                <div className="card p-8 text-center text-terminal-muted text-xs">No curated pipeline data for {co.ticker}</div>
              ) : (
                PHASE_ORDER.map(phase => {
                  const phaseDrugs = drugs.filter(d => d.phase === phase);
                  if (!phaseDrugs.length) return null;
                  return (
                    <div key={phase} className="card p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={clsx('badge', PHASE_CLASS[phase])}>{phase}</span>
                        <span className="text-terminal-muted text-xs">{phaseDrugs.length} program{phaseDrugs.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="grid gap-2">
                        {phaseDrugs.map(drug => (
                          <div key={drug.id} className="bg-terminal-bg rounded p-3 border border-terminal-border/50">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-bold text-terminal-text">{drug.drugName}</div>
                                <div className="text-terminal-muted text-xs">{drug.genericName} · {drug.mechanism}</div>
                              </div>
                              {drug.estimatedPeakSales && (
                                <div className="text-right">
                                  <div className="text-xs text-terminal-muted">Est. Peak Sales</div>
                                  <div className="text-terminal-accent font-bold text-xs">{fmtB(drug.estimatedPeakSales)}</div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-terminal-text text-xs">{drug.indication}</span>
                              {drug.partnered && <span className="text-terminal-muted text-xs">· Partner: {drug.partner}</span>}
                              {drug.expectedDataDate && (
                                <span className="text-xs text-yellow-400">Data: {drug.expectedDataDate}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              )
            )}

            {/* CT.gov trials */}
            {pipelineTab === 'trials' && !liveLoading && (
              trials.length === 0 ? (
                <div className="card p-8 text-center text-terminal-muted text-xs">No ClinicalTrials.gov data found for {co.ticker}</div>
              ) : (
                CT_PHASE_ORDER.map(phase => {
                  const phaseTrials = trials.filter(t => t.phase === phase);
                  if (!phaseTrials.length) return null;
                  return (
                    <div key={phase} className="card p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={clsx('badge', PHASE_CLASS[phase] ?? 'bg-terminal-muted/10 text-terminal-muted')}>{phase}</span>
                        <span className="text-terminal-muted text-xs">{phaseTrials.length} trial{phaseTrials.length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="space-y-2">
                        {phaseTrials.map(trial => (
                          <div key={trial.nctId} className="bg-terminal-bg rounded p-3 border border-terminal-border/50">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <StatusBadge status={trial.status} />
                                  {trial.enrollment > 0 && (
                                    <span className="text-terminal-muted text-[10px]">n={trial.enrollment.toLocaleString()}</span>
                                  )}
                                  {trial.startDate && (
                                    <span className="text-terminal-muted text-[10px]">Started {trial.startDate}</span>
                                  )}
                                  {trial.completionDate && (
                                    <span className="text-terminal-muted text-[10px]">· Est. completion {trial.completionDate}</span>
                                  )}
                                </div>
                                <div className="text-terminal-text text-xs font-medium leading-snug">{trial.title}</div>
                                {trial.conditions.length > 0 && (
                                  <div className="text-terminal-muted text-[10px] mt-1">
                                    {trial.conditions.slice(0, 3).join(' · ')}
                                    {trial.conditions.length > 3 && ` +${trial.conditions.length - 3} more`}
                                  </div>
                                )}
                                {trial.interventions.length > 0 && (
                                  <div className="text-terminal-accent/70 text-[10px] mt-0.5">
                                    {trial.interventions.slice(0, 3).join(', ')}
                                  </div>
                                )}
                              </div>
                              <a href={trial.nctUrl} target="_blank" rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center gap-1 text-[10px] text-terminal-accent hover:underline transition-colors">
                                <ExternalLink size={10} />{trial.nctId}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              )
            )}

            {/* PubMed publications */}
            {pipelineTab === 'publications' && !liveLoading && (
              publications.length === 0 ? (
                <div className="card p-8 text-center text-terminal-muted text-xs">No PubMed publications found for {co.ticker}</div>
              ) : (
                <div className="card p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={13} className="text-terminal-muted" />
                    <span className="text-terminal-muted text-xs font-bold tracking-wider">PUBMED PUBLICATIONS</span>
                    <span className="text-terminal-muted text-xs">· {publications.length} papers</span>
                  </div>
                  <div className="space-y-2">
                    {publications.map(pub => (
                      <div key={pub.pmid} className="bg-terminal-bg rounded p-3 border border-terminal-border/50">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {pub.phase && (
                                <span className={clsx('badge', PHASE_CLASS[pub.phase] ?? 'bg-terminal-muted/10 text-terminal-muted')}>{pub.phase}</span>
                              )}
                              {pub.drugName && (
                                <span className="text-terminal-accent text-[10px] font-medium">{pub.drugName}</span>
                              )}
                              <span className="text-terminal-muted text-[10px]">{pub.journal}</span>
                              <span className="text-terminal-muted text-[10px]">{pub.pubDate}</span>
                            </div>
                            <div className="text-terminal-text text-xs leading-snug">{pub.title}</div>
                          </div>
                          <a href={pub.url} target="_blank" rel="noopener noreferrer"
                            className="flex-shrink-0 flex items-center gap-1 text-[10px] text-terminal-accent hover:underline transition-colors">
                            <ExternalLink size={10} />PMID {pub.pmid}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
