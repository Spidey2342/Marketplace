-- Placeholder groups from src/data/groups.ts.
-- Same join codes. Kind uses the short database values.
-- Safe to run again: a code that already exists is left as it is.
-- Member counts are not stored. They come from real profiles.

insert into public.groups (name, kind, code)
values
  ('Block A Hostel', 'hostel', 'BLOCKA'),
  ('Class of ''26', 'class', 'YEAR26'),
  ('Osu Corner', 'neighborhood', 'OSU'),
  ('Stall United', 'team', 'UNITED')
on conflict (code) do nothing;
