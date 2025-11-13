````markdown
# IndieConverters — Publisher Website (Next.js + Supabase)
_Operational README for Copilot-driven development_

This repo hosts a modern indie-publisher site inspired by Hachette’s IA (catalog, authors, imprints, news, events, submissions). It uses **Next.js (App Router) + TypeScript + TailwindCSS** with **Supabase (Postgres + Auth + Storage)** as the backend.

> Quick start tasks for Copilot are marked with ✅ checkboxes so you can ask Copilot to implement them one by one.

---

## Goals
- Browseable **catalog** (genre filters, search, formats, retailer links).
- **Author** pages, **imprints**, **news**, **events**, and **submissions** intake.
- Accessible, fast, SEO-ready (Book/Author/Event JSON-LD).
- Admin/editor flows built on **Supabase Auth** (RLS) + simple dashboards.

---

## Tech Stack
- **Frontend:** Next.js 15+, React, TypeScript, TailwindCSS
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **Search:** Postgres `tsvector` + `pg_trgm` (server-side search)
- **Images:** Supabase Storage (`covers/`, `author_photos/`, `assets/`)
- **Deploy:** Vercel (frontend) + Supabase (DB/Storage/Functions)

---

## Local Setup
1. **Create project**
   ```bash
   npx create-next-app@latest indieconverters --ts --eslint --tailwind
   cd indieconverters
````

2. **Install deps**

   ```bash
   npm i @supabase/supabase-js zod date-fns
   ```
3. **Tailwind already configured by the template** (confirm `tailwind.config.ts` + `globals.css`).
4. **Supabase CLI**

   ```bash
   npm i -D supabase
   npx supabase init
   # add your SUPABASE_URL and SUPABASE_ANON_KEY to .env.local
   ```
5. **Run dev**

   ```bash
   npm run dev
   ```

---

## Environment Variables (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # server-only (Vercel project env)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Database Design (Supabase / Postgres)

### Entity Diagram (high level)

```
imprints (1)───(∞) books (∞)───(∞) genres via books_genres
authors  (∞)───(∞) books via books_authors
books (1)───(∞) book_retailer_links ──(∞) retailers
books (1)───(∞) book_assets
news_articles, events (independent editorial)
submissions (public form) → admin review
newsletter_subscribers (public opt-in)
```

### Core Tables — SQL (run as a migration)

> ✅ **Copilot**: Create a `supabase/migrations/0001_core.sql` with the following, then run `npx supabase db push`.

```sql
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
```

### Storage Buckets

* `covers/` – book cover images
* `author_photos/` – author portraits
* `assets/` – press kits, excerpts, audio samples

> ✅ **Copilot**: Create these buckets in `supabase/storage/seed.ts` (or via Dashboard) and set **public read** for covers and author photos.

---

## Seed Data (optional)

> ✅ **Copilot**: Add `supabase/seed/seed.sql` that inserts example imprints, genres, retailers, authors, and a couple of books.

```sql
insert into public.imprints (slug,name,mission)
values ('indieconverters-originals','IndieConverters Originals','Indie craft, major reach.')
on conflict (slug) do nothing;

insert into public.genres (slug,label) values
('fiction','Fiction'), ('nonfiction','Nonfiction'), ('sci-fi-fantasy','Sci-Fi & Fantasy'),
('children','Children''s Books'), ('cooking','Cooking')
on conflict (slug) do nothing;

insert into public.retailers (slug,label) values
('amazon','Amazon'),('bookshop','Bookshop'),('barnes-noble','Barnes & Noble'),('target','Target')
on conflict (slug) do nothing;
```

---

## API & Queries

### Search (server)

```sql
-- keyword search with trigram + tsvector
select b.*
from public.books b
where b.is_published
  and (
    b.search_vector @@ plainto_tsquery('simple', unaccent($1))
    or b.title ilike '%'||$1||'%'
  )
order by
  ts_rank(b.search_vector, plainto_tsquery('simple', unaccent($1))) desc,
  similarity(b.title, $1) desc
limit 24 offset $2;
```

### Filter by Genre + Format

```sql
select b.*
from public.books b
join public.books_genres bg on bg.book_id = b.id
join public.genres g on g.id = bg.genre_id and g.slug = $1
where b.is_published
  and ( $2::book_format is null or $2 = any(b.formats) )
