export interface Stock {
  ticker: string;
  name: string | null;
  is_etf: boolean;
  added_at: string;
}

export interface Quote {
  ticker: string;
  price: number | null;
  change_pct: number | null;
  pe: number | null;
  market_cap: number | null;
  week52_high: number | null;
  week52_low: number | null;
  support_low: number | null;
  support_high: number | null;
  as_of: string;
}

export interface PriceDaily {
  ticker: string;
  d: string;
  close: number;
}

export interface NewsItem {
  id: number;
  ticker: string;
  headline: string;
  url: string;
  source: string | null;
  published_at: string;
}

export interface Watch {
  id: string;
  ticker: string;
  target: number;
  mode: string;
  triggered: boolean;
  notify_email: string | null;
  created_at: string;
}

export interface Analysis {
  ticker: string;
  body: string;
  score: number;
  generated_at: string;
}

export interface StockWithQuote extends Stock {
  quote: Quote | null;
}

export type EntryStatus = 'in-zone' | 'approaching' | 'near-highs' | 'mid-range';

export interface WatchlistItem extends StockWithQuote {
  entryStatus: EntryStatus;
  supportRange: { low: number; high: number } | null;
  rangePosition: number | null;
}

export interface PortfolioSummary {
  totalStocks: number;
  avgChange: number;
  advancing: number;
  declining: number;
  nearSupport: number;
  leader: { ticker: string; change: number } | null;
  laggard: { ticker: string; change: number } | null;
}
