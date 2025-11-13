-- Add new columns to profiles table
alter table public.profiles
  add column if not exists bio text,
  add column if not exists pen_name text,
  add column if not exists website_url text;

comment on column public.profiles.bio is 'Short author biography used in onboarding and profile displays.';
comment on column public.profiles.pen_name is 'Optional pen/stage name for the author.';
comment on column public.profiles.website_url is 'Author personal site or portfolio.';

-- Ensure row level security is enabled
alter table public.profiles enable row level security;

-- Policy: allow users to insert their own profile
drop policy if exists "Users can insert their profile" on public.profiles;
create policy "Users can insert their profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- Policy: allow users to update their own profile
drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
