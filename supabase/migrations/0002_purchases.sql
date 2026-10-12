-- Market Street purchases. Safe to run again.
-- stalls.items is a JSON array. Each object looks like:
-- { "productId": 1, "price": 5, "stock": 6, "selected": true }
-- stock is the integer units still for sale.

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  qty int not null check (qty between 1 and 3),
  unit_price int not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  week_id text not null
);

create table if not exists public.stall_ratings (
  purchase_id uuid primary key references public.purchases (id) on delete cascade,
  rater_id uuid not null references public.profiles (id) on delete cascade,
  fair boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists purchases_buyer_created_idx
  on public.purchases (buyer_id, created_at desc);

create index if not exists purchases_pair_week_idx
  on public.purchases (buyer_id, seller_id, week_id);

alter table public.purchases enable row level security;
alter table public.stall_ratings enable row level security;

revoke all on table public.purchases from anon, authenticated;
revoke all on table public.stall_ratings from anon, authenticated;
grant select on table public.purchases to authenticated;
grant select on table public.stall_ratings to authenticated;

drop policy if exists purchases_select_party on public.purchases;
create policy purchases_select_party
  on public.purchases
  for select
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists stall_ratings_select_own on public.stall_ratings;
create policy stall_ratings_select_own
  on public.stall_ratings
  for select
  to authenticated
  using (rater_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Buy from another player's stall. The app cannot insert purchases itself.
-- ---------------------------------------------------------------------------

create or replace function public.buy_from_stall(
  seller_id uuid,
  item_id text,
  qty int
)
returns table (
  buyer_coins int,
  seller_coins int,
  stock_left int,
  purchase_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid := auth.uid();
  v_seller uuid := seller_id;
  v_item text := item_id;
  v_qty int := qty;
  v_items jsonb;
  v_index int := -1;
  v_price int;
  v_stock int;
  v_selected boolean;
  v_buyer_coins int;
  v_seller_coins int;
  v_group uuid;
  v_hour int;
  v_prior int;
  v_week text;
  v_id uuid;
  v_points int;
  v_cursor int;
begin
  if v_buyer is null then
    raise exception 'Sign in before buying';
  end if;
  if v_qty < 1 or v_qty > 3 then
    raise exception 'qty must be from 1 to 3';
  end if;
  if v_buyer = v_seller then
    raise exception 'own_stall';
  end if;

  select count(*) into v_hour
  from public.purchases
  where purchases.buyer_id = v_buyer
    and purchases.created_at > now() - interval '1 hour';

  if v_hour >= 12 then
    raise exception 'too_many';
  end if;

  select stalls.items
  into v_items
  from public.stalls
  where stalls.profile_id = v_seller
  for update;

  if v_items is null or jsonb_typeof(v_items) <> 'array' then
    raise exception 'sold_out';
  end if;

  for v_cursor in 0 .. jsonb_array_length(v_items) - 1 loop
    if (v_items -> v_cursor ->> 'productId') = v_item
      or (v_items -> v_cursor ->> 'id') = v_item then
      v_index := v_cursor;
    end if;
  end loop;

  if v_index < 0 then
    raise exception 'sold_out';
  end if;

  v_price := coalesce((v_items -> v_index ->> 'price')::int, 0);
  v_stock := coalesce((v_items -> v_index ->> 'stock')::int, 0);
  v_selected := coalesce((v_items -> v_index ->> 'selected')::boolean, true);

  if not v_selected or v_stock < v_qty or v_price < 0 then
    raise exception 'sold_out';
  end if;

  select profiles.coins
  into v_buyer_coins
  from public.profiles
  where profiles.id = v_buyer
  for update;

  if v_buyer_coins is null then
    raise exception 'Create your profile before buying';
  end if;
  if v_buyer_coins < v_price * v_qty then
    raise exception 'not_enough_coins';
  end if;

  select profiles.coins, profiles.group_id
  into v_seller_coins, v_group
  from public.profiles
  where profiles.id = v_seller
  for update;

  if v_seller_coins is null then
    raise exception 'sold_out';
  end if;

  v_buyer_coins := v_buyer_coins - (v_price * v_qty);
  v_seller_coins := v_seller_coins + (v_price * v_qty);
  v_stock := v_stock - v_qty;
  v_week := to_char(now(), 'IYYY') || '-W' || to_char(now(), 'IW');

  select count(*) into v_prior
  from public.purchases
  where purchases.buyer_id = v_buyer
    and purchases.seller_id = v_seller
    and purchases.week_id = v_week;

  v_items := jsonb_set(
    v_items,
    array[v_index::text, 'stock'],
    to_jsonb(v_stock),
    true
  );

  update public.stalls
  set items = v_items, updated_at = now()
  where stalls.profile_id = v_seller;

  insert into public.purchases (buyer_id, seller_id, item_id, qty, unit_price, week_id)
  values (v_buyer, v_seller, v_item, v_qty, v_price, v_week)
  returning purchases.id into v_id;

  perform set_config('app.allow_score_write', 'on', true);
  update public.profiles
  set coins = v_buyer_coins
  where profiles.id = v_buyer;
  update public.profiles
  set coins = v_seller_coins
  where profiles.id = v_seller;

  -- First 3 buys between this pair this week. Points are half the cedis paid.
  v_points := (v_price * v_qty) / 2;
  if v_group is not null and v_prior < 3 and v_points > 0 then
    insert into public.point_events (profile_id, group_id, week_id, points, reason)
    values (v_seller, v_group, v_week, v_points, 'player sale');
  end if;

  return query
  select v_buyer_coins, v_seller_coins, v_stock, v_id;
end;
$$;

create or replace function public.rate_purchase(
  purchase_id uuid,
  fair boolean
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rater uuid := auth.uid();
  v_purchase uuid := purchase_id;
  v_fair boolean := fair;
  v_seller uuid;
  v_buyer uuid;
  v_today int;
  v_reputation int;
begin
  if v_rater is null then
    raise exception 'Sign in before rating';
  end if;

  select purchases.buyer_id, purchases.seller_id
  into v_buyer, v_seller
  from public.purchases
  where purchases.id = v_purchase;

  if v_buyer is null or v_buyer <> v_rater then
    raise exception 'Only the buyer can rate that purchase';
  end if;

  if exists (
    select 1 from public.stall_ratings where stall_ratings.purchase_id = v_purchase
  ) then
    raise exception 'already_rated';
  end if;

  insert into public.stall_ratings (purchase_id, rater_id, fair)
  values (v_purchase, v_rater, v_fair);

  if not v_fair then
    select profiles.reputation into v_reputation
    from public.profiles
    where profiles.id = v_seller;
    return v_reputation;
  end if;

  select count(*) into v_today
  from public.stall_ratings as ratings
  join public.purchases as sales on sales.id = ratings.purchase_id
  where ratings.rater_id = v_rater
    and sales.seller_id = v_seller
    and ratings.fair
    and ratings.created_at >= date_trunc('day', now());

  select profiles.reputation into v_reputation
  from public.profiles
  where profiles.id = v_seller
  for update;

  if v_today <= 5 then
    v_reputation := v_reputation + 1;
    perform set_config('app.allow_score_write', 'on', true);
    update public.profiles
    set reputation = v_reputation
    where profiles.id = v_seller;
  end if;

  return v_reputation;
end;
$$;

revoke all on function public.buy_from_stall(uuid, text, int) from public, anon;
revoke all on function public.rate_purchase(uuid, boolean) from public, anon;
grant execute on function public.buy_from_stall(uuid, text, int) to authenticated;
grant execute on function public.rate_purchase(uuid, boolean) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'stalls'
  ) then
    alter publication supabase_realtime add table public.stalls;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'purchases'
  ) then
    alter publication supabase_realtime add table public.purchases;
  end if;
end $$;
