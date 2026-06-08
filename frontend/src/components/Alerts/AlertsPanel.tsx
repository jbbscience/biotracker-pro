import { useState } from 'react';
import { Bell, BellOff, Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { FDA_MILESTONES_STATIC } from '../../data/staticData';
import type { Alert } from '../../types';
import clsx from 'clsx';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  price_up: <TrendingUp size={14} />,
  price_down: <TrendingDown size={14} />,
  volume: <Activity size={14} />,
  fda: <Calendar size={14} />,
  earnings: <AlertTriangle size={14} />,
};

const TYPE_COLORS: Record<string, string> = {
  price_up: 'up',
  price_down: 'down',
  volume: 'text-blue-400',
  fda: 'text-yellow-400',
  earnings: 'text-orange-400',
};

export function AlertsPanel() {
  const { alerts, addAlert, removeAlert, toggleAlert, companies } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ticker: 'LLY', type: 'price_up' as Alert['type'], threshold: 5 });

  const triggered = alerts.filter(a => a.triggered);
  const active = alerts.filter(a => a.active && !a.triggered);
  const inactive = alerts.filter(a => !a.active);

  const upcomingFDA = FDA_MILESTONES_STATIC
    .filter(m => {
      const days = Math.round((new Date(m.date).getTime() - new Date('2026-04-20').getTime()) / 86400000);
      return days >= 0 && days <= 30;
    })
    .sort((a, b) => a.date < b.date ? -1 : 1);

  function handleAdd() {
    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      type: form.type,
      ticker: form.ticker.toUpperCase(),
      threshold: form.threshold,
      active: true,
      triggered: false,
      createdAt: new Date().toISOString(),
      label: form.type === 'price_up' ? `${form.ticker} up +${form.threshold}%`
        : form.type === 'price_down' ? `${form.ticker} down -${form.threshold}%`
        : form.type === 'volume' ? `${form.ticker} volume ${form.threshold}x avg`
        : form.type === 'fda' ? `${form.ticker} FDA event`
        : `${form.ticker} earnings`,
    };
    addAlert(newAlert);
    setShowAdd(false);
  }

  const AlertCard = ({ alert }: { alert: Alert }) => {
    const co = companies.find(c => c.ticker === alert.ticker);
    return (
      <div className={clsx('card p-3 transition-all', alert.triggered ? 'border-red-500/50 bg-red-500/5' : !alert.active ? 'opacity-50' : 'hover:border-terminal-accent/30')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <span className={clsx(TYPE_COLORS[alert.type] ?? 'text-terminal-muted')}>
              {TYPE_ICONS[alert.type]}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-terminal-accent font-bold text-xs">{alert.ticker}</span>
                {co && <span className="text-terminal-muted text-xs">{co.name}</span>}
                {alert.triggered && (
                  <span className="badge bg-red-500/15 text-red-400 border border-red-500/30">
                    TRIGGERED
                  </span>
                )}
              </div>
              <div className="text-terminal-text text-xs mt-0.5">{alert.label}</div>
              {co && (
                <div className="text-terminal-muted text-xs mt-1">
                  Current: ${co.price.toFixed(2)} · {co.changePercent >= 0 ? '+' : ''}{co.changePercent.toFixed(2)}%
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => toggleAlert(alert.id)}
              className={clsx('p-1 rounded transition-colors', alert.active ? 'text-terminal-accent hover:text-terminal-text' : 'text-terminal-muted hover:text-terminal-text')}>
              {alert.active ? <Bell size={14} /> : <BellOff size={14} />}
            </button>
            <button onClick={() => removeAlert(alert.id)} className="p-1 rounded text-terminal-muted hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-3 h-full overflow-hidden">
      {/* Left: alerts */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-terminal-text font-bold flex items-center gap-2">
              <Bell size={16} className="text-terminal-accent" /> Alert Center
            </h2>
            {triggered.length > 0 && (
              <span className="badge bg-red-500/15 text-red-400 border border-red-500/30">
                {triggered.length} triggered
              </span>
            )}
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30 rounded hover:bg-terminal-accent/20 transition-colors">
            <Plus size={12} /> New Alert
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="card p-4 flex-shrink-0">
            <h3 className="text-terminal-muted text-xs font-bold tracking-wider mb-3">CREATE ALERT</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-terminal-muted text-xs">Ticker</label>
                <select value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))}
                  className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent">
                  {companies.map(c => <option key={c.ticker} value={c.ticker}>{c.ticker} - {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-terminal-muted text-xs">Alert Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Alert['type'] }))}
                  className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent">
                  <option value="price_up">Price Up (+%)</option>
                  <option value="price_down">Price Down (-%)</option>
                  <option value="volume">Volume Surge (x avg)</option>
                  <option value="fda">FDA Catalyst</option>
                  <option value="earnings">Earnings Alert</option>
                </select>
              </div>
              {(form.type === 'price_up' || form.type === 'price_down' || form.type === 'volume') && (
                <div>
                  <label className="text-terminal-muted text-xs">
                    {form.type === 'volume' ? 'Volume Multiplier' : 'Threshold (%)'}
                  </label>
                  <input type="number" min="0" value={form.threshold}
                    onChange={e => setForm(f => ({ ...f, threshold: Number(e.target.value) }))}
                    className="w-full mt-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1.5 text-xs text-terminal-text focus:outline-none focus:border-terminal-accent" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleAdd}
                className="px-4 py-1.5 bg-terminal-accent text-terminal-bg text-xs font-bold rounded hover:bg-terminal-accentDim transition-colors">
                Create Alert
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-1.5 text-terminal-muted text-xs border border-terminal-border/50 rounded hover:text-terminal-text transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Alert sections */}
        <div className="flex-1 overflow-auto space-y-4">
          {triggered.length > 0 && (
            <div>
              <div className="text-red-400 text-xs font-bold tracking-wider mb-2">⚠ TRIGGERED ({triggered.length})</div>
              <div className="space-y-2">{triggered.map(a => <AlertCard key={a.id} alert={a} />)}</div>
            </div>
          )}
          {active.length > 0 && (
            <div>
              <div className="text-terminal-muted text-xs font-bold tracking-wider mb-2">ACTIVE ({active.length})</div>
              <div className="space-y-2">{active.map(a => <AlertCard key={a.id} alert={a} />)}</div>
            </div>
          )}
          {inactive.length > 0 && (
            <div>
              <div className="text-terminal-muted text-xs font-bold tracking-wider mb-2">PAUSED ({inactive.length})</div>
              <div className="space-y-2">{inactive.map(a => <AlertCard key={a.id} alert={a} />)}</div>
            </div>
          )}
          {alerts.length === 0 && (
            <div className="text-terminal-muted text-center py-12">
              <Bell size={32} className="mx-auto mb-3 opacity-30" />
              <div>No alerts configured</div>
              <div className="text-xs mt-1">Click "New Alert" to get started</div>
            </div>
          )}
        </div>
      </div>

      {/* Right: upcoming FDA reminders */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="card p-3 flex-1 overflow-auto">
          <div className="text-terminal-muted text-xs font-bold tracking-wider mb-3">FDA EVENTS NEXT 30 DAYS</div>
          <div className="space-y-3">
            {upcomingFDA.length === 0 && (
              <div className="text-terminal-muted text-xs">No events in next 30 days</div>
            )}
            {upcomingFDA.map(m => {
              const days = Math.round((new Date(m.date).getTime() - new Date('2026-04-20').getTime()) / 86400000);
              return (
                <div key={m.id} className={clsx('border-b border-terminal-border/30 pb-3 last:border-0',
                  m.significance === 'High' && 'border-l-2 border-l-red-500 pl-2')}>
                  <div className="flex justify-between items-start">
                    <span className="text-terminal-accent font-bold text-xs">{m.companyTicker}</span>
                    <span className={clsx('text-xs font-bold', days <= 7 ? 'text-red-400' : 'text-yellow-400')}>
                      T-{days}d
                    </span>
                  </div>
                  <div className="text-terminal-text text-xs">{m.drugName}</div>
                  <div className="text-terminal-muted text-xs">{m.milestoneType} · {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <div className={clsx('text-xs mt-0.5', m.significance === 'High' ? 'text-red-400' : 'text-terminal-muted')}>
                    ★ {m.significance} significance
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-3">
          <div className="text-terminal-muted text-xs font-bold tracking-wider mb-3">ALERT SUMMARY</div>
          {[
            { label: 'Total Alerts', value: alerts.length },
            { label: 'Active', value: active.length, color: 'text-terminal-accent' },
            { label: 'Triggered', value: triggered.length, color: triggered.length > 0 ? 'text-red-400' : 'text-terminal-muted' },
            { label: 'Paused', value: inactive.length, color: 'text-terminal-muted' },
          ].map(r => (
            <div key={r.label} className="flex justify-between py-1 border-b border-terminal-border/20 text-xs">
              <span className="text-terminal-muted">{r.label}</span>
              <span className={clsx('font-bold', r.color ?? 'text-terminal-text')}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
