import { Activity, Bell, LayoutDashboard, Calendar, Filter, Newspaper, Building2, FlaskConical, Wifi, WifiOff, LineChart, Calculator } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { View } from '../../types';
import clsx from 'clsx';

const NAV_ITEMS: { view: View; label: string; icon: React.ReactNode }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
  { view: 'pipeline', label: 'Pipeline', icon: <FlaskConical size={14} /> },
  { view: 'fda', label: 'FDA Calendar', icon: <Calendar size={14} /> },
  { view: 'screener', label: 'Screener', icon: <Filter size={14} /> },
  { view: 'news', label: 'News', icon: <Newspaper size={14} /> },
  { view: 'alerts', label: 'Alerts', icon: <Bell size={14} /> },
  { view: 'options', label: 'Options', icon: <LineChart size={14} /> },
  { view: 'dcf', label: 'DCF Model', icon: <Calculator size={14} /> },
];

export function Navbar() {
  const { view, setView, wsConnected, companies, alerts } = useStore();

  const gainers = companies.filter(c => c.changePercent > 0).length;
  const decliners = companies.filter(c => c.changePercent < 0).length;
  const activeAlerts = alerts.filter(a => a.triggered).length;

  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="border-b border-terminal-border bg-terminal-surface flex-shrink-0">
      <div className="flex items-center px-4 h-10 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <Activity size={16} className="text-terminal-accent" />
          <span className="text-terminal-accent font-bold text-sm tracking-wider">BIOTRACKER</span>
          <span className="text-terminal-muted text-xs">PRO</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={clsx(
                'flex items-center gap-1.5 px-3 h-8 text-xs rounded transition-colors',
                view === item.view
                  ? 'bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30'
                  : 'text-terminal-muted hover:text-terminal-text hover:bg-white/5'
              )}
            >
              {item.icon}
              {item.label}
              {item.view === 'alerts' && activeAlerts > 0 && (
                <span className="bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center ml-1">
                  {activeAlerts}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right side stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-terminal-muted">ADV</span>
            <span className="up font-bold">{gainers}</span>
            <span className="text-terminal-muted">DEC</span>
            <span className="down font-bold">{decliners}</span>
          </div>

          <div className="flex items-center gap-1 text-terminal-muted">
            <Building2 size={12} />
            <span>25 Companies</span>
          </div>

          <div className={clsx('flex items-center gap-1', wsConnected ? 'text-terminal-accent' : 'text-terminal-muted')}>
            {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span>{wsConnected ? 'LIVE' : 'SIM'}</span>
          </div>

          <span className="text-terminal-muted num">{now} ET</span>
        </div>
      </div>
    </header>
  );
}
