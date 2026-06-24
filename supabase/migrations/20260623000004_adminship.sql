-- Adminship: admins can grant admin to any email. Existing users are promoted
-- directly; not-yet-registered emails are allowlisted so they become admin when
-- they sign up.
create table if not exists public.admin_invites (
  email text primary key,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.admin_invites enable row level security;

create policy "Admins can read invites"
  on public.admin_invites for select using (public.is_admin());

-- Recreate the signup trigger to also honour the allowlist.
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
    case
      when new.email = 'sahariar99@gmail.com' then 'admin'
      when exists (
        select 1 from public.admin_invites
        where lower(email) = lower(new.email)
      ) then 'admin'
      else 'reader'
    end
  );
  return new;
end;
$$;
