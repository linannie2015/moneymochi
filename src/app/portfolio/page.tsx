'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, PieChart as PieChartIcon, TrendingUp, TrendingDown, Plus, X, DollarSign, Hash, ChevronUp, ChevronDown } from 'lucide-react';
import PortfolioImport from '@/components/PortfolioImport';
import TickerSearch from '@/components/TickerSearch';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DEMO_STOCKS } from '@/lib/demo-data';
import { fmtPx, pct, getEntryScore, getEntryStatus, getSupportRangeForTimeframe, getRangePosition, statusConfig } from '@/lib/utils';
import type { WatchlistTimeframe } from '@/lib/utils';
import type { EntryStatus } from '@/lib/types';

interface Holding {
  id: string;
  ticker: string;
  shares: number;
  avgCost: number;
}

const STORAGE_KEY = 'moneymochi-portfolio';

const DEFAULT_HOLDINGS: Holding[] = [
  { id: '1', ticker: 'GOOGL', shares: 15, avgCost: 310.0 },
  { id: '2', ticker: 'MSFT', shares: 10, avgCost: 380.0 },
  { id: '3', ticker: 'AMD', shares: 8, avgCost: 420.0 },
  { id: '4', ticker: 'VOO', shares: 20, avgCost: 620.0 },
  { id: '5', ticker: 'META', shares: 5, avgCost: 550.0 },
  { id: '6', ticker: 'AMZN', shares: 12, avgCost: 210.0 },
];

const PIE_COLORS = ['#ED8A6E', '#4F9A78', '#B79CE0', '#5E7FA3', '#CF9A3A', '#C9604F'];

const SECTOR_MAP: Record<string, string> = {
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', GOOG: 'Technology',
  META: 'Technology', NVDA: 'Technology', AMD: 'Technology', INTC: 'Technology',
  CRM: 'Technology', ORCL: 'Technology', ADBE: 'Technology', CSCO: 'Technology',
  AVGO: 'Technology', QCOM: 'Technology', TXN: 'Technology', MU: 'Technology',
  SHOP: 'Technology', SQ: 'Technology', PLTR: 'Technology', NET: 'Technology',
  SNOW: 'Technology', UBER: 'Technology', ABNB: 'Technology', SNAP: 'Technology',
  AMZN: 'Consumer', TSLA: 'Consumer', NKE: 'Consumer', SBUX: 'Consumer',
  MCD: 'Consumer', HD: 'Consumer', LOW: 'Consumer', TGT: 'Consumer',
  COST: 'Consumer', WMT: 'Consumer', DIS: 'Consumer', NFLX: 'Consumer',
  BABA: 'Consumer', PDD: 'Consumer', RIVN: 'Consumer', LCID: 'Consumer',
  JPM: 'Financial', BAC: 'Financial', GS: 'Financial', MS: 'Financial',
  V: 'Financial', MA: 'Financial', AXP: 'Financial', C: 'Financial',
  WFC: 'Financial', BLK: 'Financial', SCHW: 'Financial', PYPL: 'Financial',
  COIN: 'Financial', SOFI: 'Financial',
  JNJ: 'Healthcare', UNH: 'Healthcare', PFE: 'Healthcare', ABBV: 'Healthcare',
  MRK: 'Healthcare', LLY: 'Healthcare', TMO: 'Healthcare', ABT: 'Healthcare',
  BMY: 'Healthcare', MRNA: 'Healthcare', ISRG: 'Healthcare',
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy',
  OXY: 'Energy', BP: 'Energy', ENPH: 'Energy', FSLR: 'Energy',
  PG: 'Consumer Staples', KO: 'Consumer Staples', PEP: 'Consumer Staples',
  PM: 'Consumer Staples', CL: 'Consumer Staples', EL: 'Consumer Staples',
  BA: 'Industrial', CAT: 'Industrial', UPS: 'Industrial', FDX: 'Industrial',
  DE: 'Industrial', GE: 'Industrial', LMT: 'Industrial', RTX: 'Industrial',
  T: 'Telecom', VZ: 'Telecom', TMUS: 'Telecom',
  AMT: 'Real Estate', PLD: 'Real Estate', SPG: 'Real Estate', O: 'Real Estate',
  VOO: 'Index ETF', SPY: 'Index ETF', QQQ: 'Index ETF', QQQM: 'Index ETF', IVV: 'Index ETF',
  VTI: 'Index ETF', DIA: 'Index ETF', IWM: 'Index ETF', ARKK: 'Index ETF',
  VGT: 'Index ETF', XLF: 'Index ETF', XLE: 'Index ETF', XLK: 'Index ETF',
  RKLB: 'Industrial', MSTR: 'Financial',
};

