-- =====================================================================
--  MoneyMochi backend schema  (Supabase / Postgres)
--  Run this in the Supabase SQL editor to create your tables.
-- =====================================================================

-- Stocks you track (your watchlist lives here, server-side)
create table if not exists stocks (
  ticker     text primary key,
  name       text,
  is_etf     boolean default false,
  added_at   timestamptz default now()
);

-- Latest price + valuation snapshot per ticker (your dashboard reads this)
create table if not exists quotes (
  ticker        text primary key references stocks(ticker) on delete cascade,
  price         numeric,
  change_pct    numeric,
  pe            numeric,
  market_cap    numeric,
  week52_high   numeric,
  week52_low    numeric,
  support_low   numeric,
  support_high  numeric,
  as_of         timestamptz default now()
);

-- Daily closing prices for the history chart
create table if not exists prices_daily (
  ticker  text references stocks(ticker) on delete cascade,
  d       date,
  close   numeric,
  primary key (ticker, d)
);

-- Cached news headlines per ticker
create table if not exists news (
  id            bigint generated always as identity primary key,
  ticker        text references stocks(ticker) on delete cascade,
  headline      text,
  url           text,
  source        text,
  published_at  timestamptz,
  unique (ticker, url)
);

-- Price alerts (these are what let alerts fire when the app is closed)
create table if not exists watches (
  id           uuid primary key default gen_random_uuid(),
  ticker       text,
  target       numeric,
  mode         text default 'drop',        -- 'drop' = alert when price <= target
  triggered    boolean default false,
  notify_email text,
  created_at   timestamptz default now()
);

-- (Optional) AI-generated analysis, refreshed on a schedule
create table if not exists analysis (
  ticker        text primary key references stocks(ticker) on delete cascade,
  body          text,
  score         int,
  generated_at  timestamptz default now()
);

-- Seed your starting watchlist
insert into stocks (ticker, name, is_etf) values
  ('RKLB','Rocket Lab', false),
  ('AMD','Advanced Micro Devices', false),
  ('MU','Micron Technology', false),
  ('MSTR','Strategy (MicroStrategy)', false),
  ('VOO','Vanguard S&P 500 ETF', true),
  ('QQQM','Invesco Nasdaq-100 ETF', true),
  ('GOOGL','Alphabet', false),
  ('MSFT','Microsoft', false),
  ('META','Meta Platforms', false),
  ('AMZN','Amazon', false)
on conflict (ticker) do nothing;

-- =====================================================================
--  Schedule the refresh function with pg_cron (enable the extension first
--  under Database > Extensions: pg_cron and pg_net).
--  Replace <PROJECT_REF> and <SERVICE_KEY> with your own values.
--  This runs every 30 minutes; adjust the cron expression as you like.
-- =====================================================================
-- select cron.schedule(
--   'moneymochi-refresh',
--   '*/30 * * * *',
--   $$ select net.http_post(
--        url := 'https://<PROJECT_REF>.functions.supabase.co/refresh',
--        headers := '{"Authorization":"Bearer <SERVICE_KEY>","Content-Type":"application/json"}'::jsonb
--      ); $$
-- );
