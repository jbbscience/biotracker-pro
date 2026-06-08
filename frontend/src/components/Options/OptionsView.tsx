import { useState, useRef, useCallback } from 'react';
import { TrendingUp, TrendingDown, Info, Calculator } from 'lucide-react';
import { blackScholes, daysToExpiry, type BSResult } from '../../utils/blackScholes';
import { useStore } from '../../store/useStore';

const RISK_FREE_RATE = 0.053;

function fmt(n: number | null | undefined, decimals = 2, prefix = ''): string {
  if (n == null || isNaN(n)) return '—';
  return prefix + n.toFixed(decimals);
}

function fmtIV(n: number): string {
  return isNaN(n) || n === 0 ? '—' : (n * 100).toFixed(1) + '%';
}

interface GreekRowProps { label: string; call: number; put: number; color: string }
function GreekRow({ label, call, put, color }: GreekRowProps) {
  return (
    <tr className="border-b border-gray-800 text-sm">
      <td className="py-2 px-3 text-gray-500">{label}</td>
      <td className={`py-2 px-3 font-mono ${color}`}>{fmt(call, 4)}</td>
      <td className={`py-2 px-3 font-mono ${color}`}>{fmt(put, 4)}</td>
    </tr>
  );
}

function PayoffChart({ S, K, iv, T, r }: { S: number; K: number; iv: number; T: number; r: number }) {
  const width = 340, height = 120, pad = { l: 36, r: 10, t: 10, b: 24 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const range = K * 0.4;
  const spots = Array.from({ length: 60 }, (_, i) => S - range + (i / 59) * range * 2);

  const vals = spots.map(spot => {
    const bs = T > 0 && iv > 0 ? blackScholes(spot, K, T, r, iv) : null;
    return { spot, call: bs?.call ?? 0, put: bs?.put ?? 0 };
  });

  const maxVal = Math.max(...vals.map(v => Math.max(v.call, v.put)), 0.01);
  const xScale = (spot: number) => pad.l + ((spot - spots[0]) / (spots[spots.length - 1] - spots[0])) * innerW;
  const yScale = (v: number) => pad.t + innerH - (v / maxVal) * innerH;

  const callPath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(v.spot).toFixed(1)},${yScale(v.call).toFixed(1)}`).join(' ');
  const putPath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(v.spot).toFixed(1)},${yScale(v.put).toFixed(1)}`).join(' ');

  const xS = xScale(S);
  const xK = xScale(K);

  return (
    <svg width={width} height={height} className="w-full">
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + innerH} stroke="#374151" strokeWidth={1} />
      <line x1={pad.l} y1={pad.t + innerH} x2={pad.l + innerW} y2={pad.t + innerH} stroke="#374151" strokeWidth={1} />
      {xK >= pad.l && <line x1={xK} y1={pad.t} x2={xK} y2={pad.t + innerH} stroke="#6b7280" strokeWidth={1} strokeDasharray="3,3" />}
      {xS >= pad.l && <line x1={xS} y1={pad.t} x2={xS} y2={pad.t + innerH} stroke="#00d4aa" strokeWidth={1} strokeDasharray="2,2" />}
      <path d={callPath} fill="none" stroke="#22c55e" strokeWidth={1.5} />
      <path d={putPath} fill="none" stroke="#ef4444" strokeWidth={1.5} />
      <text x={pad.l + 4} y={pad.t + 10} fill="#22c55e" fontSize={9}>Call</text>
      <text x={pad.l + 28} y={pad.t + 10} fill="#ef4444" fontSize={9}>Put</text>
      {xK >= pad.l && <text x={xK + 2} y={pad.t + innerH - 2} fill="#6b7280" fontSize={8}>K</text>}
      {xS >= pad.l && <text x={xS + 2} y={pad.t + 8} fill="#00d4aa" fontSize={8}>S</text>}
    </svg>
  );
}

