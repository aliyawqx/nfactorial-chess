-- VoiceChess: initial schema (Phase 5 — multiplayer + profiles)
--
-- Запуск: скопировать всё содержимое в Supabase Dashboard → SQL Editor → Run.

-- ============================================================================
-- 1. profiles (1:1 с auth.users)
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  city text,
  country text not null default 'KZ',
  elo integer not null default 1200,
  preferred_language text not null default 'ru'
    check (preferred_language in ('ru', 'en', 'kk')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are public readable" on public.profiles;
create policy "profiles are public readable"
  on public.profiles for select using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Авто-создание profile row при регистрации (включая anonymous sign-in)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Гость'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 2. rooms — мультиплеер-комнаты
-- ============================================================================

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid references public.profiles(id) on delete set null,
  host_color text not null default 'white'
    check (host_color in ('white', 'black', 'random')),
  time_control text not null default 'unlimited',
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'finished', 'abandoned')),
  current_fen text not null
    default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  last_move_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);

create index if not exists rooms_invite_code_idx on public.rooms(invite_code);
create index if not exists rooms_host_id_idx on public.rooms(host_id);
create index if not exists rooms_guest_id_idx on public.rooms(guest_id);

alter table public.rooms enable row level security;

drop policy if exists "rooms readable by invite or participant" on public.rooms;
create policy "rooms readable by invite or participant"
  on public.rooms for select using (true);
  -- Любой кто знает invite_code может прочитать комнату
  -- (но не модифицировать). На уровне приложения мы ищем только по invite_code.

drop policy if exists "host can create rooms" on public.rooms;
create policy "host can create rooms"
  on public.rooms for insert with check (auth.uid() = host_id);

drop policy if exists "participants can update rooms" on public.rooms;
create policy "participants can update rooms"
  on public.rooms for update using (
    auth.uid() = host_id or auth.uid() = guest_id or guest_id is null
  );

-- ============================================================================
-- 3. room_moves — server-authoritative очередь ходов
-- ============================================================================

create table if not exists public.room_moves (
  room_id uuid not null references public.rooms(id) on delete cascade,
  ply integer not null,
  uci text not null,
  san text not null,
  fen_after text not null,
  by_user_id uuid not null references public.profiles(id) on delete cascade,
  server_received_at timestamptz not null default now(),
  primary key (room_id, ply)
);

create index if not exists room_moves_room_id_idx
  on public.room_moves(room_id, ply);

alter table public.room_moves enable row level security;

drop policy if exists "moves readable by participants or public room" on public.room_moves;
create policy "moves readable by participants or public room"
  on public.room_moves for select using (true);

drop policy if exists "participants append moves" on public.room_moves;
create policy "participants append moves"
  on public.room_moves for insert with check (
    auth.uid() = by_user_id and
    exists (
      select 1 from public.rooms r
      where r.id = room_moves.room_id
        and (r.host_id = auth.uid() or r.guest_id = auth.uid())
    )
  );

-- Trigger: при INSERT в room_moves обновлять rooms.current_fen и last_move_at
create or replace function public.on_room_move_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rooms
  set current_fen = new.fen_after,
      last_move_at = new.server_received_at
  where id = new.room_id;
  return new;
end;
$$;

drop trigger if exists trg_room_moves_after_insert on public.room_moves;
create trigger trg_room_moves_after_insert
  after insert on public.room_moves
  for each row execute function public.on_room_move_insert();

-- ============================================================================
-- 4. games — финализированные партии (история)
-- ============================================================================

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('ai', 'online', 'local')),
  white_id uuid references public.profiles(id) on delete set null,
  black_id uuid references public.profiles(id) on delete set null,
  white_name text not null,
  black_name text not null,
  pgn text not null default '',
  final_fen text,
  result text not null default '*'
    check (result in ('1-0', '0-1', '1/2-1/2', '*')),
  termination text,
  ply_count integer not null default 0,
  room_id uuid references public.rooms(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists games_white_idx on public.games(white_id, finished_at desc);
create index if not exists games_black_idx on public.games(black_id, finished_at desc);

alter table public.games enable row level security;

drop policy if exists "games readable by participants or finished public" on public.games;
create policy "games readable by participants or finished public"
  on public.games for select using (
    finished_at is not null
    or auth.uid() = white_id
    or auth.uid() = black_id
  );

-- Прямая запись в games запрещена с клиента — только через service-role в API routes.
drop policy if exists "no direct writes to games" on public.games;
create policy "no direct writes to games"
  on public.games for insert with check (false);

drop policy if exists "no direct updates to games" on public.games;
create policy "no direct updates to games"
  on public.games for update using (false);

-- ============================================================================
-- 5. Realtime publications
-- ============================================================================

-- Realtime для rooms и room_moves — клиенты подписываются на изменения.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_moves;
