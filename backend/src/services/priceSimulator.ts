import { COMPANIES } from '../data/companies.js';

export interface PriceUpdate {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

const currentPrices: Map<string, number> = new Map();
const openPrices: Map<string, number> = new Map();

export function initializePrices(): void {
  for (const co of COMPANIES) {
    const jitter = 1 + (Math.random() - 0.5) * 0.04;
    const price = parseFloat((co.basePrice * jitter).toFixed(2));
    currentPrices.set(co.ticker, price);
    openPrices.set(co.ticker, price);
  }
}

function isMarketHours(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const h = et.getHours();
  const m = et.getMinutes();
  const dayOfWeek = et.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false;
  const minutes = h * 60 + m;
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}

function getVolatility(ticker: string): number {
  const highVol = ['NTLA', 'CRSP', 'MRNA', 'TWST', 'SRPT', 'BNTX'];
  const lowVol = ['LLY', 'NVO', 'AMGN', 'GILD', 'REGN'];
  if (highVol.includes(ticker)) return 0.008;
  if (lowVol.includes(ticker)) return 0.003;
  return 0.005;
}

export function simulateTick(): PriceUpdate[] {
  const updates: PriceUpdate[] = [];
  const active = isMarketHours();

  for (const co of COMPANIES) {
    const current = currentPrices.get(co.ticker) ?? co.basePrice;
    const open = openPrices.get(co.ticker) ?? co.basePrice;

    let newPrice = current;
    if (active) {
      const vol = getVolatility(co.ticker);
      const drift = (co.basePrice - current) * 0.0001;
      const shock = (Math.random() - 0.495) * vol * current;
      newPrice = Math.max(current * 0.5, current + drift + shock);
      newPrice = parseFloat(newPrice.toFixed(2));
      currentPrices.set(co.ticker, newPrice);
    }

    const change = parseFloat((newPrice - open).toFixed(2));
    const changePercent = parseFloat(((change / open) * 100).toFixed(2));
    const volumeFactor = active ? 1 + Math.random() * 0.3 : 0;
    const volume = Math.floor(co.avgVolume * volumeFactor / 26);

    updates.push({ ticker: co.ticker, price: newPrice, change, changePercent, volume });
  }
  return updates;
}

export function getCurrentSnapshot(): PriceUpdate[] {
  return COMPANIES.map(co => {
    const price = currentPrices.get(co.ticker) ?? co.basePrice;
    const open = openPrices.get(co.ticker) ?? co.basePrice;
    const change = parseFloat((price - open).toFixed(2));
    const changePercent = parseFloat(((change / open) * 100).toFixed(2));
    return { ticker: co.ticker, price, change, changePercent, volume: Math.floor(co.avgVolume * 0.6) };
  });
}
