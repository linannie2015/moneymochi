'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Newspaper, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { NewsItem } from '@/lib/types';

interface NewsSummary {
  summary: string;
  sentiment: 'positive' | 'negative' | 'mixed';
  topStory: string;
}

interface NewsSectionProps {
  news: NewsItem[];
  ticker: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdate?: Date | null;
}

export default function NewsSection({ news, ticker, onRefresh, refreshing, lastUpdate }: NewsSectionProps) {
  const [summary, setSummary] = useState<NewsSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!news.length) return;
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/summarize-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          headlines: news.slice(0, 10).map(n => n.headline),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data);
      }
    } catch { /* fall through */ }
    setSummaryLoading(false);
  }, [news, ticker]);

  useEffect(() => {
    if (news.length > 0) fetchSummary();
  }, [ticker]);
  if (!news.length) {
    return (
      <section className="mt-8 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-xl">📰</span>
          <h2 className="text-xl">Latest news</h2>
        </div>
        <p className="text-muted mb-4 max-w-3xl text-sm">
          Recent headlines so you can see the story behind the price.
        </p>
        <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-6 text-center text-muted">
          <Newspaper className="mx-auto mb-2 text-grey" size={32} />
          No recent headlines found for {ticker}.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 animate-fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📰</span>
          <h2 className="text-xl">Latest news</h2>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted
                       bg-cream2 border border-line rounded-full px-3 py-1.5
                       hover:text-ink hover:border-peach transition-all cursor-pointer
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-4">
        <p className="text-muted max-w-3xl text-sm m-0">
          Recent headlines so you can see the story behind the price. Tap any to read the full article.
        </p>
        {lastUpdate && (
          <span className="text-[0.65rem] text-muted whitespace-nowrap ml-auto">
            Updated {timeAgo(lastUpdate.toISOString())}
          </span>
        )}
      </div>
      {/* AI News Summary */}
      {(summary || summaryLoading) && (
        <div className="bg-lav-soft/50 border border-lav/30 rounded-[var(--r)] p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-lav" />
            <span className="font-heading font-semibold text-sm text-[#6B4FA0]">AI News Digest</span>
            {summary?.sentiment && (
              <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${
                summary.sentiment === 'positive' ? 'bg-mint-soft text-[#1E7A55]'
                : summary.sentiment === 'negative' ? 'bg-peach-soft text-[#B0492F]'
                : 'bg-sun-soft text-[#A06A00]'
              }`}>
                {summary.sentiment}
              </span>
            )}
            <button
              onClick={fetchSummary}
              disabled={summaryLoading}
              className="ml-auto text-[0.65rem] font-semibold text-lav bg-transparent border-none cursor-pointer
                         hover:underline disabled:opacity-50 p-0 flex items-center gap-1"
            >
              {summaryLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              {summaryLoading ? 'Summarizing...' : 'Refresh'}
            </button>
          </div>
          {summaryLoading && !summary ? (
            <div className="text-sm text-muted animate-pulse">Reading headlines and generating summary...</div>
          ) : summary ? (
            <>
              <p className="text-sm leading-relaxed m-0 mb-2">{summary.summary}</p>
              {summary.topStory && (
                <div className="text-xs text-muted">
                  <span className="font-bold">Top story:</span> {summary.topStory}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] divide-y divide-dashed divide-line">
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3.5 no-underline text-ink transition-colors hover:bg-cream group"
          >
            <span className="text-lg flex-none mt-0.5">📄</span>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-semibold leading-snug text-sm group-hover:text-sky transition-colors">
                {item.headline}
              </div>
              <div className="text-xs text-muted font-bold mt-0.5">
                {item.source} · {timeAgo(item.published_at)}
              </div>
            </div>
            <ExternalLink size={16} className="text-sky flex-none mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>

      <div className="text-[0.65rem] text-muted text-center mt-2">
        Auto-refreshes every 5 minutes · Powered by Finnhub
      </div>
    </section>
  );
}
