'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, X, ChevronUp, ChevronDown, Search, Loader2 } from 'lucide-react';
import { fmtPx, pct, getEntryStatus, getEntryScore, getRangePosition, getSupportRange, getSupportRangeForTimeframe, statusConfig } from '@/lib/utils';
import type { WatchlistTimeframe } from '@/lib/utils';
import { searchSymbols, hasApiKeys } from '@/lib/api';
import { DEMO_STOCKS, generateDemoPriceHistory } from '@/lib/demo-data';
import type { StockWithQuote, EntryStatus } from '@/lib/types';

interface WatchlistTableProps {
  stocks: StockWithQuote[];
  onAdd?: (ticker: string) => void;
  onRemove?: (ticker: string) => void;
}

type SortKey = 'ticker' | 'price' | 'change' | 'range' | 'support' | 'score';
type SortDir = 'asc' | 'desc';

const SCORE_COLORS = {
  lav: { ring: 'var(--lav)', bg: 'bg-lav-soft', text: 'text-[#6B4FA0]' },
  peach: { ring: 'var(--peach)', bg: 'bg-peach-soft', text: 'text-[#B0492F]' },
  muted: { ring: 'var(--grey)', bg: 'bg-cream2', text: 'text-muted' },
};

function EntryCell({ price, supportHigh, week52High, week52Low, changePct, entryStatus, compact }: {
  price: number | null; supportHigh: number | null; week52High: number | null; week52Low: number | null; changePct: number | null; entryStatus: EntryStatus; compact?: boolean;
}) {
  const { score, color } = getEntryScore(price, supportHigh, week52High, week52Low, changePct);
  const c = SCORE_COLORS[color];
  const cfg = statusConfig[entryStatus];
  const dashLen = (score / 10) * 107;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-[38px] h-[38px] flex-none" title={`Entry score: ${score}/10`}>
        <svg viewBox="0 0 42 42" className="w-full h-full">
          <circle cx="21" cy="21" r="17" fill="none" stroke="var(--line)" strokeWidth="3" />
          <circle cx="21" cy="21" r="17" fill="none" stroke={c.ring} strokeWidth="3"
            strokeDasharray={`${dashLen} ${107 - dashLen}`} strokeDashoffset="27" strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-heading font-bold text-xs" style={{ color: c.ring }}>
          {score}
        </span>
      </div>
      {compact ? (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${cfg.bg}`} title={cfg.label}>
          <span className="w-[7px] h-[7px] rounded-full" style={{ background: cfg.dot }} />
        </span>
      ) : (
        <span className={`inline-flex items-center gap-1.5 text-[0.75rem] font-bold px-3 py-1 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
          <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      )}
    </div>
  );
}

const SEARCH_UNIVERSE = DEMO_STOCKS.map(s => ({ ticker: s.ticker, name: s.name || s.ticker }));

