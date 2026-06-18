'use client';

import { fmtPx } from '@/lib/utils';

interface RangeBarProps {
  price: number;
  low: number;
  high: number;
  supportLow?: number | null;
  supportHigh?: number | null;
  resistanceLow?: number | null;
  resistanceHigh?: number | null;
  rangeLabel?: string;
}

export default function RangeBar({ price, low, high, supportLow, supportHigh, resistanceLow, resistanceHigh, rangeLabel = '52-week' }: RangeBarProps) {
  const span = high - low;
  if (span <= 0) return null;

  const position = Math.max(0, Math.min(100, ((price - low) / span) * 100));

  const supLo = supportLow ?? low;
  const supHi = supportHigh ?? low + span * 0.18;
  const resLo = resistanceLow ?? high - span * 0.18;
  const resHi = resistanceHigh ?? high;

  const bandPos = (a: number, b: number) => {
    const l = ((a - low) / span) * 100;
    const w = ((b - a) / span) * 100;
    return { left: `${Math.max(0, l)}%`, width: `${Math.max(2, w)}%` };
  };

  const supStyle = bandPos(supLo, supHi);
  const resStyle = bandPos(resLo, resHi);

  return (
    <div>
      <div className="relative h-[18px] rounded-full bg-gradient-to-r from-mint via-sun to-coral mt-6 mb-2">
        <div
          className="absolute top-0 h-[18px] rounded opacity-55"
          style={{
            ...supStyle,
            background: 'repeating-linear-gradient(45deg, #1E7A55, #1E7A55 5px, transparent 5px, transparent 10px)',
          }}
        />
        <div
          className="absolute top-0 h-[18px] rounded opacity-55"
          style={{
            ...resStyle,
            background: 'repeating-linear-gradient(45deg, #B0492F, #B0492F 5px, transparent 5px, transparent 10px)',
          }}
        />
        <div
          className="absolute -top-2 w-1.5 h-9 bg-ink rounded shadow-[0_0_0_4px_#fff]"
          style={{ left: `calc(${position}% - 3px)` }}
        />
        <div
          className="absolute -top-11 bg-ink text-white font-heading font-semibold text-xs px-2.5 py-1 rounded-lg whitespace-nowrap
                     after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2
                     after:border-[6px] after:border-transparent after:border-t-ink"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          Now {fmtPx(price)}
        </div>
      </div>
      <div className="flex justify-between text-sm text-muted mt-1.5">
        <div>
          <span className="font-heading font-bold text-ink block text-base">{fmtPx(low)}</span>
          {rangeLabel} low
        </div>
        <div className="text-right">
          <span className="font-heading font-bold text-ink block text-base">{fmtPx(high)}</span>
          {rangeLabel} high
        </div>
      </div>

      <div className="flex gap-3 mt-4 flex-wrap">
        <div className="flex-1 min-w-[220px] rounded-2xl p-3.5 border border-line bg-mint-soft">
          <h3 className="font-heading text-sm font-semibold flex items-center gap-1.5 mb-1">
            🟢 Support zone
          </h3>
          <div className="font-heading font-bold text-xl">
            {fmtPx(supLo)}–{fmtPx(supHi)}
          </div>
          <p className="text-sm text-muted mt-1">
            Lower end of the range where buyers have tended to step in.
          </p>
        </div>
        <div className="flex-1 min-w-[220px] rounded-2xl p-3.5 border border-line bg-peach-soft">
          <h3 className="font-heading text-sm font-semibold flex items-center gap-1.5 mb-1">
            🔴 Resistance zone
          </h3>
          <div className="font-heading font-bold text-xl">
            {fmtPx(resLo)}–{fmtPx(resHi)}
          </div>
          <p className="text-sm text-muted mt-1">
            Near the highs where the stock has tended to stall.
          </p>
        </div>
      </div>
    </div>
  );
}
