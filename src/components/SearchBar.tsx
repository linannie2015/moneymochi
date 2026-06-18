'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { DEMO_STOCKS } from '@/lib/demo-data';
import { searchSymbols, hasApiKeys } from '@/lib/api';

interface SearchResult {
  ticker: string;
  name: string;
}

const LOCAL_UNIVERSE: SearchResult[] = DEMO_STOCKS.map(s => ({
  ticker: s.ticker,
  name: s.name || s.ticker,
}));

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const searchLocal = useCallback((q: string): SearchResult[] => {
    if (!q.trim()) return LOCAL_UNIVERSE;
    const lower = q.toLowerCase();
    return LOCAL_UNIVERSE.filter(
      s => s.ticker.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower)
    );
  }, []);

  function handleSearch(q: string) {
    setQuery(q);
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
              merged.push(r);
            }
          }
          setResults(merged.slice(0, 12));
        }
        setSearching(false);
      }, 300);
    }
  }

  function navigate(ticker: string) {
    setOpen(false);
    setQuery('');
    router.push(`/stock/${ticker}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && results[activeIdx]) {
        navigate(results[activeIdx].ticker);
      } else if (query.trim()) {
        navigate(query.trim().toUpperCase());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
        {searching ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Search size={18} />
        )}
      </span>
      <input
        type="text"
        value={query}
        onChange={e => handleSearch(e.target.value)}
        onFocus={() => handleSearch(query)}
        onKeyDown={handleKeyDown}
        placeholder="Search stock..."
        className="w-full py-2.5 pl-10 pr-4 border-2 border-line rounded-full bg-card
                   font-body text-sm text-ink outline-none transition-all
                   shadow-[var(--shadow-sm)]
                   focus:border-peach focus:shadow-[0_0_0_4px_var(--peach-soft)]"
      />
      {open && results.length > 0 && (
        <div className="absolute top-[52px] left-0 right-0 bg-card border-2 border-line rounded-2xl
                        shadow-[var(--shadow)] overflow-hidden max-h-[340px] overflow-y-auto animate-pop z-50">
          {results.map((r, i) => (
            <button
              key={r.ticker}
              onMouseDown={e => { e.preventDefault(); navigate(r.ticker); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-left border-none
                ${i === activeIdx ? 'bg-cream2' : 'bg-card hover:bg-cream2'}`}
            >
              <span className="font-heading font-semibold bg-ink text-white rounded-lg px-2.5 py-0.5 text-xs min-w-[56px] text-center">
                {r.ticker}
              </span>
              <span className="font-bold text-sm truncate">{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
