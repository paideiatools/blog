-- Canva-style editable text layers placed and positioned on a designed cover.
alter table public.posts
  add column if not exists cover_layers jsonb;
