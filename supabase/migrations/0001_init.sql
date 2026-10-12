-- Market Street, first database.
-- Safe to run again: tables use IF NOT EXISTS, functions use CREATE OR REPLACE,
-- and every policy is dropped before it is created.
-- Paste this whole file into the Supabase SQL Editor and press Run.
-- Do not put the service_role key anywhere in the app.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null check (kind in ('hostel', 'class', 'neighborhood', 'team')),
  -- Join codes stay in this table. The app never gets a select policy on it.
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 16),
  -- Shape: {"hair":"puff","outfit":"kente","shoes":"sandals"}
  avatar jsonb not null default '{}'::jsonb,
  group_id uuid references public.groups (id) on delete set null,
  coins int not null default 100 check (coins >= 0),
  reputation int not null default 0 check (reputation >= 0),
  stage text not null default 'stall',
  badges text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.stalls (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  leftover jsonb not null default '{}'::jsonb,
  upgrades text[] not null default '{}',
  regulars jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  event text not null default 'calm',
  stock_cost int not null check (stock_cost >= 0),
  revenue int not null check (revenue >= 0),
  profit int not null check (profit <= 150),
  items_sold int not null check (items_sold >= 0),
  customers int not null check (customers >= 0),
  -- Customer type counts, spoiled units, and the one-line reason.
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  week_id text not null,
  challenge_id text not null,
  proof_type text not null check (proof_type in ('photo', 'receipt', 'note')),
  proof_path text,
  note text check (note is null or char_length(note) <= 140),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (profile_id, week_id),
  check (proof_path is not null or note is not null)
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  week_id text not null,
  points int not null check (points >= 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 200),
  created_at timestamptz not null default now()
);

create index if not exists rounds_profile_created_idx
  on public.rounds (profile_id, created_at desc);

create index if not exists point_events_group_week_idx
  on public.point_events (group_id, week_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.stalls enable row level security;
alter table public.rounds enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.point_events enable row level security;
alter table public.reports enable row level security;

-- The app uses the anon key, so these roles must not read join codes.
revoke all on table public.groups from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.stalls from anon, authenticated;
revoke all on table public.rounds from anon, authenticated;
revoke all on table public.challenge_submissions from anon, authenticated;
revoke all on table public.point_events from anon, authenticated;
revoke all on table public.reports from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.stalls to authenticated;
grant select on table public.rounds to authenticated;
grant select on table public.point_events to authenticated;
grant select, insert on table public.challenge_submissions to authenticated;
grant insert on table public.reports to authenticated;

-- ---------------------------------------------------------------------------
-- Public group list. No join code.
-- security_invoker stays off so this view can count members even though
-- signed-in players have no select policy on groups.
-- ---------------------------------------------------------------------------

drop view if exists public.groups_public;

create view public.groups_public
with (security_invoker = false) as
select
  g.id,
  g.name,
  g.kind,
  (
    select count(*)::int
    from public.profiles as p
    where p.group_id = g.id
  ) as member_count
from public.groups as g;

revoke all on table public.groups_public from anon, authenticated;
grant select on table public.groups_public to authenticated;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select_signed_in on public.profiles;
create policy profiles_select_signed_in
  on public.profiles
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- groups: no select, insert, update, or delete policy on purpose.

drop policy if exists stalls_select_signed_in on public.stalls;
create policy stalls_select_signed_in
  on public.stalls
  for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists stalls_insert_own on public.stalls;
create policy stalls_insert_own
  on public.stalls
  for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists stalls_update_own on public.stalls;
create policy stalls_update_own
  on public.stalls
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists rounds_select_own on public.rounds;
create policy rounds_select_own
  on public.rounds
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists point_events_select_own on public.point_events;
create policy point_events_select_own
  on public.point_events
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists challenge_submissions_select_own on public.challenge_submissions;
create policy challenge_submissions_select_own
  on public.challenge_submissions
  for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists challenge_submissions_insert_own on public.challenge_submissions;
create policy challenge_submissions_insert_own
  on public.challenge_submissions
  for insert
  to authenticated
  with check (
    profile_id = auth.uid()
    and status = 'pending'
  );

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own
  on public.reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Profile guard. Coins, reputation, and the group are written only by the
-- functions below. A player can still change nickname, avatar, stage, badges.
-- ---------------------------------------------------------------------------

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if current_setting('app.allow_score_write', true) is distinct from 'on' then
      new.coins := 100;
      new.reputation := 0;
    end if;
    if current_setting('app.allow_group_write', true) is distinct from 'on' then
      new.group_id := null;
    end if;
    return new;
  end if;

  if current_setting('app.allow_score_write', true) is distinct from 'on' then
    new.coins := old.coins;
    new.reputation := old.reputation;
  end if;
  if current_setting('app.allow_group_write', true) is distinct from 'on' then
    new.group_id := old.group_id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields
  before insert or update on public.profiles
  for each row
  execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------------
-- Functions. security definer so they can read join codes and write rows
-- the player is not allowed to insert directly. search_path is fixed.
-- ---------------------------------------------------------------------------

create or replace function public.join_group_by_code(code text)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(code));
  v_group public.groups%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in before joining a group';
  end if;
  if not exists (select 1 from public.profiles where profiles.id = auth.uid()) then
    raise exception 'Create your profile before joining a group';
  end if;

  select * into v_group
  from public.groups
  where groups.code = v_code;

  if v_group.id is null then
    raise exception 'That code does not match a group';
  end if;

  perform set_config('app.allow_group_write', 'on', true);
  update public.profiles
  set group_id = v_group.id
  where profiles.id = auth.uid();

  return query select v_group.id, v_group.name;
