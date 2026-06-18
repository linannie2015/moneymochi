@AGENTS.md

# MoneyMochi — Friendly Finance Dashboard

## ⚠️ Keep This File Updated (read first)
**After every change, update this file** — especially the **Supabase / Realtime** section and the **Status Log** at the bottom. This is the single source of truth for project state. Whenever we add a feature, fix a bug, change auth, touch Supabase, wire realtime data, or deploy — record it in the Status Log (newest first, with the date) so the next session knows exactly where things stand.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom design tokens in globals.css
- **Charts**: Recharts (AreaChart with gradient fills)
- **Icons**: Lucide React
- **Data**: Finnhub API (quotes, news, search) + Twelve Data API (price history)
- **Fonts**: Newsreader (serif), Hanken Grotesk (sans-serif), Fredoka (logo only) via Google Fonts
- **Logo**: SVG dango illustration (`public/logo-dango.svg`) + Fredoka gradient wordmark

## Font System (Direction C Brand Kit)
Three fonts, strict roles — reference: `MoneyMochi App.html`
- **Newsreader (serif)** `font-heading` — headings (h1–h4, weight 600), prices, numbers, tickers, table headers, buttons, explainer labels, disclaimer bold, score badges, support values
- **Hanken Grotesk (sans-serif)** body default — paragraphs, descriptions, input fields, card labels (uppercase tracking), change percentages (weight 800, no serif), mobile nav labels
- **Fredoka (rounded sans)** inline style only — logo wordmark "MoneyMochi" in TopBar + Footer. Never use for other elements.

## Design System
Custom CSS variables in `src/app/globals.css`:
- Colors: cream, peach, mint, lav, sky, sun, coral, grey
- Shadows: --shadow, --shadow-sm, --shadow-lg (rgba opacity .10/.08/.14)
- Radii: --r (20px), --r-sm (14px)
- Animations: slide-up, fade-in, pop, stagger-1..6, skeleton shimmer
- Logo gradient: `linear-gradient(120deg, #FF9E80, #FF6F91)` via `.gradient-text` class

## Project Structure
```
public/
├── logo-dango.svg       # Dango illustration (used in TopBar, Footer, section headers)
├── favicon.svg          # Browser favicon
├── icon-192.svg         # PWA icon 192px
├── icon-512.svg         # PWA icon 512px
└── manifest.json        # PWA manifest
src/
├── app/
│   ├── layout.tsx        # Root layout with TopBar + Footer + MobileNav
│   ├── page.tsx           # Home: Landing if logged out, watchlist if signed in
│   ├── globals.css        # Design system, fonts, animations
│   ├── stock/[ticker]/
│   │   └── page.tsx       # Stock detail (Hero → Chart → AI → News → Metrics → S/R → Entry/Exit)
│   ├── alerts/
│   │   └── page.tsx       # Price alerts management
│   ├── portfolio/
│   │   └── page.tsx       # Portfolio tracker (holdings, allocation pie, P&L)
│   ├── dca/
│   │   └── page.tsx       # DCA calculator (projections, growth chart, breakdown)
│   ├── login/
│   │   └── page.tsx       # Email + password sign in / sign up
│   └── account/
│       └── page.tsx       # Account settings (email, sign out)
├── components/
│   ├── TopBar.tsx           # Sticky header: SVG logo, search, dark mode toggle, desktop nav
│   ├── MobileNav.tsx        # Fixed bottom nav for mobile (md:hidden)
│   ├── SearchBar.tsx        # Autocomplete search (local + API)
│   ├── PortfolioSummary.tsx # Dashboard cards (tracking, avg change, leader, support)
│   ├── WatchlistTable.tsx   # Sortable watchlist with entry scores
│   ├── StockHero.tsx        # Stock detail hero card
│   ├── MochiInsights.tsx    # AI analysis with sentiment gauge + bull/bear factors
│   ├── MetricCard.tsx       # Financial metric card
│   ├── RangeBar.tsx         # 52-week range with support/resistance
│   ├── ScoreBadge.tsx       # Conic-gradient score ring
│   ├── PriceChart.tsx       # Area chart with period selector (1M/3M/6M/1Y)
│   ├── NewsSection.tsx      # News headline list
│   ├── Footer.tsx           # Footer: SVG logo, nav links, disclaimer
│   ├── Landing.tsx          # Logged-out welcome page (hero + feature cards)
│   └── AuthGate.tsx         # Redirects logged-out users off protected routes
└── lib/
    ├── types.ts            # TypeScript interfaces
    ├── utils.ts            # Formatters, entry status logic
    ├── demo-data.ts        # Demo stocks/news (deterministic, seeded random)
    ├── api.ts              # Finnhub + Twelve Data API clients
    ├── hooks.ts            # useStockData, useWatchlist (auto-fallback to demo)
    ├── supabase.ts         # Supabase client (null if env vars missing)
    └── auth.tsx            # AuthProvider + useAuth (email + password)
supabase/
└── schema.sql           # Per-user tables (watchlist, holdings, alerts) + RLS
```

## Data Architecture
- **No API keys**: Falls back to deterministic demo data (10 stocks, seeded PRNG for charts)
- **With API keys**: Fetches live quotes, news, price history from Finnhub + Twelve Data
- Set keys in `.env.local` (see `.env.local.example`)

