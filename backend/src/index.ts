import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { COMPANIES } from './data/companies.js';
import { PIPELINE } from './data/pipeline.js';
import { FDA_MILESTONES } from './data/fda.js';
import { initializePrices, simulateTick, getCurrentSnapshot } from './services/priceSimulator.js';
import { fetchLiveQuotes } from './services/yahooQuotes.js';
import { fetchAllTrials, fetchTrialsForCompany } from './services/clinicalTrials.js';
import { fetchRecentApprovals, fetchApprovedDrugs, fetchFDACalendarEvents } from './services/openFDA.js';
import { fetchRSSNews, buildDailyDigest } from './services/rssNews.js';
import { generateMarketBriefFromData } from './services/newsSummary.js';
import { fetchAllPublications } from './services/pubmed.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize fallback price simulation
initializePrices();

// In-memory live price map (updated every 60s from Yahoo, smoothed every 10s from simulator)
let liveQuoteMap = new Map<string, { price: number; change: number; changePercent: number; volume: number; source: string }>();

async function refreshLiveQuotes() {
  try {
    const quotes = await fetchLiveQuotes();
    for (const q of quotes) {
      liveQuoteMap.set(q.ticker, {
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        volume: q.volume,
        source: q.source,
      });
    }
    console.log(`[Quotes] Refreshed ${quotes.length} live quotes from Yahoo Finance`);
  } catch (err) {
    console.warn('[Quotes] Refresh failed, keeping last known prices');
  }
}

// Kick off initial live quote fetch
refreshLiveQuotes();

// Refresh live quotes every 60 seconds
setInterval(refreshLiveQuotes, 60_000);

// ─── REST API ────────────────────────────────────────────────────────────────

app.get('/api/companies', (_req, res) => {
  const data = COMPANIES.map(co => {
    const live = liveQuoteMap.get(co.ticker);
    return {
      ...co,
      price: live?.price ?? co.basePrice,
      change: live?.change ?? 0,
      changePercent: live?.changePercent ?? 0,
      volume: live?.volume ?? co.avgVolume,
      dataSource: live?.source ?? 'fallback',
    };
  });
  res.json(data);
});

app.get('/api/companies/:ticker', (req, res) => {
  const co = COMPANIES.find(c => c.ticker === req.params.ticker.toUpperCase());
  if (!co) return res.status(404).json({ error: 'Not found' });
  const live = liveQuoteMap.get(co.ticker);
  res.json({ ...co, price: live?.price ?? co.basePrice, change: live?.change ?? 0, changePercent: live?.changePercent ?? 0, volume: live?.volume ?? co.avgVolume, dataSource: live?.source ?? 'fallback' });
});


// Static pipeline data (from PRD) + live ClinicalTrials data
app.get('/api/pipeline', (_req, res) => res.json(PIPELINE));

