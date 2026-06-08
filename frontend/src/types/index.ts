export interface Company {
  id: string;
  name: string;
  ticker: string;
  focusArea: string;
  focusTags: string[];
  basePrice: number;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  week52High: number;
  week52Low: number;
  pe: number | null;
  ps: number;
  evEbitda: number | null;
  debtToEquity: number;
  cashRunway: number;
  rdPercent: number;
  analystRating: 'Buy' | 'Hold' | 'Sell';
  priceTarget: number;
  institutionalOwnership: number;
  revenue: number;
  revenueGrowth: number;
  netIncome: number | null;
  employees: number;
  founded: number;
  hq: string;
  description: string;
}

export interface PipelineDrug {
  id: string;
  companyTicker: string;
  drugName: string;
  genericName: string;
  indication: string;
  phase: 'Discovery' | 'Phase I' | 'Phase II' | 'Phase III' | 'BLA/NDA' | 'Approved';
  mechanism: string;
  expectedDataDate?: string;
  partnered: boolean;
  partner?: string;
  estimatedPeakSales?: number;
}

export interface LiveTrial {
  nctId: string;
  nctUrl: string;
  title: string;
  briefSummary: string;
  status: string;
  statusRaw: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  sponsor: string;
  startDate: string;
  completionDate: string;
  enrollment: number;
  ticker: string;
  source: 'clinicaltrials';
}

export interface PubMedPub {
  pmid: string;
  title: string;
  journal: string;
  pubDate: string;
  phase: string;
  drugName: string;
  ticker: string;
  url: string;
}

export interface LivePipelineResponse {
  trials: LiveTrial[];
  publications: PubMedPub[];
  staticCount: number;
}

export interface FDAMilestone {
  id: string;
  companyTicker: string;
  companyName: string;
  drugName: string;
  milestoneType: 'PDUFA' | 'AdCom' | 'CRL Response' | 'Phase III Result' | 'NDA Filing' | 'Approved';
  date: string;
  indication: string;
  significance: 'High' | 'Medium' | 'Low';
  notes: string;
  source?: 'static' | 'live';
  applicationNumber?: string;
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  date: string;
  url: string;
  tickers: string[];
  category: 'FDA' | 'Clinical' | 'Earnings' | 'MA' | 'Analyst' | 'General';
  sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export interface DigestEntry {
  ticker: string;
  companyName: string;
  count: number;
  positive: number;
  negative: number;
  neutral: number;
  topHeadlines: string[];
  latestDate: string;
}

export interface Alert {
  id: string;
  type: 'price_up' | 'price_down' | 'volume' | 'fda' | 'earnings';
  ticker: string;
  threshold: number;
  active: boolean;
  triggered: boolean;
  createdAt: string;
  label: string;
}

export interface PricePoint {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
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

export interface MarketBrief {
  summary: string;
  outlook: 'Bullish' | 'Bearish' | 'Mixed';
  themes: string[];
  watchItems: { label: string; detail: string }[];
  generatedAt: string;
}

export type View = 'dashboard' | 'company' | 'pipeline' | 'fda' | 'screener' | 'news' | 'alerts' | 'options' | 'dcf';
