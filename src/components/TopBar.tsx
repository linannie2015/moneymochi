'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, LayoutList, Wallet, Calculator, Moon, Sun } from 'lucide-react';
import SearchBar from './SearchBar';

function getMarketStatus() {
  const now = new Date();
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();
  const h = et.getHours();
  const m = et.getMinutes();
  const mins = h * 60 + m;

  if (day === 0 || day === 6) return { open: false, label: 'Weekend' };
  if (mins >= 570 && mins < 960) return { open: true, label: 'Market open' };
  if (mins >= 540 && mins < 570) return { open: false, label: 'Pre-market' };
  if (mins >= 960 && mins < 1200) return { open: false, label: 'After hours' };
  return { open: false, label: 'Market closed' };
}

function useMarketStatus() {
  const [status, setStatus] = useState(getMarketStatus);

  useEffect(() => {
    const interval = setInterval(() => setStatus(getMarketStatus()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return status;
}

const DARK_CSS = `
:root {
  --cream: #1B1B2F !important;
  --cream2: #252542 !important;
  --card: #22223A !important;
  --ink: #E8E0D8 !important;
  --muted: #8A7E72 !important;
  --line: #3A3850 !important;
  --peach-soft: #3E2A22 !important;
  --mint-soft: #1A3428 !important;
  --lav-soft: #2A2040 !important;
  --sky-soft: #1A2A3E !important;
  --sun-soft: #3A3218 !important;
  --grey: #5A5464 !important;
  --shadow: 0 10px 30px rgba(0,0,0,.30) !important;
  --shadow-sm: 0 4px 14px rgba(0,0,0,.22) !important;
  --shadow-lg: 0 20px 50px rgba(0,0,0,.40) !important;
  color-scheme: dark;
}
body {
  background: radial-gradient(circle at 12% 8%, #2A2040 0, transparent 38%),
    radial-gradient(circle at 88% 4%, #1A3428 0, transparent 34%),
    radial-gradient(circle at 80% 92%, #3E2A22 0, transparent 40%),
    #1B1B2F !important;
}
::selection { background: #5A3828 !important; }
.gradient-text {
  background: linear-gradient(90deg, #FF9E80, #EC8AA0) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
  color: transparent !important;
}
.skeleton {
  background: linear-gradient(90deg, #252542 25%, #2E2E4A 37%, #252542 63%) !important;
  background-size: 200% 100% !important;
}
`;

function applyDarkMode(enabled: boolean) {
  document.documentElement.classList.toggle('dark', enabled);
  let el = document.getElementById('moneymochi-dark');
  if (enabled) {
    if (!el) {
      el = document.createElement('style');
      el.id = 'moneymochi-dark';
      document.head.appendChild(el);
    }
    el.textContent = DARK_CSS;
  } else if (el) {
    el.remove();
  }
}

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('moneymochi-theme');
    const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(prefersDark);
    applyDarkMode(prefersDark);
  }, []);
  function toggle() {
    setDark(prev => {
      const next = !prev;
      applyDarkMode(next);
      localStorage.setItem('moneymochi-theme', next ? 'dark' : 'light');
      return next;
    });
  }
  return { dark, toggle };
}

export default function TopBar() {
  const market = useMarketStatus();
  const theme = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-cream/82 border-b border-line">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <Link href="/" className="flex-none cursor-pointer no-underline group">
          <img src="/logo-horizontal.png" alt="MoneyMochi" className="h-14 w-auto group-hover:animate-pulse-soft" />
          <div className="text-xs text-muted hidden sm:flex items-center gap-1.5">
            friendly finance · your stock companion
            <span className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold px-1.5 py-0.5 rounded-full ${market.open ? 'bg-mint-soft text-[#1E7A55]' : 'bg-cream2 text-muted'}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${market.open ? 'bg-[#1E7A55] animate-pulse-soft' : 'bg-grey'}`} />
              {market.label}
            </span>
          </div>
        </Link>

        <div className="flex-1 min-w-0 max-w-[420px] ml-auto">
          <SearchBar />
        </div>

        <button
          onClick={theme.toggle}
          className="w-9 h-9 rounded-full border-2 border-line bg-card grid place-items-center cursor-pointer
                     hover:border-sun hover:bg-sun-soft transition-all shadow-[var(--shadow-sm)] flex-none"
          aria-label="Toggle dark mode"
        >
          {theme.dark ? <Sun size={16} className="text-sun" /> : <Moon size={16} className="text-lav" />}
        </button>

        <div className="hidden md:flex items-center gap-2 flex-none">
          <Link
            href="/"
            className="font-heading font-semibold text-sm border-2 border-line bg-card rounded-full px-3 py-2
                       hover:border-mint hover:bg-mint-soft hover:text-[#1E7A55] transition-all no-underline
                       shadow-[var(--shadow-sm)] flex items-center gap-1.5 whitespace-nowrap"
          >
            <LayoutList size={15} />
            Watchlist
          </Link>

          <Link
            href="/portfolio"
            className="font-heading font-semibold text-sm border-2 border-line bg-card rounded-full px-3 py-2
                       hover:border-lav hover:bg-lav-soft hover:text-[#6B4FA0] transition-all no-underline
                       shadow-[var(--shadow-sm)] flex items-center gap-1.5 whitespace-nowrap"
          >
            <Wallet size={15} />
            Portfolio
          </Link>

          <Link
            href="/dca"
            className="font-heading font-semibold text-sm border-2 border-line bg-card rounded-full px-3 py-2
                       hover:border-sky hover:bg-sky-soft hover:text-sky transition-all no-underline
                       shadow-[var(--shadow-sm)] flex items-center gap-1.5 whitespace-nowrap"
          >
            <Calculator size={15} />
            DCA
          </Link>

          <Link
            href="/alerts"
            className="font-heading font-semibold text-sm border-2 border-line bg-card rounded-full px-3 py-2
                       hover:border-peach hover:bg-peach-soft transition-all no-underline
                       shadow-[var(--shadow-sm)] flex items-center gap-1.5 whitespace-nowrap relative"
          >
            <Bell size={15} />
            Alerts
          </Link>
        </div>
      </div>
    </header>
  );
}
