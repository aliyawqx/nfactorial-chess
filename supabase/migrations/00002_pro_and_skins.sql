alter table public.profiles
  add column if not exists is_pro boolean not null default false,
  add column if not exists active_skin text not null default 'cburnett',
  add column if not exists pro_purchased_at timestamptz;

-- stripe_events — идемпотентность webhooks
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);
-- без RLS — доступ только через service-role

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null,
  amount_cents integer not null,
  currency text not null default 'usd',
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx
  on public.purchases(user_id, created_at desc);

alter table public.purchases enable row level security;

drop policy if exists "users see own purchases" on public.purchases;
create policy "users see own purchases"
  on public.purchases for select using (auth.uid() = user_id);

-- запись только через service-role (stripe webhook)
drop policy if exists "no direct writes to purchases" on public.purchases;
create policy "no direct writes to purchases"
  on public.purchases for insert with check (false);
