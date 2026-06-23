-- Allow commenting without an account: guest comments carry a display name
-- instead of an author profile.

alter table public.comments alter column author_id drop not null;

alter table public.comments
  add column guest_name text check (char_length(guest_name) between 1 and 80);

-- Every comment needs either a signed-in author or a guest name.
alter table public.comments
  add constraint comments_author_or_guest
  check (author_id is not null or guest_name is not null);

drop policy "Authenticated users can comment" on public.comments;

create policy "Anyone can comment"
  on public.comments for insert
  with check (
    (auth.uid() is not null and author_id = auth.uid())
    or (author_id is null and guest_name is not null)
  );
