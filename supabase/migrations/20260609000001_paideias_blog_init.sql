-- Paideias Blog schema: profiles, categories, posts, comments, likes, subscribers
-- All tables RLS-enabled. Admin bootstrap: sahariar99@gmail.com becomes admin on signup.

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'reader' check (role in ('admin', 'reader')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update using (public.is_admin());

-- Auto-create a profile on signup; bootstrap the first admin by email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.email = 'sahariar99@gmail.com' then 'admin' else 'reader' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

create policy "Admins manage categories"
  on public.categories for all using (public.is_admin()) with check (public.is_admin());

-- ---------- posts ----------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text not null unique,
  excerpt text,
  content jsonb,
  content_html text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  tags text[] not null default '{}',
  reading_time integer not null default 1,
  view_count integer not null default 0,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_status_published_at_idx on public.posts (status, published_at desc);
create index posts_category_idx on public.posts (category_id);

alter table public.posts enable row level security;

create policy "Published posts are viewable by everyone"
  on public.posts for select using (status = 'published' or public.is_admin());

create policy "Admins manage posts"
  on public.posts for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------- comments ----------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create policy "Visible comments are viewable by everyone"
  on public.comments for select
  using (not is_hidden or author_id = auth.uid() or public.is_admin());

create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "Authors and admins can update comments"
  on public.comments for update
  using (author_id = auth.uid() or public.is_admin());

create policy "Authors and admins can delete comments"
  on public.comments for delete
  using (author_id = auth.uid() or public.is_admin());

-- ---------- post likes ----------
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.post_likes for select using (true);

create policy "Users can like posts"
  on public.post_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on public.post_likes for delete using (auth.uid() = user_id);

-- ---------- newsletter subscribers ----------
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

create policy "Anyone can subscribe"
  on public.subscribers for insert with check (true);

create policy "Admins view subscribers"
  on public.subscribers for select using (public.is_admin());

create policy "Admins manage subscribers"
  on public.subscribers for delete using (public.is_admin());

-- ---------- view counter ----------
create or replace function public.increment_post_views(post_slug text)
returns void
language sql security definer
set search_path = public
as $$
  update public.posts
  set view_count = view_count + 1
  where slug = post_slug and status = 'published';
$$;

grant execute on function public.increment_post_views(text) to anon, authenticated;

-- ---------- storage bucket for blog media ----------
insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do nothing;

create policy "Public read blog media"
  on storage.objects for select using (bucket_id = 'blog-media');

create policy "Admins upload blog media"
  on storage.objects for insert
  with check (bucket_id = 'blog-media' and public.is_admin());

create policy "Admins update blog media"
  on storage.objects for update
  using (bucket_id = 'blog-media' and public.is_admin());

create policy "Admins delete blog media"
  on storage.objects for delete
  using (bucket_id = 'blog-media' and public.is_admin());

-- ---------- seed categories ----------
insert into public.categories (name, slug, description) values
  ('Methodology', 'methodology', 'Research design, epistemology, and qualitative methods in practice.'),
  ('Coding & Analysis', 'coding-analysis', 'Thematic analysis, coding strategies, and making sense of qualitative data.'),
  ('Research Tools', 'research-tools', 'Software, workflows, and tips for the modern qualitative researcher.'),
  ('Community Stories', 'community-stories', 'Interviews and stories from researchers in the field.'),
  ('Product Updates', 'product-updates', 'News and updates from the Paideias team.');
