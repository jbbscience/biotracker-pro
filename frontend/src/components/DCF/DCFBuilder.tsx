import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import { useStore } from '../../store/useStore';
import { PIPELINE_STATIC } from '../../data/staticData';
import {
  buildDrugModel, calcDrugDCF, calcCumulativePOS, calcPeakSales,
  POS_DEFAULTS, INDICATION_TYPES, guessIndicationType, estimateLaunchYear,
  NET_CASH_LOOKUP,
  type DrugModel, type GlobalParams,
} from '../../utils/dcf';
import type { LiveTrial } from '../../types';
import { ChevronDown, ChevronUp, Plus, Trash2, Info, TrendingUp, TrendingDown, DollarSign, Target, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { apiFetch } from '../../utils/api';

// ── CT.gov → DrugModel helpers ────────────────────────────────────────────────

// Terms that indicate a comparator/control arm, not the sponsor's drug
const SKIP_TERMS = new Set([
  'placebo','vehicle','saline','standard of care','best supportive care',
  'observation','soc','bsc','chemotherapy','radiation','surgery',
  'active comparator','pembrolizumab','nivolumab','bevacizumab','rituximab',
  'trastuzumab','cetuximab','paclitaxel','docetaxel','carboplatin','cisplatin',
  'doxorubicin','cyclophosphamide','methotrexate','fluorouracil','capecitabine',
]);

function isComparator(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (lower.length < 3) return true;
  if (SKIP_TERMS.has(lower)) return true;
  if (/^(drug|compound|agent|treatment|therapy|control|arm)\s*[ab12]?$/i.test(lower)) return true;
  return false;
}

function normalizeDrugName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

// Convert CT.gov phase string → our PipelineDrug phase keys
function ctPhaseToModel(phase: string): DrugModel['phase'] {
  if (phase === 'Phase IV') return 'Approved';
  if (phase === 'Phase III') return 'Phase III';
  if (phase === 'Phase II') return 'Phase II';
  if (phase === 'Phase I') return 'Phase I';
  return 'Discovery';
}

// Deduplicate and convert CT.gov trials into DrugModels
// Skips drugs already present in staticDrugs (by normalized name match)
function trialsToModels(trials: LiveTrial[], staticDrugs: DrugModel[], marginHint = 0.25): DrugModel[] {
  const staticNames = new Set(staticDrugs.map(d => normalizeDrugName(d.drugName)));

  // Collect all (drugName, phase, condition) from trials
  const seen = new Map<string, { name: string; phase: string; condition: string; count: number }>();

  for (const trial of trials) {
    const condition = trial.conditions[0] ?? '';
    for (const intervention of trial.interventions) {
      if (isComparator(intervention)) continue;
      const key = normalizeDrugName(intervention);
      if (!key || key.length < 3) continue;
      if (staticNames.has(key)) continue;

      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, { name: intervention, phase: trial.phase, condition, count: 1 });
      } else {
        existing.count++;
        // Keep most advanced phase
        const phaseOrder = ['Phase IV', 'Phase III', 'BLA/NDA', 'Phase II', 'Phase I', 'N/A'];
        if (phaseOrder.indexOf(trial.phase) < phaseOrder.indexOf(existing.phase)) {
          existing.phase = trial.phase;
          existing.condition = condition;
        }
      }
    }
  }

  // Filter out low-count noise (only 1 trial mention unless Phase III+)
  const phaseOrder = ['Phase IV', 'Phase III'];
  return Array.from(seen.values())
    .filter(e => e.count >= 2 || phaseOrder.includes(e.phase))
    .map(e => buildDrugModel({
      id: `ct_${normalizeDrugName(e.name)}_${Date.now()}`,
      drugName: e.name,
      genericName: e.name,
      phase: ctPhaseToModel(e.phase),
      indication: e.condition,
      partnered: false,
      estimatedPeakSales: undefined,
    }, true, marginHint));
}