export default function WatchlistTable({ stocks, onAdd, onRemove }: WatchlistTableProps) {
  const [addInput, setAddInput] = useState('');
  const [searchResults, setSearchResults] = useState<{ ticker: string; name: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [sortKey, setSortKey] = useState<SortKey>('ticker');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [timeframe, setTimeframe] = useState<WatchlistTimeframe>('1Y');
  const [isScrolled, setIsScrolled] = useState(false);
  const [pullReveal, setPullReveal] = useState(0);
  const pullRef = useRef<{ startX: number; active: boolean }>({ startX: 0, active: false });

  const TF_OPTIONS: { key: WatchlistTimeframe; label: string; days: number; band: number }[] = [
    { key: '1W', label: 'Day', days: 7, band: 0.30 },
    { key: '2W', label: 'Short', days: 14, band: 0.28 },
    { key: '1M', label: 'Swing', days: 30, band: 0.25 },
    { key: '3M', label: 'Position', days: 90, band: 0.22 },
    { key: '6M', label: 'Medium', days: 180, band: 0.20 },
    { key: '1Y', label: 'Long-term', days: 365, band: 0.18 },
  ];

  const priceHistoryMap = useMemo(() => {
    const map: Record<string, { d: string; close: number }[]> = {};
    for (const s of stocks) {
      map[s.ticker] = generateDemoPriceHistory(s.ticker);
    }
    return map;
  }, [stocks]);

  const getSupportForStock = useCallback((ticker: string, q: StockWithQuote['quote'], tf: WatchlistTimeframe) => {
    if (!q || q.week52_low == null || q.week52_high == null) return null;
    if (tf === '1Y') return getSupportRange(q);

    const history = priceHistoryMap[ticker];
    if (!history || history.length < 2) return getSupportRangeForTimeframe(q, tf);

    const opt = TF_OPTIONS.find(o => o.key === tf);
    if (!opt) return getSupportRangeForTimeframe(q, tf);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - opt.days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const slice = history.filter(p => p.d >= cutoffStr);

    if (slice.length < 2) return getSupportRangeForTimeframe(q, tf);

    const closes = slice.map(p => p.close);
    const lo = Math.min(...closes);
    const hi = Math.max(...closes);
    const span = hi - lo;

    return { low: lo, high: lo + span * opt.band };
  }, [priceHistoryMap]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      setIsScrolled((el as HTMLDivElement).scrollLeft > 0);
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const onPullStart = useCallback((e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (el && el.scrollLeft <= 1) {
      pullRef.current = { startX: e.touches[0].clientX, active: true };
    } else {
      pullRef.current.active = false;
    }
  }, []);

  const onPullMove = useCallback((e: React.TouchEvent) => {
    if (!pullRef.current.active) return;
    const el = scrollRef.current;
    if (!el || el.scrollLeft > 1) {
      pullRef.current.active = false;
      setPullReveal(0);
      return;
    }
    const dx = e.touches[0].clientX - pullRef.current.startX;
    if (dx > 5) {
      setPullReveal(Math.min((dx - 5) * 0.5, 80));
    }
  }, []);

  const onPullEnd = useCallback(() => {
    pullRef.current.active = false;
    setPullReveal(0);
  }, []);

  const handleSearchInput = useCallback((q: string) => {
    setAddInput(q);
    setActiveIdx(-1);

    if (!q.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const lower = q.toLowerCase();
    const local = SEARCH_UNIVERSE.filter(
      s => s.ticker.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower)
    ).filter(s => !stocks.some(st => st.ticker === s.ticker));
    setSearchResults(local);
    setShowDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (hasApiKeys() && q.trim().length >= 2) {
      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        const api = await searchSymbols(q.trim());
        const merged = [...local];
        for (const r of api) {
          if (!merged.some(m => m.ticker === r.ticker) && !stocks.some(s => s.ticker === r.ticker)) {
            merged.push(r);
          }
        }
        setSearchResults(merged.slice(0, 8));
        setSearching(false);
      }, 300);
    }
  }, [stocks]);

  const handleAddFromSearch = useCallback((ticker: string) => {
    if (onAdd) onAdd(ticker);
    setAddInput('');
    setShowDropdown(false);
    setSearchResults([]);
  }, [onAdd]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && searchResults[activeIdx]) {
        handleAddFromSearch(searchResults[activeIdx].ticker);
      } else if (addInput.trim()) {
        handleAddFromSearch(addInput.trim().toUpperCase());
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const sortedStocks = useMemo(() => {
    const arr = [...stocks];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'ticker':
          cmp = a.ticker.localeCompare(b.ticker);
          break;
        case 'price':
          cmp = (a.quote?.price ?? 0) - (b.quote?.price ?? 0);
          break;
        case 'change':
          cmp = (a.quote?.change_pct ?? 0) - (b.quote?.change_pct ?? 0);
          break;
        case 'range':
          cmp = (getRangePosition(a.quote?.price ?? null, a.quote?.week52_low ?? null, a.quote?.week52_high ?? null) ?? 50)
              - (getRangePosition(b.quote?.price ?? null, b.quote?.week52_low ?? null, b.quote?.week52_high ?? null) ?? 50);
          break;
        case 'support': {
          const supA = getSupportForStock(a.ticker, a.quote, timeframe);
          const supB = getSupportForStock(b.ticker, b.quote, timeframe);
          cmp = (supA?.high ?? 0) - (supB?.high ?? 0);
          break;
        }
        case 'score': {
          const scoreA = getEntryScore(a.quote?.price ?? null, getSupportForStock(a.ticker, a.quote, timeframe)?.high ?? null, a.quote?.week52_high ?? null, a.quote?.week52_low ?? null, a.quote?.change_pct ?? null);
          const scoreB = getEntryScore(b.quote?.price ?? null, getSupportForStock(b.ticker, b.quote, timeframe)?.high ?? null, b.quote?.week52_high ?? null, b.quote?.week52_low ?? null, b.quote?.change_pct ?? null);
          cmp = scoreA.score - scoreB.score;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [stocks, sortKey, sortDir, timeframe, getSupportForStock]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'change' ? 'desc' : 'asc');
    }
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: 'ticker', label: 'Stock' },
    { key: 'price', label: 'Price' },
    { key: 'change', label: 'Today' },
    { key: 'range', label: '52-week range' },
    { key: 'support', label: 'Support' },
    { key: 'score', label: 'Entry' },
  ];

  return (
    <div className="animate-slide-up">
      <section>
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="text-xl">👀</span>
          <h2 className="text-xl">At a glance</h2>
        </div>
        <p className="text-muted mb-3 max-w-3xl text-sm">
          Price, today&apos;s move, where each sits in its 52-week range, its support level, and an <strong>&quot;entry&quot;</strong> read.
          This is context, <strong>not a buy signal</strong>.
        </p>

        {/* Timeframe toggle */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">View:</span>
          {TF_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setTimeframe(opt.key)}
              className={`font-heading font-semibold text-[0.7rem] border-2 rounded-full px-2.5 py-1 cursor-pointer transition-all
                ${timeframe === opt.key
                  ? 'border-lav bg-lav-soft text-[#6B4FA0]'
                  : 'border-line bg-card text-muted hover:border-peach hover:text-ink'}`}
            >
              {opt.label} {opt.key}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-3 flex-wrap mb-3 text-xs">
          {(['in-zone', 'approaching', 'near-highs', 'mid-range'] as const).map(status => {
            const cfg = statusConfig[status];
            return (
              <span key={status} className={`inline-flex items-center gap-1.5 text-[0.75rem] font-bold px-3 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                <span className="w-[7px] h-[7px] rounded-full" style={{ background: cfg.dot }} />
                {cfg.label}
              </span>
            );
          })}
        </div>

        {/* Add bar with autocomplete */}
        <div ref={dropdownRef} className="relative mb-4 max-w-[360px]">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </span>
              <input
                value={addInput}
                onChange={e => handleSearchInput(e.target.value)}
                onFocus={() => { if (addInput.trim()) handleSearchInput(addInput); }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search stock to add..."
                className="w-full pl-9 pr-3 py-2.5 border-2 border-line rounded-xl
                           font-body text-sm outline-none focus:border-peach transition-colors"
              />
            </div>
            <button
              onClick={() => { if (addInput.trim()) handleAddFromSearch(addInput.trim().toUpperCase()); }}
              className="font-heading font-semibold bg-peach text-white border-none rounded-xl px-4 py-2.5
                         cursor-pointer hover:bg-coral transition-colors flex items-center gap-1.5 text-sm flex-none"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-[50px] left-0 right-0 bg-card border-2 border-line rounded-2xl
                            shadow-[var(--shadow)] overflow-hidden max-h-[260px] overflow-y-auto animate-pop z-50">
              {searchResults.map((r, i) => (
                <button
                  key={r.ticker}
                  onMouseDown={e => { e.preventDefault(); handleAddFromSearch(r.ticker); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-left border-none
                    ${i === activeIdx ? 'bg-cream2' : 'bg-card hover:bg-cream2'}`}
                >
                  <span className="font-heading font-semibold bg-ink text-white rounded-lg px-2.5 py-0.5 text-xs min-w-[56px] text-center">
                    {r.ticker}
                  </span>
                  <span className="font-bold text-sm truncate">{r.name}</span>
                  <Plus size={14} className="text-muted ml-auto flex-none" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table — scrollable with frozen Stock column */}
        <div className="border border-line rounded-[18px] overflow-hidden shadow-[var(--shadow-sm)] bg-card">
          <div ref={scrollRef} className="overflow-x-auto" onTouchStart={onPullStart} onTouchMove={onPullMove} onTouchEnd={onPullEnd}>
            <table className="w-full border-collapse min-w-[860px]">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className={`font-heading font-semibold text-[0.72rem] uppercase tracking-wider text-muted text-left
                                py-3 bg-cream2 border-b border-line whitespace-nowrap
                                cursor-pointer select-none hover:text-ink transition-colors group
                                ${col.key === 'ticker' ? `px-3 md:px-4 sticky left-0 z-20 ${isScrolled ? 'shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]' : ''}` : 'px-3.5'}`}
                              style={col.key === 'ticker' ? { minWidth: 120 + pullReveal, transition: pullReveal > 0 ? 'none' : 'min-width 0.3s ease, box-shadow 0.2s' } : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <span className={`inline-flex flex-col leading-none ${sortKey === col.key ? 'text-peach' : 'text-grey opacity-0 group-hover:opacity-60'} transition-opacity`}>
                          {sortKey === col.key ? (
                            sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map(stock => {
                  const q = stock.quote;
                  const sup = getSupportForStock(stock.ticker, q, timeframe);
                  const entryStatus = getEntryStatus(q?.price ?? null, sup?.high ?? null, q?.week52_high ?? null, q?.week52_low ?? null);
                  const rangePos = getRangePosition(q?.price ?? null, q?.week52_low ?? null, q?.week52_high ?? null);
                  const up = (q?.change_pct ?? 0) >= 0;
                  const isNearSupport = entryStatus === 'in-zone';

                  return (
                    <tr
                      key={stock.ticker}
                      className={`cursor-pointer transition-colors
                        ${isNearSupport ? 'bg-mint-soft hover:bg-[#cdeedd]' : 'hover:bg-cream'}`}
                    >
                      <td
                        className={`px-3 md:px-4 py-3 border-b border-line sticky left-0 z-[1]
                        ${isScrolled ? 'shadow-[4px_0_12px_-4px_rgba(0,0,0,0.08)]' : ''}
                        ${isNearSupport ? 'bg-mint-soft' : 'bg-card'}`}
                        style={{ minWidth: 120 + pullReveal, transition: pullReveal > 0 ? 'none' : 'min-width 0.3s ease, box-shadow 0.2s' }}
                      >
                        <Link href={`/stock/${stock.ticker}`} className="no-underline text-ink">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-heading font-bold text-base tnum">{stock.ticker}</span>
                              <div
                                className="text-[0.73rem] text-muted overflow-hidden text-ellipsis whitespace-nowrap"
                                style={{ maxWidth: 90 + pullReveal * 2, transition: pullReveal > 0 ? 'none' : 'max-width 0.3s ease' }}
                              >{stock.name}</div>
                            </div>
                            {onRemove && (
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); onRemove(stock.ticker); }}
                                className="border-none bg-transparent text-grey cursor-pointer font-extrabold text-sm hover:text-coral ml-2
                                           opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3.5 py-3 border-b border-line">
                        <Link href={`/stock/${stock.ticker}`} className="no-underline text-ink">
                          <span className="font-heading font-bold text-base whitespace-nowrap tnum">{fmtPx(q?.price)}</span>
                        </Link>
                      </td>
                      <td className="px-3.5 py-3 border-b border-line">
                        <span className={`font-extrabold whitespace-nowrap ${up ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
                          {up ? '▲' : '▼'} {pct(q?.change_pct)}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 border-b border-line">
                        {rangePos != null ? (
                          <div className="relative">
                            <div className="w-[100px] h-2 rounded-full bg-gradient-to-r from-mint via-sun to-coral relative">
                              <div
                                className="absolute -top-[3px] w-1 h-3.5 bg-ink rounded-sm shadow-[0_0_0_2px_#fff]"
                                style={{ left: `calc(${rangePos}% - 2px)` }}
                              />
                            </div>
                            <div className="text-[0.62rem] text-muted mt-0.5">{rangePos.toFixed(0)}%</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 border-b border-line">
                        {sup ? (
                          <span className="font-heading font-semibold whitespace-nowrap text-sm">
                            ${Math.round(sup.low)}–${Math.round(sup.high)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 border-b border-line">
                        <EntryCell
                          price={q?.price ?? null}
                          supportHigh={sup?.high ?? null}
                          week52High={q?.week52_high ?? null}
                          week52Low={q?.week52_low ?? null}
                          changePct={q?.change_pct ?? null}
                          entryStatus={entryStatus}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Explainer */}
      <div className="bg-sky-soft border-[1.5px] border-[#CFE3F6] border-l-[5px] border-l-sky rounded-[14px] p-3.5 mt-5 text-[0.92rem]">
        <div className="font-heading font-semibold text-sky flex items-center gap-1.5 mb-0.5">
          💡 &quot;When should I go in?&quot; — the calm read
        </div>
        The entry score (1–10) combines distance to support, 52-week position, and momentum.
        <strong className="text-[#6B4FA0]"> Lavender</strong> = favorable zone,
        <strong className="text-[#B0492F]"> peach</strong> = stretched.
        None of this says buy or sell — it tells you <em className="font-heading">where</em> a stock is so you can decide with your own plan.
      </div>

      {/* Disclaimer */}
      <div className="bg-card border border-dashed border-grey rounded-[18px] p-5 mt-6 text-[0.84rem] text-left">
        <strong className="font-heading font-bold text-ink">📋 Education, not advice.</strong>
        <br />
        Prices are snapshots and may differ from your broker. Support levels and entry scores are context only,
        not recommendations. Stocks fall as well as rise — do your own research.
      </div>
    </div>
  );
}
