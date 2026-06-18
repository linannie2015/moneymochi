'use client';

import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PriceChartProps {
  data: { d: string; close: number }[];
  intradayData?: { d: string; close: number }[];
}

const PERIODS = [
  { label: '1D', days: 0, isIntraday: true },
  { label: '1W', days: 5 },
  { label: '1M', days: 22 },
  { label: '3M', days: 66 },
  { label: '6M', days: 132 },
  { label: '1Y', days: 260 },
] as const;

export default function PriceChart({ data, intradayData }: PriceChartProps) {
  const [period, setPeriod] = useState<string>('1Y');

  const chartData = useMemo(() => {
    if (period === '1D' && intradayData?.length) {
      return intradayData.map(p => ({ date: p.d, price: p.close }));
    }

    const periodDays = PERIODS.find(p => p.label === period)?.days ?? 260;
    const sliced = data.slice(-periodDays);
    return sliced.map(p => ({ date: p.d, price: p.close }));
  }, [data, intradayData, period]);

  const tickInterval = useMemo(() => {
    const len = chartData.length;
    if (period === '1D') return Math.floor(len / 6);
    if (len <= 8) return 0;
    if (len <= 25) return 4;
    if (len <= 70) return Math.floor(len / 6);
    return Math.floor(len / 7);
  }, [chartData, period]);

  if (!chartData.length) {
    return (
      <div className="text-center text-muted py-10">
        No price history available.
      </div>
    );
  }

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const priceChange = chartData.length >= 2 ? chartData[chartData.length - 1].price - chartData[0].price : 0;
  const pctChange = chartData.length >= 2 && chartData[0].price > 0
    ? (priceChange / chartData[0].price) * 100
    : 0;
  const isPositive = priceChange >= 0;
  const strokeColor = isPositive ? '#4F9A78' : '#C9604F';
  const gradId = isPositive ? 'priceGradUp' : 'priceGradDown';

  const isIntraday = period === '1D';

  return (
    <section className="mt-8 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-1.5">
        <span className="text-xl">📊</span>
        <h2 className="text-xl">Price history</h2>
      </div>
      <p className="text-muted mb-4 max-w-3xl text-sm">
        {isIntraday
          ? "Today's intraday price action — 5-minute intervals during market hours."
          : 'Daily closing prices — the real trend behind the support & resistance zones.'}
      </p>
      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={`font-heading font-bold text-lg ${isPositive ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
              {isPositive ? '▲' : '▼'} ${Math.abs(priceChange).toFixed(2)}
            </span>
            <span className={`font-extrabold text-xs ${isPositive ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
              {isPositive ? '+' : ''}{pctChange.toFixed(2)}%
            </span>
            <span className="text-xs text-muted">
              {isIntraday ? 'today' : `over ${period}`}
            </span>
          </div>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button
                key={p.label}
                onClick={() => setPeriod(p.label)}
                className={`font-heading font-semibold text-xs px-3 py-1.5 rounded-full border-2 cursor-pointer transition-all
                  ${period === p.label
                    ? 'bg-ink text-white border-ink'
                    : 'bg-transparent text-muted border-line hover:border-peach hover:text-ink'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--line)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontFamily: 'Hanken Grotesk', fill: '#9A8F87' }}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
              tickFormatter={(v: string) => {
                if (isIntraday) {
                  const parts = v.split(' ');
                  const time = parts[1] ?? '';
                  return time.slice(0, 5);
                }
                const d = new Date(v + 'T00:00:00');
                if (period === '1W') {
                  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                }
                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: 'Hanken Grotesk', fill: '#9A8F87' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              domain={[minPrice * 0.98, maxPrice * 1.02]}
              width={55}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--ink)',
                border: 'none',
                borderRadius: '14px',
                padding: '10px 14px',
                color: '#fff',
                fontFamily: 'Hanken Grotesk',
                fontSize: '13px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
              labelFormatter={(label) => {
                const s = String(label);
                if (isIntraday) {
                  const parts = s.split(' ');
                  const time = parts[1] ?? '';
                  return `Today at ${time.slice(0, 5)}`;
                }
                return new Date(s + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                });
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: strokeColor, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
