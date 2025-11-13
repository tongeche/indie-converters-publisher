-- Extensions
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Simple enums
do $$ begin
  create type book_format as enum ('Hardcover','Paperback','eBook','Audiobook');
exception when duplicate_object then null; end $$;

-- IMPRINTS
create table if not exists public.imprints (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  mission text,
  hero_image_url text,
  created_at timestamptz default now()
);

-- AUTHORS
create table if not exists public.authors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  short_bio text,
  long_bio text,
  website_url text,
  photo_url text,
  created_at timestamptz default now()
);

-- GENRES (lookup)
create table if not exists public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null
);

-- BOOKS
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  imprint_id uuid references public.imprints(id) on delete set null,
  pub_date date,
  isbn10 text,
  isbn13 text,
  description text,
  cover_url text,
  formats book_format[] default '{}',
  keywords text[] default '{}',
  is_published boolean default false,
  -- search
  search_vector tsvector,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BOOKS <-> AUTHORS (many-to-many with ordering)
create table if not exists public.books_authors (
  book_id uuid references public.books(id) on delete cascade,
  author_id uuid references public.authors(id) on delete cascade,
  position int default 1,
  primary key (book_id, author_id)
);

-- BOOKS <-> GENRES (many-to-many)
create table if not exists public.books_genres (
  book_id uuid references public.books(id) on delete cascade,
  genre_id uuid references public.genres(id) on delete cascade,
  primary key (book_id, genre_id)
);

-- RETAILERS (lookup)
create table if not exists public.retailers (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null
);

-- BOOK RETAILER LINKS
create table if not exists public.book_retailer_links (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books(id) on delete cascade,
  retailer_id uuid references public.retailers(id) on delete cascade,
  url text not null
);

-- BOOK ASSETS (press kit, excerpts, audio samples)
create table if not exists public.book_assets (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references public.books(id) on delete cascade,
  asset_type text check (asset_type in ('cover','excerpt','pressKit','audioSample')),
  url text not null,
  title text,
  created_at timestamptz default now()
);

-- NEWS
create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  dek text,
  body text,
  hero_image_url text,
  published_at timestamptz,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  body text,
  hero_image_url text,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- SUBMISSIONS (public form)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text not null,
  category text,        -- free text or map to genres via FK if desired
  pitch text,           -- up to ~300 words
  manuscript_url text,  -- optional link to file (or use Storage)
  status text default 'received' check (status in ('received','in_review','replied','closed'))
);

-- NEWSLETTER
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz default now(),
  source text default 'site'
);

-- Slug helpers & updated_at trigger
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_books_updated_at on public.books;
create trigger trg_books_updated_at before update on public.books
for each row execute function public.set_updated_at();

-- Search vector builder
create or replace function public.books_search_vector() returns trigger language plpgsql as $$
begin
  new.search_vector :=
    setweight(to_tsvector('simple', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.subtitle,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.description,'')), 'C');
  return new;
end $$;

drop trigger if exists trg_books_tsv on public.books;
create trigger trg_books_tsv before insert or update on public.books
for each row execute function public.books_search_vector();

-- Indexes
create index if not exists idx_books_slug on public.books(slug);
create index if not exists idx_books_pubdate on public.books(pub_date);
create index if not exists idx_books_tsv on public.books using gin (search_vector);
create index if not exists idx_books_title_trgm on public.books using gin (title gin_trgm_ops);
create index if not exists idx_authors_slug on public.authors(slug);
create index if not exists idx_imprints_slug on public.imprints(slug);
create index if not exists idx_news_published on public.news_articles(published_at) where is_published = true;
create index if not exists idx_events_starts on public.events(starts_at) where is_published = true;

-- Public read policies for published content; authenticated edit
alter table public.books enable row level security;
alter table public.authors enable row level security;
alter table public.imprints enable row level security;
alter table public.genres enable row level security;
alter table public.books_genres enable row level security;
alter table public.books_authors enable row level security;
alter table public.book_retailer_links enable row level security;
alter table public.retailers enable row level security;
alter table public.book_assets enable row level security;
alter table public.news_articles enable row level security;
alter table public.events enable row level security;
alter table public.submissions enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Roles: public can read published books/authors/imprints/genres/retailers/news/events
create policy "public_read_books" on public.books
  for select using (is_published is true);

create policy "public_read_authors" on public.authors
  for select using (true);

create policy "public_read_imprints" on public.imprints
  for select using (true);

create policy "public_read_genres" on public.genres
  for select using (true);

create policy "public_read_books_genres" on public.books_genres
  for select using (exists (select 1 from public.books b where b.id = book_id and b.is_published));

create policy "public_read_books_authors" on public.books_authors
  for select using (exists (select 1 from public.books b where b.id = book_id and b.is_published));

create policy "public_read_book_assets" on public.book_assets
  for select using (exists (select 1 from public.books b where b.id = book_id and b.is_published));

create policy "public_read_retailers" on public.retailers
  for select using (true);

create policy "public_read_book_retailer_links" on public.book_retailer_links
  for select using (exists (select 1 from public.books b where b.id = book_id and b.is_published));

create policy "public_read_news" on public.news_articles
  for select using (is_published is true);

create policy "public_read_events" on public.events
  for select using (is_published is true);

-- Public can insert submissions & newsletter opt-ins
create policy "public_insert_submissions" on public.submissions
  for insert to public with check (true);
create policy "public_select_own_submission" on public.submissions
  for select using (auth.role() = 'authenticated'); -- editors only in practice via RPC

create policy "public_insert_newsletter" on public.newsletter_subscribers
  for insert to public with check (true);
create policy "public_select_newsletter_admin_only" on public.newsletter_subscribers
  for select using (auth.role() = 'service_role'); -- restrict via server key

-- Admin/editor write policies:
-- Prefer using service role in API routes to perform writes; optionally create a role 'editor' and map user_id in a table with policies.

-- Editors table and policy
create table if not exists public.editors (
  user_id uuid primary key,
  created_at timestamptz default now()
);

create policy "editors_can_write_books" on public.books
  for all to authenticated
  using (exists (select 1 from public.editors e where e.user_id = auth.uid()))
  with check (exists (select 1 from public.editors e where e.user_id = auth.uid()));