// ── Formatting ────────────────────────────────────────────────────────────────
function fmtM(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1000) return `${n < 0 ? '-' : ''}$${(abs / 1000).toFixed(2)}B`;
  if (abs >= 1)    return `${n < 0 ? '-' : ''}$${abs.toFixed(0)}M`;
  return `${n < 0 ? '-' : ''}$${(abs * 1000).toFixed(0)}K`;
}
function fmtPct(n: number, d = 1) { return `${(n * 100).toFixed(d)}%`; }
function fmtNum(n: number, d = 1) { return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }

const PHASE_COLORS: Record<string, string> = {
  'Approved': '#22c55e', 'BLA/NDA': '#a3e635', 'Phase III': '#3b82f6',
  'Phase II': '#8b5cf6', 'Phase I': '#f59e0b', 'Discovery': '#6b7280',
};

const DRUG_PALETTE = ['#00d4ff','#22c55e','#f59e0b','#8b5cf6','#ef4444','#f97316','#06b6d4','#84cc16'];

// ── Sub-components ────────────────────────────────────────────────────────────

function NumInput({ label, value, onChange, min = 0, max, step = 1, prefix = '', suffix = '', className = '' }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; prefix?: string; suffix?: string; className?: string;
}) {
  return (
    <div className={clsx('flex flex-col gap-0.5', className)}>
      <label className="text-[10px] text-terminal-muted">{label}</label>
      <div className="flex items-center border border-terminal-border rounded bg-terminal-bg px-2 py-1 gap-1 focus-within:border-terminal-accent/50">
        {prefix && <span className="text-terminal-muted text-xs">{prefix}</span>}
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="bg-transparent text-terminal-text text-xs w-full focus:outline-none num"
        />
        {suffix && <span className="text-terminal-muted text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

function POSRow({ label, value, onChange, dimmed = false }: {
  label: string; value: number; onChange: (v: number) => void; dimmed?: boolean;
}) {
  const pct = (value * 100).toFixed(0);
  return (
    <div className={clsx('flex items-center gap-2', dimmed && 'opacity-40')}>
      <span className="text-[10px] text-terminal-muted w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded bg-terminal-border/40 relative">
        <div className="h-full rounded bg-terminal-accent/60" style={{ width: `${value * 100}%` }} />
      </div>
      <input
        type="number" value={pct} min={1} max={100} step={1}
        onChange={e => onChange(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)) / 100)}
        className="w-11 bg-terminal-bg border border-terminal-border/50 rounded px-1 py-0.5 text-[10px] text-terminal-accent num text-right focus:outline-none focus:border-terminal-accent/60"
      />
      <span className="text-[10px] text-terminal-muted">%</span>
    </div>
  );
}

function DrugCard({ drug, onChange, onRemove }: {
  drug: DrugModel;
  onChange: (updated: Partial<DrugModel>) => void;
  onRemove: () => void;
}) {
  const cumPOS = calcCumulativePOS(drug.phase, drug.pos);
  const peakSales = calcPeakSales(drug);
  const phaseColor = PHASE_COLORS[drug.phase] ?? '#6b7280';

  const updatePOS = (key: keyof typeof drug.pos, val: number) =>
    onChange({ pos: { ...drug.pos, [key]: val } });

  const applyIndicationDefaults = (type: string) => {
    onChange({ indicationType: type, pos: { ...POS_DEFAULTS[type] ?? POS_DEFAULTS['Other'] } });
  };

  return (
    <div className={clsx('card transition-colors', !drug.included && 'opacity-40')}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={drug.included} onChange={e => onChange({ included: e.target.checked })}
          className="accent-terminal-accent" />
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: phaseColor }} />
        <span className="text-terminal-text font-bold text-sm flex-1 truncate">{drug.drugName}</span>
        <span className="text-terminal-muted text-[10px] px-1.5 py-0.5 rounded border border-terminal-border/50">
          {drug.phase}
        </span>
        <div className="text-right text-[10px] w-20">
          <div className="text-terminal-muted">POS</div>
          <div className={clsx('font-bold num', cumPOS > 0.4 ? 'text-green-400' : cumPOS > 0.15 ? 'text-yellow-400' : 'text-orange-400')}>
            {fmtPct(cumPOS)}
          </div>
        </div>
        <div className="text-right text-[10px] w-24">
          <div className="text-terminal-muted">Peak Sales</div>
          <div className="text-terminal-accent font-bold num">{fmtM(peakSales)}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onChange({ expanded: !drug.expanded })}
            className="text-terminal-muted hover:text-terminal-text transition-colors p-1">
            {drug.expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button onClick={onRemove} className="text-terminal-muted hover:text-red-400 transition-colors p-1">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Indication + source badge */}
      <div className="flex items-center gap-2 mt-1 ml-6">
        <span className="text-[10px] text-terminal-muted truncate">{drug.indication}</span>
        {drug.id.startsWith('ct_')
          ? <span className="flex-shrink-0 text-[9px] px-1 py-0.5 rounded border border-terminal-accent/20 text-terminal-accent/60">CT.gov</span>
          : <span className="flex-shrink-0 text-[9px] px-1 py-0.5 rounded border border-green-500/20 text-green-400/60">Curated</span>
        }
      </div>

      {/* Expanded body */}
      {drug.expanded && (
        <div className="mt-3 space-y-4 border-t border-terminal-border/40 pt-3">

          {/* Indication type */}
          <div>
            <label className="text-[10px] text-terminal-muted block mb-1">INDICATION TYPE</label>
            <select value={drug.indicationType}
              onChange={e => applyIndicationDefaults(e.target.value)}
              className="bg-terminal-surface border border-terminal-border text-xs text-terminal-text rounded px-2 py-1 w-full focus:outline-none focus:border-terminal-accent/50">
              {INDICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <p className="text-[10px] text-terminal-muted mt-1">Changing type resets POS to industry benchmarks.</p>
          </div>

          {/* POS transitions */}
          <div>
            <div className="text-[10px] text-terminal-muted font-bold tracking-wider mb-2">PHASE TRANSITION PROBABILITIES</div>
            <div className="space-y-1.5">
              {drug.phase === 'Discovery' && (
                <POSRow label="Discovery → Phase I" value={drug.pos.discToP1} onChange={v => updatePOS('discToP1', v)} />
              )}
              <POSRow label="Phase I → Phase II" value={drug.pos.p1ToP2} onChange={v => updatePOS('p1ToP2', v)}
                dimmed={['BLA/NDA','Approved','Phase III','Phase II'].includes(drug.phase)} />
              <POSRow label="Phase II → Phase III" value={drug.pos.p2ToP3} onChange={v => updatePOS('p2ToP3', v)}
                dimmed={['BLA/NDA','Approved','Phase III'].includes(drug.phase)} />
              <POSRow label="Phase III → NDA/BLA" value={drug.pos.p3ToNDA} onChange={v => updatePOS('p3ToNDA', v)}
                dimmed={['BLA/NDA','Approved'].includes(drug.phase)} />
              <POSRow label="NDA/BLA → Approval" value={drug.pos.ndaToAP} onChange={v => updatePOS('ndaToAP', v)}
                dimmed={drug.phase === 'Approved'} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-terminal-muted">Cumulative POS from current phase:</span>
              <span className={clsx('text-sm font-bold num',
                cumPOS > 0.5 ? 'text-green-400' : cumPOS > 0.2 ? 'text-yellow-400' : 'text-orange-400')}>
                {fmtPct(cumPOS)}
              </span>
            </div>
          </div>

          {/* Peak sales model */}
          <div>
            <div className="text-[10px] text-terminal-muted font-bold tracking-wider mb-2">PEAK SALES MODEL</div>
            <div className="flex items-center gap-3 mb-2">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" checked={!drug.useOverride} onChange={() => onChange({ useOverride: false })}
                  className="accent-terminal-accent" />
                <span className={!drug.useOverride ? 'text-terminal-accent' : 'text-terminal-muted'}>Calculate from TAM</span>
              </label>
              <label className={clsx('flex items-center gap-1.5 text-xs cursor-pointer', drug.peakSalesOverrideM === 0 && 'opacity-40')}>
                <input type="radio" checked={drug.useOverride} onChange={() => onChange({ useOverride: true })}
                  disabled={drug.peakSalesOverrideM === 0}
                  className="accent-terminal-accent" />
                <span className={drug.useOverride ? 'text-terminal-accent' : 'text-terminal-muted'}>Use estimate</span>
              </label>
            </div>

            {!drug.useOverride ? (
              <div className="grid grid-cols-3 gap-2">
                <NumInput label="Patient Population (M)" value={drug.patientPopulationM} min={0.001} step={0.1}
                  onChange={v => onChange({ patientPopulationM: v })} suffix="M" />
                <NumInput label="Market Share at Peak" value={drug.marketPenetration} min={1} max={100} step={1}
                  onChange={v => onChange({ marketPenetration: v })} suffix="%" />
                <NumInput label="Price / Patient / Year" value={drug.pricePerPatient} min={1000} step={1000}
                  onChange={v => onChange({ pricePerPatient: v })} prefix="$" />
              </div>
            ) : (
              <NumInput label="Peak Sales Estimate" value={drug.peakSalesOverrideM} min={1} step={100}
                onChange={v => onChange({ peakSalesOverrideM: v })} prefix="$" suffix="M" />
            )}

            <div className="mt-2 flex items-center justify-between bg-terminal-surface rounded px-3 py-1.5">
              <span className="text-[10px] text-terminal-muted">Estimated Peak Sales</span>
              <span className="text-terminal-accent font-bold num">{fmtM(peakSales)}</span>
            </div>
          </div>

          {/* Timeline & economics */}
          <div>
            <div className="text-[10px] text-terminal-muted font-bold tracking-wider mb-2">TIMELINE & ECONOMICS</div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <NumInput label="Launch Year" value={drug.launchYear} min={2024} max={2045} step={1}
                onChange={v => onChange({ launchYear: v })} />
              <NumInput label="Patent Life (yrs)" value={drug.patentLife} min={1} max={20} step={1}
                onChange={v => onChange({ patentLife: v })} />
              <NumInput label="Ramp to Peak (yrs)" value={drug.rampYears} min={1} max={10} step={1}
                onChange={v => onChange({ rampYears: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {!drug.isPartnered ? (
                <NumInput label="Operating Margin" value={drug.operatingMargin} min={5} max={90} step={1}
                  onChange={v => onChange({ operatingMargin: v })} suffix="%" />
              ) : (
                <NumInput label="Royalty Rate" value={drug.royaltyRate} min={1} max={50} step={1}
                  onChange={v => onChange({ royaltyRate: v })} suffix="%" />
              )}
              <label className="flex items-center gap-2 text-xs cursor-pointer mt-3">
                <input type="checkbox" checked={drug.isPartnered} onChange={e => onChange({ isPartnered: e.target.checked })}
                  className="accent-terminal-accent" />
                <span className="text-terminal-muted">Partnered (use royalty %)</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DCFBuilder() {
  const { companies } = useStore();
  const [selectedTicker, setSelectedTicker] = useState(companies[0]?.ticker ?? 'LLY');
  const [drugs, setDrugs] = useState<DrugModel[]>([]);
  const [globalParams, setGlobalParams] = useState<GlobalParams>({
    wacc: 12,
    taxRate: 21,
    netCashB: 0,
    sharesOutstandingM: 0,
  });
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [filterPhase, setFilterPhase] = useState<string>('All');

  const co = companies.find(c => c.ticker === selectedTicker);

  const fetchAndMerge = useCallback(async (ticker: string, staticModels: DrugModel[], marginHint = 0.25) => {
    setLiveLoading(true);
    try {
      const res = await apiFetch(`/api/pipeline/live/${ticker}`);
      if (!res.ok) return;
      const data = await res.json() as { trials: LiveTrial[] };
      const liveModels = trialsToModels(data.trials ?? [], staticModels, marginHint);
      setLiveCount(liveModels.length);
      setDrugs([...staticModels, ...liveModels]);
    } catch {
      // keep static only
    } finally {
      setLiveLoading(false);
    }
  }, []);

  // Load company pipeline (static + live)
  function loadCompany(ticker: string) {
    setSelectedTicker(ticker);
    setLiveCount(0);
    setFilterPhase('All');
    const company = companies.find(c => c.ticker === ticker);
    const marginHint = company && company.netIncome && company.netIncome > 0 && company.revenue > 0
      ? Math.min(0.65, company.netIncome / company.revenue)
      : 0.25;
    const staticModels = PIPELINE_STATIC
      .filter(d => d.companyTicker === ticker)
      .map(d => buildDrugModel(d, false, marginHint));
    setDrugs(staticModels);
    if (company) {
      setGlobalParams(p => ({
        ...p,
        sharesOutstandingM: parseFloat((company.marketCap / company.price / 1e6).toFixed(1)),
        netCashB: NET_CASH_LOOKUP[ticker] ?? 0,
      }));
    }
    fetchAndMerge(ticker, staticModels, marginHint);
  }

  // Load initial company on mount
  useEffect(() => {
    const company = companies[0];
    const ticker = company?.ticker ?? 'LLY';
    const marginHint = company && company.netIncome && company.netIncome > 0 && company.revenue > 0
      ? Math.min(0.65, company.netIncome / company.revenue)
      : 0.25;
    const staticModels = PIPELINE_STATIC
      .filter(d => d.companyTicker === ticker)
      .map(d => buildDrugModel(d, false, marginHint));
    setDrugs(staticModels);
    if (company) {
      setGlobalParams(p => ({
        ...p,
        sharesOutstandingM: parseFloat((company.marketCap / company.price / 1e6).toFixed(1)),
        netCashB: NET_CASH_LOOKUP[ticker] ?? 0,
      }));
    }
    fetchAndMerge(ticker, staticModels, marginHint);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDrug(id: string, updates: Partial<DrugModel>) {
    setDrugs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }

  function removeDrug(id: string) {
    setDrugs(prev => prev.filter(d => d.id !== id));
  }

  function addBlankDrug() {
    const blank: DrugModel = {
      id: `custom_${Date.now()}`,
      drugName: 'New Drug',
      genericName: '',
      phase: 'Phase II',
      indication: 'Custom indication',
      indicationType: 'Other',
      pos: { ...POS_DEFAULTS['Other'] },
      patientPopulationM: 1.0,
      marketPenetration: 25,
      pricePerPatient: 25000,
      useOverride: false,
      peakSalesOverrideM: 0,
      launchYear: new Date().getFullYear() + 5,
      patentLife: 12,
      rampYears: 5,
      operatingMargin: 30,
      isPartnered: false,
      royaltyRate: 15,
      expanded: true,
      included: true,
    };
    setDrugs(prev => [...prev, blank]);
  }

  // ── Calculations ──────────────────────────────────────────────────────────
  const results = useMemo(() => {
    return drugs
      .filter(d => d.included)
      .map(d => calcDrugDCF(d, globalParams));
  }, [drugs, globalParams]);

  const totalRNPVM = results.reduce((s, r) => s + r.rNPVM, 0);
  const totalEquityB = totalRNPVM / 1000 + globalParams.netCashB;
  const impliedPricePerShare = globalParams.sharesOutstandingM > 0
    ? (totalEquityB * 1e9) / (globalParams.sharesOutstandingM * 1e6)
    : 0;
  const currentPrice = co?.price ?? 0;
  const upside = currentPrice > 0 ? (impliedPricePerShare / currentPrice - 1) * 100 : 0;

  // NPV bar chart data
  const npvChartData = results
    .filter(r => Math.abs(r.rNPVM) > 1)
    .sort((a, b) => b.rNPVM - a.rNPVM)
    .map(r => ({ name: r.drugName, rNPV: parseFloat((r.rNPVM / 1000).toFixed(2)), pos: parseFloat((r.cumulativePOS * 100).toFixed(1)) }));

  // Revenue forecast stacked area chart (2026-2042)
  const forecastYears = Array.from({ length: 17 }, (_, i) => 2026 + i);
  const includedDrugs = drugs.filter(d => d.included);
  const topDrugs = [...includedDrugs]
    .sort((a, b) => calcPeakSales(b) - calcPeakSales(a))
    .slice(0, 7);

  const revenueChartData = forecastYears.map(year => {
    const row: Record<string, number> = { year };
    for (const drug of topDrugs) {
      const r = results.find(x => x.drugId === drug.id);
      const entry = r?.yearlyRevenue.find(y => y.year === year);
      row[drug.drugName] = parseFloat(((entry?.riskAdj ?? 0) / 1000).toFixed(3));
    }
    return row;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-3 h-full overflow-hidden">

      {/* ── Left panel: inputs ── */}
      <div className="w-[480px] flex-shrink-0 flex flex-col gap-3 overflow-auto">

        {/* Company selector */}
        <div className="card p-3 flex-shrink-0">
          <div className="text-terminal-muted text-[10px] font-bold tracking-wider mb-2">SELECT COMPANY</div>
          <select value={selectedTicker} onChange={e => loadCompany(e.target.value)}
            className="w-full bg-terminal-surface border border-terminal-border text-terminal-text text-sm rounded px-3 py-2 focus:outline-none focus:border-terminal-accent/50">
            {companies.map(c => (
              <option key={c.ticker} value={c.ticker}>{c.ticker} — {c.name}</option>
            ))}
          </select>
          {co && (
            <div className="flex gap-4 mt-2 text-[10px]">
              <span className="text-terminal-muted">Current: <span className="text-terminal-text num font-bold">${co.price.toFixed(2)}</span></span>
              <span className="text-terminal-muted">Mkt Cap: <span className="text-terminal-text num">{fmtM(co.marketCap / 1e6)}</span></span>
              <span className="text-terminal-muted">Analyst PT: <span className="text-terminal-accent num">${co.priceTarget.toFixed(2)}</span></span>
            </div>
          )}
        </div>

        {/* Global params */}
        <div className="card p-3 flex-shrink-0">
          <div className="text-terminal-muted text-[10px] font-bold tracking-wider mb-2">DCF PARAMETERS</div>
          <div className="grid grid-cols-2 gap-2">
            <NumInput label="Discount Rate (WACC)" value={globalParams.wacc} min={5} max={30} step={0.5}
              onChange={v => setGlobalParams(p => ({ ...p, wacc: v }))} suffix="%" />
            <NumInput label="Corporate Tax Rate" value={globalParams.taxRate} min={0} max={40} step={1}
              onChange={v => setGlobalParams(p => ({ ...p, taxRate: v }))} suffix="%" />
            <NumInput label="Net Cash / (Debt)" value={globalParams.netCashB} min={-50} max={200} step={0.5}
              onChange={v => setGlobalParams(p => ({ ...p, netCashB: v }))} prefix="$" suffix="B" />
            <NumInput label="Shares Outstanding" value={globalParams.sharesOutstandingM} min={1} step={10}
              onChange={v => setGlobalParams(p => ({ ...p, sharesOutstandingM: v }))} suffix="M" />
          </div>
          <p className="text-[10px] text-terminal-muted mt-2 flex items-start gap-1">
            <Info size={10} className="mt-0.5 shrink-0" />
            Biotech WACC typically 10–15%. Higher rates for earlier-stage pipelines.
          </p>
        </div>

        {/* Drug list */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-terminal-muted text-[10px] font-bold tracking-wider">
              PIPELINE DRUGS
            </span>
            <span className="text-terminal-accent text-[10px] font-bold">
              {drugs.filter(d => d.included).length}/{drugs.length}
            </span>
            {liveLoading && (
              <span className="flex items-center gap-1 text-[10px] text-terminal-muted">
                <RefreshCw size={9} className="animate-spin" /> fetching CT.gov…
              </span>
            )}
            {!liveLoading && liveCount > 0 && (
              <span className="text-[10px] text-terminal-accent/70">+{liveCount} from CT.gov</span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)}
                className="bg-terminal-surface border border-terminal-border text-[10px] text-terminal-text rounded px-1.5 py-1 focus:outline-none">
                <option value="All">All phases</option>
                {['Approved','BLA/NDA','Phase III','Phase II','Phase I','Discovery'].map(p => (
                  <option key={p} value={p}>{p} ({drugs.filter(d => d.phase === p).length})</option>
                ))}
              </select>
              <button onClick={() => setDrugs(prev => prev.map(d => ({ ...d, included: !d.id.startsWith('ct_') })))}
                className="px-1.5 py-1 rounded text-[10px] border border-green-500/30 text-green-400/70 hover:text-green-400 transition-colors">
                Curated
              </button>
              <button onClick={() => setDrugs(prev => prev.map(d => ({ ...d, included: true })))}
                className="px-1.5 py-1 rounded text-[10px] border border-terminal-border/50 text-terminal-muted hover:text-terminal-text transition-colors">
                All ✓
              </button>
              <button onClick={addBlankDrug}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-terminal-border/50 text-terminal-muted hover:text-terminal-accent hover:border-terminal-accent/40 transition-colors">
                <Plus size={10} /> Add
              </button>
            </div>
          </div>

          {drugs.length === 0 && !liveLoading && (
            <div className="card p-6 text-center text-terminal-muted text-xs">
              No pipeline data for {selectedTicker}. Add a drug manually.
            </div>
          )}

          {drugs
            .filter(d => filterPhase === 'All' || d.phase === filterPhase)
            .map(drug => (
              <DrugCard key={drug.id} drug={drug}
                onChange={updates => updateDrug(drug.id, updates)}
                onRemove={() => removeDrug(drug.id)} />
            ))
          }
        </div>
      </div>

      {/* ── Right panel: results ── */}
      <div className="flex-1 flex flex-col gap-3 overflow-auto">

        {/* Calibration warning */}
        {impliedPricePerShare > 0 && currentPrice > 0 && upside > 150 && (
          <div className="card p-3 border-yellow-500/30 bg-yellow-500/5 flex-shrink-0">
            <div className="flex items-start gap-2 text-xs">
              <Info size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-yellow-400 font-bold">Model may be overcounting. </span>
                <span className="text-terminal-muted">
                  CT.gov drugs default to 50K patients — expand and set realistic TAM before including them.
                  Curated drugs (green badge) use analyst estimates and are more reliable anchors.
                  Only include CT.gov drugs you have conviction on.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Results summary */}
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
          <div className="card p-3">
            <div className="text-terminal-muted text-[10px] mb-1">TOTAL rNPV</div>
            <div className="text-2xl font-bold text-terminal-accent num">{fmtM(totalRNPVM)}</div>
            <div className="text-terminal-muted text-[10px]">{results.length} drugs included</div>
          </div>
          <div className="card p-3">
            <div className="text-terminal-muted text-[10px] mb-1">EQUITY VALUE</div>
            <div className="text-2xl font-bold text-terminal-text num">
              {fmtM(totalEquityB * 1000)}
            </div>
            <div className="text-terminal-muted text-[10px]">rNPV + net cash</div>
          </div>
          <div className="card p-3">
            <div className="text-terminal-muted text-[10px] mb-1">IMPLIED PRICE</div>
            <div className="text-2xl font-bold text-terminal-text num">
              {impliedPricePerShare > 0 ? `$${impliedPricePerShare.toFixed(2)}` : '—'}
            </div>
            <div className="text-terminal-muted text-[10px]">per share</div>
          </div>
          <div className="card p-3">
            <div className="text-terminal-muted text-[10px] mb-1">VS CURRENT PRICE</div>
            {impliedPricePerShare > 0 && currentPrice > 0 ? (
              <>
                <div className={clsx('text-2xl font-bold num flex items-center gap-1', upside >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {upside >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  {upside >= 0 ? '+' : ''}{fmtNum(upside)}%
                </div>
                <div className="text-terminal-muted text-[10px]">
                  Model: ${impliedPricePerShare.toFixed(2)} vs ${currentPrice.toFixed(2)}
                </div>
              </>
            ) : (
              <div className="text-terminal-muted text-sm">Set shares outstanding</div>
            )}
          </div>
        </div>

        {/* Drug NPV contribution chart */}
        <div className="card p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={13} className="text-terminal-muted" />
            <span className="text-terminal-muted text-[10px] font-bold tracking-wider">RISK-ADJUSTED NPV BY DRUG ($B)</span>
          </div>
          {npvChartData.length === 0 ? (
            <div className="text-center py-6 text-terminal-muted text-xs">No included drugs with positive NPV</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(160, npvChartData.length * 36)}>
              <BarChart data={npvChartData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#1e2d45" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}B`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 6, fontSize: 11 }}
                  formatter={(val: number) => [`$${val.toFixed(2)}B`, 'Risk-Adj NPV']}
                />
                <Bar dataKey="rNPV" radius={[0, 3, 3, 0]}
                  fill="#00d4ff" fillOpacity={0.8}
                  label={{ position: 'right', fill: '#64748b', fontSize: 10, formatter: (v: number) => `$${v.toFixed(2)}B` }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue forecast chart */}
        <div className="card p-4 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <Target size={13} className="text-terminal-muted" />
            <span className="text-terminal-muted text-[10px] font-bold tracking-wider">RISK-ADJUSTED REVENUE FORECAST ($B)</span>
            <span className="text-terminal-muted text-[10px]">· probability-weighted · top 7 drugs</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChartData} margin={{ left: 8, right: 8, top: 4, bottom: 0 }}>
              <defs>
                {topDrugs.map((drug, i) => (
                  <linearGradient key={drug.id} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DRUG_PALETTE[i % DRUG_PALETTE.length]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={DRUG_PALETTE[i % DRUG_PALETTE.length]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => `$${v}B`} width={45} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e3a5f', borderRadius: 6, fontSize: 11 }}
                formatter={(val: number) => [`$${(val).toFixed(3)}B`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 10, color: '#64748b' }} />
              {topDrugs.map((drug, i) => (
                <Area key={drug.id} type="monotone" dataKey={drug.drugName} stackId="1"
                  stroke={DRUG_PALETTE[i % DRUG_PALETTE.length]}
                  fill={`url(#grad${i})`} strokeWidth={1.5} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed drug NPV table */}
        <div className="card p-4">
          <div className="text-terminal-muted text-[10px] font-bold tracking-wider mb-3">DRUG-LEVEL DETAIL</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-terminal-border">
                  {['Drug', 'Phase', 'Indication Type', 'Cum. POS', 'Peak Sales', 'Gross NPV', 'rNPV', '% of Total'].map(h => (
                    <th key={h} className="text-terminal-muted text-left pb-2 pr-3 font-medium text-[10px] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drugs.map(drug => {
                  const r = results.find(x => x.drugId === drug.id);
                  const cumPOS = calcCumulativePOS(drug.phase, drug.pos);
                  const pct = r && totalRNPVM > 0 ? (r.rNPVM / totalRNPVM) * 100 : 0;
                  return (
                    <tr key={drug.id} className={clsx('border-b border-terminal-border/20 hover:bg-terminal-surface/50',
                      !drug.included && 'opacity-35')}>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: PHASE_COLORS[drug.phase] ?? '#6b7280' }} />
                          <span className="font-medium text-terminal-text">{drug.drugName}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-terminal-muted">{drug.phase}</td>
                      <td className="py-2 pr-3 text-terminal-muted text-[10px]">{drug.indicationType}</td>
                      <td className={clsx('py-2 pr-3 font-bold num',
                        cumPOS > 0.4 ? 'text-green-400' : cumPOS > 0.15 ? 'text-yellow-400' : 'text-orange-400')}>
                        {fmtPct(cumPOS)}
                      </td>
                      <td className="py-2 pr-3 text-terminal-accent num">
                        {r ? fmtM(r.peakSalesM) : '—'}
                      </td>
                      <td className="py-2 pr-3 text-terminal-text num">
                        {r ? fmtM(r.grossNPVM) : '—'}
                      </td>
                      <td className="py-2 pr-3 font-bold num text-terminal-accent">
                        {r && drug.included ? fmtM(r.rNPVM) : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {r && drug.included && totalRNPVM > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1 rounded bg-terminal-border/40 w-16">
                              <div className="h-full rounded bg-terminal-accent/50"
                                style={{ width: `${Math.min(100, Math.abs(pct))}%` }} />
                            </div>
                            <span className="text-terminal-muted num text-[10px]">{pct.toFixed(1)}%</span>
                          </div>
                        ) : <span className="text-terminal-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-terminal-border">
                  <td colSpan={5} className="pt-2 text-terminal-muted text-[10px] font-bold">TOTAL (included drugs)</td>
                  <td className="pt-2 text-terminal-text font-bold num">{fmtM(results.reduce((s, r) => s + r.grossNPVM, 0))}</td>
                  <td className="pt-2 text-terminal-accent font-bold num">{fmtM(totalRNPVM)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