end;
$$;

create or replace function public.get_group_rankings(week_id text)
returns table (
  rank int,
  group_id uuid,
  name text,
  points int,
  member_count int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week text := week_id;
begin
  if auth.uid() is null then
    raise exception 'Sign in before looking at rankings';
  end if;

  -- Inner names stay off the output columns. rank, name and points
  -- are return variables, and Postgres would mix them up with the query.
  return query
  select place, gid, group_name, total_points, members
  from (
    select
      rank() over (
        order by coalesce(sum(pe.points), 0) desc, g.name asc
      )::int as place,
      g.id as gid,
      g.name as group_name,
      coalesce(sum(pe.points), 0)::int as total_points,
      (
        select count(*)::int
        from public.profiles as p
        where p.group_id = g.id
      ) as members
    from public.groups as g
    left join public.point_events as pe
      on pe.group_id = g.id
      and pe.week_id = v_week
    group by g.id, g.name
  ) as ranked
  order by total_points desc, group_name asc;
end;
$$;

create or replace function public.record_round(
  stock_cost int,
  revenue int,
  profit int,
  items_sold int,
  customers int,
  event text,
  breakdown jsonb,
  started_at timestamptz
)
returns table (coins int, reputation int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profit int := profit;
  v_revenue int := revenue;
  v_stock int := stock_cost;
  v_items int := items_sold;
  v_customers int := customers;
  v_event text := coalesce(nullif(trim(event), ''), 'calm');
  v_started timestamptz := coalesce(started_at, now());
  v_group uuid;
  v_last timestamptz;
  v_coins int;
  v_reputation int;
begin
  if v_uid is null then
    raise exception 'Sign in before saving a round';
  end if;
  if v_stock < 0 or v_revenue < 0 or v_items < 0 or v_customers < 0 then
    raise exception 'Round numbers cannot be negative';
  end if;
  if v_profit is distinct from v_revenue - v_stock then
    raise exception 'Profit has to match revenue minus stock cost';
  end if;
  if v_profit > 150 then
    raise exception 'Profit cannot be more than 150 in one round';
  end if;

  select profiles.group_id, profiles.coins, profiles.reputation
  into v_group, v_coins, v_reputation
  from public.profiles
  where profiles.id = v_uid;

  if v_coins is null then
    raise exception 'Create your profile before saving a round';
  end if;

  select rounds.created_at into v_last
  from public.rounds
  where rounds.profile_id = v_uid
  order by rounds.created_at desc
  limit 1;

  if v_last is not null and v_last > now() - interval '50 seconds' then
    raise exception 'Wait a moment before the next round';
  end if;

  insert into public.rounds (
    profile_id,
    started_at,
    event,
    stock_cost,
    revenue,
    profit,
    items_sold,
    customers,
    breakdown
  )
  values (
    v_uid,
    v_started,
    v_event,
    v_stock,
    v_revenue,
    v_profit,
    v_items,
    v_customers,
    coalesce(breakdown, '{}'::jsonb)
  );

  v_coins := greatest(0, v_coins + v_profit);
  v_reputation := greatest(0, v_reputation + v_items);

  perform set_config('app.allow_score_write', 'on', true);
  update public.profiles
  set
    coins = v_coins,
    reputation = v_reputation
  where profiles.id = v_uid;

  if v_group is not null and v_profit > 0 then
    insert into public.point_events (profile_id, group_id, week_id, points, reason)
    values (
      v_uid,
      v_group,
      to_char(v_started, 'IYYY') || '-W' || to_char(v_started, 'IW'),
      v_profit,
      'round profit'
    );
  end if;

  return query select v_coins, v_reputation;
end;
$$;

create or replace function public.join_public_group(group_id uuid)
returns table (id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.groups%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in before joining a group';
  end if;
  if not exists (select 1 from public.profiles where profiles.id = auth.uid()) then
    raise exception 'Create your profile before joining a group';
  end if;

  select * into v_group
  from public.groups
  where groups.id = group_id;

  if v_group.id is null then
    raise exception 'That group is not on the list';
  end if;

  perform set_config('app.allow_group_write', 'on', true);
  update public.profiles
  set group_id = v_group.id
  where profiles.id = auth.uid();

  return query select v_group.id, v_group.name;
end;
$$;

revoke all on function public.join_group_by_code(text) from public, anon;
revoke all on function public.join_public_group(uuid) from public, anon;
revoke all on function public.get_group_rankings(text) from public, anon;
revoke all on function public.record_round(int, int, int, int, int, text, jsonb, timestamptz) from public, anon;
revoke all on function public.protect_profile_fields() from public, anon, authenticated;

grant execute on function public.join_group_by_code(text) to authenticated;
grant execute on function public.join_public_group(uuid) to authenticated;
grant execute on function public.get_group_rankings(text) to authenticated;
grant execute on function public.record_round(int, int, int, int, int, text, jsonb, timestamptz) to authenticated;

-- No trigger on auth.users. The app creates the profile after LET'S GO.

-- ---------------------------------------------------------------------------
-- Private proof photos. Images only, 2 MB, own folder only.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs',
  'proofs',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists proofs_insert_own on storage.objects;
create policy proofs_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists proofs_select_own on storage.objects;
create policy proofs_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
