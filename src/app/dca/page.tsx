'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ArrowLeft,
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
  PiggyBank,
  Target,
  Coins,
} from 'lucide-react';
import { DEMO_STOCKS } from '@/lib/demo-data';
import { fmtPx } from '@/lib/utils';
import TickerSearch from '@/components/TickerSearch';

const HORIZONS = [
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '2 years', months: 24 },
  { label: '3 years', months: 36 },
  { label: '5 years', months: 60 },
  { label: '10 years', months: 120 },
] as const;

const HISTORICAL_RETURNS: Record<string, { annualized: number; label: string }> = {
  VOO:   { annualized: 10.3, label: 'S&P 500 avg ~10.3%' },
  SPY:   { annualized: 10.3, label: 'S&P 500 avg ~10.3%' },
  QQQM:  { annualized: 14.5, label: 'Nasdaq-100 avg ~14.5%' },
  QQQ:   { annualized: 14.5, label: 'Nasdaq-100 avg ~14.5%' },
  GOOGL: { annualized: 22.0, label: 'GOOGL 10yr avg ~22%' },
  MSFT:  { annualized: 26.0, label: 'MSFT 10yr avg ~26%' },
  META:  { annualized: 23.0, label: 'META 10yr avg ~23%' },
  AMZN:  { annualized: 25.0, label: 'AMZN 10yr avg ~25%' },
  AMD:   { annualized: 45.0, label: 'AMD 10yr avg ~45%' },
  NVDA:  { annualized: 60.0, label: 'NVDA 10yr avg ~60%' },
  AAPL:  { annualized: 28.0, label: 'AAPL 10yr avg ~28%' },
  RKLB:  { annualized: 15.0, label: 'RKLB est ~15%' },
  MU:    { annualized: 18.0, label: 'MU 10yr avg ~18%' },
  MSTR:  { annualized: 30.0, label: 'MSTR 5yr avg ~30%' },
};

const BENCHMARK_PRESETS = [
  { label: 'Conservative', rate: 6, desc: 'Bond-like' },
  { label: 'S&P 500', rate: 10, desc: 'Historical avg' },
  { label: 'Nasdaq', rate: 14, desc: 'Growth index' },
  { label: 'Aggressive', rate: 20, desc: 'High growth' },
];

