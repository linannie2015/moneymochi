'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchQuote, fetchPriceHistory, fetchIntradayHistory, fetchNews, hasApiKeys } from './api';
import { DEMO_STOCKS, DEMO_NEWS, generateDemoPriceHistory, generateDemoIntradayHistory } from './demo-data';
import type { StockWithQuote, NewsItem } from './types';

const NEWS_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function useStockData(ticker: string) {
  const [quote, setQuote] = useState<StockWithQuote | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [priceHistory, setPriceHistory] = useState<{ d: string; close: number }[]>([]);
  const [intradayHistory, setIntradayHistory] = useState<{ d: string; close: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [lastNewsUpdate, setLastNewsUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (!hasApiKeys()) {
        const demoStock = DEMO_STOCKS.find(s => s.ticker === ticker);
        setQuote(demoStock ?? { ticker, name: ticker, is_etf: false, added_at: '', quote: null });
        setNews(DEMO_NEWS[ticker] ?? []);
        setPriceHistory(generateDemoPriceHistory(ticker));
        setIntradayHistory(generateDemoIntradayHistory(ticker));
        setLoading(false);
        return;
      }

      const [liveQuote, liveNews, liveHistory, liveIntraday] = await Promise.all([
        fetchQuote(ticker),
        fetchNews(ticker),
        fetchPriceHistory(ticker),
        fetchIntradayHistory(ticker),
      ]);

      if (cancelled) return;

      setQuote({
        ticker,
        name: ticker,
        is_etf: false,
        added_at: '',
        quote: liveQuote,
      });
      setNews(liveNews);
      setLastNewsUpdate(new Date());
      setPriceHistory(liveHistory.length > 0 ? liveHistory : generateDemoPriceHistory(ticker));
      setIntradayHistory(liveIntraday.length > 0 ? liveIntraday : generateDemoIntradayHistory(ticker));
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [ticker]);

  // Auto-refresh news every 5 minutes
  useEffect(() => {
    if (!hasApiKeys()) return;

    const interval = setInterval(async () => {
      const fresh = await fetchNews(ticker);
      if (fresh.length > 0) {
        setNews(fresh);
        setLastNewsUpdate(new Date());
      }
    }, NEWS_REFRESH_MS);

    return () => clearInterval(interval);
  }, [ticker]);

  const refreshNews = useCallback(async () => {
    if (!hasApiKeys()) return;
    setNewsRefreshing(true);
    const fresh = await fetchNews(ticker);
    if (fresh.length > 0) {
      setNews(fresh);
      setLastNewsUpdate(new Date());
    }
    setNewsRefreshing(false);
  }, [ticker]);

  return { stock: quote, news, priceHistory, intradayHistory, loading, refreshNews, newsRefreshing, lastNewsUpdate };
}

const WATCHLIST_KEY = 'moneymochi-watchlist';

function loadWatchlistTickers(): string[] | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(WATCHLIST_KEY);
  if (!saved) return null;
  try {
    const arr = JSON.parse(saved);
    return Array.isArray(arr) ? arr : null;
  } catch { return null; }
}

function saveWatchlistTickers(stocks: StockWithQuote[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(stocks.map(s => s.ticker)));
}

export function isInWatchlist(ticker: string): boolean {
  const tickers = loadWatchlistTickers();
  if (!tickers) return DEMO_STOCKS.some(s => s.ticker === ticker);
  return tickers.includes(ticker);
}

export function addToWatchlistStorage(ticker: string) {
  const tickers = loadWatchlistTickers() ?? DEMO_STOCKS.map(s => s.ticker);
  if (!tickers.includes(ticker)) {
    tickers.push(ticker);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(tickers));
  }
}

export function removeFromWatchlistStorage(ticker: string) {
  const tickers = loadWatchlistTickers() ?? DEMO_STOCKS.map(s => s.ticker);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(tickers.filter(t => t !== ticker)));
}

export function useWatchlist() {
  const [stocks, setStocks] = useState<StockWithQuote[]>(DEMO_STOCKS);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = loadWatchlistTickers();
    if (saved && saved.length > 0) {
      const known = saved
        .map(t => DEMO_STOCKS.find(s => s.ticker === t) ?? {
          ticker: t, name: t, is_etf: false, added_at: '', quote: null,
        } as StockWithQuote)
      setStocks(known);

      if (hasApiKeys()) {
        Promise.all(known.map(async s => {
          const q = await fetchQuote(s.ticker);
          return q ? { ...s, quote: q } : s;
        })).then(setStocks);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveWatchlistTickers(stocks);
  }, [stocks, mounted]);

  const refreshQuotes = useCallback(async () => {
    if (!hasApiKeys()) return;
    setRefreshing(true);

    const updated = await Promise.all(
      stocks.map(async (s) => {
        const liveQuote = await fetchQuote(s.ticker);
        return liveQuote
          ? { ...s, quote: liveQuote }
          : s;
      }),
    );

    setStocks(updated);
    setRefreshing(false);
  }, [stocks]);

  const addStock = useCallback(async (ticker: string) => {
    if (stocks.some(s => s.ticker === ticker)) return;

    let quote = null;
    if (hasApiKeys()) {
      quote = await fetchQuote(ticker);
    }

    const newStock: StockWithQuote = {
      ticker,
      name: ticker,
      is_etf: false,
      added_at: new Date().toISOString(),
      quote,
    };
    setStocks(prev => [...prev, newStock]);
  }, [stocks]);

  const removeStock = useCallback((ticker: string) => {
    setStocks(prev => prev.filter(s => s.ticker !== ticker));
  }, []);

  return { stocks, addStock, removeStock, refreshQuotes, refreshing };
}
