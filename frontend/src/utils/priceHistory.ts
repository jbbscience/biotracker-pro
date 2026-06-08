import type { PricePoint } from '../types';

export function generatePriceHistory(basePrice: number, days: number = 365, ticker: string = ''): PricePoint[] {
  const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  let rand = seed;
  const lcg = () => {
    rand = (rand * 1664525 + 1013904223) & 0xffffffff;
    return (rand >>> 0) / 0xffffffff;
  };

  const volatility = basePrice > 400 ? 0.018 : basePrice > 100 ? 0.022 : 0.032;
  const points: PricePoint[] = [];
  let price = basePrice * (0.85 + lcg() * 0.3);

  const now = new Date('2026-04-20');
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;

    const drift = 0.0002;
    const shock = (lcg() - 0.495) * volatility * price;
    const meanRev = (basePrice - price) * 0.003;
    price = Math.max(price * 0.3, price + price * drift + shock + meanRev);

    const open = parseFloat((price * (1 + (lcg() - 0.5) * 0.005)).toFixed(2));
    const high = parseFloat((Math.max(price, open) * (1 + lcg() * 0.012)).toFixed(2));
    const low = parseFloat((Math.min(price, open) * (1 - lcg() * 0.012)).toFixed(2));
    const close = parseFloat(price.toFixed(2));
    const volume = Math.floor(500_000 + lcg() * 3_000_000);

    points.push({
      date: d.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });
  }
  return points;
}

export function filterHistory(history: PricePoint[], range: '1D' | '5D' | '1M' | '6M' | '1Y' | '5Y' | 'Max'): PricePoint[] {
  const days: Record<string, number> = { '1D': 1, '5D': 5, '1M': 21, '6M': 126, '1Y': 252, '5Y': 1260, 'Max': 99999 };
  const n = days[range] ?? 252;
  return history.slice(-n);
}
