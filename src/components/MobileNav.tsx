'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, PiggyBank, HandCoins, BellRing } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/', icon: Sparkles, label: 'Watchlist' },
  { href: '/portfolio', icon: PiggyBank, label: 'Portfolio' },
  { href: '/dca', icon: HandCoins, label: 'DCA' },
  { href: '/alerts', icon: BellRing, label: 'Alerts' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user, configured } = useAuth();

  // No app tabs until the visitor is signed in
  if (configured && !user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--card)]/90 backdrop-blur-md border-t border-line shadow-[0_-4px_20px_rgba(120,90,70,.08)]">
      <div className="flex items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl no-underline transition-all min-w-[60px]
                ${active
                  ? 'text-peach bg-peach-soft'
                  : 'text-muted hover:text-ink'
                }`}
            >
              <item.icon size={20} />
              <span className="text-[0.6rem] font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
