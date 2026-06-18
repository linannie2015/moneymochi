import type { StockWithQuote, NewsItem } from './types';

const SNAP = '2026-06-16T16:00:00Z';

export const DEMO_STOCKS: StockWithQuote[] = [
  {
    ticker: 'RKLB', name: 'Rocket Lab', is_etf: false, added_at: SNAP,
    quote: { ticker: 'RKLB', price: 107.49, change_pct: 1.84, pe: null, market_cap: 59.27e9, week52_high: 151.00, week52_low: 55.00, support_low: 55.00, support_high: 72.28, as_of: SNAP },
  },
  {
    ticker: 'AMD', name: 'Advanced Micro Devices', is_etf: false, added_at: SNAP,
    quote: { ticker: 'AMD', price: 548.80, change_pct: 3.50, pe: 35.0, market_cap: 893e9, week52_high: 558.37, week52_low: 350.00, support_low: 350.00, support_high: 387.51, as_of: SNAP },
  },
  {
    ticker: 'MU', name: 'Micron Technology', is_etf: false, added_at: SNAP,
    quote: { ticker: 'MU', price: 1057.18, change_pct: 10.80, pe: 51.4, market_cap: 1.19e12, week52_high: 1133.17, week52_low: 680.00, support_low: 680.00, support_high: 761.57, as_of: SNAP },
  },
  {
    ticker: 'MSTR', name: 'Strategy (MicroStrategy)', is_etf: false, added_at: SNAP,
    quote: { ticker: 'MSTR', price: 123.97, change_pct: 2.15, pe: null, market_cap: 120e9, week52_high: 150.00, week52_low: 70.00, support_low: 70.00, support_high: 84.40, as_of: SNAP },
  },
  {
    ticker: 'VOO', name: 'Vanguard S&P 500 ETF', is_etf: true, added_at: SNAP,
    quote: { ticker: 'VOO', price: 693.83, change_pct: 0.52, pe: null, market_cap: null, week52_high: 700.00, week52_low: 540.00, support_low: 540.00, support_high: 568.80, as_of: SNAP },
  },
  {
    ticker: 'QQQM', name: 'Invesco Nasdaq-100 ETF', is_etf: true, added_at: SNAP,
    quote: { ticker: 'QQQM', price: 306.24, change_pct: 0.85, pe: null, market_cap: null, week52_high: 308.21, week52_low: 240.00, support_low: 240.00, support_high: 252.28, as_of: SNAP },
  },
  {
    ticker: 'GOOGL', name: 'Alphabet Inc.', is_etf: false, added_at: SNAP,
    quote: { ticker: 'GOOGL', price: 373.44, change_pct: -0.65, pe: 22.0, market_cap: 4.40e12, week52_high: 408.61, week52_low: 300.00, support_low: 300.00, support_high: 319.55, as_of: SNAP },
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corp.', is_etf: false, added_at: SNAP,
    quote: { ticker: 'MSFT', price: 399.50, change_pct: -0.53, pe: 30.5, market_cap: 2.97e12, week52_high: 468.35, week52_low: 360.00, support_low: 360.00, support_high: 379.50, as_of: SNAP },
  },
  {
    ticker: 'META', name: 'Meta Platforms', is_etf: false, added_at: SNAP,
    quote: { ticker: 'META', price: 590.00, change_pct: 1.02, pe: 22.0, market_cap: 1.51e12, week52_high: 794.38, week52_low: 450.00, support_low: 450.00, support_high: 511.99, as_of: SNAP },
  },
  {
    ticker: 'AMZN', name: 'Amazon.com Inc.', is_etf: false, added_at: SNAP,
    quote: { ticker: 'AMZN', price: 238.55, change_pct: -0.32, pe: 35.0, market_cap: 2.55e12, week52_high: 285.00, week52_low: 185.00, support_low: 185.00, support_high: 203.00, as_of: SNAP },
  },
];

