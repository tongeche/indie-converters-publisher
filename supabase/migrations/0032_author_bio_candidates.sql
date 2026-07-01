-- Private review table for generated author bio candidates.
-- Candidates are staged here before being promoted into public.authors.long_bio.

create schema if not exists app_private;

revoke all on schema app_private from anon, authenticated;

create table if not exists app_private.author_bio_candidates (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.authors(id) on delete cascade,
  display_name text not null,
  candidate_bio text not null,
  source_name text not null,
  source_url text,
  source_license text,
  source_attribution text,
  source_payload jsonb not null default '{}'::jsonb,
  confidence smallint not null default 0 check (confidence between 0 and 100),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_private.author_bio_candidates enable row level security;

create unique index if not exists author_bio_candidates_author_source_idx
  on app_private.author_bio_candidates (author_id, source_name, coalesce(source_url, ''));

create index if not exists author_bio_candidates_status_idx
  on app_private.author_bio_candidates (status, confidence desc);

revoke all on app_private.author_bio_candidates from anon, authenticated;

comment on schema app_private is
  'Internal tables that should not be exposed through the public API.';

comment on table app_private.author_bio_candidates is
  'Draft author bios with source metadata. Review before promoting to public.authors.long_bio.';
