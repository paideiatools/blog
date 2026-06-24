-- Cover photo credit (shown on hover) and a typographic cover option that
-- renders the post title as a designed banner instead of a photo.
alter table public.posts
  add column if not exists cover_credit_name text,
  add column if not exists cover_credit_link text,
  add column if not exists cover_template text;