export default function DCAPage() {
  const [selectedTicker, setSelectedTicker] = useState('VOO');
  const [monthlyInvestment, setMonthlyInvestment] = useState(500);
  const [horizonMonths, setHorizonMonths] = useState(60);
  const [annualReturn, setAnnualReturn] = useState(10);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const selectedStock = useMemo(
    () => DEMO_STOCKS.find(s => s.ticker === selectedTicker) ?? DEMO_STOCKS[4],
    [selectedTicker],
  );

  const historicalReturn = HISTORICAL_RETURNS[selectedTicker] ?? null;
  const currentPrice = selectedStock.quote?.price ?? 100;

  const results = useMemo(() => {
    const r = annualReturn / 100 / 12;
    const n = horizonMonths;
    const pmt = monthlyInvestment;
    const totalInvested = pmt * n;

    let projectedValue: number;
    if (r === 0) {
      projectedValue = totalInvested;
    } else {
      projectedValue = pmt * ((Math.pow(1 + r, n) - 1) / r);
    }

    const projectedGain = projectedValue - totalInvested;
    const sharesAccumulated = totalInvested / currentPrice;

    return { totalInvested, projectedValue, projectedGain, sharesAccumulated };
  }, [monthlyInvestment, horizonMonths, annualReturn, currentPrice]);

  const chartData = useMemo(() => {
    const r = annualReturn / 100 / 12;
    const pmt = monthlyInvestment;
    const points: { label: string; invested: number; value: number }[] = [];

    for (let m = 0; m <= horizonMonths; m++) {
      let invested = pmt * m;
      let value: number;
      if (r === 0) {
        value = invested;
      } else {
        value = m === 0 ? 0 : pmt * ((Math.pow(1 + r, m) - 1) / r);
      }

      let label: string;
      if (horizonMonths <= 12) {
        label = `Mo ${m}`;
      } else if (m % 12 === 0) {
        label = m === 0 ? 'Start' : `Yr ${m / 12}`;
      } else if (horizonMonths <= 36 && m % 3 === 0) {
        label = `Mo ${m}`;
      } else if (horizonMonths <= 60 && m % 6 === 0) {
        label = `Mo ${m}`;
      } else if (m % 12 === 0) {
        label = `Yr ${m / 12}`;
      } else {
        label = '';
      }

      points.push({
        label: label || `Mo ${m}`,
        invested: Math.round(invested * 100) / 100,
        value: Math.round(value * 100) / 100,
      });
    }

    return points;
  }, [monthlyInvestment, horizonMonths, annualReturn]);

  const filteredChartData = useMemo(() => {
    if (horizonMonths <= 12) return chartData;
    if (horizonMonths <= 36) return chartData.filter((_, i) => i % 3 === 0 || i === chartData.length - 1);
    if (horizonMonths <= 60) return chartData.filter((_, i) => i % 6 === 0 || i === chartData.length - 1);
    return chartData.filter((_, i) => i % 12 === 0 || i === chartData.length - 1);
  }, [chartData, horizonMonths]);

  const breakdownRows = useMemo(() => {
    const r = annualReturn / 100 / 12;
    const pmt = monthlyInvestment;
    const rows: {
      month: number;
      deposit: number;
      sharePrice: number;
      sharesBought: number;
      totalShares: number;
      portfolioValue: number;
    }[] = [];

    let totalShares = 0;
    const maxRows = Math.min(horizonMonths, 24);

    for (let m = 1; m <= maxRows; m++) {
      const sharePrice = currentPrice * Math.pow(1 + r, m);
      const sharesBought = pmt / sharePrice;
      totalShares += sharesBought;
      const portfolioValue = totalShares * sharePrice;

      rows.push({
        month: m,
        deposit: pmt,
        sharePrice,
        sharesBought,
        totalShares,
        portfolioValue,
      });
    }

    return rows;
  }, [monthlyInvestment, horizonMonths, annualReturn, currentPrice]);

  const maxChartVal = useMemo(
    () => Math.max(...filteredChartData.map(d => Math.max(d.invested, d.value))),
    [filteredChartData],
  );

  return (
    <div className="max-w-3xl mx-auto">
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

      <div className="bg-card rounded-[var(--r)] shadow-[var(--shadow)] p-6 border border-line animate-slide-up">
        <h1 className="text-2xl flex items-center gap-2.5 mb-2">
          <Calculator className="text-lav" size={28} />
          DCA Calculator
        </h1>
        <p className="text-sm text-muted m-0 mb-6">
          See how regular investing could grow over time. Adjust the inputs and watch the
          projections update instantly.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Stock
            </label>
            <TickerSearch
              value={selectedTicker}
              onChange={setSelectedTicker}
              onSelect={(ticker) => {
                setSelectedTicker(ticker);
                const hist = HISTORICAL_RETURNS[ticker];
                if (hist) setAnnualReturn(Math.round(hist.annualized));
              }}
              placeholder="Search stock..."
            />
            {historicalReturn && (
              <div className="text-[11px] text-lav font-semibold mt-1.5 flex items-center gap-1">
                <TrendingUp size={12} />
                {historicalReturn.label}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Monthly investment
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">$</span>
              <input
                type="number"
                min={1}
                step={50}
                value={monthlyInvestment}
                onChange={e => setMonthlyInvestment(Math.max(1, Number(e.target.value)))}
                className="w-full pl-7 pr-3.5 py-2.5 border-2 border-line rounded-xl font-body text-sm outline-none focus:border-peach transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Time horizon
            </label>
            <select
              value={horizonMonths}
              onChange={e => setHorizonMonths(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border-2 border-line rounded-xl font-body text-sm outline-none focus:border-peach transition-colors bg-card appearance-none cursor-pointer"
            >
              {HORIZONS.map(h => (
                <option key={h.months} value={h.months}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
              Expected annual return: {annualReturn}%
            </label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {BENCHMARK_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setAnnualReturn(p.rate)}
                  className={`text-[11px] font-heading font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer
                    ${annualReturn === p.rate
                      ? 'bg-lav-soft border-lav text-[#6B4FA0]'
                      : 'bg-cream2 border-line text-muted hover:border-lav'}`}
                >
                  {p.label} {p.rate}%
                </button>
              ))}
              {historicalReturn && !BENCHMARK_PRESETS.some(p => p.rate === Math.round(historicalReturn.annualized)) && (
                <button
                  onClick={() => setAnnualReturn(Math.round(historicalReturn.annualized))}
                  className={`text-[11px] font-heading font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer
                    ${annualReturn === Math.round(historicalReturn.annualized)
                      ? 'bg-lav-soft border-lav text-[#6B4FA0]'
                      : 'bg-cream2 border-line text-lav hover:border-lav'}`}
                >
                  {selectedTicker} {Math.round(historicalReturn.annualized)}%
                </button>
              )}
            </div>
            <input
              type="range"
              min={-10}
              max={50}
              step={1}
              value={annualReturn}
              onChange={e => setAnnualReturn(Number(e.target.value))}
              className="w-full accent-[#B79CE0]"
            />
            <div className="flex justify-between text-[10px] text-muted font-semibold mt-0.5">
              <span>-10%</span>
              <span>0%</span>
              <span>10%</span>
              <span>20%</span>
              <span>30%</span>
              <span>50%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 animate-fade-in">
        <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4">
          <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-1">
            <PiggyBank size={16} /> Total Invested
          </div>
          <div className="text-2xl font-heading font-bold">
            ${results.totalInvested.toLocaleString()}
          </div>
          <div className="text-xs text-muted mt-0.5">
            ${monthlyInvestment.toLocaleString()}/mo for{' '}
            {horizonMonths >= 12
              ? `${(horizonMonths / 12).toFixed(horizonMonths % 12 === 0 ? 0 : 1)} yr`
              : `${horizonMonths} mo`}
          </div>
        </div>

        <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4">
          <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-1">
            <Target size={16} /> Projected Value
          </div>
          <div className="text-2xl font-heading font-bold text-[#6B44B8]">
            ${Math.round(results.projectedValue).toLocaleString()}
          </div>
          <div className="text-xs text-muted mt-0.5">at {annualReturn}% annual return</div>
        </div>

        <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4">
          <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp size={16} /> Projected Gain
          </div>
          <div className={`text-2xl font-heading font-bold ${results.projectedGain >= 0 ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
            {results.projectedGain >= 0 ? '+' : ''}${Math.round(results.projectedGain).toLocaleString()}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {results.totalInvested > 0
              ? `${((results.projectedGain / results.totalInvested) * 100).toFixed(1)}% total return`
              : 'no investment'}
          </div>
        </div>

        <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4">
          <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-1">
            <Coins size={16} /> Shares Accumulated
          </div>
          <div className="text-2xl font-heading font-bold">
            {results.sharesAccumulated.toFixed(2)}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {selectedTicker} at {fmtPx(currentPrice)}/share
          </div>
        </div>
      </div>

      <section className="mt-6 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-xl">📈</span>
          <h2 className="text-xl">Growth projection</h2>
        </div>
        <p className="text-muted mb-4 max-w-3xl text-sm">
          The lavender curve shows projected compound growth; the grey line is your total deposits.
        </p>
        <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={filteredChartData} margin={{ top: 10, right: 10, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="dcaGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B79CE0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#B79CE0" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8DFD6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fontFamily: 'Hanken Grotesk', fill: '#9A8F87' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: 'Hanken Grotesk', fill: '#9A8F87' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000000
                    ? `$${(v / 1000000).toFixed(1)}M`
                    : v >= 1000
                      ? `$${(v / 1000).toFixed(0)}K`
                      : `$${v.toFixed(0)}`
                }
                domain={[0, maxChartVal * 1.1]}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: '#33302C',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontFamily: 'Hanken Grotesk',
                  fontSize: '13px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}
                formatter={(value, name) => [
                  `$${Math.round(Number(value)).toLocaleString()}`,
                  name === 'value' ? 'Projected Value' : 'Total Invested',
                ]}
              />
              <Area
                type="monotone"
                dataKey="invested"
                stroke="#C9BBB0"
                strokeWidth={2}
                fill="transparent"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#B79CE0"
                strokeWidth={2.5}
                fill="url(#dcaGrowthGrad)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#B79CE0', fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-muted font-heading">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-[3px] rounded-full bg-[#B79CE0]" />
              Projected value
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-[3px] rounded-full bg-[#C9BBB0]" />
              Total invested
            </span>
          </div>
        </div>
      </section>

      <div className="bg-sky-soft border-[1.5px] border-[#CFE3F6] border-l-[5px] border-l-sky rounded-[14px] p-3.5 mt-5 text-sm">
        <div className="font-heading font-semibold text-sky flex items-center gap-1.5 mb-0.5">
          <DollarSign size={16} />
          What is dollar-cost averaging?
        </div>
        By investing a fixed amount on a regular schedule, you buy more shares when prices are low
        and fewer when prices are high. Over time, this can lower your average cost per share. It
        removes the stress of trying to &ldquo;time the market.&rdquo;
      </div>

      <section className="mt-6 animate-fade-in">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] px-5 py-3.5 cursor-pointer hover:border-peach transition-colors"
        >
          <span className="flex items-center gap-2 font-heading font-semibold text-sm">
            <Calendar size={16} className="text-muted" />
            {showBreakdown ? 'Hide' : 'Show'} monthly breakdown
          </span>
          {showBreakdown ? (
            <ChevronUp size={18} className="text-muted" />
          ) : (
            <ChevronDown size={18} className="text-muted" />
          )}
        </button>

        {showBreakdown && (
          <div className="bg-card border border-line border-t-0 rounded-b-[var(--r)] shadow-[var(--shadow-sm)] overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="bg-cream2 text-muted text-xs font-heading font-semibold uppercase tracking-wider">
                    <th className="text-left px-4 py-2.5">Month</th>
                    <th className="text-right px-4 py-2.5">Deposit</th>
                    <th className="text-right px-4 py-2.5">Est. Price</th>
                    <th className="text-right px-4 py-2.5">Shares</th>
                    <th className="text-right px-4 py-2.5">Total Shares</th>
                    <th className="text-right px-4 py-2.5">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownRows.map(row => (
                    <tr key={row.month} className="border-t border-line hover:bg-cream2/50 transition-colors">
                      <td className="px-4 py-2 font-heading font-semibold">{row.month}</td>
                      <td className="px-4 py-2 text-right">${row.deposit.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">{fmtPx(row.sharePrice)}</td>
                      <td className="px-4 py-2 text-right">{row.sharesBought.toFixed(4)}</td>
                      <td className="px-4 py-2 text-right font-semibold">{row.totalShares.toFixed(4)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-[#6B44B8]">
                        ${Math.round(row.portfolioValue).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {horizonMonths > 24 && (
              <div className="px-4 py-3 text-xs text-muted text-center border-t border-line bg-cream2/30">
                Showing first 24 of {horizonMonths} months. The full projection is reflected in the
                chart and summary cards above.
              </div>
            )}
          </div>
        )}
      </section>

      <div className="bg-card border border-dashed border-grey rounded-[18px] p-5 mt-8 text-sm text-left">
        <strong className="font-heading font-semibold text-ink">Education, not advice.</strong>
        <br />
        This calculator uses a fixed annual return assumption and does not account for fees,
        inflation, taxes, or price volatility. Real returns will differ. MoneyMochi is an
        educational tool &mdash; <strong>not</strong> financial advice.
      </div>
    </div>
  );
}
