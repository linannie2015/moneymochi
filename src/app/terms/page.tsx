'use client';

import Link from 'next/link';

const LAST_UPDATED = 'June 18, 2026';

export default function TermsPage() {
  return (
    <div className="max-w-[720px] mx-auto mt-6 animate-slide-up">
      <div className="text-center mb-6">
        <img src="/logo-dango.svg" alt="" className="h-12 w-auto mx-auto mb-3" />
        <h1 className="text-2xl mb-1">Terms &amp; Conditions</h1>
        <p className="text-muted text-sm">Last updated: {LAST_UPDATED}</p>
      </div>

      <div className="bg-card border border-line rounded-[var(--r)] shadow-[var(--shadow-sm)] p-5 sm:p-7 text-[0.95rem] leading-relaxed">
        <p className="mb-5">
          Welcome to <strong>MoneyMochi</strong>. By creating an account or using this app, you agree
          to these Terms &amp; Conditions. Please read them. If you don&apos;t agree, please don&apos;t use the app.
        </p>

        <Section title="1. What MoneyMochi is">
          MoneyMochi is a friendly, <strong>educational</strong> finance dashboard. It helps you track stocks,
          watch your portfolio, set price alerts, and read general context about the market. It is a tool for
          learning and organizing — nothing more.
        </Section>

        <Section title="2. Not financial advice">
          MoneyMochi does <strong>not</strong> provide financial, investment, tax, or legal advice, and does not
          give buy or sell recommendations. Support zones, entry scores, and AI insights are educational context
          only — not predictions or signals. Always do your own research and consider speaking with a licensed
          professional. You are solely responsible for your own investment decisions. Stocks can lose value.
        </Section>

        <Section title="3. Free to use">
          MoneyMochi is currently <strong>free</strong>{' '}and has no subscription. We may add paid features in
          the future; if we do, we&apos;ll make it clear before you&apos;re charged anything.
        </Section>

        <Section title="4. Your account">
          You&apos;re responsible for keeping your email and password secure and for activity under your account.
          Use a real email you control. Don&apos;t share your login or use someone else&apos;s account.
        </Section>

        <Section title="5. Market data">
          Prices, news, and history come from third-party providers (such as Finnhub and Twelve Data). This data
          may be delayed, incomplete, or inaccurate, and may differ from your broker. We don&apos;t guarantee its
          accuracy and aren&apos;t liable for decisions made based on it.
        </Section>

        <Section title="6. Provided “as is”">
          MoneyMochi is provided “as is,” without warranties of any kind. We don&apos;t guarantee the app will be
          uninterrupted, error-free, or always available. To the fullest extent allowed by law, we&apos;re not
          liable for any losses arising from your use of the app.
        </Section>

        <Section title="7. Your data &amp; privacy">
          To run your account we store your email and the data you create (watchlist, portfolio holdings, and
          alerts) securely in our database (Supabase). We don&apos;t sell your personal data. You can sign out any
          time, and you can ask us to delete your account and data.
        </Section>

        <Section title="8. Acceptable use">
          Don&apos;t misuse the app — no attempting to break security, scrape at scale, disrupt the service, or use
          it for anything unlawful.
        </Section>

        <Section title="9. Changes to these terms">
          We may update these terms as the app grows. If we make important changes, we&apos;ll update the date at
          the top. Continuing to use MoneyMochi means you accept the latest version.
        </Section>

        <Section title="10. Contact">
          Questions about these terms? Reach out at <strong>yesswetravel@gmail.com</strong>.
        </Section>

        <div className="bg-sky-soft border-[1.5px] border-[#CFE3F6] border-l-[5px] border-l-sky rounded-[14px] p-3.5 mt-6 text-sm">
          <strong className="font-heading text-sky">📋 Education, not advice.</strong> MoneyMochi is for learning
          and organizing only. Nothing here is a recommendation to buy or sell any security.
        </div>
      </div>

      <p className="text-center text-xs text-muted mt-4">
        <Link href="/login" className="text-muted hover:text-ink no-underline">← Back to sign in</Link>
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="font-heading font-semibold text-base mb-1.5">{title}</h2>
      <p className="text-muted">{children}</p>
    </div>
  );
}
