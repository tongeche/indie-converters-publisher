-- Add tags array column to books table
-- Tags are dynamic, computed labels for filtering and discovery

alter table public.books 
  add column if not exists tags text[] default '{}';

-- Create index for tag searches
create index if not exists idx_books_tags on public.books using gin (tags);

-- Optional: Create a tags lookup table for managing available tags
-- This helps with UI autocomplete and tag management
create table if not exists public.book_tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  category text not null check (category in (
    'format',
    'release', 
    'genre',
    'length',
    'theme',
    'audience',
    'mood',
    'season',
    'discovery',
    'other'
  )),
  description text,
  color text, -- hex color for UI badges
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.book_tags enable row level security;

-- Public read access
create policy "public_read_book_tags" on public.book_tags
  for select using (true);

-- Seed some common tags
insert into public.book_tags (slug, label, category, color) values
  -- Format tags
  ('format:ebook', 'eBook', 'format', '#3B82F6'),
  ('format:paperback', 'Paperback', 'format', '#10B981'),
  ('format:hardcover', 'Hardcover', 'format', '#8B5CF6'),
  ('format:audiobook', 'Audiobook', 'format', '#F59E0B'),
  
  -- Release tags
  ('new-release', 'New Release', 'release', '#EF4444'),
  ('coming-soon', 'Coming Soon', 'release', '#EC4899'),
  ('pre-order', 'Pre-Order', 'release', '#8B5CF6'),
  ('just-released', 'Just Released', 'release', '#F97316'),
  ('backlist', 'Backlist', 'release', '#6B7280'),
  
  -- Length tags
  ('quick-read', 'Quick Read', 'length', '#14B8A6'),
  ('immersive', 'Immersive', 'length', '#8B5CF6'),
  ('bite-sized', 'Bite-Sized', 'length', '#06B6D4'),
  
  -- Theme tags
  ('award-winning', 'Award-Winning', 'theme', '#F59E0B'),
  ('series', 'Series', 'theme', '#3B82F6'),
  ('debut-author', 'Debut Author', 'theme', '#10B981'),
  ('illustrated', 'Illustrated', 'theme', '#EC4899'),
  ('true-story', 'True Story', 'theme', '#EF4444'),
  
  -- Audience tags
  ('young-adult', 'Young Adult', 'audience', '#A855F7'),
  ('middle-grade', 'Middle Grade', 'audience', '#3B82F6'),
  ('adult', 'Adult', 'audience', '#6366F1'),
  
  -- Mood tags
  ('dark', 'Dark', 'mood', '#1F2937'),
  ('suspenseful', 'Suspenseful', 'mood', '#7C3AED'),
  ('uplifting', 'Uplifting', 'mood', '#FBBF24'),
  ('heartwarming', 'Heartwarming', 'mood', '#F472B6'),
  ('fast-paced', 'Fast-Paced', 'mood', '#EF4444'),
  ('page-turner', 'Page-Turner', 'mood', '#F97316'),
  ('thought-provoking', 'Thought-Provoking', 'mood', '#8B5CF6'),
  ('literary', 'Literary', 'mood', '#6366F1'),
  ('emotional', 'Emotional', 'mood', '#EC4899'),
  ('humorous', 'Humorous', 'mood', '#14B8A6'),
  ('witty', 'Witty', 'mood', '#06B6D4'),
  
  -- Season tags
  ('holiday-read', 'Holiday Read', 'season', '#DC2626'),
  ('cozy', 'Cozy', 'season', '#F59E0B'),
  ('summer-read', 'Summer Read', 'season', '#FBBF24'),
  ('beach-read', 'Beach Read', 'season', '#06B6D4'),
  ('gift-worthy', 'Gift-Worthy', 'season', '#EC4899'),
  
  -- Discovery tags
  ('staff-pick', 'Staff Pick', 'discovery', '#8B5CF6'),
  ('reader-favorite', 'Reader Favorite', 'discovery', '#EF4444'),
  ('hidden-gem', 'Hidden Gem', 'discovery', '#10B981'),
  ('trending', 'Trending', 'discovery', '#F59E0B'),
  ('must-read', 'Must Read', 'discovery', '#EC4899')
on conflict (slug) do nothing;

-- Add comment explaining the tags system
comment on column public.books.tags is 'Dynamic tags for filtering and discovery. Generated from book metadata, genres, themes, and editorial curation.';
comment on table public.book_tags is 'Lookup table for available book tags with display metadata. Used for UI filtering and tag management.';
