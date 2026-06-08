import { useState, useEffect, useRef } from 'react';
import { Newspaper, TrendingUp, TrendingDown, Minus, Search, ExternalLink, RefreshCw, ChevronDown, ChevronUp, BarChart2, Brain, Eye, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { NewsItem, DigestEntry, MarketBrief } from '../../types';
import clsx from 'clsx';
import { apiFetch } from '../../utils/api';

const CAT_COLORS: Record<string, string> = {
  FDA:      'bg-green-500/15 text-green-400 border-green-500/30',
  Clinical: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Earnings: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  MA:       'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Analyst:  'bg-orange-500/15 text-orange-400 border-orange-500/30',
  General:  'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const OUTLOOK_STYLE: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  Bullish: { color: 'text-green-400', bg: 'bg-green-500/8', border: 'border-green-500/25', icon: <TrendingUp size={14} /> },
  Bearish: { color: 'text-red-400',   bg: 'bg-red-500/8',   border: 'border-red-500/25',   icon: <TrendingDown size={14} /> },
  Mixed:   { color: 'text-yellow-400',bg: 'bg-yellow-500/8',border: 'border-yellow-500/25', icon: <Minus size={14} /> },
};

const CATS = ['All', 'FDA', 'Clinical', 'Earnings', 'Analyst', 'MA', 'General'];

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SentimentBar({ pos, neg, neu }: { pos: number; neg: number; neu: number }) {
  const total = pos + neg + neu || 1;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full mt-1">
      <div className="bg-green-500" style={{ width: `${(pos / total) * 100}%` }} />
      <div className="bg-red-500"   style={{ width: `${(neg / total) * 100}%` }} />
      <div className="bg-gray-600"  style={{ width: `${(neu / total) * 100}%` }} />
    </div>
  );
}

