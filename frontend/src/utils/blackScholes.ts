// Abramowitz & Stegun approximation for standard normal CDF
function normCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BSGreeks {
  delta: number;
  gamma: number;
  theta: number;  // per day
  vega: number;   // per 1% IV move
  rho: number;    // per 1% rate move
}

export interface BSResult {
  call: number;
  put: number;
  callGreeks: BSGreeks;
  putGreeks: BSGreeks;
  d1: number;
  d2: number;
}

export function blackScholes(
  S: number,   // spot price
  K: number,   // strike
  T: number,   // time to expiry in years
  r: number,   // risk-free rate (decimal)
  sigma: number // implied volatility (decimal)
): BSResult | null {
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) return null;

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = normCDF(d1);
  const Nd2 = normCDF(d2);
  const Nnd1 = normCDF(-d1);
  const Nnd2 = normCDF(-d2);
  const nd1 = normPDF(d1);
  const ert = Math.exp(-r * T);

  const call = S * Nd1 - K * ert * Nd2;
  const put = K * ert * Nnd2 - S * Nnd1;

  const gamma = nd1 / (S * sigma * sqrtT);
  const vega = (S * nd1 * sqrtT) / 100; // per 1% move

  const callGreeks: BSGreeks = {
    delta: Nd1,
    gamma,
    theta: (-(S * nd1 * sigma) / (2 * sqrtT) - r * K * ert * Nd2) / 365,
    vega,
    rho: (K * T * ert * Nd2) / 100,
  };

  const putGreeks: BSGreeks = {
    delta: Nd1 - 1,
    gamma,
    theta: (-(S * nd1 * sigma) / (2 * sqrtT) + r * K * ert * Nnd2) / 365,
    vega,
    rho: (-K * T * ert * Nnd2) / 100,
  };

  return { call, put, callGreeks, putGreeks, d1, d2 };
}

// Newton-Raphson implied volatility solver
export function impliedVolatility(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  isCall: boolean,
  maxIter = 100,
  tol = 1e-6
): number | null {
  if (T <= 0 || marketPrice <= 0) return null;

  let sigma = 0.3; // initial guess
  for (let i = 0; i < maxIter; i++) {
    const bs = blackScholes(S, K, T, r, sigma);
    if (!bs) return null;

    const price = isCall ? bs.call : bs.put;
    const vega = bs.callGreeks.vega * 100; // convert back from per-1%
    const diff = price - marketPrice;

    if (Math.abs(diff) < tol) return sigma;
    if (Math.abs(vega) < 1e-10) return null;

    sigma -= diff / vega;
    if (sigma <= 0) sigma = 0.001;
  }
  return sigma;
}

export function daysToExpiry(expirationDate: string): number {
  const now = new Date();
  const exp = new Date(expirationDate);
  return Math.max(0, (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
