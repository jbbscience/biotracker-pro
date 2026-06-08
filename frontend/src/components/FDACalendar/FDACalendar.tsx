import { useState, useEffect, useCallback } from 'react';
import { Calendar, AlertTriangle, Clock, RefreshCw, Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { FDA_MILESTONES_STATIC } from '../../data/staticData';
import type { FDAMilestone } from '../../types';
import clsx from 'clsx';
import { apiFetch } from '../../utils/api';

const TYPE_COLORS: Record<string, string> = {
  'PDUFA':            'bg-green-500/15 text-green-400 border-green-500/30',
  'AdCom':            'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Phase III Result': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'CRL Response':     'bg-red-500/15 text-red-400 border-red-500/30',
  'NDA Filing':       'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Approved':         'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const SIG_COLORS: Record<string, string> = {
  'High':   'text-red-400',
  'Medium': 'text-yellow-400',
  'Low':    'text-terminal-muted',
};

function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function SourceBadge({ source }: { source?: 'static' | 'live' }) {
  if (source === 'live') {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-terminal-accent/15 text-terminal-accent border border-terminal-accent/30 font-medium">
        <Zap size={8} />LIVE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-terminal-muted/10 text-terminal-muted border border-terminal-border/30 font-medium">
      CURATED
    </span>
  );
}

export function FDACalendar() {
  const { selectTicker } = useStore();
  const [filterType, setFilterType] = useState<string>('All');
  const [filterSig, setFilterSig] = useState<string>('All');
  const [filterSource, setFilterSource] = useState<string>('All');
  const [liveEvents, setLiveEvents] = useState<FDAMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchLive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/fda/calendar');
      if (res.ok) {
        const data = await res.json() as FDAMilestone[];
        setLiveEvents(data);
        setLastFetch(new Date());
      }
    } catch {
      // silently fall back to static only
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  // Tag static milestones with source field
  const staticTagged: FDAMilestone[] = FDA_MILESTONES_STATIC.map(m => ({ ...m, source: 'static' as const }));

  // Merge: live events first, then static (skip static entries that overlap with live by same ticker+drug+type within 30 days)
  const allMilestones: FDAMilestone[] = [...staticTagged];
  for (const live of liveEvents) {
    const isDupe = staticTagged.some(s =>
      s.companyTicker === live.companyTicker &&
      s.milestoneType === live.milestoneType &&
      Math.abs(daysUntil(s.date) - daysUntil(live.date)) <= 30 &&
      (s.drugName.toLowerCase().includes(live.drugName.toLowerCase().slice(0, 6)) ||
       live.drugName.toLowerCase().includes(s.drugName.toLowerCase().slice(0, 6)))
    );
    if (!isDupe) allMilestones.push(live);
  }

  const types = ['All', 'PDUFA', 'AdCom', 'Phase III Result', 'CRL Response', 'NDA Filing', 'Approved'];
  const sigs = ['All', 'High', 'Medium', 'Low'];
  const sources = ['All', 'Live', 'Curated'];

  const filtered = allMilestones
    .filter(m => {
      const typeMatch = filterType === 'All' || m.milestoneType === filterType;
      const sigMatch = filterSig === 'All' || m.significance === filterSig;
      const srcMatch = filterSource === 'All' ||
        (filterSource === 'Live' && m.source === 'live') ||
        (filterSource === 'Curated' && m.source === 'static');
      return typeMatch && sigMatch && srcMatch;
    })
    .sort((a, b) => a.date < b.date ? -1 : 1);

  const upcoming30 = allMilestones.filter(m => { const d = daysUntil(m.date); return d >= 0 && d <= 30; });
  const upcoming90 = allMilestones.filter(m => { const d = daysUntil(m.date); return d >= 0 && d <= 90; });
  const highSig = allMilestones.filter(m => m.significance === 'High');
  const approvedCount = liveEvents.filter(e => e.milestoneType === 'Approved').length;

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">TOTAL CATALYSTS</div>
          <div className="text-2xl font-bold text-terminal-text">{allMilestones.length}</div>
          <div className="text-terminal-muted text-xs">{liveEvents.length} live · {staticTagged.length} curated</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">NEXT 30 DAYS</div>
          <div className="text-2xl font-bold text-yellow-400">{upcoming30.length}</div>
          <div className="text-terminal-muted text-xs">upcoming events</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">NEXT 90 DAYS</div>
          <div className="text-2xl font-bold text-blue-400">{upcoming90.length}</div>
          <div className="text-terminal-muted text-xs">Q2-Q3 catalysts</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">HIGH SIGNIFICANCE</div>
          <div className="text-2xl font-bold text-red-400">{highSig.length}</div>
          <div className="text-terminal-muted text-xs">{approvedCount} recent approvals</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        <Calendar size={14} className="text-terminal-muted" />
        <span className="text-terminal-muted text-xs">Type:</span>
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={clsx('px-2 py-1 rounded text-xs transition-colors',
              filterType === t ? 'bg-terminal-accent text-terminal-bg font-bold' : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
            )}>{t}</button>
        ))}
        <span className="text-terminal-muted text-xs ml-2">Sig:</span>
        {sigs.map(s => (
          <button key={s} onClick={() => setFilterSig(s)}
            className={clsx('px-2 py-1 rounded text-xs transition-colors',
              filterSig === s ? 'bg-terminal-accent text-terminal-bg font-bold' : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
            )}>{s}</button>
        ))}
        <span className="text-terminal-muted text-xs ml-2">Source:</span>
        {sources.map(s => (
          <button key={s} onClick={() => setFilterSource(s)}
            className={clsx('px-2 py-1 rounded text-xs transition-colors',
              filterSource === s ? 'bg-terminal-accent text-terminal-bg font-bold' : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
            )}>{s}</button>
        ))}
        <button onClick={fetchLive} disabled={loading}
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded text-xs border border-terminal-border/50 text-terminal-muted hover:text-terminal-text transition-colors disabled:opacity-50">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading…' : lastFetch ? `Updated ${lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}
        </button>
        <span className="text-terminal-muted text-xs">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-2">
          {filtered.map(m => {
            const days = daysUntil(m.date);
            const isPast = days < 0;
            const isImminent = days >= 0 && days <= 14;
            const isApproved = m.milestoneType === 'Approved';

            return (
              <div key={m.id}
                className={clsx('card p-4 transition-colors hover:border-terminal-accent/30',
                  isImminent && !isPast && 'border-yellow-500/40 bg-yellow-500/5',
                  isApproved && !isPast && 'border-emerald-500/40 bg-emerald-500/5',
                  isPast && 'opacity-50'
                )}>
                <div className="flex items-start gap-4">
                  {/* Date */}
                  <div className="w-24 flex-shrink-0 text-center">
                    <div className="text-terminal-text font-bold text-sm">
                      {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-terminal-muted text-xs">{new Date(m.date).getFullYear()}</div>
                    <div className={clsx('text-xs font-bold mt-1',
                      isApproved ? 'text-emerald-400' :
                      isPast ? 'text-terminal-muted' :
                      days <= 7 ? 'text-red-400' :
                      days <= 30 ? 'text-yellow-400' : 'text-terminal-muted'
                    )}>
                      {isApproved && isPast ? 'APPROVED' :
                       isPast ? `${Math.abs(days)}d ago` :
                       days === 0 ? 'TODAY' : `T-${days}d`}
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => selectTicker(m.companyTicker)}
                        className="text-terminal-accent font-bold text-sm hover:underline">{m.companyTicker}</button>
                      <span className="text-terminal-muted text-xs">·</span>
                      <span className="text-terminal-text font-medium">{m.companyName}</span>
                      <span className={clsx('badge border', TYPE_COLORS[m.milestoneType] ?? 'text-terminal-muted')}>
                        {isApproved && <CheckCircle2 size={10} className="inline mr-0.5" />}
                        {m.milestoneType}
                      </span>
                      <div className={clsx('flex items-center gap-1 text-xs', SIG_COLORS[m.significance])}>
                        <AlertTriangle size={11} />
                        {m.significance}
                      </div>
                      <SourceBadge source={m.source} />
                    </div>
                    <div className="text-terminal-text font-medium mt-1">{m.drugName}</div>
                    {m.indication && (
                      <div className="text-terminal-muted text-xs mt-0.5">{m.indication}</div>
                    )}
                    <div className="text-terminal-muted text-xs mt-2 leading-relaxed">{m.notes}</div>
                    {m.applicationNumber && (
                      <a
                        href={`https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${m.applicationNumber.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-terminal-accent/70 hover:text-terminal-accent mt-1 transition-colors"
                      >
                        <ExternalLink size={9} /> {m.applicationNumber}
                      </a>
                    )}
                  </div>

                  {/* Countdown / status indicator */}
                  {isApproved ? (
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded border flex-shrink-0 border-emerald-500/40 bg-emerald-500/10">
                      <CheckCircle2 size={20} className="text-emerald-400" />
                      <div className="text-[10px] text-emerald-400 mt-1 font-bold">APPROVED</div>
                    </div>
                  ) : !isPast ? (
                    <div className={clsx('flex flex-col items-center justify-center w-16 h-16 rounded border flex-shrink-0',
                      days <= 7 ? 'border-red-500/40 bg-red-500/10' :
                      days <= 30 ? 'border-yellow-500/40 bg-yellow-500/10' :
                      'border-terminal-border'
                    )}>
                      <Clock size={12} className={days <= 7 ? 'text-red-400' : days <= 30 ? 'text-yellow-400' : 'text-terminal-muted'} />
                      <div className={clsx('text-lg font-bold num', days <= 7 ? 'text-red-400' : days <= 30 ? 'text-yellow-400' : 'text-terminal-text')}>{days}</div>
                      <div className="text-terminal-muted text-[10px]">days</div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-terminal-muted">
              <Calendar size={32} className="mx-auto mb-3 opacity-30" />
              <div>No events match current filters</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
