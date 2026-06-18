'use client';

import { use, useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Plus, Check } from 'lucide-react';
import StockHero from '@/components/StockHero';
import NewsSection from '@/components/NewsSection';
import MochiInsights from '@/components/MochiInsights';
import PriceChart from '@/components/PriceChart';
import MetricCard from '@/components/MetricCard';
import RangeBar from '@/components/RangeBar';
import { useStockData, isInWatchlist, addToWatchlistStorage } from '@/lib/hooks';
import { fmtPx, pct, getEntryScore, getEntryStatus, getSupportRange, statusConfig } from '@/lib/utils';

export default function StockPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(params);
  const upperTicker = ticker.toUpperCase();
  const { stock, news, priceHistory, intradayHistory, loading, refreshNews, newsRefreshing, lastNewsUpdate } = useStockData(upperTicker);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    setInWatchlist(isInWatchlist(upperTicker));
  }, [upperTicker]);

  const handleAddToWatchlist = useCallback(() => {
    addToWatchlistStorage(upperTicker);
    setInWatchlist(true);
  }, [upperTicker]);

  if (loading || !stock) {
    return (
      <div>
        <div className="fixed top-[71px] sm:top-[87px] left-0 right-0 z-40 backdrop-blur-md bg-cream/82 border-b border-line">
          <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-3 flex items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-ink transition-colors font-semibold"
            >
              <ArrowLeft size={18} />
              Back to Watchlist
            </Link>
          </div>
        </div>
        <div className="h-14" />
        <div className="space-y-4">
          <div className="skeleton h-[200px] w-full" />
          <div className="skeleton h-[120px] w-full" />
          <div className="grid grid-cols-3 gap-4">
            <div className="skeleton h-[100px]" />
            <div className="skeleton h-[100px]" />
            <div className="skeleton h-[100px]" />
          </div>
        </div>
      </div>
    );
  }

  const q = stock.quote;

  const metrics = q ? [
    { icon: '🧮', label: 'P/E Ratio', value: q.pe ? q.pe.toFixed(1) + '×' : '—', note: 'price vs yearly profit', pill: q.pe && q.pe < 25 ? { variant: 'good' as const, text: 'Reasonable' } : q.pe && q.pe > 40 ? { variant: 'watch' as const, text: 'Premium' } : undefined },
    { icon: '💰', label: 'Market Cap', value: q.market_cap ? formatCap(q.market_cap) : '—', note: 'total company value', pill: q.market_cap && q.market_cap > 1e12 ? { variant: 'good' as const, text: 'Mega-cap' } : q.market_cap && q.market_cap > 100e9 ? { variant: 'good' as const, text: 'Large-cap' } : undefined },
    { icon: '📈', label: 'Today', value: pct(q.change_pct), note: 'daily change', pill: (q.change_pct ?? 0) > 0 ? { variant: 'good' as const, text: 'Up' } : (q.change_pct ?? 0) < 0 ? { variant: 'bad' as const, text: 'Down' } : undefined },
    { icon: '📐', label: '52w High', value: fmtPx(q.week52_high), note: 'yearly peak price' },
    { icon: '📉', label: '52w Low', value: fmtPx(q.week52_low), note: 'yearly trough price' },
    { icon: '🛡️', label: 'Support High', value: fmtPx(q.support_high), note: 'upper support boundary' },
  ] : [];

  return (
    <div>
      <div className="fixed top-[71px] sm:top-[87px] left-0 right-0 z-40 backdrop-blur-md bg-cream/82 border-b border-line">
        <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted no-underline hover:text-ink transition-colors font-semibold"
          >
            <ArrowLeft size={18} />
            Back to Watchlist
          </Link>
          {!inWatchlist ? (
            <button
              onClick={handleAddToWatchlist}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold
                         border-2 border-lav bg-lav-soft text-[#6B4FA0] rounded-full px-3 py-1.5
                         cursor-pointer hover:bg-lav hover:text-white transition-all"
            >
              <Plus size={14} /> Add to Watchlist
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold
                             border-2 border-[#1E7A55]/30 bg-mint-soft text-[#1E7A55] rounded-full px-3 py-1.5">
              <Check size={14} /> In Watchlist
            </span>
          )}
        </div>
      </div>
      <div className="h-14" />

      <StockHero stock={stock} />

      {/* Entry Score Card */}
      {q && (() => {
        const sup = getSupportRange(q);
        const entryStatus = getEntryStatus(q.price ?? null, sup?.high ?? null, q.week52_high ?? null, q.week52_low ?? null);
        const entryScore = getEntryScore(q.price ?? null, sup?.high ?? null, q.week52_high ?? null, q.week52_low ?? null, q.change_pct ?? null);
        const cfg = statusConfig[entryStatus];
        const SCORE_COLORS: Record<string, { ring: string; bg: string; text: string }> = {
          lav: { ring: 'var(--lav)', bg: 'bg-lav-soft', text: 'text-[#6B4FA0]' },
          peach: { ring: 'var(--peach)', bg: 'bg-peach-soft', text: 'text-[#B0492F]' },
          muted: { ring: 'var(--grey)', bg: 'bg-cream2', text: 'text-muted' },
        };
        const c = SCORE_COLORS[entryScore.color];
        const dashLen = (entryScore.score / 10) * 107;

        return (
          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 sm:p-6 mt-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="relative w-[56px] h-[56px] flex-none">
                <svg viewBox="0 0 42 42" className="w-full h-full">
                  <circle cx="21" cy="21" r="17" fill="none" stroke="var(--line)" strokeWidth="3" />
                  <circle cx="21" cy="21" r="17" fill="none" stroke={c.ring} strokeWidth="3"
                    strokeDasharray={`${dashLen} ${107 - dashLen}`} strokeDashoffset="27" strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-heading font-bold text-base" style={{ color: c.ring }}>
                  {entryScore.score}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-semibold text-lg">Entry Score</span>
                  <span className={`inline-block text-xs font-extrabold px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                    {entryScore.label}
                  </span>
                  <span className={`inline-block text-xs font-extrabold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {cfg.emoji} {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1 mb-0">
                  Based on distance to support, 52-week position, and recent momentum. Not a buy/sell signal.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Price Chart — front and center */}
      <PriceChart data={priceHistory} intradayData={intradayHistory} />

      {/* Mochi AI Insights */}
      <MochiInsights stock={stock} news={news} />

      {/* News */}
      <NewsSection news={news} ticker={upperTicker} onRefresh={refreshNews} refreshing={newsRefreshing} lastUpdate={lastNewsUpdate} />

      {/* Financial Snapshot */}
      {metrics.length > 0 && (
        <section className="mt-8 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-xl">💪</span>
            <h2 className="text-xl">Financial snapshot</h2>
          </div>
          <p className="text-muted mb-4 max-w-3xl text-sm">
            The headline health metrics at a glance.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {metrics.map((m, i) => (
              <MetricCard key={m.label} {...m} className={`stagger-${i + 1}`} />
            ))}
          </div>

          <div className="bg-sky-soft border-[1.5px] border-[#CFE3F6] border-l-[5px] border-l-sky rounded-[14px] p-3.5 mt-4 text-sm">
            <div className="font-heading font-semibold text-sky flex items-center gap-1.5 mb-0.5">
              💡 Quick reading
            </div>
            Higher margins and ROE mean a more efficient, profitable business. A high P/E means investors expect
            strong growth. Compare these to the company&apos;s peers — one number alone never tells the story.
          </div>
        </section>
      )}

      {/* Support & Resistance */}
      {q && q.week52_low != null && q.week52_high != null && q.price != null && (
        <SupportResistanceSection
          price={q.price}
          week52Low={q.week52_low}
          week52High={q.week52_high}
          supportLow={q.support_low}
          supportHigh={q.support_high}
          priceHistory={priceHistory}
        />
      )}

      {/* Entry & Exit framework */}
      <section className="mt-8 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-xl">🧘</span>
          <h2 className="text-xl">Best time to enter & exit — the calm way</h2>
        </div>
        <p className="text-muted mb-4 max-w-3xl text-sm">
          The honest truth: nobody reliably nails the perfect price. Here are the frameworks investors actually lean on.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5">
            <h3 className="text-base mb-2.5">🪜 Entering</h3>
            <p className="text-sm m-0 mb-2.5">
              <strong>Near support</strong> is often seen as a lower-risk <em>area</em> to buy, but support can break.
              The bigger idea: <strong>dollar-cost averaging</strong> — buying a fixed amount on a regular schedule regardless of price.
            </p>
            <div className="bg-sky-soft border-[1.5px] border-[#CFE3F6] border-l-[5px] border-l-sky rounded-[14px] p-3 text-sm">
              <div className="font-heading font-semibold text-sky text-xs mb-0.5">💡 Why it helps</div>
              &ldquo;Time <em>in</em> the market usually beats <em>timing</em> the market.&rdquo;
            </div>
          </div>
          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5">
            <h3 className="text-base mb-2.5">🚪 Exiting</h3>
            <p className="text-sm m-0 mb-2.5">
              <strong>Near resistance</strong> is where some investors trim. Decide <em>why</em> you&apos;d sell <strong>before</strong> you buy, not in a panic.
            </p>
            <ul className="text-sm pl-5 m-0 space-y-1">
              <li>You need the money for a real-life goal.</li>
              <li>The reason you invested no longer holds.</li>
              <li>One stock has grown into a risky share of your savings — time to rebalance.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-card border border-dashed border-grey rounded-[18px] p-5 mt-8 text-sm text-left">
        <strong className="font-heading font-semibold text-ink">📋 Education, not advice.</strong>
        <br />
        MoneyMochi is an educational tool. It is <strong>not</strong> financial advice and contains <strong>no recommendation</strong> to buy, sell or hold.
        Stocks fall as well as rise and you can lose money. Do your own research.
      </div>
    </div>
  );
}

type Timeframe = '1W' | '2W' | '1M' | '3M' | '6M' | '1Y' | 'Custom';

const TIMEFRAME_OPTIONS: { key: Timeframe; label: string; days: number; desc: string; band: number }[] = [
  { key: '1W', label: '1W', days: 7, desc: 'Day', band: 0.30 },
  { key: '2W', label: '2W', days: 14, desc: 'Short', band: 0.28 },
  { key: '1M', label: '1M', days: 30, desc: 'Swing', band: 0.25 },
  { key: '3M', label: '3M', days: 90, desc: 'Position', band: 0.22 },
  { key: '6M', label: '6M', days: 180, desc: 'Medium', band: 0.20 },
  { key: '1Y', label: '1Y', days: 365, desc: 'Long-term', band: 0.18 },
];

const RANGE_LABELS: Record<Timeframe, string> = {
  '1W': '1-week',
  '2W': '2-week',
  '1M': '1-month',
  '3M': '3-month',
  '6M': '6-month',
  '1Y': '52-week',
  'Custom': 'Custom',
};

function SupportResistanceSection({
  price, week52Low, week52High, supportLow, supportHigh, priceHistory,
}: {
  price: number;
  week52Low: number;
  week52High: number;
  supportLow: number | null;
  supportHigh: number | null;
  priceHistory: { d: string; close: number }[];
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [customMode, setCustomMode] = useState(false);
  const [customSupportLow, setCustomSupportLow] = useState('');
  const [customSupportHigh, setCustomSupportHigh] = useState('');
  const [customResLow, setCustomResLow] = useState('');
  const [customResHigh, setCustomResHigh] = useState('');

  const rangeFromHistory = useMemo(() => {
    const result: Record<string, { low: number; high: number }> = {};
    for (const opt of TIMEFRAME_OPTIONS) {
      if (opt.key === '1Y') {
        result[opt.key] = { low: week52Low, high: week52High };
        continue;
      }
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - opt.days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const slice = priceHistory.filter(p => p.d >= cutoffStr);
      if (slice.length < 2) {
        result[opt.key] = { low: week52Low, high: week52High };
        continue;
      }
      const closes = slice.map(p => p.close);
      result[opt.key] = { low: Math.min(...closes), high: Math.max(...closes) };
    }
    return result;
  }, [priceHistory, week52Low, week52High]);

  const computed = useMemo(() => {
    if (customMode) {
      const sLo = parseFloat(customSupportLow);
      const sHi = parseFloat(customSupportHigh);
      const rLo = parseFloat(customResLow);
      const rHi = parseFloat(customResHigh);

      const range = timeframe === 'Custom'
        ? rangeFromHistory['1Y']
        : rangeFromHistory[timeframe] ?? rangeFromHistory['1Y'];

      return {
        low: range.low,
        high: range.high,
        supportLow: isNaN(sLo) ? null : sLo,
        supportHigh: isNaN(sHi) ? null : sHi,
        resistanceLow: isNaN(rLo) ? null : rLo,
        resistanceHigh: isNaN(rHi) ? null : rHi,
      };
    }

    const range = rangeFromHistory[timeframe] ?? rangeFromHistory['1Y'];
    const span = range.high - range.low;

    const opt = TIMEFRAME_OPTIONS.find(o => o.key === timeframe);
    const band = opt?.band ?? 0.18;

    if (timeframe === '1Y') {
      return {
        low: range.low,
        high: range.high,
        supportLow: supportLow ?? range.low,
        supportHigh: supportHigh ?? range.low + span * band,
        resistanceLow: range.high - span * band,
        resistanceHigh: range.high,
      };
    }

    return {
      low: range.low,
      high: range.high,
      supportLow: range.low,
      supportHigh: range.low + span * band,
      resistanceLow: range.high - span * band,
      resistanceHigh: range.high,
    };
  }, [timeframe, customMode, customSupportLow, customSupportHigh, customResLow, customResHigh, rangeFromHistory, supportLow, supportHigh]);

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    setCustomMode(false);
  };

  const activateCustom = () => {
    setCustomMode(true);
    setCustomSupportLow(computed.supportLow?.toFixed(2) ?? '');
    setCustomSupportHigh(computed.supportHigh?.toFixed(2) ?? '');
    setCustomResLow(computed.resistanceLow?.toFixed(2) ?? '');
    setCustomResHigh(computed.resistanceHigh?.toFixed(2) ?? '');
  };

  return (
    <section className="mt-8 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-xl">📐</span>
        <h2 className="text-xl">Support, resistance & entry zones</h2>
      </div>
      <p className="text-muted mb-4 max-w-3xl text-sm">
        Price <em>zones</em> where buyers (support) or sellers (resistance) have tended to show up.
        Choose a timeframe or set your own levels. Not a buy/sell signal.
      </p>
      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 sm:p-6">

        {/* Timeframe selector */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {TIMEFRAME_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleTimeframeChange(opt.key)}
              className={`font-heading font-semibold text-xs border-2 rounded-full px-3 py-1.5 cursor-pointer transition-all
                ${timeframe === opt.key && !customMode
                  ? 'border-lav bg-lav-soft text-[#6B4FA0]'
                  : 'border-line bg-card text-muted hover:border-peach hover:text-ink'}`}
            >
              {opt.desc} {opt.label}
            </button>
          ))}
          <button
            onClick={activateCustom}
            className={`font-heading font-semibold text-xs border-2 rounded-full px-3 py-1.5 cursor-pointer transition-all
              flex items-center gap-1
              ${customMode
                ? 'border-peach bg-peach-soft text-[#B0492F]'
                : 'border-line bg-card text-muted hover:border-peach hover:text-ink'}`}
          >
            <Pencil size={12} /> Custom
          </button>
        </div>

        {/* Custom inputs */}
        {customMode && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 animate-fade-in">
            <div>
              <label className="text-[0.62rem] font-bold uppercase tracking-wider text-muted mb-0.5 block">Support Low</label>
              <input
                type="number"
                step="0.01"
                value={customSupportLow}
                onChange={e => setCustomSupportLow(e.target.value)}
                placeholder="e.g. 95.00"
                className="w-full px-2.5 py-2 border-2 border-[#1E7A55]/30 rounded-xl font-heading font-semibold text-sm
                           outline-none focus:border-[#1E7A55] transition-colors bg-mint-soft/50"
              />
            </div>
            <div>
              <label className="text-[0.62rem] font-bold uppercase tracking-wider text-muted mb-0.5 block">Support High</label>
              <input
                type="number"
                step="0.01"
                value={customSupportHigh}
                onChange={e => setCustomSupportHigh(e.target.value)}
                placeholder="e.g. 100.00"
                className="w-full px-2.5 py-2 border-2 border-[#1E7A55]/30 rounded-xl font-heading font-semibold text-sm
                           outline-none focus:border-[#1E7A55] transition-colors bg-mint-soft/50"
              />
            </div>
            <div>
              <label className="text-[0.62rem] font-bold uppercase tracking-wider text-muted mb-0.5 block">Resistance Low</label>
              <input
                type="number"
                step="0.01"
                value={customResLow}
                onChange={e => setCustomResLow(e.target.value)}
                placeholder="e.g. 115.00"
                className="w-full px-2.5 py-2 border-2 border-[#B0492F]/30 rounded-xl font-heading font-semibold text-sm
                           outline-none focus:border-[#B0492F] transition-colors bg-peach-soft/50"
              />
            </div>
            <div>
              <label className="text-[0.62rem] font-bold uppercase tracking-wider text-muted mb-0.5 block">Resistance High</label>
              <input
                type="number"
                step="0.01"
                value={customResHigh}
                onChange={e => setCustomResHigh(e.target.value)}
                placeholder="e.g. 120.00"
                className="w-full px-2.5 py-2 border-2 border-[#B0492F]/30 rounded-xl font-heading font-semibold text-sm
                           outline-none focus:border-[#B0492F] transition-colors bg-peach-soft/50"
              />
            </div>
          </div>
        )}

        <RangeBar
          price={price}
          low={computed.low}
          high={computed.high}
          supportLow={computed.supportLow}
          supportHigh={computed.supportHigh}
          resistanceLow={computed.resistanceLow}
          resistanceHigh={computed.resistanceHigh}
          rangeLabel={customMode ? 'Custom' : RANGE_LABELS[timeframe]}
        />

        <div className="bg-sky-soft border-[1.5px] border-[#CFE3F6] border-l-[5px] border-l-sky rounded-[14px] p-3.5 mt-5 text-sm">
          <div className="font-heading font-semibold text-sky flex items-center gap-1.5 mb-0.5">
            💡 {timeframe === '1W' || timeframe === '2W'
              ? 'Day / short-term trading tip'
              : timeframe === '1M' || timeframe === '3M'
                ? 'Swing trading tip'
                : 'Use it as a zone, not a number'}
          </div>
          {timeframe === '1W' || timeframe === '2W'
            ? 'Very short timeframes produce tight ranges ideal for day and short-swing setups. These levels can shift quickly — check daily and combine with volume and intraday charts for best results.'
            : timeframe === '1M' || timeframe === '3M'
              ? 'Shorter timeframes give tighter support/resistance zones that suit swing trading. These levels shift as new price data comes in — revisit often.'
              : 'Different chart-watchers draw slightly different lines, so treat any level as a rough area. Moving averages are a common way to spot them.'}
        </div>
      </div>
    </section>
  );
}

function formatCap(n: number): string {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  return '$' + (n / 1e6).toFixed(0) + 'M';
}

