import yahooFinance from 'yahoo-finance2';
import { quoteCache, optionsCache } from './cache.js';
import { COMPANIES } from '../data/companies.js';

const TTL_QUOTES = 15 * 60 * 1000;    // 15 minutes (matches Yahoo delay)
const TTL_OPTIONS = 15 * 60 * 1000;

export interface LiveQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  source: 'live' | 'cached' | 'fallback';
}

export interface OptionContract {
  contractSymbol: string;
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  percentChange: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  inTheMoney: boolean;
  expiration: string;
}

export interface OptionsChain {
  ticker: string;
  expirationDates: string[];
  calls: OptionContract[];
  puts: OptionContract[];
  underlyingPrice: number;
  fetchedAt: string;
  delayed: boolean;
}

// Suppress yahoo-finance2 validation warnings in console
yahooFinance.setGlobalConfig({ validation: { logErrors: false } });

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchLiveQuotes(): Promise<LiveQuote[]> {
  const cacheKey = 'all_quotes';
  const cached = quoteCache.get(cacheKey) as LiveQuote[] | null;
  if (cached) return cached;

  const tickers = COMPANIES.map(c => c.ticker);
  const quotes: LiveQuote[] = [];

  try {
    // Yahoo Finance allows bulk quote fetching
    const results = await yahooFinance.quote(tickers);
    const arr = Array.isArray(results) ? results : [results];

    for (const r of arr) {
      if (!r || !r.regularMarketPrice) continue;
      quotes.push({
        ticker: r.symbol ?? '',
        price: r.regularMarketPrice ?? 0,
        change: r.regularMarketChange ?? 0,
        changePercent: r.regularMarketChangePercent ?? 0,
        volume: r.regularMarketVolume ?? 0,
        marketCap: r.marketCap ?? 0,
        previousClose: r.regularMarketPreviousClose ?? 0,
        open: r.regularMarketOpen ?? 0,
        dayHigh: r.regularMarketDayHigh ?? 0,
        dayLow: r.regularMarketDayLow ?? 0,
        fiftyTwoWeekHigh: r.fiftyTwoWeekHigh ?? 0,
        fiftyTwoWeekLow: r.fiftyTwoWeekLow ?? 0,
        source: 'live',
      });
    }

    quoteCache.set(cacheKey, quotes as unknown as Record<string, unknown>, TTL_QUOTES);
    console.log(`[Yahoo] Fetched ${quotes.length} live quotes`);
    return quotes;

  } catch (err) {
    console.warn('[Yahoo] Quote fetch failed, using fallback:', (err as Error).message);
    return COMPANIES.map(co => ({
      ticker: co.ticker,
      price: co.basePrice,
      change: 0,
      changePercent: 0,
      volume: co.avgVolume,
      marketCap: co.marketCap,
      previousClose: co.basePrice,
      open: co.basePrice,
      dayHigh: co.basePrice * 1.01,
      dayLow: co.basePrice * 0.99,
      fiftyTwoWeekHigh: co.week52High,
      fiftyTwoWeekLow: co.week52Low,
      source: 'fallback',
    }));
  }
}

// Circuit breaker: after 3 consecutive 429s, pause all options fetches for 2 minutes
let optionsCircuitOpen = false;
let optionsCircuitUntil = 0;
let optionsConsecutive429s = 0;

// In-flight dedup: prevent concurrent fetches for the same ticker+expiry
const optionsInflight = new Map<string, Promise<OptionsChain | null>>();

export async function fetchOptionsChain(ticker: string, expiration?: string): Promise<OptionsChain | null> {
  // Circuit breaker check
  if (optionsCircuitOpen) {
    if (Date.now() < optionsCircuitUntil) {
      const secs = Math.ceil((optionsCircuitUntil - Date.now()) / 1000);
      throw new Error(`Yahoo Finance rate limit active — options paused for ${secs}s`);
    }
    optionsCircuitOpen = false;
    optionsConsecutive429s = 0;
    console.log('[Yahoo] Options circuit breaker reset');
  }

  const cacheKey = `options_${ticker}_${expiration ?? 'nearest'}`;
  const cached = optionsCache.get(cacheKey) as OptionsChain | null;
  if (cached) return cached;

  // Return the existing promise if this combo is already being fetched
  const inflight = optionsInflight.get(cacheKey);
  if (inflight) return inflight;

  const promise = (async () => {
  try {
    await delay(1000); // 1s polite delay before hitting Yahoo

    let result = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const queryOptions = expiration ? { date: new Date(expiration) } : {};
        result = await yahooFinance.options(ticker, queryOptions);
        optionsConsecutive429s = 0; // reset on success
        break;
      } catch (e) {
        const msg = (e as Error).message ?? '';
        if (msg.includes('Too Many Requests') || msg.includes('429')) {
          optionsConsecutive429s++;
          if (optionsConsecutive429s >= 3) {
            optionsCircuitOpen = true;
            optionsCircuitUntil = Date.now() + 2 * 60 * 1000; // 2-minute cooldown
            console.warn('[Yahoo] Options circuit breaker tripped — pausing for 2 minutes');
            throw new Error('Yahoo Finance rate limit active — options paused for 120s');
          }
          const backoff = (attempt + 1) * 4000;
          console.warn(`[Yahoo] Options rate-limited for ${ticker}, retrying in ${backoff}ms…`);
          await delay(backoff);
        } else {
          throw e;
        }
      }
    }

    if (!result || !result.options?.length) return null;


    const chain = result.options[0];
    const expirations = (result.expirationDates ?? []).map((d: Date | number) =>
      new Date(d).toISOString().split('T')[0]
    );

    const mapContract = (c: Record<string, unknown>): OptionContract => ({
      contractSymbol: String(c.contractSymbol ?? ''),
      strike: Number(c.strike ?? 0),
      lastPrice: Number(c.lastPrice ?? 0),
      bid: Number(c.bid ?? 0),
      ask: Number(c.ask ?? 0),
      change: Number(c.change ?? 0),
      percentChange: Number(c.percentChange ?? 0),
      volume: Number(c.volume ?? 0),
      openInterest: Number(c.openInterest ?? 0),
      impliedVolatility: Number(c.impliedVolatility ?? 0),
      inTheMoney: Boolean(c.inTheMoney),
      expiration: new Date(chain.expirationDate as Date).toISOString().split('T')[0],
    });

    const out: OptionsChain = {
      ticker,
      expirationDates: expirations,
      calls: ((chain.calls as Record<string, unknown>[]) ?? []).map(mapContract),
      puts: ((chain.puts as Record<string, unknown>[]) ?? []).map(mapContract),
      underlyingPrice: Number(result.quote?.regularMarketPrice ?? 0),
      fetchedAt: new Date().toISOString(),
      delayed: true,
    };

    optionsCache.set(cacheKey, out as unknown as Record<string, unknown>, TTL_OPTIONS);
    return out;

  } catch (err) {
    console.warn(`[Yahoo] Options fetch failed for ${ticker}:`, (err as Error).message);
    return null;
  } finally {
    optionsInflight.delete(cacheKey);
  }
  })();

  optionsInflight.set(cacheKey, promise);
  return promise;
}