## Supabase & Realtime Data (IN PROGRESS — keep updated)
**Supabase is connected.** Project ref `dmapwgxlossapbzyqyzd`. Client in `src/lib/supabase.ts` (returns `null` if env vars missing → app falls back to demo/localStorage). Keys in `.env.local` (URL + publishable + secret). Schema in `supabase/schema.sql`.

- **Phase 1 — Auth + Storage** *(in progress)*
  - ✅ **Auth**: email + password (`src/lib/auth.tsx` → `AuthProvider`/`useAuth`). Pages: `/login`, `/account`. Route protection via `src/components/AuthGate.tsx` (only `/` and `/login` are public; nav hidden when logged out). Logged-out `/` shows `src/components/Landing.tsx`.
    - Supabase setting required: **Authentication → Sign In/Providers → Email → "Confirm email" OFF** (instant signup, no email sender needed).
    - NOTE: email OTP (6-digit) was tried but needs custom SMTP to edit templates → switched to email+password instead.
  - ✅ **Tables** (per-user, Row Level Security so each user sees only their own): `watchlist`, `holdings`, `alerts`. See `supabase/schema.sql`.
  - ⏳ **TODO**: wire `useWatchlist` (hooks.ts), portfolio holdings (portfolio/page.tsx), and alerts (alerts/page.tsx) to read/write Supabase per-user. **Currently these still use localStorage.**
- **Phase 2 — Live Data Pipeline**: Edge Function on cron refreshes quotes/news/history into Supabase; frontend reads from Supabase; API keys move server-side only.
- **Phase 3 — Realtime Alerts**: alerts checked server-side each refresh; push via Supabase Realtime or email even when app is closed.
- **Phase 4 — AI Insights Cache**: cache Claude analysis in Supabase to cut cost / speed repeat views.

## Deployment
- **GitHub**: https://github.com/linannie2015/moneymochi (account: linannie2015). `.env.local` is gitignored — keys never committed.
- **Vercel**: deploy from GitHub. MUST add env vars in Vercel (the 5 from `.env.local`: Finnhub, Twelve Data, Supabase URL, Supabase anon/publishable, Supabase secret). After deploy, add the Vercel URL to Supabase → Auth → URL Configuration (Site URL + Redirect URLs).
- `npm run build` must pass before deploying (Turbopack dev does NOT type-check; the build does).

## Key Patterns
- Entry watch system: in-zone / approaching / near-highs / mid-range
- Support zone = 18% slice from 52-week low
- Watchlist table supports column sorting (click headers)
- Price chart: green/red gradient based on period performance
- Mochi Insights: AI analysis with sentiment gauge (0-100), bull/bear factors, expandable detail
- Portfolio Summary: dashboard cards with avg change, leader/laggard, near-support count
- Market status indicator: open/closed/pre-market/after-hours based on ET timezone
- Stock detail page order: Hero → Chart → AI Insights → News → Metrics → Support/Resistance → Entry/Exit

## Dev Commands
```sh
npm run dev     # Start dev server (Turbopack, port 3000)
npm run build   # Production build
npm run lint    # ESLint
```

## Rules
- Educational tool — NOT financial advice. Every page includes a disclaimer.
- No buy/sell recommendations. AI analysis framed as educational context.
- Support/resistance presented as historical zones, not predictions.
- Demo data uses fixed timestamps and seeded random to avoid hydration mismatches.

## Status Log (newest first — UPDATE AFTER EVERY CHANGE)
- **2026-06-18** — Added **sign-up disclaimer** ("By creating an account, you agree to our Terms & Conditions") and a **`/terms` page** (`src/app/terms/page.tsx`) — educational/not-advice, free/no-subscription, data & privacy, etc. Added `/terms` to `AuthGate` public paths. App intended for **public use, no subscription** currently.
- **2026-06-18** — Verified `npm run build` passes; fixed pre-existing build errors (Recharts Tooltip formatter types ×2, MochiInsights `onClick` passing event as AbortSignal, `useRef<ReturnType<typeof setTimeout>>` missing arg ×3). Prepared Vercel deploy guide (env vars). Pushed to GitHub.
- **2026-06-18** — Switched auth from email OTP to **email + password** (OTP needs custom SMTP; not worth it now). Updated `/login`, `/account`, `auth.tsx`.
- **2026-06-18** — Added **accounts**: `auth.tsx`, `/login`, `/account`, `Landing.tsx`, `AuthGate.tsx`. Removed "Built with Next.js" from footer. Hid nav when logged out.
- **2026-06-18** — Connected **Supabase** (project `dmapwgxlossapbzyqyzd`); created `watchlist`/`holdings`/`alerts` tables with RLS (`supabase/schema.sql`).
- **2026-06-18** — First push to **GitHub** (linannie2015/moneymochi). Logged out/in via Git Credential Manager.
- **Earlier this session** — Watchlist frozen column with pull-to-reveal (compact at rest, full name on pull). Fixed support-level calc per timeframe (detail page + watchlist). Fixed 9 review bugs.
- **NEXT** — Deploy to Vercel (add 5 env vars) → add Vercel URL to Supabase Auth redirect URLs → then wire per-user data (Phase 1 TODO above).
