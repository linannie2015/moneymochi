import type { Quote, NewsItem } from './types';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const TWELVE_BASE = 'https://api.twelvedata.com';

function finnhubKey(): string | null {
  return process.env.NEXT_PUBLIC_FINNHUB_KEY ?? null;
}

function twelveKey(): string | null {
  return process.env.NEXT_PUBLIC_TWELVE_DATA_KEY ?? null;
}

export function hasApiKeys(): boolean {
  return !!(finnhubKey() && twelveKey());
}

export async function fetchQuote(ticker: string): Promise<Quote | null> {
  const key = finnhubKey();
  if (!key) return null;

  try {
    const enc = encodeURIComponent(ticker);
    const [quoteRes, profileRes] = await Promise.all([
      fetch(`${FINNHUB_BASE}/quote?symbol=${enc}&token=${key}`),
      fetch(`${FINNHUB_BASE}/stock/metric?symbol=${enc}&metric=all&token=${key}`),
    ]);

    if (!quoteRes.ok) return null;
    const q = await quoteRes.json();
    if (!q.c || q.c === 0) return null;

    let pe: number | null = null;
    let marketCap: number | null = null;
    let week52High: number | null = null;
    let week52Low: number | null = null;

    if (profileRes.ok) {
      const m = await profileRes.json();
      const metric = m.metric ?? {};
      pe = metric.peNormalizedAnnual ?? metric.peTTM ?? null;
      marketCap = metric.marketCapitalization ? metric.marketCapitalization * 1e6 : null;
      week52High = metric['52WeekHigh'] ?? week52High;
      week52Low = metric['52WeekLow'] ?? week52Low;
    }

    const changePct = q.dp ?? (q.pc ? ((q.c - q.pc) / q.pc) * 100 : null);

    const supportLow = week52Low;
    const supportHigh = week52Low != null && week52High != null
      ? week52Low + (week52High - week52Low) * 0.18
      : null;

    return {
      ticker,
      price: q.c,
      change_pct: changePct,
      pe,
      market_cap: marketCap,
      week52_high: week52High,
      week52_low: week52Low,
      support_low: supportLow,
      support_high: supportHigh,
      as_of: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function fetchPriceHistory(
  ticker: string,
): Promise<{ d: string; close: number }[]> {
  const key = twelveKey();
  if (!key) return [];

  try {
    const res = await fetch(
      `${TWELVE_BASE}/time_series?symbol=${encodeURIComponent(ticker)}&interval=1day&outputsize=260&apikey=${key}`,
    );
    if (!res.ok) return [];
    const data = await res.json();

    if (data.status === 'error' || !data.values) return [];

    return data.values
      .map((v: { datetime: string; close: string }) => ({
        d: v.datetime,
        close: parseFloat(v.close),
      }))
      .reverse();
  } catch {
    return [];
  }
}

export async function fetchIntradayHistory(
  ticker: string,
): Promise<{ d: string; close: number }[]> {
  const key = twelveKey();
  if (!key) return [];

  try {
    const res = await fetch(
      `${TWELVE_BASE}/time_series?symbol=${encodeURIComponent(ticker)}&interval=5min&outputsize=78&apikey=${key}`,
    );
    if (!res.ok) return [];
    const data = await res.json();

    if (data.status === 'error' || !data.values) return [];

    return data.values
      .map((v: { datetime: string; close: string }) => ({
        d: v.datetime,
        close: parseFloat(v.close),
      }))
      .reverse();
  } catch {
    return [];
  }
}

export async function fetchNews(ticker: string): Promise<NewsItem[]> {
  const key = finnhubKey();
  if (!key) return [];

  try {
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);

    const res = await fetch(
      `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}&token=${key}`,
    );
    if (!res.ok) return [];
    const articles = await res.json();

    if (!Array.isArray(articles)) return [];

    return articles.slice(0, 8).map((a: { id: number; headline: string; url: string; source: string; datetime: number }, i: number) => ({
      id: a.id ?? i,
      ticker,
      headline: a.headline,
      url: a.url,
      source: a.source,
      published_at: new Date(a.datetime * 1000).toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function searchSymbols(query: string): Promise<{ ticker: string; name: string }[]> {
  const key = finnhubKey();
  if (!key) return [];

  try {
    const res = await fetch(
      `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${key}`,
    );
    if (!res.ok) return [];
    const data = await res.json();

    if (!data.result) return [];

    return data.result
      .filter((r: { type: string }) => r.type === 'Common Stock' || r.type === 'ETP')
      .slice(0, 10)
      .map((r: { symbol: string; description: string }) => ({
        ticker: r.symbol,
        name: r.description,
      }));
  } catch {
    return [];
  }
}
