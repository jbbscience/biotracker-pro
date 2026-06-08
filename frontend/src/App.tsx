import { useEffect } from 'react';
import { Navbar } from './components/Layout/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { CompanyDetail } from './components/CompanyDetail/CompanyDetail';
import { PipelineDashboard } from './components/Pipeline/PipelineDashboard';
import { FDACalendar } from './components/FDACalendar/FDACalendar';
import { Screener } from './components/Screener/Screener';
import { NewsFeed } from './components/News/NewsFeed';
import { AlertsPanel } from './components/Alerts/AlertsPanel';
import OptionsView from './components/Options/OptionsView';
import { DCFBuilder } from './components/DCF/DCFBuilder';
import { useStore } from './store/useStore';
import { useWebSocket } from './hooks/useWebSocket';

function ViewRouter() {
  const { view, selectedTicker } = useStore();
  if (view === 'company' && selectedTicker) return <CompanyDetail />;
  if (view === 'pipeline') return <PipelineDashboard />;
  if (view === 'fda') return <FDACalendar />;
  if (view === 'screener') return <Screener />;
  if (view === 'news') return <NewsFeed />;
  if (view === 'alerts') return <AlertsPanel />;
  if (view === 'options') return <OptionsView />;
  if (view === 'dcf') return <DCFBuilder />;
  return <Dashboard />;
}

export default function App() {
  useWebSocket();

  useEffect(() => {
    const t = setInterval(() => {
      // force re-render clock in navbar
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-terminal-bg overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden p-3">
        <ViewRouter />
      </main>
      <footer className="border-t border-terminal-border px-4 py-1.5 text-[10px] text-terminal-muted flex items-center justify-between">
        <span>BioTracker Pro v1.0 · For informational purposes only. Not financial advice.</span>
        <span>Data simulated for demonstration · Real-time via WebSocket or local simulation</span>
      </footer>
    </div>
  );
}
