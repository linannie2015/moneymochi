'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-cream/60 backdrop-blur-sm">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="text-center sm:text-left">
            <img src="/logo-horizontal.png" alt="MoneyMochi" className="h-10 w-auto mx-auto sm:mx-0" />
            <p className="text-xs text-muted mt-1 max-w-[280px]">
              Your friendly stock companion. Track, analyze, and stay informed — the calm way.
            </p>
          </div>

          <div className="flex gap-8 text-sm">
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-xs uppercase tracking-wider text-muted mb-1">Navigate</span>
              <Link href="/" className="text-ink no-underline hover:text-peach transition-colors">Watchlist</Link>
              <Link href="/portfolio" className="text-ink no-underline hover:text-peach transition-colors">Portfolio</Link>
              <Link href="/dca" className="text-ink no-underline hover:text-peach transition-colors">DCA Calculator</Link>
              <Link href="/alerts" className="text-ink no-underline hover:text-peach transition-colors">Alerts</Link>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-xs uppercase tracking-wider text-muted mb-1">About</span>
              <Link href="/account" className="text-ink no-underline hover:text-peach transition-colors">Account</Link>
              <Link href="/login" className="text-ink no-underline hover:text-peach transition-colors">Sign in</Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 mb-2">
          <span className="font-heading font-semibold text-sm tracking-wide text-ink/70">
            Learn. Track. Grow.
          </span>
        </div>

        <div className="border-t border-line pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <div className="flex items-center gap-1">
            Made with <Heart size={12} className="text-coral" /> by MoneyMochi
          </div>
          <div>
            Educational only. Not financial advice. Stocks can lose value. Do your own research.
          </div>
        </div>
      </div>
    </footer>
  );
}
