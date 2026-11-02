-- Guinea Run Hall of Fame, in Supabase.
--
-- Safe to run again: node scripts/guinea-run/supabase.mjs apply
--
-- The game sends two kinds of rows with the publishable key, and can read
-- nothing back but the boards:
--   guinea_names   a player's nickname and guinea pig, one row per change
--   guinea_scores  a new personal best of one board, signed by the game
-- A player is a random id the game draws on its device. The views never show
-- it, so nobody can tell who is who or send under someone else's id.
--
-- Nothing personal is stored: the nickname is the only text a player types,
-- and names that look like an email or a web address are refused.
--
-- Private schema guinea_private: the signing keys, the limits, the banned
-- players, and the checks. The API never exposes that schema. The limits are
-- pushed by supabase.mjs settings from a file outside the repository, on
-- purpose: their values are never written here.
--
-- Every object is prefixed guinea_ or lives in guinea_private: the project is
-- shared with another game.

create schema if not exists guinea_private;
revoke all on schema guinea_private from public, anon, authenticated;

-- ---------- Private tables ----------

create table if not exists guinea_private.keys (
  id integer primary key,
  secret bytea not null
);

create table if not exists guinea_private.settings (
  id boolean primary key default true check (id),
  value jsonb not null default '{}'::jsonb
);
insert into guinea_private.settings (id) values (true) on conflict (id) do nothing;

create table if not exists guinea_private.banned (
  player_id uuid primary key,
  note text,
  at timestamptz not null default now()
);

alter table guinea_private.keys enable row level security;
alter table guinea_private.settings enable row level security;
alter table guinea_private.banned enable row level security;
revoke all on all tables in schema guinea_private from public, anon, authenticated;

-- ---------- Public tables: insert only ----------

create table if not exists public.guinea_names (
  id bigint generated always as identity primary key,
  player_id uuid not null,
  name text not null,
  coat text not null,
  created_at timestamptz not null default now()
);
create index if not exists guinea_names_by_player on public.guinea_names (player_id, created_at desc);

create table if not exists public.guinea_scores (
  id bigint generated always as identity primary key,
  player_id uuid not null,
  board text not null,
  score bigint not null,
  stars integer,
  boss_ms integer,
  mode text,
  level integer,
  missions integer,
  notes integer,
  admins integer,
  play_ms bigint,
  at bigint not null,
  version text not null,
  key_id integer not null,
  sig text not null,
  created_at timestamptz not null default now()
);
create index if not exists guinea_scores_by_player on public.guinea_scores (player_id, board, score desc);
create index if not exists guinea_scores_recent on public.guinea_scores (player_id, board, created_at desc);

alter table public.guinea_names enable row level security;
alter table public.guinea_scores enable row level security;
drop policy if exists "add names" on public.guinea_names;
create policy "add names" on public.guinea_names for insert to anon, authenticated with check (true);
drop policy if exists "add scores" on public.guinea_scores;
create policy "add scores" on public.guinea_scores for insert to anon, authenticated with check (true);
revoke all on public.guinea_names, public.guinea_scores from public, anon, authenticated;
grant insert (player_id, name, coat) on public.guinea_names to anon, authenticated;
grant insert (player_id, board, score, stars, boss_ms, mode, level, missions, notes, admins, play_ms, at, version, key_id, sig)
  on public.guinea_scores to anon, authenticated;

-- ---------- The checks ----------

-- The coats the game offers (guinea-run.css .gr-coat--<code>)
create or replace function guinea_private.coats() returns text[]
language sql immutable as $$ select array['agouti', 'golden', 'chocolate', 'snow', 'slate', 'ginger'] $$;

-- base64url without padding, as the game writes its signatures (core/tally.js)
create or replace function guinea_private.b64url(data bytea) returns text
language sql immutable as $$
  select rtrim(translate(replace(encode(data, 'base64'), E'\n', ''), '+/', '-_'), '=') $$;

-- The text a row stands for, exactly as core/tally.js builds it
create or replace function guinea_private.signed_text(s public.guinea_scores) returns text
language sql immutable as $$
  select case
    when s.board = 'pinball' then concat_ws('|', 'p1', s.score, s.play_ms, s.level, s.missions, s.notes, s.at, s.version, s.key_id)
    when s.board = 'orgman' then concat_ws('|', 'o1', s.score, s.play_ms, s.level, s.admins, s.at, s.version, s.key_id)
    else concat_ws('|', 'r2', substr(s.board, 2), s.score, s.stars, coalesce(s.boss_ms::text, ''), s.mode, s.at, s.version, s.key_id)
  end $$;

