import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Search, Star, StarOff, ArrowUpDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

type SortKey = 'ticker' | 'price' | 'changePercent' | 'marketCap' | 'volume' | 'pe';
type SortDir = 'asc' | 'desc';

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtCap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
}
function fmtVol(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

export function Dashboard() {
  const { companies, selectTicker, watchlist, addToWatchlist, removeFromWatchlist } = useStore();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [tab, setTab] = useState<'all' | 'watchlist'>('all');
  const prevPrices = useRef<Map<string, number>>(new Map());
  const [flashMap, setFlashMap] = useState<Map<string, 'up' | 'down'>>(new Map());

  useEffect(() => {
    const newFlash = new Map<string, 'up' | 'down'>();
    companies.forEach(co => {
      const prev = prevPrices.current.get(co.ticker);
      if (prev !== undefined && prev !== co.price) {
        newFlash.set(co.ticker, co.price > prev ? 'up' : 'down');
      }
      prevPrices.current.set(co.ticker, co.price);
    });
    if (newFlash.size > 0) {
      setFlashMap(newFlash);
      setTimeout(() => setFlashMap(new Map()), 800);
    }
  }, [companies]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-terminal-accent transition-colors">
      {label}
      <ArrowUpDown size={10} className={sortKey === k ? 'text-terminal-accent' : 'opacity-30'} />
    </button>
  );

  let filtered = companies.filter(co => {
    const q = search.toLowerCase();
    const match = !q || co.ticker.toLowerCase().includes(q) || co.name.toLowerCase().includes(q) || co.focusArea.toLowerCase().includes(q);
    const inList = tab === 'all' ? true : watchlist.includes(co.ticker);
    return match && inList;
  });

  filtered = [...filtered].sort((a, b) => {
    let va = (a as unknown as Record<string, unknown>)[sortKey] as number | string | null;
    let vb = (b as unknown as Record<string, unknown>)[sortKey] as number | string | null;
    if (va === null) va = -Infinity;
    if (vb === null) vb = -Infinity;
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const topGainer = [...companies].sort((a, b) => b.changePercent - a.changePercent)[0];
  const topLoser = [...companies].sort((a, b) => a.changePercent - b.changePercent)[0];
  const avgChange = companies.reduce((s, c) => s + c.changePercent, 0) / companies.length;

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Market Summary */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">BIOPHARMA INDEX</div>
          <div className={clsx('text-xl font-bold num', avgChange >= 0 ? 'up' : 'down')}>
            {avgChange >= 0 ? '+' : ''}{fmt(avgChange)}%
          </div>
          <div className="text-terminal-muted text-xs">25-stock avg today</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">TOP GAINER</div>
          <div className="text-sm font-bold text-terminal-text">{topGainer?.ticker}</div>
          <div className="up text-sm num font-bold">+{fmt(topGainer?.changePercent ?? 0)}%</div>
          <div className="text-terminal-muted text-xs truncate">{topGainer?.name}</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">TOP LOSER</div>
          <div className="text-sm font-bold text-terminal-text">{topLoser?.ticker}</div>
          <div className="down text-sm num font-bold">{fmt(topLoser?.changePercent ?? 0)}%</div>
          <div className="text-terminal-muted text-xs truncate">{topLoser?.name}</div>
        </div>
        <div className="card p-3">
          <div className="text-terminal-muted text-xs mb-1">SECTOR VOLUME</div>
          <div className="text-xl font-bold text-terminal-text num">
            {fmtVol(companies.reduce((s, c) => s + c.volume, 0))}
          </div>
          <div className="text-terminal-muted text-xs">Total shares traded</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-terminal-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ticker, name, area..."
            className="bg-terminal-surface border border-terminal-border rounded pl-7 pr-3 py-1.5 text-xs text-terminal-text placeholder:text-terminal-muted focus:outline-none focus:border-terminal-accent w-56"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'watchlist'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={clsx('px-3 py-1.5 rounded text-xs capitalize transition-colors',
                tab === t ? 'bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30' : 'text-terminal-muted hover:text-terminal-text border border-transparent'
              )}>
              {t === 'watchlist' ? `★ Watchlist (${watchlist.length})` : 'All Companies'}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-terminal-muted">{filtered.length} companies</div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto card">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-terminal-surface border-b border-terminal-border z-10">
            <tr className="text-terminal-muted">
              <th className="text-left px-3 py-2 w-8"></th>
              <th className="text-left px-3 py-2"><SortBtn k="ticker" label="TICKER" /></th>
              <th className="text-left px-2 py-2 hidden xl:table-cell">COMPANY</th>
              <th className="text-left px-2 py-2 hidden lg:table-cell">FOCUS</th>
              <th className="text-right px-3 py-2"><SortBtn k="price" label="PRICE" /></th>
              <th className="text-right px-3 py-2"><SortBtn k="changePercent" label="CHG%" /></th>
              <th className="text-right px-3 py-2 hidden md:table-cell">CHG $</th>
              <th className="text-right px-3 py-2"><SortBtn k="marketCap" label="MKT CAP" /></th>
              <th className="text-right px-3 py-2 hidden lg:table-cell"><SortBtn k="volume" label="VOLUME" /></th>
              <th className="text-right px-3 py-2 hidden xl:table-cell"><SortBtn k="pe" label="P/E" /></th>
              <th className="text-right px-3 py-2 hidden xl:table-cell">P/S</th>
              <th className="text-right px-3 py-2 hidden xl:table-cell">RATING</th>
              <th className="text-right px-3 py-2 hidden xl:table-cell">TARGET</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((co) => {
              const flash = flashMap.get(co.ticker);
              const inWL = watchlist.includes(co.ticker);
              const ratingColor = co.analystRating === 'Buy' ? 'up' : co.analystRating === 'Sell' ? 'down' : 'neutral';
              return (
                <tr key={co.ticker}
                  onClick={() => selectTicker(co.ticker)}
                  className={clsx(
                    'border-b border-terminal-border/30 cursor-pointer transition-colors hover:bg-white/5',
                    flash === 'up' && 'flash-up',
                    flash === 'down' && 'flash-down',
                  )}
                >
                  <td className="px-3 py-2">
                    <button onClick={e => { e.stopPropagation(); inWL ? removeFromWatchlist(co.ticker) : addToWatchlist(co.ticker); }}
                      className={clsx('transition-colors', inWL ? 'text-yellow-400' : 'text-terminal-dim hover:text-yellow-400')}>
                      {inWL ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
                    </button>
                  </td>
                  <td className="px-3 py-2 font-bold text-terminal-accent">{co.ticker}</td>
                  <td className="px-2 py-2 text-terminal-text hidden xl:table-cell max-w-[180px] truncate">{co.name}</td>
                  <td className="px-2 py-2 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {co.focusTags.slice(0, 2).map(t => (
                        <span key={t} className="bg-terminal-border/50 text-terminal-muted px-1.5 py-0.5 rounded text-[10px]">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right num font-medium text-terminal-text">${fmt(co.price)}</td>
                  <td className={clsx('px-3 py-2 text-right num font-bold', co.changePercent >= 0 ? 'up' : 'down')}>
                    <span className="flex items-center justify-end gap-1">
                      {co.changePercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {co.changePercent >= 0 ? '+' : ''}{fmt(co.changePercent)}%
                    </span>
                  </td>
                  <td className={clsx('px-3 py-2 text-right num hidden md:table-cell', co.change >= 0 ? 'up' : 'down')}>
                    {co.change >= 0 ? '+' : ''}{fmt(co.change)}
                  </td>
                  <td className="px-3 py-2 text-right num text-terminal-text">{fmtCap(co.marketCap)}</td>
                  <td className="px-3 py-2 text-right num text-terminal-muted hidden lg:table-cell">{fmtVol(co.volume)}</td>
                  <td className="px-3 py-2 text-right num text-terminal-text hidden xl:table-cell">{co.pe ? fmt(co.pe, 1) : '—'}</td>
                  <td className="px-3 py-2 text-right num text-terminal-text hidden xl:table-cell">{fmt(co.ps, 1)}x</td>
                  <td className={clsx('px-3 py-2 text-right font-bold hidden xl:table-cell', ratingColor)}>{co.analystRating}</td>
                  <td className="px-3 py-2 text-right num text-terminal-muted hidden xl:table-cell">${fmt(co.priceTarget)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
