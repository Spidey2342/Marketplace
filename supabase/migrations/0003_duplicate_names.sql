-- Duplicate nicknames: each player gets a tag so Nickname#tag is unique.
-- Safe to run again.

alter table public.profiles
  add column if not exists tag smallint check (tag between 1000 and 9999),
  add column if not exists nickname_changed_at timestamptz;

-- Backfill tags for existing profiles.
do $$
declare
  row record;
  candidate int;
  tries int;
begin
  for row in
    select id, nickname
    from public.profiles
    where tag is null
  loop
    tries := 0;
    loop
      tries := tries + 1;
      candidate := 1000 + floor(random() * 9000)::int;
      exit when not exists (
        select 1
        from public.profiles p
        where lower(p.nickname) = lower(row.nickname)
          and p.tag = candidate
      );
      if tries >= 40 then
        raise exception 'Could not assign tag for profile %', row.id;
      end if;
    end loop;
    update public.profiles
    set tag = candidate
    where id = row.id;
  end loop;
end;
$$;

alter table public.profiles
  alter column tag set not null;

create unique index if not exists profiles_nickname_tag_idx
  on public.profiles (lower(nickname), tag);

create table if not exists public.blocked_words (
  word text primary key
);

insert into public.blocked_words (word)
values
  ('placeholder1'),
  ('placeholder2'),
  ('placeholder3')
on conflict (word) do nothing;

alter table public.blocked_words enable row level security;

-- No client access to blocked_words.

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
    if current_setting('app.allow_nickname_write', true) is distinct from 'on' then
      if new.tag is null then
        raise exception 'Use set_nickname to choose your name';
      end if;
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
  if current_setting('app.allow_nickname_write', true) is distinct from 'on' then
    new.nickname := old.nickname;
    new.tag := old.tag;
    new.nickname_changed_at := old.nickname_changed_at;
  end if;
  return new;
end;
$$;

create or replace function public.set_nickname(new_nickname text)
returns table (nickname text, tag smallint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(new_nickname);
  v_tag smallint;
  v_try int := 0;
  v_row public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Sign in before choosing a name';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 16 then
    raise exception 'invalid_name';
  end if;

  if exists (
    select 1
    from public.blocked_words bw
    where position(lower(bw.word) in lower(v_name)) > 0
  ) then
    raise exception 'name_not_allowed';
  end if;

  select * into v_row from public.profiles where id = v_uid;

  if v_row.id is not null then
    if lower(v_row.nickname) = lower(v_name) and v_row.tag is not null then
      return query select v_row.nickname, v_row.tag;
      return;
    end if;
    if v_row.nickname_changed_at is not null
      and v_row.nickname_changed_at > now() - interval '7 days' then
      raise exception 'nickname_cooldown';
    end if;
  end if;

  loop
    v_try := v_try + 1;
    v_tag := (1000 + floor(random() * 9000)::int)::smallint;
    exit when not exists (
      select 1
      from public.profiles p
      where lower(p.nickname) = lower(v_name)
        and p.tag = v_tag
    );
    if v_try >= 20 then
      raise exception 'tag_exhausted';
    end if;
  end loop;

  perform set_config('app.allow_nickname_write', 'on', true);

  if v_row.id is null then
    insert into public.profiles (id, nickname, tag, nickname_changed_at)
    values (v_uid, v_name, v_tag, null);
  else
    update public.profiles
    set
      nickname = v_name,
      tag = v_tag,
      nickname_changed_at = now()
    where id = v_uid;
  end if;

  return query select v_name, v_tag;
end;
$$;

revoke all on function public.set_nickname(text) from public;
grant execute on function public.set_nickname(text) to authenticated;

-- Top hustlers in the player's group for the leaderboard (by profile id, not name).
create or replace function public.get_group_top_hustlers(p_week_id text)
returns table (
  profile_id uuid,
  nickname text,
  tag smallint,
  points int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
begin
  if auth.uid() is null then
    return;
  end if;
  select group_id into v_group from public.profiles where id = auth.uid();
  if v_group is null then
    return;
  end if;

  return query
  select
    p.id as profile_id,
    p.nickname,
    p.tag,
    coalesce(sum(pe.points), 0)::int as points
  from public.profiles p
  left join public.point_events pe
    on pe.profile_id = p.id
    and pe.group_id = v_group
    and pe.week_id = p_week_id
  where p.group_id = v_group
  group by p.id, p.nickname, p.tag
  order by points desc, p.nickname asc
  limit 10;
end;
$$;

revoke all on function public.get_group_top_hustlers(text) from public;
grant execute on function public.get_group_top_hustlers(text) to authenticated;
