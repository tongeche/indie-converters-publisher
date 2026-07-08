-- Dynamic quote cards for the landing page.
create table if not exists public.site_quotes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  placement text not null default 'landing',
  quote text not null,
  author text not null default 'Indie Converters',
  role text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_quotes_placement_active
  on public.site_quotes (placement, is_active, sort_order);

alter table public.site_quotes enable row level security;

drop policy if exists "public_read_active_site_quotes" on public.site_quotes;
create policy "public_read_active_site_quotes"
  on public.site_quotes
  for select
  to anon, authenticated
  using (is_active is true);

grant select on public.site_quotes to anon, authenticated;

insert into public.site_quotes (slug, placement, quote, author, role, sort_order, is_active)
values
  (
    'landing-clean-file',
    'landing',
    'Every book deserves a clean file, a real cover, and a chance to be found.',
    'Indie Converters',
    'Publishing principle',
    10,
    true
  ),
  (
    'landing-different-craft',
    'landing',
    'Self-publishing is not a compromise. It is a different kind of craft.',
    'Indie Converters',
    'For authors',
    20,
    true
  ),
  (
    'landing-writing-leads',
    'landing',
    'The best publishing tools get out of the way and let the writing lead.',
    'Indie Converters',
    'Product note',
    30,
    true
  ),
  (
    'landing-reach-any-reader',
    'landing',
    'An indie author with the right files can reach any reader, anywhere.',
    'Indie Converters',
    'Distribution belief',
    40,
    true
  )
on conflict (slug) do update set
  placement = excluded.placement,
  quote = excluded.quote,
  author = excluded.author,
  role = excluded.role,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
