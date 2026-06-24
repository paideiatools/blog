-- Posts can belong to the public blog or to the Paideias docs (shown only
-- under /about), which are never listed, searched, or syndicated alongside
-- blog posts.
alter table public.posts
  add column if not exists section text not null default 'blog'
  check (section in ('blog', 'docs'));

create index if not exists posts_section_status_published_idx
  on public.posts (section, status, published_at desc);
