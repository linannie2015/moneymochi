import type { EntryStatus, Quote } from './types';

export function fmtMoney(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  if (Math.abs(n) >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + n.toFixed(2);
}

export function fmtPx(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  return '$' + Number(n).toFixed(2);
}

export function pct(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  return (n > 0 ? '+' : '') + Number(n).toFixed(2) + '%';
}

export function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getEntryStatus(
  price: number | null,
  supportHigh: number | null,
  week52High: number | null,
  week52Low: number | null,
): EntryStatus {
  if (price == null || supportHigh == null) return 'mid-range';
  if (price <= supportHigh) return 'in-zone';
  if (price <= supportHigh * 1.07) return 'approaching';
  if (week52High != null && week52Low != null) {
    const range = week52High - week52Low;
    if (price >= week52High - 0.08 * range) return 'near-highs';
  }
  return 'mid-range';
}

export function getRangePosition(
  price: number | null,
  low: number | null,
  high: number | null,
): number | null {
  if (price == null || low == null || high == null || high === low) return null;
  return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
}

export function getSupportRange(
  quote: Quote | null,
): { low: number; high: number } | null {
  if (!quote) return null;
  if (quote.support_low != null && quote.support_high != null) {
    return { low: quote.support_low, high: quote.support_high };
  }
  if (quote.week52_low != null && quote.week52_high != null) {
    const span = quote.week52_high - quote.week52_low;
    return {
      low: quote.week52_low,
      high: quote.week52_low + span * 0.18,
    };
  }
  return null;
}

export type WatchlistTimeframe = '1W' | '2W' | '1M' | '3M' | '6M' | '1Y';

const TIMEFRAME_BANDS: Record<WatchlistTimeframe, number> = {
  '1W': 0.30, '2W': 0.28, '1M': 0.25, '3M': 0.22, '6M': 0.20, '1Y': 0.18,
};

export function getSupportRangeForTimeframe(
  quote: Quote | null,
  tf: WatchlistTimeframe,
): { low: number; high: number } | null {
  if (!quote || quote.week52_low == null || quote.week52_high == null) return null;
  if (tf === '1Y') return getSupportRange(quote);
  const span = quote.week52_high - quote.week52_low;
  const band = TIMEFRAME_BANDS[tf];
  return { low: quote.week52_low, high: quote.week52_low + span * band };
}

export function getEntryScore(
  price: number | null,
  supportHigh: number | null,
  week52High: number | null,
  week52Low: number | null,
  changePct: number | null,
): { score: number; label: string; color: 'lav' | 'peach' | 'muted' } {
  if (price == null || supportHigh == null || week52High == null || week52Low == null) {
    return { score: 5, label: 'No data', color: 'muted' };
  }

  const range = week52High - week52Low;
  if (range <= 0) return { score: 5, label: 'Flat', color: 'muted' };

  const posInRange = ((price - week52Low) / range) * 100;
  const distToSupport = supportHigh > 0 ? ((price - supportHigh) / supportHigh) * 100 : 50;
  const momentum = changePct ?? 0;

  let raw = 0;
  // Closer to support = higher score (more favorable)
  if (distToSupport <= 0) raw += 4;
  else if (distToSupport <= 5) raw += 3.5;
  else if (distToSupport <= 15) raw += 2.5;
  else if (distToSupport <= 30) raw += 1.5;
  else raw += 0.5;

  // Lower in 52w range = higher score
  if (posInRange <= 25) raw += 3.5;
  else if (posInRange <= 40) raw += 3;
  else if (posInRange <= 60) raw += 2;
  else if (posInRange <= 80) raw += 1;
  else raw += 0.5;

  // Negative momentum = slightly favorable for entry (dip buying)
  if (momentum <= -2) raw += 2;
  else if (momentum <= -0.5) raw += 1.5;
  else if (momentum <= 0.5) raw += 1;
  else raw += 0.5;

  const score = Math.max(1, Math.min(10, Math.round(raw)));

  let label: string;
  let color: 'lav' | 'peach' | 'muted';
  if (score >= 7) { label = 'Favorable'; color = 'lav'; }
  else if (score >= 4) { label = 'Neutral'; color = 'muted'; }
  else { label = 'Stretched'; color = 'peach'; }

  return { score, label, color };
}

export const statusConfig: Record<EntryStatus, { label: string; emoji: string; bg: string; text: string; dot: string }> = {
  'in-zone': { label: 'In support zone', emoji: '●', bg: 'bg-mint-soft', text: 'text-[#1E7A55]', dot: '#3F9A6E' },
  'approaching': { label: 'Approaching', emoji: '●', bg: 'bg-sun-soft', text: 'text-[#A06A00]', dot: '#CF9A3A' },
  'near-highs': { label: 'Near highs', emoji: '●', bg: 'bg-[#F8E2DD]', text: 'text-[#B0492F]', dot: '#C9604F' },
  'mid-range': { label: 'Mid-range', emoji: '●', bg: 'bg-[#F1ECE5]', text: 'text-[#6B6058]', dot: '#B7A99D' },
};