-- A number of the limits, or its fallback (the fallbacks are public, the real values are not)
create or replace function guinea_private.limit_of(path text[], fallback numeric) returns numeric
language sql stable security definer set search_path = '' as $$
  select coalesce((select (value #>> path)::numeric from guinea_private.settings where id), fallback) $$;

create or replace function guinea_private.guard_name() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from guinea_private.banned where player_id = new.player_id) then
    raise exception 'banned';
  end if;
  new.name := btrim(new.name);
  if char_length(new.name) < 1 or char_length(new.name) > 20 or new.name ~ '[[:cntrl:]]'
     or position('@' in new.name) > 0 or new.name ~* '(://|www\.)' then
    raise exception 'bad name';
  end if;
  if not (new.coat = any (guinea_private.coats())) then
    raise exception 'bad coat';
  end if;
  if exists (select 1 from public.guinea_names where player_id = new.player_id and created_at > now() - interval '10 seconds') then
    raise exception 'too soon';
  end if;
  return new;
end $$;

create or replace function guinea_private.guard_score() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  secret bytea;
  w integer;
  now_ms bigint := floor(extract(epoch from now()) * 1000);
begin
  if exists (select 1 from guinea_private.banned where player_id = new.player_id) then
    raise exception 'banned';
  end if;
  if not exists (select 1 from public.guinea_names where player_id = new.player_id) then
    raise exception 'no name';
  end if;
  if exists (select 1 from public.guinea_scores where player_id = new.player_id and board = new.board
             and created_at > now() - interval '10 seconds') then
    raise exception 'too soon';
  end if;

  -- The signature
  select k.secret into secret from guinea_private.keys k where k.id = new.key_id;
  if secret is null then
    raise exception 'unknown key';
  end if;
  if char_length(new.version) > 40 or new.sig is distinct from guinea_private.b64url(
       extensions.hmac(convert_to(guinea_private.signed_text(new), 'UTF8'), secret, 'sha256')) then
    raise exception 'bad sig';
  end if;

  -- Played before it is sent, give or take the clock of the device
  if new.at <= 0 or new.at > now_ms + 3600000 then
    raise exception 'bad date';
  end if;
  if new.score <= 0 then
    raise exception 'bad score';
  end if;

  if new.board = 'pinball' then
    if new.play_ms is null or new.play_ms < 30000 or new.play_ms > 8 * 3600000
       or new.level is null or new.level not between 1 and 1000
       or new.missions is null or new.missions not between 0 and 100000
       or new.notes is null or new.notes not between 0 and 100000 then
      raise exception 'bad pinball';
    end if;
    if new.score > guinea_private.limit_of('{pinballCap}', 1000000000)
       or new.score > guinea_private.limit_of('{pinballBase}', 3000000)
                      + guinea_private.limit_of('{pinballPerMinute}', 12000000) * new.play_ms / 60000 then
      raise exception 'over limits';
    end if;
  elsif new.board = 'orgman' then
    if new.play_ms is null or new.play_ms < 15000 or new.play_ms > 8 * 3600000
       or new.level is null or new.level not between 1 and 1000
       or new.admins is null or new.admins not between 0 and 100000 then
      raise exception 'bad orgman';
    end if;
    -- No maze cleared faster than a guinea pig can eat it, no more points than the mazes reached hold
    if new.level > 1 + new.play_ms / 15000.0
       or new.score > guinea_private.limit_of(array['orgmanMazes', (new.level - 1)::text], 0)
       or new.score > guinea_private.limit_of('{orgmanCap}', 50000000)
       or new.score > guinea_private.limit_of('{orgmanBase}', 30000)
                      + guinea_private.limit_of('{orgmanPerMinute}', 60000) * new.play_ms / 60000 then
      raise exception 'over limits';
    end if;
  elsif new.board ~ '^w[0-9]$' then
    w := substr(new.board, 2)::integer;
    if new.stars is null or new.stars not between 1 and 3 or new.mode is null or new.mode not in ('easy', 'normal', 'hard')
       or (new.boss_ms is not null and new.boss_ms < 0) then
      raise exception 'bad world';
    end if;
    if new.score > guinea_private.limit_of(array['caps', w::text], 20000)
       or (new.boss_ms is not null and new.boss_ms < guinea_private.limit_of(array['minBossMs', w::text], 0)) then
      raise exception 'over limits';
    end if;
  else
    raise exception 'bad board';
  end if;

  -- Only a new personal best is kept: the table stays small
  if exists (select 1 from public.guinea_scores where player_id = new.player_id and board = new.board and score >= new.score) then
    raise exception 'not better';
  end if;
  return new;
end $$;

revoke all on all functions in schema guinea_private from public, anon, authenticated;

drop trigger if exists guinea_names_guard on public.guinea_names;
create trigger guinea_names_guard before insert on public.guinea_names
  for each row execute function guinea_private.guard_name();
drop trigger if exists guinea_scores_guard on public.guinea_scores;
create trigger guinea_scores_guard before insert on public.guinea_scores
  for each row execute function guinea_private.guard_score();

-- ---------- The boards ----------

drop view if exists public.guinea_board;
drop view if exists public.guinea_totals;
drop view if exists guinea_private.totals;
drop view if exists guinea_private.best;
drop view if exists guinea_private.names;

-- Each player's newest nickname and guinea pig
create view guinea_private.names as
  select distinct on (player_id) player_id, name, coat
  from public.guinea_names
  order by player_id, created_at desc;

-- Each player's best row of each board: score, then stars, then the fastest boss, then who got there first
create view guinea_private.best as
  select distinct on (s.board, s.player_id)
    s.board, s.player_id, s.score, s.stars, s.boss_ms, s.mode, s.level, s.missions, s.admins, s.play_ms, s.at, s.created_at
  from public.guinea_scores s
  where not exists (select 1 from guinea_private.banned b where b.player_id = s.player_id)
  order by s.board, s.player_id, s.score desc, s.stars desc nulls last, s.boss_ms asc nulls last, s.level desc nulls last, s.at asc;

-- All worlds: the best score of each world, added up
create view guinea_private.totals as
  select b.player_id, sum(b.score)::bigint as total, sum(coalesce(b.stars, 0))::integer as stars,
         count(*)::integer as worlds, min(b.created_at) as since
  from guinea_private.best b
  where b.board ~ '^w[0-9]$'
  group by b.player_id;

create view public.guinea_board as
  select b.board, n.name, n.coat, b.score, b.stars, b.boss_ms, b.mode, b.level, b.missions, b.admins, b.play_ms,
         to_timestamp(b.at / 1000.0) as played_at
  from guinea_private.best b
  join guinea_private.names n using (player_id);

create view public.guinea_totals as
  select n.name, n.coat, t.total, t.stars, t.worlds, t.since
  from guinea_private.totals t
  join guinea_private.names n using (player_id);

revoke all on public.guinea_board, public.guinea_totals from public, anon, authenticated;
grant select on public.guinea_board, public.guinea_totals to anon, authenticated;
revoke all on guinea_private.names, guinea_private.best, guinea_private.totals from public, anon, authenticated;

-- ---------- What only the player can ask (their id is the secret) ----------

-- My rank on each board I am on, and on the general board ('all')
create or replace function public.guinea_ranks(pid uuid) returns table (board text, rank integer, players integer)
language sql stable security definer set search_path = '' as $$
  with named as (
    select b.* from guinea_private.best b where exists (select 1 from guinea_private.names n where n.player_id = b.player_id)
  ), ranked as (
    select r.board, r.player_id,
           (row_number() over (partition by r.board order by r.score desc, r.stars desc nulls last, r.boss_ms asc nulls last,
                                                              r.level desc nulls last, r.at asc))::integer as rank,
           (count(*) over (partition by r.board))::integer as players
    from named r
  ), overall as (
    select 'all'::text as board, t.player_id,
           (row_number() over (order by t.total desc, t.stars desc, t.since asc))::integer as rank,
           (count(*) over ())::integer as players
    from guinea_private.totals t
    where exists (select 1 from guinea_private.names n where n.player_id = t.player_id)
  )
  select x.board, x.rank, x.players from (select * from ranked union all select * from overall) x where x.player_id = pid $$;

-- Removes a player from the Hall of Fame: every name and score of that id
create or replace function public.guinea_forget(pid uuid) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer;
  m integer;
begin
  delete from public.guinea_scores where player_id = pid;
  get diagnostics n = row_count;
  delete from public.guinea_names where player_id = pid;
  get diagnostics m = row_count;
  return n + m;
end $$;

-- Whether the game and the database agree on a key: sig is the game's signature
-- of the probe below (scripts/guinea-run/key-check.mjs). It says nothing else.
create or replace function public.guinea_key_ok(k integer, sig text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select guinea_private.b64url(extensions.hmac(convert_to(concat_ws('|', 'r2', 0, 1234, 2, 45678, 'easy', 1767225600000, 'key-check', k), 'UTF8'), secret, 'sha256')) = sig
    from guinea_private.keys where id = k), false) $$;

revoke all on function public.guinea_ranks(uuid), public.guinea_forget(uuid), public.guinea_key_ok(integer, text) from public, anon, authenticated;
grant execute on function public.guinea_ranks(uuid), public.guinea_forget(uuid), public.guinea_key_ok(integer, text) to anon, authenticated;
