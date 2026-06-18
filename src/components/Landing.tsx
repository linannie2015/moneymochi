'use client';

import Link from 'next/link';
import { LineChart, Wallet, Bell, Sparkles, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: LineChart, title: 'Smart watchlist', desc: 'See where each stock sits in its range, with calm entry reads.', color: 'text-[#1E7A55]', bg: 'bg-mint-soft' },
  { icon: Wallet, title: 'Portfolio tracker', desc: 'Track holdings, gains, and allocation at a glance.', color: 'text-[#6B4FA0]', bg: 'bg-lav-soft' },
  { icon: Bell, title: 'Price alerts', desc: 'Get nudged when a stock reaches a price you care about.', color: 'text-[#B0492F]', bg: 'bg-peach-soft' },
  { icon: Sparkles, title: 'Mochi Insights', desc: 'Friendly AI context on the news — never buy/sell advice.', color: 'text-sky', bg: 'bg-sky-soft' },
];

export default function Landing() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="text-center pt-6 pb-12 sm:pt-12 sm:pb-16">
        <img
          src="/logo-dango.svg"
          alt="MoneyMochi"
          className="h-24 sm:h-32 w-auto mx-auto mb-6 animate-float drop-shadow-[0_12px_24px_rgba(0,0,0,0.10)]"
        />
        <h1 className="text-3xl sm:text-5xl font-heading font-semibold mb-4 leading-tight">
          Investing, the <span className="gradient-text">calm</span> way.
        </h1>
        <p className="text-muted text-base sm:text-lg max-w-[520px] mx-auto mb-8">
          MoneyMochi is your friendly finance companion — track stocks, watch your portfolio,
          and stay informed without the noise. <strong className="text-ink">Education, not advice.</strong>
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/login"
            className="font-heading font-semibold text-base bg-peach text-white border-none rounded-full px-7 py-3.5
                       cursor-pointer hover:bg-coral transition-all no-underline shadow-[var(--shadow)]
                       flex items-center gap-2 hover:gap-3"
          >
            Get started — it&apos;s free <ArrowRight size={18} />
          </Link>
        </div>
        <p className="text-xs text-muted mt-4">Sign in with just your email — no password to remember.</p>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[760px] mx-auto pb-8">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className={`bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 stagger-${i + 1}`}
            >
              <span className={`inline-grid place-items-center w-11 h-11 rounded-2xl ${f.bg} ${f.color} mb-3`}>
                <Icon size={20} />
              </span>
              <h3 className="text-lg mb-1">{f.title}</h3>
              <p className="text-muted text-sm">{f.desc}</p>
            </div>
          );
        })}
      </section>

      {/* Bottom CTA */}
      <section className="text-center py-8">
        <p className="font-heading font-semibold text-lg text-ink/70 mb-4">Learn. Track. Grow.</p>
        <Link
          href="/login"
          className="font-heading font-semibold text-sm border-2 border-peach text-peach rounded-full px-6 py-3
                     cursor-pointer hover:bg-peach hover:text-white transition-all no-underline inline-flex items-center gap-2"
        >
          Create your free account <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