function DigestCard({ entry, onSelect }: { entry: DigestEntry; onSelect: (t: string) => void }) {
  const dominant = entry.positive > entry.negative ? 'Positive'
    : entry.negative > entry.positive ? 'Negative' : 'Neutral';
  return (
    <div className="card flex-shrink-0 w-52 cursor-pointer hover:border-terminal-accent/40 transition-colors"
      onClick={() => onSelect(entry.ticker)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-terminal-accent font-bold text-sm">{entry.ticker}</span>
        <span className={clsx('text-xs font-semibold',
          dominant === 'Positive' ? 'text-green-400' : dominant === 'Negative' ? 'text-red-400' : 'text-gray-400')}>
          {entry.count} stories
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">{entry.companyName}</p>
      <SentimentBar pos={entry.positive} neg={entry.negative} neu={entry.neutral} />
      <div className="mt-2 space-y-1">
        {entry.topHeadlines.slice(0, 2).map((h, i) => (
          <p key={i} className="text-xs text-gray-400 leading-tight line-clamp-2">{h}</p>
        ))}
      </div>
      <p className="text-[10px] text-gray-700 mt-2">{timeAgo(entry.latestDate)}</p>
    </div>
  );
}

function MarketBriefCard({ brief, loading, onRefresh }: {
  brief: MarketBrief | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const outlook = brief ? OUTLOOK_STYLE[brief.outlook] : null;

  return (
    <div className={clsx('card flex-shrink-0 border transition-colors',
      outlook ? `${outlook.bg} ${outlook.border}` : 'border-terminal-accent/20 bg-terminal-accent/5'
    )}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-0">
        <Brain size={14} className="text-terminal-accent flex-shrink-0" />
        <span className="text-terminal-accent text-xs font-bold tracking-wider">AI MARKET BRIEF</span>
        {brief && (
          <>
            <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border', outlook?.color, outlook?.bg, outlook?.border)}>
              {outlook?.icon}{brief.outlook}
            </span>
            {brief.themes.map(t => (
              <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-terminal-surface border border-terminal-border/50 text-terminal-muted">
                {t}
              </span>
            ))}
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          {brief && (
            <span className="text-terminal-muted text-[10px]">
              {timeAgo(brief.generatedAt)}
            </span>
          )}
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-terminal-border/50 text-terminal-muted hover:text-terminal-text transition-colors disabled:opacity-40">
            <RefreshCw size={9} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Generating…' : 'Refresh'}
          </button>
          <button onClick={() => setCollapsed(v => !v)} className="text-terminal-muted hover:text-terminal-text transition-colors">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {loading && !brief && (
            <div className="mt-3 flex items-center gap-2 text-terminal-muted text-xs">
              <RefreshCw size={12} className="animate-spin text-terminal-accent" />
              Analyzing {RSS_FEED_COUNT} news sources with Claude…
            </div>
          )}

          {!loading && !brief && (
            <div className="mt-3 flex items-center gap-2 text-terminal-muted text-xs">
              <AlertCircle size={12} className="text-yellow-400" />
              Summary unavailable — news data not yet loaded.
            </div>
          )}

          {brief && (
            <div className="mt-3 grid grid-cols-3 gap-4">
              {/* Summary */}
              <div className="col-span-2">
                <p className="text-terminal-text text-xs leading-relaxed">{brief.summary}</p>
              </div>

              {/* Watch items */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-[10px] text-terminal-muted font-bold tracking-wider mb-1">
                  <Eye size={10} />WATCH LIST
                </div>
                {brief.watchItems.map((w, i) => (
                  <div key={i} className="border-l-2 border-terminal-accent/40 pl-2">
                    <div className="text-terminal-accent text-[10px] font-bold">{w.label}</div>
                    <div className="text-terminal-muted text-[10px] leading-snug">{w.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function NewsFeed() {
  const { selectTicker } = useStore();

  const [news, setNews]         = useState<NewsItem[]>([]);
  const [digest, setDigest]     = useState<DigestEntry[]>([]);
  const [brief, setBrief]       = useState<MarketBrief | null>(null);
  const [loading, setLoading]   = useState(true);
  const [briefLoading, setBriefLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [showDigest, setShowDigest] = useState(true);

  const [filterCat,  setFilterCat]  = useState('All');
  const [filterSent, setFilterSent] = useState('All');
  const [filterTicker, setFilterTicker] = useState('All');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchBrief(force = false) {
    setBriefLoading(true);
    try {
      const url = force ? '/api/news/summary?force=1' : '/api/news/summary';
      const res = await apiFetch(url);
      if (res.ok) setBrief(await res.json());
    } catch {
      // silently fail — summary is supplementary
    } finally {
      setBriefLoading(false);
    }
  }

  async function fetchNews(silent = false) {
    if (!silent) setLoading(true);
    try {
      const [newsRes, digestRes] = await Promise.all([
        apiFetch('/api/news'),
        apiFetch('/api/news/digest'),
      ]);
      if (newsRes.ok)   setNews(await newsRes.json());
      if (digestRes.ok) setDigest(await digestRes.json());
      setLastFetch(new Date());
    } catch (e) {
      console.warn('[NewsFeed] fetch error', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch news and brief in parallel
    fetchNews();
    fetchBrief();
    intervalRef.current = setInterval(() => {
      fetchNews(true);
      fetchBrief();
    }, 20 * 60 * 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const allTickers = Array.from(new Set(news.flatMap(n => n.tickers))).sort();

  const filtered = news.filter(n => {
    if (filterCat !== 'All' && n.category !== filterCat) return false;
    if (filterSent !== 'All' && n.sentiment !== filterSent) return false;
    if (filterTicker !== 'All' && !n.tickers.includes(filterTicker)) return false;
    const q = search.toLowerCase();
    if (q && !n.headline.toLowerCase().includes(q) && !n.tickers.some(t => t.toLowerCase().includes(q)) && !n.source.toLowerCase().includes(q)) return false;
    return true;
  });

  const posCount = news.filter(n => n.sentiment === 'Positive').length;
  const negCount = news.filter(n => n.sentiment === 'Negative').length;
  const neuCount = news.filter(n => n.sentiment === 'Neutral').length;
  const todayCount = news.filter(n => Date.now() - new Date(n.date).getTime() < 86400000).length;

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">

      {/* AI Market Brief */}
      <MarketBriefCard brief={brief} loading={briefLoading} onRefresh={() => fetchBrief(true)} />

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-2 flex-shrink-0">
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">TOTAL STORIES</div>
          <div className="text-2xl font-bold text-terminal-text">{news.length}</div>
          <div className="text-terminal-muted text-xs">{loading ? 'loading…' : lastFetch ? `updated ${timeAgo(lastFetch.toISOString())}` : 'live'}</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">TODAY</div>
          <div className="text-2xl font-bold text-terminal-accent">{todayCount}</div>
          <div className="text-terminal-muted text-xs">last 24h</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">POSITIVE</div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="up" />
            <span className="text-2xl font-bold up">{posCount}</span>
          </div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">NEGATIVE</div>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="down" />
            <span className="text-2xl font-bold down">{negCount}</span>
          </div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">NEUTRAL</div>
          <div className="flex items-center gap-2">
            <Minus size={16} className="neutral" />
            <span className="text-2xl font-bold neutral">{neuCount}</span>
          </div>
        </div>
      </div>

      {/* Daily Digest */}
      {digest.length > 0 && (
        <div className="flex-shrink-0">
          <button
            onClick={() => setShowDigest(v => !v)}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white mb-2 transition-colors"
          >
            <BarChart2 size={13} className="text-terminal-accent" />
            <span className="font-semibold text-terminal-accent">DAILY DIGEST</span>
            <span className="text-gray-600">— {digest.length} companies in the news today</span>
            {showDigest ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showDigest && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {digest.map(entry => (
                <DigestCard key={entry.ticker} entry={entry} onSelect={t => {
                  setFilterTicker(t);
                  selectTicker(null as unknown as string);
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        <Newspaper size={14} className="text-terminal-muted" />

        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-terminal-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search headlines, tickers…"
            className="bg-terminal-surface border border-terminal-border rounded pl-7 pr-3 py-1.5 text-xs text-terminal-text placeholder:text-terminal-muted focus:outline-none focus:border-terminal-accent w-44" />
        </div>

        <select value={filterTicker} onChange={e => setFilterTicker(e.target.value)}
          className="bg-terminal-surface border border-terminal-border text-xs text-terminal-text rounded px-2 py-1.5 focus:outline-none focus:border-terminal-accent">
          <option value="All">All tickers</option>
          {allTickers.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {CATS.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={clsx('px-2 py-1 rounded text-xs transition-colors',
              filterCat === c
                ? 'bg-terminal-accent text-terminal-bg font-bold'
                : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
            )}>{c}</button>
        ))}

        <span className="text-terminal-muted text-xs">·</span>

        {(['All', 'Positive', 'Negative', 'Neutral'] as const).map(s => (
          <button key={s} onClick={() => setFilterSent(s)}
            className={clsx('px-2 py-1 rounded text-xs transition-colors',
              filterSent === s
                ? 'bg-terminal-accent text-terminal-bg font-bold'
                : 'text-terminal-muted hover:text-terminal-text border border-terminal-border/50'
            )}>{s}</button>
        ))}

        <button onClick={() => fetchNews()} disabled={loading}
          className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-white border border-gray-700 rounded px-2 py-1 transition-colors disabled:opacity-40">
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>

        <span className="text-terminal-muted text-xs">{filtered.length} stories</span>
      </div>

      {/* News list */}
      <div className="flex-1 overflow-auto space-y-1.5 min-h-0">
        {loading && news.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-600 gap-2">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Fetching live news from {RSS_FEED_COUNT} sources…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">No stories match your filters.</div>
        ) : filtered.map(item => (
          <div key={item.id}
            className={clsx('card p-3 transition-all hover:border-terminal-accent/30',
              expanded === item.id && 'border-terminal-accent/30'
            )}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className={clsx('badge border text-[10px]', CAT_COLORS[item.category] ?? 'text-terminal-muted')}>{item.category}</span>
                  {item.tickers.map(t => (
                    <button key={t} onClick={() => setFilterTicker(filterTicker === t ? 'All' : t)}
                      className="text-terminal-accent text-xs font-bold hover:underline">{t}</button>
                  ))}
                  <span className="text-terminal-muted text-[10px]">{item.source}</span>
                </div>

                <button
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="text-left text-terminal-text text-sm font-medium leading-snug hover:text-white w-full"
                >
                  {item.headline}
                </button>

                {expanded === item.id && (
                  <div className="mt-2 space-y-2">
                    {item.summary && (
                      <p className="text-terminal-muted text-xs leading-relaxed">{item.summary}</p>
                    )}
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-terminal-accent hover:underline">
                        <ExternalLink size={11} />
                        Read full article
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <div className="flex items-center gap-1">
                  {item.sentiment === 'Positive' && <TrendingUp size={11} className="up" />}
                  {item.sentiment === 'Negative' && <TrendingDown size={11} className="down" />}
                  {item.sentiment === 'Neutral'  && <Minus size={11} className="neutral" />}
                  <span className={clsx('text-xs', item.sentiment === 'Positive' ? 'up' : item.sentiment === 'Negative' ? 'down' : 'neutral')}>
                    {item.sentiment}
                  </span>
                </div>
                <span className="text-terminal-muted text-[10px]">{timeAgo(item.date)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const RSS_FEED_COUNT = 15;