function getSector(ticker: string): string {
  return SECTOR_MAP[ticker] ?? 'Other';
}

const SECTOR_COLORS: Record<string, string> = {
  'Technology': '#B79CE0',
  'Consumer': '#ED8A6E',
  'Financial': '#5E7FA3',
  'Healthcare': '#4F9A78',
  'Energy': '#CF9A3A',
  'Consumer Staples': '#E8A0BF',
  'Industrial': '#7BAFD4',
  'Telecom': '#95C8B8',
  'Real Estate': '#D4A574',
  'Index ETF': '#6B8CC7',
  'Other': '#999',
};

const SCORE_COLORS = {
  lav: { ring: 'var(--lav)', bg: 'bg-lav-soft', text: 'text-[#6B4FA0]' },
  peach: { ring: 'var(--peach)', bg: 'bg-peach-soft', text: 'text-[#B0492F]' },
  muted: { ring: 'var(--grey)', bg: 'bg-cream2', text: 'text-muted' },
};

function getStockData(ticker: string) {
  return DEMO_STOCKS.find(s => s.ticker === ticker) ?? null;
}

type PortfolioSortKey = 'ticker' | 'shares' | 'cost' | 'price' | 'pnl' | 'change' | 'range' | 'score';

function EntryCell({ price, supportHigh, week52High, week52Low, changePct, entryStatus }: {
  price: number | null; supportHigh: number | null; week52High: number | null; week52Low: number | null; changePct: number | null; entryStatus: EntryStatus;
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
      <span className={`inline-flex items-center gap-1.5 text-[0.75rem] font-bold px-3 py-1 rounded-full whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
        <span className="w-[7px] h-[7px] rounded-full flex-none" style={{ background: cfg.dot }} />
        {cfg.label}
      </span>
    </div>
  );
}

function PieLabel({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, name = '' }: {
  cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number; name?: string;
}) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.06) return null;

  return (
    <text x={x} y={y} fill="var(--ink)" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"
      style={{ fontSize: '11px', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
      {name} {(percent * 100).toFixed(0)}%
    </text>
  );
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>(DEFAULT_HOLDINGS);
  const [mounted, setMounted] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [sharesInput, setSharesInput] = useState('');
  const [costInput, setCostInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Holding[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHoldings(parsed);
        }
      } catch { /* use defaults */ }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    }
  }, [holdings, mounted]);

  const addHolding = useCallback(() => {
    const ticker = tickerInput.trim().toUpperCase();
    const shares = parseFloat(sharesInput);
    const avgCost = parseFloat(costInput);
    if (!ticker || isNaN(shares) || shares <= 0 || isNaN(avgCost) || avgCost <= 0) return;
    setHoldings(prev => [...prev, {
      id: Date.now().toString(),
      ticker,
      shares,
      avgCost,
    }]);
    setTickerInput('');
    setSharesInput('');
    setCostInput('');
  }, [tickerInput, sharesInput, costInput]);

  const removeHolding = useCallback((id: string) => {
    setHoldings(prev => prev.filter(h => h.id !== id));
  }, []);

  const importHoldings = useCallback((incoming: { ticker: string; shares: number; avgCost: number }[]) => {
    const newHoldings = incoming.map((h, i) => ({
      id: (Date.now() + i).toString(),
      ticker: h.ticker.toUpperCase(),
      shares: h.shares,
      avgCost: h.avgCost,
    }));
    setHoldings(prev => [...prev, ...newHoldings]);
  }, []);

  const enriched = useMemo(() => holdings.map(h => {
    const stock = getStockData(h.ticker);
    const q = stock?.quote ?? null;
    const currentPrice = q?.price ?? h.avgCost;
    const currentValue = h.shares * currentPrice;
    const totalCost = h.shares * h.avgCost;
    const pnl = currentValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    const sector = getSector(h.ticker);
    return { ...h, name: stock?.name ?? h.ticker, quote: q, currentPrice, currentValue, totalCost, pnl, pnlPct, sector };
  }), [holdings]);

  const totals = useMemo(() => {
    const totalValue = enriched.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = enriched.reduce((sum, h) => sum + h.totalCost, 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    return { totalValue, totalCost, totalPnl, totalPnlPct };
  }, [enriched]);

  const pieData = useMemo(() => enriched.map(h => ({
    name: h.ticker,
    value: h.currentValue,
  })), [enriched]);

  const sectorPieData = useMemo(() => {
    const map = new Map<string, number>();
    enriched.forEach(h => {
      map.set(h.sector, (map.get(h.sector) ?? 0) + h.currentValue);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [enriched]);

  const pnlUp = totals.totalPnl >= 0;

  const [sortKey, setSortKey] = useState<PortfolioSortKey>('ticker');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [timeframe, setTimeframe] = useState<WatchlistTimeframe>('1Y');

  const TF_OPTIONS: { key: WatchlistTimeframe; label: string }[] = [
    { key: '1W', label: 'Day' },
    { key: '2W', label: 'Short' },
    { key: '1M', label: 'Swing' },
    { key: '3M', label: 'Position' },
    { key: '6M', label: 'Medium' },
    { key: '1Y', label: 'Long-term' },
  ];

  const COLUMNS: { key: PortfolioSortKey; label: string }[] = [
    { key: 'ticker', label: 'Stock' },
    { key: 'shares', label: 'Shares' },
    { key: 'cost', label: 'Avg Cost' },
    { key: 'price', label: 'Price' },
    { key: 'pnl', label: 'P&L' },
    { key: 'change', label: 'Today' },
    { key: 'range', label: '52w Range' },
    { key: 'score', label: 'Entry' },
  ];

  function toggleSort(key: PortfolioSortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'pnl' || key === 'change' ? 'desc' : 'asc');
    }
  }

  const sortedEnriched = useMemo(() => {
    const arr = [...enriched];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'ticker': cmp = a.ticker.localeCompare(b.ticker); break;
        case 'shares': cmp = a.shares - b.shares; break;
        case 'cost': cmp = a.avgCost - b.avgCost; break;
        case 'price': cmp = a.currentPrice - b.currentPrice; break;
        case 'pnl': cmp = a.pnl - b.pnl; break;
        case 'change': cmp = (a.quote?.change_pct ?? 0) - (b.quote?.change_pct ?? 0); break;
        case 'range':
          cmp = (getRangePosition(a.currentPrice, a.quote?.week52_low ?? null, a.quote?.week52_high ?? null) ?? 50)
              - (getRangePosition(b.currentPrice, b.quote?.week52_low ?? null, b.quote?.week52_high ?? null) ?? 50);
          break;
        case 'score': {
          const supA = getSupportRangeForTimeframe(a.quote, timeframe);
          const supB = getSupportRangeForTimeframe(b.quote, timeframe);
          const sA = getEntryScore(a.currentPrice, supA?.high ?? null, a.quote?.week52_high ?? null, a.quote?.week52_low ?? null, a.quote?.change_pct ?? null);
          const sB = getEntryScore(b.currentPrice, supB?.high ?? null, b.quote?.week52_high ?? null, b.quote?.week52_low ?? null, b.quote?.change_pct ?? null);
          cmp = sA.score - sB.score;
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [enriched, sortKey, sortDir, timeframe]);

  return (
    <div className="max-w-5xl mx-auto">
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

      <div className="animate-slide-up">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-xl">💼</span>
          <h1 className="text-2xl">Portfolio Tracker</h1>
        </div>
        <p className="text-sm text-muted m-0 mb-6">
          Track your holdings, see unrealized P&amp;L, and understand your allocation.
          <strong> Practice tool — not connected to a real brokerage.</strong>
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4 hover:-translate-y-0.5 transition-all duration-200 stagger-1">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <div className="p-1.5 rounded-lg bg-cream2"><Wallet size={16} className="text-lav" /></div>
              Total Value
            </div>
            <div className="text-2xl font-heading font-bold">${totals.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-muted mt-0.5">across {holdings.length} holding{holdings.length !== 1 ? 's' : ''}</div>
          </div>

          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4 hover:-translate-y-0.5 transition-all duration-200 stagger-2">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <div className="p-1.5 rounded-lg bg-cream2"><DollarSign size={16} className="text-sky" /></div>
              Total Cost
            </div>
            <div className="text-2xl font-heading font-bold">${totals.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-muted mt-0.5">total invested</div>
          </div>

          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4 hover:-translate-y-0.5 transition-all duration-200 stagger-3">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <div className="p-1.5 rounded-lg bg-cream2">
                {pnlUp ? <TrendingUp size={16} className="text-[#1E7A55]" /> : <TrendingDown size={16} className="text-[#B0492F]" />}
              </div>
              Total P&amp;L
            </div>
            <div className={`text-2xl font-heading font-bold ${pnlUp ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
              {'$'}{pnlUp ? '+' : ''}{totals.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-xs mt-0.5 font-semibold ${pnlUp ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
              {pnlUp ? '+' : ''}{totals.totalPnlPct.toFixed(2)}%
            </div>
          </div>

          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-4 hover:-translate-y-0.5 transition-all duration-200 stagger-4">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-1">
              <div className="p-1.5 rounded-lg bg-cream2"><Hash size={16} className="text-sun" /></div>
              Holdings
            </div>
            <div className="text-2xl font-heading font-bold">{holdings.length}</div>
            <div className="text-xs text-muted mt-0.5">stocks tracked</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-lg">📊</span>
              <h2 className="text-lg">By Stock</h2>
            </div>
            {mounted && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={PieLabel}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => ['$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'Value']}
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid var(--line)',
                      boxShadow: 'var(--shadow-sm)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted text-sm">
                {!mounted ? <div className="skeleton h-[280px] w-full" /> : 'Add holdings to see allocation'}
              </div>
            )}
          </div>

          <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 animate-fade-in">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-lg">🏷️</span>
              <h2 className="text-lg">By Sector</h2>
            </div>
            {mounted && sectorPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sectorPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={PieLabel}
                    labelLine={false}
                  >
                    {sectorPieData.map(entry => (
                      <Cell key={entry.name} fill={SECTOR_COLORS[entry.name] ?? '#999'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => ['$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'Value']}
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid var(--line)',
                      boxShadow: 'var(--shadow-sm)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted text-sm">
                {!mounted ? <div className="skeleton h-[280px] w-full" /> : 'Add holdings to see sectors'}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 mb-6 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-4">
            <PieChartIcon size={18} className="text-peach" />
            <h2 className="text-lg">Breakdown</h2>
          </div>
          <div className="space-y-2.5">
            {enriched.map((h, i) => {
              const pctAlloc = totals.totalValue > 0 ? (h.currentValue / totals.totalValue) * 100 : 0;
              return (
                <div key={h.id} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-none" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <Link href={`/stock/${h.ticker}`} className="font-heading font-bold text-sm no-underline text-ink hover:text-peach transition-colors w-14 flex-none">
                    {h.ticker}
                  </Link>
                  <span
                    className="text-[0.62rem] font-bold px-2 py-0.5 rounded-full flex-none"
                    style={{ backgroundColor: SECTOR_COLORS[h.sector] + '22', color: SECTOR_COLORS[h.sector] }}
                  >
                    {h.sector}
                  </span>
                  <div className="flex-1 h-1.5 bg-cream2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctAlloc}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                  <span className="text-xs font-heading font-semibold text-muted w-10 text-right">{pctAlloc.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <PortfolioImport onImport={importHoldings} />
        </div>

        <div className="animate-slide-up">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-xl">📋</span>
            <h2 className="text-xl">Holdings</h2>
          </div>
          <p className="text-muted mb-3 max-w-3xl text-sm">
            Your positions with cost basis, P&amp;L, 52-week range position, and an <strong>&quot;entry&quot;</strong> read.
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

          {/* Add form */}
          <div className="flex gap-2 flex-wrap mb-4 items-end">
            <TickerSearch
              value={tickerInput}
              onChange={setTickerInput}
              onSelect={(ticker) => setTickerInput(ticker)}
              placeholder="Search ticker..."
              className="w-[180px]"
            />
            <input
              value={sharesInput}
              onChange={e => setSharesInput(e.target.value)}
              type="number"
              step="1"
              placeholder="Shares"
              className="w-[100px] px-3 py-2.5 border-2 border-line rounded-xl font-body text-sm outline-none focus:border-peach transition-colors"
            />
            <input
              value={costInput}
              onChange={e => setCostInput(e.target.value)}
              type="number"
              step="0.01"
              placeholder="Avg cost $"
              className="w-[140px] px-3 py-2.5 border-2 border-line rounded-xl font-body text-sm outline-none focus:border-peach transition-colors"
            />
            <button
              onClick={addHolding}
              className="font-heading font-semibold bg-peach text-white border-none rounded-xl px-4 py-2.5 cursor-pointer hover:bg-coral transition-colors flex items-center gap-1.5 text-sm"
            >
              <Plus size={16} /> Add holding
            </button>
          </div>

          {holdings.length === 0 ? (
            <div className="text-center text-muted py-8">
              <Wallet className="mx-auto mb-2 text-grey" size={36} />
              <p className="text-sm">No holdings yet. Add a ticker, shares, and average cost above.</p>
            </div>
          ) : (
            <div className="border border-line rounded-[18px] overflow-hidden shadow-[var(--shadow-sm)] bg-card">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1060px]">
                  <thead>
                    <tr>
                      {COLUMNS.map(col => (
                        <th
                          key={col.key}
                          onClick={() => toggleSort(col.key)}
                          className={`font-heading font-semibold text-[0.72rem] uppercase tracking-wider text-muted text-left
                                    py-3 bg-cream2 border-b border-line whitespace-nowrap
                                    cursor-pointer select-none hover:text-ink transition-colors group
                                    ${col.key === 'ticker' ? 'px-2 md:px-3.5 sticky left-0 z-20 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-line' : 'px-3.5'}`}
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
                      <th className="w-10 bg-cream2 border-b border-line" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEnriched.map(h => {
                      const q = h.quote;
                      const sup = getSupportRangeForTimeframe(q, timeframe);
                      const entryStatus = getEntryStatus(h.currentPrice, sup?.high ?? null, q?.week52_high ?? null, q?.week52_low ?? null);
                      const rangePos = getRangePosition(h.currentPrice, q?.week52_low ?? null, q?.week52_high ?? null);
                      const up = h.pnl >= 0;
                      const dayUp = (q?.change_pct ?? 0) >= 0;
                      const isNearSupport = entryStatus === 'in-zone';

                      return (
                        <tr
                          key={h.id}
                          className={`cursor-pointer transition-colors
                            ${isNearSupport ? 'bg-mint-soft hover:bg-[#cdeedd]' : 'hover:bg-cream'}`}
                        >
                          <td className={`px-2 md:px-3.5 py-3 border-b border-line sticky left-0 z-[1]
                            after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-line
                            ${isNearSupport ? 'bg-mint-soft' : 'bg-card'}`}>
                            <Link href={`/stock/${h.ticker}`} className="no-underline text-ink">
                              <span className="font-heading font-bold text-base tnum">{h.ticker}</span>
                              <div className="text-[0.73rem] text-muted truncate max-w-[90px] md:max-w-[140px]">{h.name}</div>
                            </Link>
                          </td>
                          <td className="px-3.5 py-3 border-b border-line font-heading font-semibold text-sm tnum">
                            {h.shares}
                          </td>
                          <td className="px-3.5 py-3 border-b border-line font-heading font-semibold text-sm tnum">
                            {fmtPx(h.avgCost)}
                          </td>
                          <td className="px-3.5 py-3 border-b border-line">
                            <span className="font-heading font-bold text-base whitespace-nowrap tnum">{fmtPx(h.currentPrice)}</span>
                          </td>
                          <td className="px-3.5 py-3 border-b border-line">
                            <div className={`font-heading font-bold text-sm tnum ${up ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
                              {'$'}{up ? '+' : ''}{h.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[0.68rem] font-extrabold ${up ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
                              {up ? '+' : ''}{h.pnlPct.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-3.5 py-3 border-b border-line">
                            <span className={`font-extrabold whitespace-nowrap ${dayUp ? 'text-[#1E7A55]' : 'text-[#B0492F]'}`}>
                              {dayUp ? '▲' : '▼'} {pct(q?.change_pct)}
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
                            <EntryCell
                              price={h.currentPrice}
                              supportHigh={sup?.high ?? null}
                              week52High={q?.week52_high ?? null}
                              week52Low={q?.week52_low ?? null}
                              changePct={q?.change_pct ?? null}
                              entryStatus={entryStatus}
                            />
                          </td>
                          <td className="px-3.5 py-3 border-b border-line">
                            <button
                              onClick={() => removeHolding(h.id)}
                              className="border-none bg-transparent text-grey cursor-pointer hover:text-coral transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="bg-sky-soft border-[1.5px] border-[#CFE3F6] border-l-[5px] border-l-sky rounded-[14px] p-3.5 mt-5 text-sm">
          <div className="font-heading font-semibold text-sky flex items-center gap-1.5 mb-0.5">
            💡 Tracking vs. real brokerage
          </div>
          This portfolio tracker uses demo prices and is not connected to a real brokerage account.
          Use it to practice tracking your positions and understanding P&amp;L. Your holdings are saved
          locally in your browser.
        </div>

        <div className="bg-card border border-dashed border-grey rounded-[18px] p-5 mt-6 text-sm text-left">
          <strong className="font-heading font-semibold text-ink">📋 Education, not advice.</strong>
          <br />
          MoneyMochi is an educational tool. It is <strong>not</strong> financial advice and contains <strong>no recommendation</strong> to buy, sell or hold.
          Stocks fall as well as rise and you can lose money. Do your own research.
        </div>
      </div>
    </div>
  );
}
