-- Editorial kicker (overline above the title) and subtitle (deck below it).
alter table public.posts
  add column if not exists kicker text,
  add column if not exists subtitle text;
