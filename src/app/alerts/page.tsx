'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Bell, BellRing } from 'lucide-react';
import { fmtPx } from '@/lib/utils';
import TickerSearch from '@/components/TickerSearch';

interface AlertItem {
  id: string;
  ticker: string;
  target: number;
  triggered: boolean;
  currentPrice?: number;
}

const DEFAULT_ALERTS: AlertItem[] = [
  { id: '1', ticker: 'GOOGL', target: 320, triggered: false, currentPrice: 373.44 },
  { id: '2', ticker: 'AMD', target: 400, triggered: false, currentPrice: 548.80 },
  { id: '3', ticker: 'MU', target: 760, triggered: true, currentPrice: 1057.18 },
];
const ALERTS_KEY = 'moneymochi-alerts';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(DEFAULT_ALERTS);
  const [mounted, setMounted] = useState(false);
  const [tickerInput, setTickerInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(ALERTS_KEY);
    if (saved) {
      try { setAlerts(JSON.parse(saved)); } catch { /* use defaults */ }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }, [alerts, mounted]);

  function addAlert() {
    const ticker = tickerInput.trim().toUpperCase();
    const target = parseFloat(priceInput);
    if (!ticker || isNaN(target)) return;
    setAlerts(prev => [...prev, {
      id: Date.now().toString(),
      ticker,
      target,
      triggered: false,
    }]);
    setTickerInput('');
    setPriceInput('');
  }

  function removeAlert(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  return (
    <div className="max-w-2xl mx-auto">
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
          <Bell className="text-peach" size={28} />
          Price Alerts
        </h1>
        <p className="text-sm text-muted m-0 mb-5">
          Get notified when a stock drops to a price you choose (e.g. your support zone).
          <strong> Not a buy signal — just a heads-up.</strong>
        </p>

        {/* Add form */}
        <div className="flex gap-2 flex-wrap mb-6 items-end">
          <TickerSearch
            value={tickerInput}
            onChange={setTickerInput}
            onSelect={(ticker, price) => {
              setTickerInput(ticker);
              if (price != null && !priceInput) setPriceInput(price.toFixed(2));
            }}
            placeholder="Search ticker..."
            className="w-[180px]"
          />
          <input
            value={priceInput}
            onChange={e => setPriceInput(e.target.value)}
            type="number"
            step="0.01"
            placeholder="Alert at $"
            className="w-[140px] px-3 py-2.5 border-2 border-line rounded-xl font-body text-sm outline-none
                       focus:border-peach transition-colors"
          />
          <button
            onClick={addAlert}
            className="font-heading font-semibold bg-peach text-white border-none rounded-xl px-4 py-2.5
                       cursor-pointer hover:bg-coral transition-colors flex items-center gap-1.5 text-sm"
          >
            <Plus size={16} /> Add alert
          </button>
        </div>

        {/* Alert list */}
        {alerts.length === 0 ? (
          <div className="text-center text-muted py-8">
            <BellRing className="mx-auto mb-2 text-grey" size={36} />
            <p className="text-sm">No alerts yet. Add a ticker and a price above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => {
              const distPct = alert.currentPrice
                ? (((alert.currentPrice - alert.target) / alert.target) * 100).toFixed(1)
                : null;
              return (
                <div
                  key={alert.id}
                  className={`border rounded-[14px] p-3 transition-colors
                    ${alert.triggered
                      ? 'bg-mint-soft border-mint'
                      : 'bg-cream border-line'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-base">{alert.ticker}</span>
                    <span className="text-sm text-muted">
                      alert at {fmtPx(alert.target)}
                    </span>
                    <button
                      onClick={() => removeAlert(alert.id)}
                      className="ml-auto border-none bg-transparent text-muted cursor-pointer hover:text-coral"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="font-heading font-semibold text-sm mt-1">
                    {alert.currentPrice != null ? (
                      <>
                        now {fmtPx(alert.currentPrice)} ·{' '}
                        {alert.triggered ? (
                          <span className="text-[#1E7A55]">🟢 reached!</span>
                        ) : (
                          <span className="text-muted">{distPct}% away</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">checking...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-sky-soft border-[1.5px] border-[#CFE3F6] border-l-[5px] border-l-sky rounded-[14px] p-3.5 mt-5 text-sm">
        <div className="font-heading font-semibold text-sky flex items-center gap-1.5 mb-0.5">
          💡 How alerts work
        </div>
        Browser alerts check prices while the page is open. For alerts that fire even when the app is closed
        (email/push), connect a Supabase backend with the scheduled refresh function.
      </div>
    </div>
  );
}
