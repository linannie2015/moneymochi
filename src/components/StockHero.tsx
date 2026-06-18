'use client';

import { fmtPx, fmtMoney, pct } from '@/lib/utils';
import type { StockWithQuote } from '@/lib/types';

interface StockHeroProps {
  stock: StockWithQuote;
}

export default function StockHero({ stock }: StockHeroProps) {
  const q = stock.quote;
  const price = q?.price;
  const changePct = q?.change_pct;
  const up = (changePct ?? 0) >= 0;

  const chips: [string, string][] = [];
  if (q?.market_cap) chips.push([fmtMoney(q.market_cap), 'Market cap']);
  if (q?.pe) chips.push([q.pe.toFixed(1) + '×', 'P/E (TTM)']);
  if (q?.change_pct != null) chips.push([pct(q.change_pct), 'Today']);
  if (q?.week52_high) chips.push([fmtPx(q.week52_high), '52w high']);
  if (q?.week52_low) chips.push([fmtPx(q.week52_low), '52w low']);

  return (
    <div className="bg-card rounded-[var(--r)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-lg)] p-6 sm:p-7 relative overflow-hidden border border-line animate-slide-up transition-shadow duration-300">
      <div className="flex items-center gap-3.5 flex-wrap">
        <div
          className="w-14 h-14 rounded-[18px] grid place-items-center font-heading font-bold text-2xl text-white flex-none"
          style={{
            background: 'conic-gradient(from 200deg, #5E7FA3, #C9604F, #CF9A3A, #4F9A78, #5E7FA3)',
          }}
        >
          {stock.ticker[0]}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl flex items-center gap-2 flex-wrap">
            {stock.name || stock.ticker}
            <span className="inline-block bg-ink text-white font-heading font-semibold rounded-lg px-2.5 py-0.5 text-xs align-middle">
              {stock.ticker}
            </span>
            {stock.is_etf && (
              <span className="inline-block bg-lav text-white font-heading font-semibold rounded-lg px-2.5 py-0.5 text-xs">
                ETF
              </span>
            )}
          </h1>
          <div className="text-muted text-sm mt-0.5">
            {stock.is_etf ? 'Exchange-Traded Fund' : 'Equity'} · USD
          </div>
        </div>
      </div>

      <div className="flex gap-5 items-end mt-5 flex-wrap">
        <div>
          <div className="font-heading font-bold text-4xl sm:text-5xl tracking-tight tnum">
            {fmtPx(price)}
          </div>
          {changePct != null && (
            <span
              className={`inline-block font-extrabold text-sm px-3 py-1 rounded-full mt-1
                ${up ? 'bg-mint-soft text-[#1E7A55]' : 'bg-peach-soft text-[#B0492F]'}`}
            >
              {up ? '▲' : '▼'} {pct(changePct)} today
            </span>
          )}
        </div>
        <div className="ml-auto text-right text-muted text-xs">
          📅 {q?.as_of ? new Date(q.as_of).toLocaleDateString() : 'N/A'}
          <br />prices in USD
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap mt-5">
        {chips.map(([val, label]) => (
          <div key={label} className="bg-cream2 rounded-[14px] px-3.5 py-2 text-sm">
            <span className="font-heading font-semibold block text-base tnum">{val}</span>
            <span className="text-muted text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
