'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Shield, Trophy, AlertTriangle } from 'lucide-react';
import { pct } from '@/lib/utils';
import type { StockWithQuote, PortfolioSummary as PortfolioSummaryType } from '@/lib/types';

interface PortfolioSummaryProps {
  stocks: StockWithQuote[];
}

function computeSummary(stocks: StockWithQuote[]): PortfolioSummaryType {
  const withChanges = stocks.filter(s => s.quote?.change_pct != null);
  const changes = withChanges.map(s => s.quote!.change_pct!);
  const avgChange = changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
  const advancing = changes.filter(c => c > 0).length;
  const declining = changes.filter(c => c < 0).length;

  const nearSupport = stocks.filter(s => {
    const q = s.quote;
    if (!q?.price || !q.support_high) return false;
    return q.price <= q.support_high * 1.07;
  }).length;

  let leader: { ticker: string; change: number } | null = null;
  let laggard: { ticker: string; change: number } | null = null;

  for (const s of withChanges) {
    const c = s.quote!.change_pct!;
    if (!leader || c > leader.change) leader = { ticker: s.ticker, change: c };
    if (!laggard || c < laggard.change) laggard = { ticker: s.ticker, change: c };
  }

  return {
    totalStocks: stocks.length,
    avgChange,
    advancing,
    declining,
    nearSupport,
    leader,
    laggard,
  };
}

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  accent?: string;
  className?: string;
}

function SummaryCard({ icon, label, value, subtext, accent, className = '' }: SummaryCardProps) {
  return (
    <div className={`bg-card border border-line rounded-[var(--r-sm)] shadow-[var(--shadow-sm)] p-4 hover:-translate-y-0.5 transition-all duration-200 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-cream2">{icon}</div>
        <span className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</span>
      </div>
      <div className={`font-heading font-bold text-2xl tnum ${accent || ''}`}>{value}</div>
      {subtext && <div className="text-xs text-muted mt-0.5">{subtext}</div>}
    </div>
  );
}

export default function PortfolioSummary({ stocks }: PortfolioSummaryProps) {
  const summary = useMemo(() => computeSummary(stocks), [stocks]);
  const avgUp = summary.avgChange >= 0;

  return (
    <section className="animate-slide-up mb-6">
      <div className="flex items-center gap-2.5 mb-4">
        <img src="/logo-dango.svg" alt="" width={24} height={24} />
        <h2 className="text-xl">Your watchlist at a glance</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<BarChart3 size={18} className="text-sky" />}
          label="Tracking"
          value={`${summary.totalStocks}`}
          subtext={`${summary.advancing} up · ${summary.declining} down`}
          className="stagger-1"
        />

        <SummaryCard
          icon={avgUp ? <TrendingUp size={18} className="text-[#1E7A55]" /> : <TrendingDown size={18} className="text-[#B0492F]" />}
          label="Avg change"
          value={pct(summary.avgChange)}
          subtext="across all positions today"
          accent={avgUp ? 'text-[#1E7A55]' : 'text-[#B0492F]'}
          className="stagger-2"
        />

        <SummaryCard
          icon={<Trophy size={18} className="text-sun" />}
          label="Today's leader"
          value={summary.leader?.ticker ?? '—'}
          subtext={summary.leader ? pct(summary.leader.change) : ''}
          className="stagger-3"
        />

        <SummaryCard
          icon={<Shield size={18} className="text-mint" />}
          label="Near support"
          value={`${summary.nearSupport}`}
          subtext={summary.nearSupport > 0 ? 'stocks approaching entry zone' : 'none at entry zone right now'}
          className="stagger-4"
        />
      </div>

      {summary.nearSupport > 0 && (
        <div className="bg-mint-soft border-[1.5px] border-[#BCE0CD] border-l-[5px] border-l-mint rounded-[14px] p-3.5 mt-3 text-sm animate-fade-in-delay">
          <div className="font-heading font-semibold text-[#1E7A55] flex items-center gap-1.5 mb-0.5">
            <AlertTriangle size={14} /> Entry zone alert
          </div>
          {summary.nearSupport} stock{summary.nearSupport > 1 ? 's are' : ' is'} trading near or within support zones.
          Scroll down to the watchlist for details — remember, support zones are context, not buy signals.
        </div>
      )}
    </section>
  );
}
