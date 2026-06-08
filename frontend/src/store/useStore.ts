import { create } from 'zustand';
import type { Company, Alert, View } from '../types';
import { COMPANIES_STATIC } from '../data/staticData';

interface StoreState {
  companies: Company[];
  selectedTicker: string | null;
  view: View;
  watchlist: string[];
  alerts: Alert[];
  wsConnected: boolean;

  setCompanies: (companies: Company[]) => void;
  updatePrices: (updates: Array<{ ticker: string; price: number; change: number; changePercent: number; volume: number }>) => void;
  selectTicker: (ticker: string | null) => void;
  setView: (view: View) => void;
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  setWsConnected: (connected: boolean) => void;
}

const initialCompanies: Company[] = COMPANIES_STATIC.map(c => ({
  ...c,
  price: c.basePrice,
  change: 0,
  changePercent: 0,
  volume: c.avgVolume,
}));

export const useStore = create<StoreState>((set) => ({
  companies: initialCompanies,
  selectedTicker: null,
  view: 'dashboard',
  watchlist: ['LLY', 'NVO', 'VRTX', 'CRSP', 'NTLA'],
  alerts: [
    { id: 'a1', type: 'price_up', ticker: 'LLY', threshold: 5, active: true, triggered: false, createdAt: '2026-04-20T00:00:00Z', label: 'LLY up +5%' },
    { id: 'a2', type: 'price_down', ticker: 'MRNA', threshold: 10, active: true, triggered: false, createdAt: '2026-04-20T00:00:00Z', label: 'MRNA down -10%' },
    { id: 'a3', type: 'fda', ticker: 'NTLA', threshold: 0, active: true, triggered: false, createdAt: '2026-04-20T00:00:00Z', label: 'NTLA MAGNITUDE readout Jun 8' },
    { id: 'a4', type: 'earnings', ticker: 'AMGN', threshold: 0, active: true, triggered: false, createdAt: '2026-04-20T00:00:00Z', label: 'AMGN earnings T-7 days' },
  ],
  wsConnected: false,

  setCompanies: (companies) => set({ companies }),

  updatePrices: (updates) => set((state) => {
    const map = new Map(updates.map(u => [u.ticker, u]));
    const companies = state.companies.map(c => {
      const u = map.get(c.ticker);
      return u ? { ...c, price: u.price, change: u.change, changePercent: u.changePercent, volume: c.volume + u.volume } : c;
    });

    const alerts = state.alerts.map(alert => {
      if (!alert.active || alert.triggered) return alert;
      const co = companies.find(c => c.ticker === alert.ticker);
      if (!co) return alert;
      let triggered = false;
      if (alert.type === 'price_up' && co.changePercent >= alert.threshold) triggered = true;
      if (alert.type === 'price_down' && co.changePercent <= -alert.threshold) triggered = true;
      return triggered ? { ...alert, triggered: true } : alert;
    });

    return { companies, alerts };
  }),

  selectTicker: (ticker) => set((state) => ({
    selectedTicker: ticker,
    view: ticker ? 'company' : state.view,
  })),

  setView: (view) => set({ view, selectedTicker: view !== 'company' ? null : undefined }),

  addToWatchlist: (ticker) => set((state) => ({
    watchlist: state.watchlist.includes(ticker) ? state.watchlist : [...state.watchlist, ticker],
  })),

  removeFromWatchlist: (ticker) => set((state) => ({
    watchlist: state.watchlist.filter(t => t !== ticker),
  })),

  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),

  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter(a => a.id !== id) })),

  toggleAlert: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, active: !a.active, triggered: false } : a),
  })),

  setWsConnected: (connected) => set({ wsConnected: connected }),
}));
