-- VoiceChess: leaderboard (Phase 7a)
--
-- Запуск: вставить в Supabase Dashboard → SQL Editor → Run.

-- Materialized view с рейтингом игроков по ELO + их статистикой.
-- Содержит только профили с display_name (анонимные «Гость» исключены)
-- и хотя бы одной законченной партией.

drop materialized view if exists public.leaderboard;

create materialized view public.leaderboard as
select
  p.id,
  p.display_name,
  p.city,
  p.country,
  p.elo,
  count(g.id) filter (where g.finished_at is not null) as games_played,
  count(g.id) filter (
    where (g.white_id = p.id and g.result = '1-0')
       or (g.black_id = p.id and g.result = '0-1')
  ) as wins,
  count(g.id) filter (
    where (g.white_id = p.id and g.result = '0-1')
       or (g.black_id = p.id and g.result = '1-0')
  ) as losses,
  count(g.id) filter (
    where (g.white_id = p.id or g.black_id = p.id) and g.result = '1/2-1/2'
  ) as draws
from public.profiles p
left join public.games g
  on (g.white_id = p.id or g.black_id = p.id)
group by p.id;

create unique index leaderboard_id_idx on public.leaderboard(id);
create index leaderboard_elo_idx on public.leaderboard(elo desc);
create index leaderboard_city_idx on public.leaderboard(country, city, elo desc);

-- Функция для обновления view (вызывается из приложения после finalize)
create or replace function public.refresh_leaderboard()
returns void
language sql
security definer
as $$
  refresh materialized view concurrently public.leaderboard;
$$;

grant execute on function public.refresh_leaderboard() to anon, authenticated;

-- Public read access. Materialized views в Supabase не имеют RLS,
-- но мы открываем доступ через GRANT.
grant select on public.leaderboard to anon, authenticated;
