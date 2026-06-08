import { useState, useMemo } from 'react';
import { Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { useStore } from '../../store/useStore';
import clsx from 'clsx';

type SortKey = 'ticker' | 'price' | 'changePercent' | 'marketCap' | 'pe' | 'revenueGrowth' | 'rdPercent' | 'cashRunway' | 'priceTarget';

function fmt(n: number, d = 2) { return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtB(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
}

export function Screener() {
  const { companies, selectTicker } = useStore();
  const [sortKey, setSortKey] = useState<SortKey>('marketCap');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [chartMode, setChartMode] = useState(false);

  const [filters, setFilters] = useState({
    marketCapMin: 0,
    marketCapMax: Infinity,
    peMax: Infinity,
    revenueGrowthMin: -Infinity,
    rdPercentMin: 0,
    cashRunwayMin: 0,
    analystRating: 'All',
    focusArea: 'All',
    profitable: 'All',
    changePercentMin: -Infinity,
  });

  const areas = ['All', ...Array.from(new Set(companies.flatMap(c => c.focusTags))).sort()];

  const filtered = useMemo(() => {
    return companies.filter(co => {
      const capOk = co.marketCap >= filters.marketCapMin * 1e9 && co.marketCap <= filters.marketCapMax * 1e9;
      const peOk = filters.peMax === Infinity || !co.pe || co.pe <= filters.peMax;
      const growthOk = co.revenueGrowth >= filters.revenueGrowthMin;
      const rdOk = co.rdPercent >= filters.rdPercentMin;
      const cashOk = co.cashRunway >= filters.cashRunwayMin;
      const ratingOk = filters.analystRating === 'All' || co.analystRating === filters.analystRating;
      const areaOk = filters.focusArea === 'All' || co.focusTags.includes(filters.focusArea);
      const profOk = filters.profitable === 'All' || (filters.profitable === 'Yes' ? co.netIncome && co.netIncome > 0 : co.netIncome === null || co.netIncome <= 0);
      const changeOk = co.changePercent >= filters.changePercentMin;
      return capOk && peOk && growthOk && rdOk && cashOk && ratingOk && areaOk && profOk && changeOk;
    }).sort((a, b) => {
      let va = (a as unknown as Record<string, unknown>)[sortKey] as number | null;
      let vb = (b as unknown as Record<string, unknown>)[sortKey] as number | null;
      if (va === null) va = -Infinity;
      if (vb === null) vb = -Infinity;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [companies, filters, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="text-right px-3 py-2">
      <button onClick={() => toggleSort(k)} className={clsx('hover:text-terminal-accent transition-colors', sortKey === k && 'text-terminal-accent')}>
        {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </button>
    </th>
  );

  const scatterData = filtered.map(co => ({
    x: co.revenueGrowth,
    y: co.changePercent,
    z: Math.log(co.marketCap) * 2,
    ticker: co.ticker,
    name: co.name,
  }));

  const upside = (co: typeof companies[0]) => ((co.priceTarget - co.price) / co.price) * 100;

  return (
    <div className="flex gap-3 h-full overflow-hidden">
      {/* Filters sidebar */}
      <div className="w-56 flex-shrink-0 card p-3 overflow-auto flex flex-col gap-3">
        <div className="flex items-center gap-2 text-terminal-muted text-xs font-bold tracking-wider">
          <Filter size={12} /> FILTERS
        </div>

        <div>
          <label className="text-terminal-muted text-xs">Analyst Rating</label>
          <select value={filters.analystRating} onChange={e => setFilters(f => ({ ...f, analystRating: e.target.value }))}
            className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent">
            {['All', 'Buy', 'Hold', 'Sell'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="text-terminal-muted text-xs">Focus Area</label>
          <select value={filters.focusArea} onChange={e => setFilters(f => ({ ...f, focusArea: e.target.value }))}
            className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent">
            {areas.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label className="text-terminal-muted text-xs">Profitable</label>
          <select value={filters.profitable} onChange={e => setFilters(f => ({ ...f, profitable: e.target.value }))}
            className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent">
            {['All', 'Yes', 'No'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="text-terminal-muted text-xs">Min Market Cap ($B)</label>
          <input type="number" min="0" value={filters.marketCapMin || ''}
            onChange={e => setFilters(f => ({ ...f, marketCapMin: Number(e.target.value) || 0 }))}
            placeholder="0"
            className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent" />
        </div>

        <div>
          <label className="text-terminal-muted text-xs">Min Revenue Growth (%)</label>
          <input type="number" value={filters.revenueGrowthMin === -Infinity ? '' : filters.revenueGrowthMin}
            onChange={e => setFilters(f => ({ ...f, revenueGrowthMin: e.target.value === '' ? -Infinity : Number(e.target.value) }))}
            placeholder="Any"
            className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent" />
        </div>

        <div>
          <label className="text-terminal-muted text-xs">Min R&D % Revenue</label>
          <input type="number" min="0" max="100" value={filters.rdPercentMin || ''}
            onChange={e => setFilters(f => ({ ...f, rdPercentMin: Number(e.target.value) || 0 }))}
            placeholder="0%"
            className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent" />
        </div>

        <div>
          <label className="text-terminal-muted text-xs">Min Cash Runway (qtrs)</label>
          <input type="number" min="0" value={filters.cashRunwayMin || ''}
            onChange={e => setFilters(f => ({ ...f, cashRunwayMin: Number(e.target.value) || 0 }))}
            placeholder="0"
            className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent" />
        </div>

        <button onClick={() => setFilters({ marketCapMin: 0, marketCapMax: Infinity, peMax: Infinity, revenueGrowthMin: -Infinity, rdPercentMin: 0, cashRunwayMin: 0, analystRating: 'All', focusArea: 'All', profitable: 'All', changePercentMin: -Infinity })}
          className="text-xs text-terminal-muted hover:text-terminal-accent transition-colors border border-terminal-border/50 rounded py-1.5">
          Reset Filters
        </button>

        <div className="border-t border-terminal-border pt-3">
          <button onClick={() => setChartMode(m => !m)}
            className={clsx('w-full text-xs py-1.5 rounded border transition-colors',
              chartMode ? 'bg-terminal-accent/10 text-terminal-accent border-terminal-accent/30' : 'text-terminal-muted border-terminal-border/50 hover:text-terminal-text'
            )}>
            {chartMode ? 'Show Table' : 'Scatter Plot'}
          </button>
        </div>

        <div className="text-terminal-muted text-xs text-center border-t border-terminal-border pt-2">
          {filtered.length} / {companies.length} companies
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col gap-2">
        {chartMode ? (
          <div className="card p-4 flex-1 flex flex-col">
            <div className="text-terminal-muted text-xs font-bold tracking-wider mb-4">
              SCATTER: Revenue Growth (X) vs Price Change Today (Y) — bubble size = Market Cap
            </div>
            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
                  <XAxis dataKey="x" type="number" name="Rev Growth %" tick={{ fill: '#64748b', fontSize: 10 }}
                    label={{ value: 'Revenue Growth %', position: 'bottom', fill: '#64748b', fontSize: 11 }} />
                  <YAxis dataKey="y" type="number" name="Price Chg %" tick={{ fill: '#64748b', fontSize: 10 }}
                    label={{ value: 'Price Change %', angle: -90, position: 'left', fill: '#64748b', fontSize: 11 }} />
                  <ZAxis dataKey="z" range={[40, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }}
                    content={({ payload }) => {
                      if (payload?.length) {
                        const d = payload[0].payload as typeof scatterData[0];
                        return (
                          <div className="card p-2 text-xs">
                            <div className="text-terminal-accent font-bold">{d.ticker}</div>
                            <div className="text-terminal-muted">{d.name}</div>
                            <div>Rev Growth: {fmt(d.x)}%</div>
                            <div>Price Chg: {fmt(d.y)}%</div>
                          </div>
                        );
                      }
                      return null;
                    }} />
                  <Scatter data={scatterData} fill="#00d4aa" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto card">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-terminal-surface border-b border-terminal-border z-10">
                <tr className="text-terminal-muted">
                  <th className="text-left px-3 py-2">TICKER</th>
                  <th className="text-left px-3 py-2 hidden xl:table-cell">COMPANY</th>
                  <Th k="price" label="PRICE" />
                  <Th k="changePercent" label="CHG%" />
                  <Th k="marketCap" label="MKT CAP" />
                  <Th k="pe" label="P/E" />
                  <Th k="revenueGrowth" label="REV GR%" />
                  <Th k="rdPercent" label="R&D%" />
                  <Th k="cashRunway" label="RUNWAY" />
                  <th className="text-right px-3 py-2">RATING</th>
                  <Th k="priceTarget" label="TARGET" />
                  <th className="text-right px-3 py-2">UPSIDE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(co => {
                  const up = upside(co);
                  return (
                    <tr key={co.ticker} onClick={() => selectTicker(co.ticker)}
                      className="border-b border-terminal-border/30 cursor-pointer hover:bg-white/5 transition-colors">
                      <td className="px-3 py-2 font-bold text-terminal-accent">{co.ticker}</td>
                      <td className="px-3 py-2 text-terminal-text hidden xl:table-cell max-w-[180px] truncate">{co.name}</td>
                      <td className="px-3 py-2 text-right num text-terminal-text">${fmt(co.price)}</td>
                      <td className={clsx('px-3 py-2 text-right num font-bold flex items-center justify-end gap-1', co.changePercent >= 0 ? 'up' : 'down')}>
                        {co.changePercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {co.changePercent >= 0 ? '+' : ''}{fmt(co.changePercent)}%
                      </td>
                      <td className="px-3 py-2 text-right num text-terminal-text">{fmtB(co.marketCap)}</td>
                      <td className="px-3 py-2 text-right num text-terminal-text">{co.pe ? fmt(co.pe, 1) + 'x' : '—'}</td>
                      <td className={clsx('px-3 py-2 text-right num', co.revenueGrowth >= 0 ? 'up' : 'down')}>
                        {co.revenueGrowth >= 0 ? '+' : ''}{fmt(co.revenueGrowth)}%
                      </td>
                      <td className="px-3 py-2 text-right num text-terminal-muted">{fmt(co.rdPercent)}%</td>
                      <td className={clsx('px-3 py-2 text-right num', co.cashRunway <= 4 ? 'down' : co.cashRunway <= 8 ? 'text-yellow-400' : 'text-terminal-text')}>
                        {co.cashRunway}Q
                      </td>
                      <td className={clsx('px-3 py-2 text-right font-bold', co.analystRating === 'Buy' ? 'up' : co.analystRating === 'Sell' ? 'down' : 'neutral')}>
                        {co.analystRating}
                      </td>
                      <td className="px-3 py-2 text-right num text-terminal-muted">${fmt(co.priceTarget)}</td>
                      <td className={clsx('px-3 py-2 text-right num font-bold', up >= 0 ? 'up' : 'down')}>
                        {up >= 0 ? '+' : ''}{fmt(up)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