app.get('/api/trials', async (_req, res) => {
  try {
    const trials = await fetchAllTrials();
    res.json(trials);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/trials/:ticker', async (req, res) => {
  try {
    const trials = await fetchTrialsForCompany(req.params.ticker.toUpperCase());
    res.json(trials);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Live pipeline — ClinicalTrials.gov + PubMed + static data merged
app.get('/api/pipeline/live', async (_req, res) => {
  try {
    const [trials, pubs] = await Promise.all([
      fetchAllTrials(),
      fetchAllPublications(),
    ]);
    res.json({ trials, publications: pubs, staticCount: PIPELINE.length });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/pipeline/live/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const [trials, pubs] = await Promise.all([
      fetchTrialsForCompany(ticker),
      fetchAllPublications().then(all => all.filter(p => p.ticker === ticker)),
    ]);
    res.json({ trials, publications: pubs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// FDA data — static milestones + live OpenFDA approvals
app.get('/api/fda-milestones', (_req, res) => res.json(FDA_MILESTONES));

app.get('/api/fda/approvals', async (_req, res) => {
  try {
    const approvals = await fetchRecentApprovals();
    res.json(approvals);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/fda/approvals/:ticker', async (req, res) => {
  try {
    const drugs = await fetchApprovedDrugs(req.params.ticker.toUpperCase());
    res.json(drugs);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Live FDA calendar: recent approvals + upcoming PDUFA dates for tracked companies
app.get('/api/fda/calendar', async (_req, res) => {
  try {
    const events = await fetchFDACalendarEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// News — always serve live RSS, fall back to static only on total failure
app.get('/api/news', async (_req, res) => {
  try {
    const news = await fetchRSSNews();
    res.json(news);
  } catch (err) {
    console.warn('[News] RSS fetch failed, returning static fallback');
    const { NEWS } = await import('./data/news.js');
    res.json(NEWS);
  }
});

// Market brief — rule-based summary derived from live RSS news data
app.get('/api/news/summary', async (_req, res) => {
  try {
    const articles = await fetchRSSNews();
    const brief = generateMarketBriefFromData(articles.map(a => ({
      headline: a.headline,
      category: a.category,
      sentiment: a.sentiment,
      source: a.source,
      date: a.date,
      tickers: a.tickers,
    })));
    res.json(brief);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Daily digest — today's news grouped by company, sorted by article count
app.get('/api/news/digest', async (_req, res) => {
  try {
    const news = await fetchRSSNews();
    res.json(buildDailyDigest(news));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  time: new Date().toISOString(),
  liveQuotes: liveQuoteMap.size,
  dataSource: 'Yahoo Finance (15-min delayed) + Government APIs (free)',
}));

// ─── WebSocket ───────────────────────────────────────────────────────────────

wss.on('connection', (ws: WebSocket) => {
  // Send current snapshot on connect (from live map or simulator fallback)
  const snapshot = COMPANIES.map(co => {
    const live = liveQuoteMap.get(co.ticker);
    return { ticker: co.ticker, price: live?.price ?? co.basePrice, change: live?.change ?? 0, changePercent: live?.changePercent ?? 0, volume: live?.volume ?? co.avgVolume };
  });
  ws.send(JSON.stringify({ type: 'snapshot', data: snapshot, source: 'yahoo_finance' }));
  ws.on('error', () => {});
});

// Broadcast small price movements every 10s (simulator smooths between 60s Yahoo refreshes)
setInterval(() => {
  const simUpdates = simulateTick();

  // Blend simulator with live prices — simulator only moves price if we have a live anchor
  const updates = simUpdates.map(u => {
    const live = liveQuoteMap.get(u.ticker);
    if (live) {
      // Small random walk around the live price
      const drift = (Math.random() - 0.499) * live.price * 0.001;
      const price = parseFloat((live.price + drift).toFixed(2));
      const change = parseFloat((price - (COMPANIES.find(c => c.ticker === u.ticker)?.basePrice ?? price)).toFixed(2));
      const changePercent = parseFloat(((change / (COMPANIES.find(c => c.ticker === u.ticker)?.basePrice ?? price)) * 100).toFixed(2));
      liveQuoteMap.set(u.ticker, { ...live, price, change, changePercent });
      return { ticker: u.ticker, price, change, changePercent, volume: live.volume };
    }
    return u;
  });

  const msg = JSON.stringify({ type: 'price_update', data: updates });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}, 10_000);

// Pre-warm caches in background — trials first, then PubMed (slower)
setTimeout(() => {
  fetchRSSNews().catch(() => {});
  fetchAllTrials().catch(() => {});
}, 5000);
setTimeout(() => {
  fetchAllPublications().catch(() => {});
}, 30000); // delay PubMed so CT.gov finishes first

const PORT = process.env.PORT ?? 3001;
server.listen(PORT, () => {
  console.log(`BioTracker Pro API  →  http://localhost:${PORT}`);
  console.log(`Data sources: Yahoo Finance (quotes/options) | ClinicalTrials.gov | OpenFDA | RSS Feeds`);
});