export const DEMO_NEWS: Record<string, NewsItem[]> = {
  GOOGL: [
    { id: 1, ticker: 'GOOGL', headline: 'Alphabet market cap holds above $4.4T as Gemini AI powers Search and Cloud growth', url: '#', source: 'Reuters', published_at: '2026-06-16T14:00:00Z' },
    { id: 2, ticker: 'GOOGL', headline: 'Waymo surpasses 1 million autonomous rides per week across 12 US cities', url: '#', source: 'TechCrunch', published_at: '2026-06-16T08:00:00Z' },
    { id: 3, ticker: 'GOOGL', headline: 'Google Cloud crosses $50B annual run rate, narrowing gap with Azure', url: '#', source: 'CNBC', published_at: '2026-06-15T16:00:00Z' },
  ],
  MSFT: [
    { id: 4, ticker: 'MSFT', headline: 'Microsoft shares slip to $399 as cloud spending growth decelerates', url: '#', source: 'Bloomberg', published_at: '2026-06-16T13:00:00Z' },
    { id: 5, ticker: 'MSFT', headline: 'Copilot surpasses 50 million paid seats as enterprise AI adoption broadens', url: '#', source: 'The Verge', published_at: '2026-06-16T04:00:00Z' },
  ],
  META: [
    { id: 6, ticker: 'META', headline: 'Meta shares rise on Zuckerberg AI budget expansion, stock nears $590', url: '#', source: 'WSJ', published_at: '2026-06-16T12:00:00Z' },
    { id: 7, ticker: 'META', headline: 'Llama 4 open-source model drives Meta AI to 1 billion monthly active users', url: '#', source: 'Bloomberg', published_at: '2026-06-15T22:00:00Z' },
  ],
  AMZN: [
    { id: 8, ticker: 'AMZN', headline: 'Amazon stock at $238 as retail margins expand through AI-powered automation', url: '#', source: 'CNBC', published_at: '2026-06-16T11:00:00Z' },
    { id: 9, ticker: 'AMZN', headline: 'AWS Trainium3 chips power 30% of new AI training workloads, reducing Nvidia dependency', url: '#', source: 'The Information', published_at: '2026-06-15T20:00:00Z' },
  ],
  AMD: [
    { id: 10, ticker: 'AMD', headline: 'AMD surges 8% to record high near $549 in broad chip rally', url: '#', source: 'Reuters', published_at: '2026-06-16T10:00:00Z' },
    { id: 11, ticker: 'AMD', headline: 'AMD MI400 AI accelerator wins major cloud contracts, challenging Nvidia B300', url: '#', source: 'The Information', published_at: '2026-06-15T15:00:00Z' },
  ],
  RKLB: [
    { id: 12, ticker: 'RKLB', headline: 'Rocket Lab stock at $107 after KeyBanc upgrade despite SpaceX IPO sell-off', url: '#', source: 'SpaceNews', published_at: '2026-06-16T09:00:00Z' },
    { id: 13, ticker: 'RKLB', headline: 'Neutron rocket completes first commercial launch, opens $10B+ addressable market', url: '#', source: 'Ars Technica', published_at: '2026-06-15T14:00:00Z' },
  ],
  MU: [
    { id: 14, ticker: 'MU', headline: 'Micron surges 10.8% to $1,057 as analysts raise price targets on AI memory demand', url: '#', source: 'Bloomberg', published_at: '2026-06-16T11:30:00Z' },
    { id: 15, ticker: 'MU', headline: 'Micron HBM4 chips achieve record bandwidth, locking in next-gen AI server contracts', url: '#', source: 'Barron\'s', published_at: '2026-06-15T18:00:00Z' },
  ],
  MSTR: [
    { id: 16, ticker: 'MSTR', headline: 'Strategy stock at $124 post-split as Bitcoin treasury strategy continues accumulation', url: '#', source: 'CoinDesk', published_at: '2026-06-16T07:00:00Z' },
    { id: 17, ticker: 'MSTR', headline: 'Strategy benefits from S&P 500 index inclusion with steady passive fund inflows', url: '#', source: 'WSJ', published_at: '2026-06-15T21:00:00Z' },
  ],
  VOO: [
    { id: 18, ticker: 'VOO', headline: 'S&P 500 ETF VOO hits $694 as index approaches all-time highs on AI-led rally', url: '#', source: 'ETF.com', published_at: '2026-06-16T08:00:00Z' },
  ],
  QQQM: [
    { id: 19, ticker: 'QQQM', headline: 'Nasdaq-100 ETF QQQM nears $306 record as semiconductor and AI stocks lead gains', url: '#', source: 'MarketWatch', published_at: '2026-06-15T19:00:00Z' },
  ],
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function hashTicker(ticker: string): number {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) {
    h = ((h << 5) - h + ticker.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

export function generateDemoPriceHistory(ticker: string): { d: string; close: number }[] {
  const stock = DEMO_STOCKS.find(s => s.ticker === ticker);
  const currentPrice = stock?.quote?.price ?? 100;
  const rand = seededRandom(hashTicker(ticker));
  const points: { d: string; close: number }[] = [];
  let price = currentPrice * 0.75;
  const base = new Date('2026-06-16T00:00:00Z').getTime();
  for (let i = 260; i >= 0; i--) {
    const date = new Date(base - i * 86400000);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dayStr = date.toISOString().slice(0, 10);
    const change = (rand() - 0.48) * currentPrice * 0.025;
    price = Math.max(price * 0.95, Math.min(price * 1.05, price + change));
    points.push({ d: dayStr, close: Math.round(price * 100) / 100 });
  }
  const last = points[points.length - 1];
  if (last) last.close = currentPrice;
  return points;
}

export function generateDemoIntradayHistory(ticker: string): { d: string; close: number }[] {
  const stock = DEMO_STOCKS.find(s => s.ticker === ticker);
  const currentPrice = stock?.quote?.price ?? 100;
  const changePct = stock?.quote?.change_pct ?? 0;
  const rand = seededRandom(hashTicker(ticker) + 9999);
  const points: { d: string; close: number }[] = [];

  const openPrice = currentPrice / (1 + changePct / 100);
  let price = openPrice;

  for (let i = 0; i < 78; i++) {
    const hours = Math.floor(i * 5 / 60) + 9;
    const mins = (i * 5) % 60 + (i < 6 ? 30 : 0);
    const actualHours = 9 + Math.floor((i * 5 + 30) / 60);
    const actualMins = (i * 5 + 30) % 60;
    const timeStr = `2026-06-16 ${String(actualHours).padStart(2, '0')}:${String(actualMins).padStart(2, '0')}:00`;

    const progress = i / 77;
    const target = openPrice + (currentPrice - openPrice) * progress;
    const noise = (rand() - 0.5) * currentPrice * 0.004;
    price = price + (target - price) * 0.15 + noise;
    price = Math.max(price * 0.995, Math.min(price * 1.005, price));

    points.push({ d: timeStr, close: Math.round(price * 100) / 100 });
  }

  const last = points[points.length - 1];
  if (last) last.close = currentPrice;
  return points;
}
