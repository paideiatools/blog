-- Editable text shown on a designed cover, independent of title/kicker/subtitle.
alter table public.posts add column if not exists cover_text text;
