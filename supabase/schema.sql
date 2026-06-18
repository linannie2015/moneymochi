-- ============================================================================
--  MoneyMochi — Database blueprint (Supabase / Postgres)
--  Phase 1: Accounts + Login. Each user has their OWN private data.
--
--  HOW TO USE:
--    1. Open your Supabase project → click "SQL Editor" in the left menu
--    2. Click "New query"
--    3. Paste this ENTIRE file
--    4. Click "Run"  (you should see "Success. No rows returned")
--
--  What this creates:
--    • watchlist  — the tickers each user follows
--    • holdings   — each user's portfolio (shares + average cost)
--    • alerts     — each user's price alerts
--  Plus "Row Level Security" so each person only ever sees their own rows.
-- ============================================================================


-- ----------------------------------------------------------------------------
--  1. WATCHLIST  — one row per ticker a user follows
-- ----------------------------------------------------------------------------
create table if not exists watchlist (
  user_id   uuid not null references auth.users(id) on delete cascade default auth.uid(),
  ticker    text not null,
  name      text,
  is_etf    boolean default false,
  added_at  timestamptz default now(),
  primary key (user_id, ticker)        -- a user can't add the same ticker twice
);

alter table watchlist enable row level security;

-- "A user can read/add/change/delete ONLY their own watchlist rows."
create policy "own watchlist" on watchlist
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
--  2. HOLDINGS  — a user's portfolio positions
-- ----------------------------------------------------------------------------
create table if not exists holdings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  ticker     text not null,
  shares     numeric not null default 0,
  avg_cost   numeric not null default 0,
  created_at timestamptz default now()
);

alter table holdings enable row level security;

create policy "own holdings" on holdings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
--  3. ALERTS  — a user's price alerts
-- ----------------------------------------------------------------------------
create table if not exists alerts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  ticker     text not null,
  target     numeric not null,
  triggered  boolean default false,
  created_at timestamptz default now()
);

alter table alerts enable row level security;

create policy "own alerts" on alerts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
--  4. Speed: indexes so "give me MY rows" stays fast as data grows
-- ----------------------------------------------------------------------------
create index if not exists watchlist_user_idx on watchlist (user_id);
create index if not exists holdings_user_idx  on holdings  (user_id);
create index if not exists alerts_user_idx    on alerts    (user_id);

-- ============================================================================
--  Done. Tables are created and locked down per-user.
--  Email login is already ON by default in Supabase
--  (Authentication → Providers → Email). No extra setup needed.
-- ============================================================================
