-- Private review table for book-level indie classification candidates.
-- Classifications are staged here before any public catalogue fields are added or updated.

create schema if not exists app_private;

revoke all on schema app_private from anon, authenticated;

create table if not exists app_private.book_indie_classification_candidates (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  title text not null,
  slug text,
  author_names text[] not null default '{}',
  current_publisher_name text,
  detected_publishers text[] not null default '{}',
  detected_isbns text[] not null default '{}',
  classification text not null check (
    classification in (
      'likely_traditional',
      'small_press',
      'self_published',
      'likely_indie',
      'uncertain'
    )
  ),
  confidence smallint not null default 0 check (confidence between 0 and 100),
  reason text not null,
  signals jsonb not null default '{}'::jsonb,
  source_payload jsonb not null default '{}'::jsonb,
  evidence_urls text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_private.book_indie_classification_candidates enable row level security;

create unique index if not exists book_indie_classification_candidates_book_idx
  on app_private.book_indie_classification_candidates (book_id);

create index if not exists book_indie_classification_candidates_classification_idx
  on app_private.book_indie_classification_candidates (classification, confidence desc);

create index if not exists book_indie_classification_candidates_status_idx
  on app_private.book_indie_classification_candidates (status, confidence desc);

revoke all on app_private.book_indie_classification_candidates from anon, authenticated;

comment on table app_private.book_indie_classification_candidates is
  'Book-level indie/traditional classification candidates with external metadata evidence. Review before promoting to public catalogue fields.';
