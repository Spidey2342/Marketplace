# Market Street database

Paste these files into the Supabase SQL Editor. Do not put the service_role key in the app, in `.env.local`, or in Git.

## Run the SQL

1. In the dashboard, open **SQL Editor**, then **New query**.
2. Open `supabase/migrations/0001_init.sql` in this repo. Copy the whole file, paste it into the query, and press **Run**.
3. Open a new query. Paste `supabase/seed.sql` and press **Run**.
4. Open a new query. Paste `supabase/migrations/0002_purchases.sql` and press **Run**.
5. Open **Table Editor**. For each table (`groups`, `profiles`, `stalls`, `rounds`, `challenge_submissions`, `point_events`, `reports`, `purchases`, `stall_ratings`) confirm that row level security is enabled.

You can also check with this query:

```sql
select c.relname as table_name, c.relrowsecurity as rls_on
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by 1;
```

Every game table should show `rls_on` as true.

## What each policy allows

- **profiles.** Any signed-in player can read every profile. A player can insert and update only the row whose id is their own user id. Coins, reputation, and the group are ignored on those writes. `record_round` and `join_group_by_code` are the only writers for those fields.
- **groups.** Nobody using the app can read or write this table, so the join code stays hidden. Signed-in players read `groups_public` instead: id, name, kind, and how many members have joined.
- **stalls.** Any signed-in player can read a stall, so a visit can show items and prices. A player can insert and update only their own stall.
- **rounds.** A player can read only their own rounds. The app cannot insert a round. `record_round` does that.
- **point_events.** A player can read only their own point rows. The app cannot insert them. `record_round` adds one point for each cedi of profit above zero, for that ISO week.
- **challenge_submissions.** A player can read and insert only their own rows, and a new row can only be `pending`. The app cannot update a row. Approve or reject it yourself in the Table Editor.
- **reports.** A signed-in player can insert a report only with their own user id as the reporter. Nobody using the app can read reports.
- **stalls.items.** A JSON array. Each item is `{ "productId": 1, "price": 5, "stock": 6, "selected": true }`. `stock` is how many units are left.
- **purchases.** A player can read a row only if they bought it or sold it. The app cannot insert a row. `buy_from_stall` does that.
- **stall_ratings.** A player can read only ratings they wrote. The app cannot insert one. `rate_purchase` does that.
- **proofs bucket.** Private. Images only, up to 2 MB. A player can upload and read files only inside a folder named with their own user id.

## Functions

- `join_group_by_code(code)` sets the caller's group when the code matches. A wrong code raises `That code does not match a group`. It returns the group id and name, never the code.
- `join_public_group(group_id)` does the same for a group the player picked from `groups_public`. The list has no code, so this is how a tap on the list joins.
- `get_group_rankings(week_id)` returns rank, group id, name, points, and member count for every group. Pass a week such as `2026-W42`.
- `record_round(...)` saves the round, updates coins and reputation, and writes group points. Profit must equal revenue minus stock cost, profit cannot be above 150, and the previous round must be at least 50 seconds old. Coins never go below 0. Reputation grows by the number of items sold.
- Nothing is created automatically when someone signs in. The app inserts the profile.
- `buy_from_stall(seller_id, item_id, qty)` locks the seller's stall, checks the quantity is 1 to 3, the stock is enough, the buyer can pay, and the buyer is not the seller. It moves the coins, lowers `stock`, and writes a purchase. A buyer can do this at most 12 times an hour. Errors: `sold_out`, `not_enough_coins`, `own_stall`, `too_many`.
- Group points from a player sale are half the cedis paid, and only the first 3 purchases between that buyer and seller in the week count.
- `rate_purchase(purchase_id, fair)` lets the buyer rate once. A fair rating adds 1 reputation to the seller, at most 5 a day from that same buyer.

Guest sign-in still counts as signed in. The policies use `authenticated`, which is the role anonymous users get after `signInAnonymously`.

## Reset

This deletes game rows. It does not delete login accounts.

```sql
delete from public.stall_ratings;
delete from public.purchases;
delete from public.point_events;
delete from public.rounds;
delete from public.challenge_submissions;
delete from public.reports;
delete from public.stalls;
delete from public.profiles;
delete from public.groups;
delete from storage.objects where bucket_id = 'proofs';
```

Then run `supabase/seed.sql` again.

To remove the tables as well, run the deletes above, then:

```sql
drop view if exists public.groups_public;
drop table if exists public.stall_ratings;
drop table if exists public.purchases;
drop table if exists public.reports;
drop table if exists public.point_events;
drop table if exists public.challenge_submissions;
drop table if exists public.rounds;
drop table if exists public.stalls;
drop table if exists public.profiles;
drop table if exists public.groups;
drop function if exists public.join_group_by_code(text);
drop function if exists public.join_public_group(uuid);
drop function if exists public.get_group_rankings(text);
drop function if exists public.record_round(int, int, int, int, int, text, jsonb, timestamptz);
drop function if exists public.protect_profile_fields();
drop function if exists public.buy_from_stall(uuid, text, int);
drop function if exists public.rate_purchase(uuid, boolean);
```

Then run `0001_init.sql` and `seed.sql` again.
