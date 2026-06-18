'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { DEMO_STOCKS } from '@/lib/demo-data';
import { searchSymbols, hasApiKeys } from '@/lib/api';
import { fmtPx } from '@/lib/utils';

interface TickerResult {
  ticker: string;
  name: string;
  price: number | null;
}

const LOCAL_UNIVERSE: TickerResult[] = DEMO_STOCKS.map(s => ({
  ticker: s.ticker,
  name: s.name || s.ticker,
  price: s.quote?.price ?? null,
}));

interface TickerSearchProps {
  value: string;
  onChange: (ticker: string) => void;
  onSelect?: (ticker: string, price: number | null) => void;
  placeholder?: string;
  className?: string;
}

export default function TickerSearch({ value, onChange, onSelect, placeholder = 'Search ticker...', className = '' }: TickerSearchProps) {
  const [results, setResults] = useState<TickerResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchLocal = useCallback((q: string): TickerResult[] => {
    if (!q.trim()) return LOCAL_UNIVERSE;
    const lower = q.toLowerCase();
    return LOCAL_UNIVERSE.filter(
      s => s.ticker.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower)
    );
  }, []);

  function handleSearch(q: string) {
    onChange(q);
    setActiveIdx(-1);

    const localResults = searchLocal(q);
    setResults(localResults);
    setOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (hasApiKeys() && q.trim().length >= 2) {
      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        const apiResults = await searchSymbols(q.trim());
        if (apiResults.length > 0) {
          const merged = [...localResults];
          for (const r of apiResults) {
            if (!merged.some(m => m.ticker === r.ticker)) {
              merged.push({ ...r, price: null });
            }
          }
          setResults(merged.slice(0, 12));
        }
        setSearching(false);
      }, 300);
    }
  }

  function selectItem(item: TickerResult) {
    onChange(item.ticker);
    setOpen(false);
    onSelect?.(item.ticker, item.price);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && results[activeIdx]) {
        selectItem(results[activeIdx]);
      } else if (value.trim()) {
        const match = LOCAL_UNIVERSE.find(s => s.ticker === value.trim().toUpperCase());
        onSelect?.(value.trim().toUpperCase(), match?.price ?? null);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
        {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
      </span>
      <input
        type="text"
        value={value}
        onChange={e => handleSearch(e.target.value)}
        onFocus={() => handleSearch(value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full py-2.5 pl-9 pr-3 border-2 border-line rounded-xl bg-card
                   font-body text-sm text-ink outline-none transition-colors
                   focus:border-peach"
      />
      {open && results.length > 0 && (
        <div className="absolute top-[46px] left-0 right-0 bg-card border-2 border-line rounded-2xl
                        shadow-[var(--shadow)] overflow-hidden max-h-[280px] overflow-y-auto animate-pop z-50">
          {results.map((r, i) => (
            <button
              key={r.ticker}
              onMouseDown={e => { e.preventDefault(); selectItem(r); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 cursor-pointer transition-colors text-left border-none
                ${i === activeIdx ? 'bg-cream2' : 'bg-card hover:bg-cream2'}`}
            >
              <span className="font-heading font-semibold bg-ink text-white rounded-lg px-2 py-0.5 text-xs min-w-[50px] text-center">
                {r.ticker}
              </span>
              <span className="font-semibold text-sm truncate flex-1">{r.name}</span>
              {r.price != null && (
                <span className="font-heading font-bold text-sm text-lav flex-none">
                  {fmtPx(r.price)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
