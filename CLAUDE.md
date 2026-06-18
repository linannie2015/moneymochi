@AGENTS.md

# MoneyMochi — Friendly Finance Dashboard

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
│   ├── page.tsx           # Watchlist home (uses useWatchlist hook)
│   ├── globals.css        # Design system, fonts, animations
│   ├── stock/[ticker]/
│   │   └── page.tsx       # Stock detail (Hero → Chart → AI → News → Metrics → S/R → Entry/Exit)
│   ├── alerts/
│   │   └── page.tsx       # Price alerts management
│   ├── portfolio/
│   │   └── page.tsx       # Portfolio tracker (holdings, allocation pie, P&L)
│   └── dca/
│       └── page.tsx       # DCA calculator (projections, growth chart, breakdown)
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
│   └── Footer.tsx           # Footer: SVG logo, nav links, disclaimer
└── lib/
    ├── types.ts            # TypeScript interfaces
    ├── utils.ts            # Formatters, entry status logic
    ├── demo-data.ts        # Demo stocks/news (deterministic, seeded random)
    ├── api.ts              # Finnhub + Twelve Data API clients
    ├── hooks.ts            # useStockData, useWatchlist (auto-fallback to demo)
    └── supabase.ts         # Supabase client (optional)
```

## Data Architecture
- **No API keys**: Falls back to deterministic demo data (10 stocks, seeded PRNG for charts)
- **With API keys**: Fetches live quotes, news, price history from Finnhub + Twelve Data
- Set keys in `.env.local` (see `.env.local.example`)

## Supabase Migration (Planned)
Currently all persistence uses localStorage (watchlist, portfolio holdings, alerts, theme preference).
The Supabase client is scaffolded in `src/lib/supabase.ts`; env vars are in `.env.local.example`.

When ready to migrate:
1. **Phase 1 — Auth + Storage**: Move watchlist, portfolio, alerts to Supabase tables. Add auth (magic link or OAuth). Users get cross-device sync.
2. **Phase 2 — Live Data Pipeline**: Supabase Edge Function on a cron refreshes stock quotes, news, and price history from Finnhub + Twelve Data into Supabase. Frontend reads from Supabase instead of calling APIs directly. API keys move to server-side only.
3. **Phase 3 — Real-time Alerts**: Price alerts checked server-side on each refresh. Push notifications via Supabase Realtime or email when targets are hit — works even when the app is closed.
4. **Phase 4 — AI Insights Cache**: Cache Anthropic Claude analysis in Supabase to reduce API costs and speed up repeat views.

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