order by b.pub_date desc
limit 24 offset $3;
```

---

## Frontend Structure (Next.js App Router)

> ✅ **Copilot**: Scaffold these routes and components.

```
app/
  layout.tsx                # metadata, fonts, header/footer
  page.tsx                  # Home: hero + discover + highlights
  catalog/
    page.tsx                # filters (genre, format), server search
    [slug]/page.tsx         # book detail page
  authors/
    page.tsx                # author index
    [slug]/page.tsx         # author detail
  imprints/
    page.tsx
    [slug]/page.tsx
  news/
    page.tsx                # news index
    [slug]/page.tsx
  events/
    page.tsx                # upcoming events
    [slug]/page.tsx
  submissions/page.tsx      # guidelines + form (POST → Supabase)
  api/
    newsletter/route.ts     # POST subscribe (server action)
lib/
  supabaseClient.ts         # browser client
  supabaseServer.ts         # server client with service role (edge)
  queries.ts                # typed SQL queries
components/
  SearchBox.tsx
  GenreChips.tsx
  BookCard.tsx
  AuthorCard.tsx
  EventCard.tsx
  Markdown.tsx              # safe render of long_bio/news body
  JsonLd.tsx                # SEO schemas
```

---

## Forms & Actions

### Submissions (public)

* POST to insert into `public.submissions`.
* Validate with `zod`; rate-limit by IP (edge function / middleware).

> ✅ **Copilot**: Implement `submissions/page.tsx` with action `submitSubmission(formData)` using anon key.

### Newsletter

* POST `email` → `newsletter_subscribers`.

> ✅ **Copilot**: Implement `app/api/newsletter/route.ts` server route using service role to avoid duplicate race conditions.

---

## SEO (JSON-LD)

> ✅ **Copilot**: On book pages, render `Book` schema with `name`, `author`, `workExample` (formats), `isbn`, `offers` (retailer links if direct price not available, you can omit price).

---

## Accessibility

* Semantic headings (`h1` per page), labelled inputs (`aria-label`).
* All images need alt text; decorative images `aria-hidden`.
* Keyboard-friendly filters (arrow keys + Enter on genre chips).
* Minimum contrast AA; focus states visible.

---

## Admin Approach

Short term: use Supabase SQL Editor and Table view for content entry.
Longer term: build `/admin` with Clerk/Supabase Auth + RLS (editor role table) or connect a lightweight CMS bridge.

> ✅ **Copilot**: Create `admin/editors` table to map `auth.user().id` to editor role and author RLS policies so only editors can write.

```sql
create table if not exists public.editors (
  user_id uuid primary key,
  created_at timestamptz default now()
);

-- example policy allowing editors to write books
create policy "editors_can_write_books" on public.books
  for all to authenticated
  using (exists (select 1 from public.editors e where e.user_id = auth.uid()))
  with check (exists (select 1 from public.editors e where e.user_id = auth.uid()));
```

---

## Sample Types (TS)

> ✅ **Copilot**: Add `types/entities.ts`.

```ts
export type Book = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  imprint_id?: string | null;
  pub_date?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
  description?: string | null;
  cover_url?: string | null;
  formats: ('Hardcover'|'Paperback'|'eBook'|'Audiobook')[];
  keywords: string[];
  is_published: boolean;
};

export type Author = {
  id: string;
  slug: string;
  display_name: string;
  short_bio?: string | null;
  long_bio?: string | null;
  website_url?: string | null;
  photo_url?: string | null;
};
```

---

## Styling

* Tailwind with a neutral palette; round `xl` radii, soft shadows, generous spacing.
* Components are responsive grids (2/3/4 columns) with aspect-ratio covers.

---

## Roadmap

* [ ] ✅ Home sections: hero, discover by genre, highlights.
* [ ] ✅ Catalog page: server search + filters (genre, format).
* [ ] ✅ Book detail page with retailer links & assets.
* [ ] ✅ Author pages & cards.
* [ ] ✅ Imprints pages.
* [ ] ✅ News & Events pages.
* [ ] ✅ Submissions form + admin view.
* [ ] ✅ Newsletter endpoint.
* [ ] ✅ SEO JSON-LD and sitemap.
* [ ] ✅ Lighthouse/axe pass (AA).

---

## Notes & Tips

* Prefer **server components** for data fetching (stable SEO).
* Use **service role** only in **server routes**/**edge functions**, never on the client.
* For uploads (covers, press kits), use Storage with public read and keep write guarded by editor sessions.

---

## Credits & License

* IndieConverters © You.
* Third-party images used for development only (replace with your assets).

```

::contentReference[oaicite:0]{index=0}
```