export default function OptionsView() {
  const companies = useStore(s => s.companies);
  const selectedTicker = useStore(s => s.selectedTicker) ?? 'LLY';

  const [ticker, setTicker] = useState(selectedTicker);
  const company = companies.find(c => c.ticker === ticker);
  const liveSpot = company?.price ?? 0;

  const [spot, setSpot] = useState('');
  const [strike, setStrike] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [iv, setIv] = useState('30');

  const effectiveSpot = parseFloat(spot) || liveSpot;
  const effectiveStrike = parseFloat(strike) || effectiveSpot;
  const effectiveIv = (parseFloat(iv) || 30) / 100;
  const dte = expiryDate ? daysToExpiry(expiryDate) : 30;
  const T = dte / 365;

  const result: BSResult | null = effectiveSpot > 0 && effectiveStrike > 0 && effectiveIv > 0 && T > 0
    ? blackScholes(effectiveSpot, effectiveStrike, T, RISK_FREE_RATE, effectiveIv)
    : null;

  // Prefill spot when ticker changes
  const prevTicker = useRef(ticker);
  if (prevTicker.current !== ticker) {
    prevTicker.current = ticker;
    setSpot('');
    setStrike('');
  }

  const handleTickerChange = useCallback((t: string) => {
    setTicker(t);
    setSpot('');
    setStrike('');
  }, []);

  const displaySpot = effectiveSpot > 0 ? effectiveSpot : 0;

  // Moneyness
  const moneyness = effectiveStrike > 0 && displaySpot > 0
    ? ((displaySpot - effectiveStrike) / effectiveStrike) * 100
    : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator size={18} className="text-[#00d4aa]" />
        <h2 className="text-xl font-bold text-white">Black-Scholes Options Calculator</h2>
        <div className="flex items-center gap-1 text-xs text-[#00d4aa]/70 bg-[#00d4aa]/10 px-2 py-1 rounded border border-[#00d4aa]/20">
          <Info size={11} />
          <span>Live spot price · BS pricing · No external API</span>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        {/* Inputs */}
        <div className="card w-72 flex-shrink-0 space-y-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Parameters</h3>

          {/* Ticker */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Underlying</label>
            <select
              value={ticker}
              onChange={e => handleTickerChange(e.target.value)}
              className="w-full bg-[#0a0e1a] border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-[#00d4aa]"
            >
              {companies.map(c => (
                <option key={c.ticker} value={c.ticker}>{c.ticker} — {c.name}</option>
              ))}
            </select>
            {liveSpot > 0 && (
              <p className="text-xs text-[#00d4aa]">
                Live: ${liveSpot.toFixed(2)}
                {company?.changePercent !== undefined && (
                  <span className={company.changePercent >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                    ({company.changePercent >= 0 ? '+' : ''}{company.changePercent.toFixed(2)}%)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Spot override */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Spot Price (S) <span className="text-gray-600">— leave blank to use live</span></label>
            <input
              type="number"
              value={spot}
              onChange={e => setSpot(e.target.value)}
              placeholder={liveSpot > 0 ? liveSpot.toFixed(2) : 'e.g. 850'}
              className="w-full bg-[#0a0e1a] border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-[#00d4aa] placeholder-gray-700"
            />
          </div>

          {/* Strike */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Strike Price (K)</label>
            <input
              type="number"
              value={strike}
              onChange={e => setStrike(e.target.value)}
              placeholder={displaySpot > 0 ? displaySpot.toFixed(0) : 'e.g. 850'}
              className="w-full bg-[#0a0e1a] border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-[#00d4aa] placeholder-gray-700"
            />
            {effectiveStrike > 0 && displaySpot > 0 && (
              <p className={`text-xs ${Math.abs(moneyness) < 2 ? 'text-yellow-400' : moneyness > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {moneyness > 2 ? 'In-the-money (call)' : moneyness < -2 ? 'Out-of-the-money (call)' : 'At-the-money'}
                {' '}({moneyness >= 0 ? '+' : ''}{moneyness.toFixed(1)}%)
              </p>
            )}
          </div>

          {/* Expiry */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Expiration Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-[#0a0e1a] border border-gray-700 text-white text-sm px-3 py-2 rounded focus:outline-none focus:border-[#00d4aa]"
            />
            {expiryDate && (
              <p className="text-xs text-gray-500">{Math.round(dte)} days to expiry · T = {T.toFixed(4)} yrs</p>
            )}
          </div>

          {/* IV */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Implied Volatility (IV %)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={200}
                value={iv}
                onChange={e => setIv(e.target.value)}
                className="flex-1 accent-[#00d4aa]"
              />
              <div className="flex items-center">
                <input
                  type="number"
                  value={iv}
                  onChange={e => setIv(e.target.value)}
                  className="w-16 bg-[#0a0e1a] border border-gray-700 text-white text-sm px-2 py-1 rounded text-right focus:outline-none focus:border-[#00d4aa]"
                />
                <span className="text-gray-500 text-sm ml-1">%</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">Risk-free rate: {(RISK_FREE_RATE * 100).toFixed(1)}% (10Y Treasury)</p>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 space-y-3 min-w-0">
          {result ? (
            <>
              {/* Price cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card border-green-800/40">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-green-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Call Price</span>
                  </div>
                  <p className="text-3xl font-mono font-bold text-green-400">${fmt(result.call)}</p>
                  <p className="text-xs text-gray-600 mt-1">d₁ = {fmt(result.d1, 4)} · d₂ = {fmt(result.d2, 4)}</p>
                </div>
                <div className="card border-red-800/40">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={14} className="text-red-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Put Price</span>
                  </div>
                  <p className="text-3xl font-mono font-bold text-red-400">${fmt(result.put)}</p>
                  <p className="text-xs text-gray-600 mt-1">Put-call parity: ${fmt(result.call - result.put + effectiveStrike * Math.exp(-RISK_FREE_RATE * T) - effectiveSpot)}</p>
                </div>
              </div>

              {/* Greeks table */}
              <div className="card">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Greeks</h3>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-gray-800">
                      <th className="pb-2 px-3">Greek</th>
                      <th className="pb-2 px-3">Call</th>
                      <th className="pb-2 px-3">Put</th>
                      <th className="pb-2 px-3 text-gray-700">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-800 text-sm">
                      <td className="py-2 px-3 text-gray-500">Delta (Δ)</td>
                      <td className="py-2 px-3 font-mono text-blue-400">{fmt(result.callGreeks.delta, 4)}</td>
                      <td className="py-2 px-3 font-mono text-blue-400">{fmt(result.putGreeks.delta, 4)}</td>
                      <td className="py-2 px-3 text-xs text-gray-700">$ change per $1 move in S</td>
                    </tr>
                    <tr className="border-b border-gray-800 text-sm">
                      <td className="py-2 px-3 text-gray-500">Gamma (Γ)</td>
                      <td className="py-2 px-3 font-mono text-purple-400">{fmt(result.callGreeks.gamma, 5)}</td>
                      <td className="py-2 px-3 font-mono text-purple-400">{fmt(result.putGreeks.gamma, 5)}</td>
                      <td className="py-2 px-3 text-xs text-gray-700">Δ change per $1 move in S</td>
                    </tr>
                    <tr className="border-b border-gray-800 text-sm">
                      <td className="py-2 px-3 text-gray-500">Theta (Θ/day)</td>
                      <td className="py-2 px-3 font-mono text-red-400">{fmt(result.callGreeks.theta, 4)}</td>
                      <td className="py-2 px-3 font-mono text-red-400">{fmt(result.putGreeks.theta, 4)}</td>
                      <td className="py-2 px-3 text-xs text-gray-700">$ decay per calendar day</td>
                    </tr>
                    <tr className="border-b border-gray-800 text-sm">
                      <td className="py-2 px-3 text-gray-500">Vega (V/1%IV)</td>
                      <td className="py-2 px-3 font-mono text-green-400">{fmt(result.callGreeks.vega, 4)}</td>
                      <td className="py-2 px-3 font-mono text-green-400">{fmt(result.putGreeks.vega, 4)}</td>
                      <td className="py-2 px-3 text-xs text-gray-700">$ change per 1% IV move</td>
                    </tr>
                    <tr className="text-sm">
                      <td className="py-2 px-3 text-gray-500">Rho (ρ/1%r)</td>
                      <td className="py-2 px-3 font-mono text-gray-300">{fmt(result.callGreeks.rho, 4)}</td>
                      <td className="py-2 px-3 font-mono text-gray-300">{fmt(result.putGreeks.rho, 4)}</td>
                      <td className="py-2 px-3 text-xs text-gray-700">$ change per 1% rate move</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payoff chart */}
              <div className="card">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Price vs Spot at Expiry (T=0)</h3>
                <PayoffChart S={effectiveSpot} K={effectiveStrike} iv={effectiveIv} T={T} r={RISK_FREE_RATE} />
                <p className="text-xs text-gray-700 mt-1">Green = call · Red = put · Dashed teal = current spot · Dashed gray = strike</p>
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-gray-600">
              <Calculator size={40} className="mb-3 opacity-30" />
              <p className="text-sm">Fill in the parameters on the left to price an option.</p>
              <p className="text-xs mt-1 text-gray-700">Spot price auto-fills from the live feed when you select a ticker.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
