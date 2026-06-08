export class TTLCache<T> {
  private store = new Map<string, { data: T; expires: number }>();

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { this.store.delete(key); return null; }
    return entry.data;
  }

  set(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expires: Date.now() + ttlMs });
  }

  has(key: string): boolean { return this.get(key) !== null; }
  size(): number { return this.store.size; }
}

// Shared caches with TTLs matching the PRD caching strategy
export const quoteCache = new TTLCache<Record<string, unknown>>();       // 15 min
export const optionsCache = new TTLCache<Record<string, unknown>>();     // 15 min
export const trialsCache = new TTLCache<unknown[]>();                    // 24 hours
export const newsCache = new TTLCache<unknown[]>();                      // 15 min
export const fdaCache = new TTLCache<unknown[]>();                       // 1 hour
export const briefCache = new TTLCache<Record<string, unknown>>();       // 30 min
