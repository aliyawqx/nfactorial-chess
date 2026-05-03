alter table public.rooms
  add column if not exists initial_ms integer,
  add column if not exists increment_ms integer not null default 0,
  add column if not exists white_clock_ms integer,
  add column if not exists black_clock_ms integer;

alter table public.room_moves
  add column if not exists time_spent_ms integer;

-- before-trigger чтобы записать time_spent_ms в new и обновить часы атомарно
create or replace function public.on_room_move_insert_clock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rooms%rowtype;
  prev_time timestamptz;
  elapsed_ms integer;
  is_white_move boolean;
  current_clock integer;
  new_clock integer;
begin
  select * into r from public.rooms where id = new.room_id;

  is_white_move := (new.ply % 2 = 1);
  prev_time := coalesce(r.last_move_at, r.created_at);
  elapsed_ms := greatest(0, extract(epoch from (new.server_received_at - prev_time)) * 1000)::integer;

  if r.initial_ms is not null then
    current_clock := case when is_white_move then r.white_clock_ms else r.black_clock_ms end;
    if current_clock is null then current_clock := r.initial_ms; end if;
    new_clock := greatest(0, current_clock - elapsed_ms + coalesce(r.increment_ms, 0));

    if is_white_move then
      update public.rooms
        set white_clock_ms = new_clock,
            current_fen = new.fen_after,
            last_move_at = new.server_received_at
        where id = new.room_id;
    else
      update public.rooms
        set black_clock_ms = new_clock,
            current_fen = new.fen_after,
            last_move_at = new.server_received_at
        where id = new.room_id;
    end if;

    new.time_spent_ms := elapsed_ms;
  else
    update public.rooms
      set current_fen = new.fen_after,
          last_move_at = new.server_received_at
      where id = new.room_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_room_moves_after_insert on public.room_moves;
drop trigger if exists trg_room_moves_before_insert on public.room_moves;
create trigger trg_room_moves_before_insert
  before insert on public.room_moves
  for each row execute function public.on_room_move_insert_clock();
