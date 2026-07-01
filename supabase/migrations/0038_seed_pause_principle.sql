-- Seed The Pause Principle by Timothy Ongeche.
-- Verified from Google Books plus bookseller metadata.

insert into public.genres (slug, label) values
  ('nonfiction', 'Nonfiction'),
  ('self-help', 'Self-Help'),
  ('habits', 'Habits & Behaviour')
on conflict (slug) do update set label = excluded.label;

insert into public.retailers (slug, label) values
  ('google-books', 'Google Books'),
  ('barnes-noble', 'Barnes & Noble'),
  ('hatchards', 'Hatchards')
on conflict (slug) do update set label = excluded.label;

insert into public.publishers (name, slug, description)
values (
  'Timothy Ongeche',
  'timothy-ongeche',
  'Author-published imprint for Timothy Ongeche titles.'
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.authors (
  slug,
  display_name,
  short_bio,
  long_bio,
  bio_source,
  bio_source_url,
  bio_attribution,
  bio_updated_at
)
select
  'timothy-ongeche',
  'Timothy Ongeche',
  'Author, thinker, and creative strategist writing about clarity, stillness, and meaningful work.',
  'Timothy Ongeche is an author, thinker, and creative strategist whose work explores clarity, stillness, creativity, and intentional living in a distracted world. His writing connects systems thinking, emotional intelligence, and practical reflection for readers who want to slow down with purpose and return to their work with sharper focus.',
  'generated_from_barnes_and_noble_google_books_metadata',
  'https://www.barnesandnoble.com/w/the-pause-principle-timothy-ongeche/1147208390',
  'Original catalogue bio based on Barnes & Noble and Google Books metadata',
  now()
where not exists (
  select 1
  from public.authors
  where lower(display_name) = lower('Timothy Ongeche')
)
on conflict (slug) do update set
  display_name = excluded.display_name,
  short_bio = excluded.short_bio,
  long_bio = excluded.long_bio,
  bio_source = excluded.bio_source,
  bio_source_url = excluded.bio_source_url,
  bio_attribution = excluded.bio_attribution,
  bio_updated_at = excluded.bio_updated_at;

update public.authors
set
  short_bio = 'Author, thinker, and creative strategist writing about clarity, stillness, and meaningful work.',
  long_bio = 'Timothy Ongeche is an author, thinker, and creative strategist whose work explores clarity, stillness, creativity, and intentional living in a distracted world. His writing connects systems thinking, emotional intelligence, and practical reflection for readers who want to slow down with purpose and return to their work with sharper focus.',
  bio_source = 'generated_from_barnes_and_noble_google_books_metadata',
  bio_source_url = 'https://www.barnesandnoble.com/w/the-pause-principle-timothy-ongeche/1147208390',
  bio_attribution = 'Original catalogue bio based on Barnes & Noble and Google Books metadata',
  bio_updated_at = now()
where id = (
  select id
  from public.authors
  where lower(display_name) = lower('Timothy Ongeche')
  order by created_at nulls last, id
  limit 1
);

insert into public.books (
  slug,
  title,
  subtitle,
  pub_date,
  isbn10,
  isbn13,
  description,
  cover_url,
  formats,
  keywords,
  is_published,
  tags,
  rating,
  publisher_id,
  pub_year,
  page_count,
  isbn_13,
  language,
  publisher_name
)
select
  'the-pause-principle',
  'The Pause Principle',
  'Unlocking Clarity, Purpose, and Creativity Through Life''s Quiet Moments',
  date '2025-04-11',
  null,
  '9798230003984',
  'A self-published guide for entrepreneurs, professionals, and creatives who want to use intentional pauses to think clearly, reset focus, and move through work and life with more purpose.',
  'https://books.google.com/books/content?id=hSFI0QEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
  array['Paperback', 'eBook']::public.book_format[],
  array['clarity', 'purpose', 'creativity', 'stillness', 'focus', 'intentional living'],
  true,
  array['verified-indie', 'self-published', 'indie-discovery'],
  0.0,
  p.id,
  2025,
  158,
  '9798230003984',
  'English',
  'Timothy Ongeche'
from public.publishers p
where p.slug = 'timothy-ongeche'
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  pub_date = excluded.pub_date,
  isbn10 = excluded.isbn10,
  isbn13 = excluded.isbn13,
  description = excluded.description,
  cover_url = excluded.cover_url,
  formats = excluded.formats,
  keywords = excluded.keywords,
  is_published = true,
  tags = excluded.tags,
  publisher_id = excluded.publisher_id,
  pub_year = excluded.pub_year,
  page_count = excluded.page_count,
  isbn_13 = excluded.isbn_13,
  language = excluded.language,
  publisher_name = excluded.publisher_name,
  updated_at = now();

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join lateral (
  select id
  from public.authors
  where lower(display_name) = lower('Timothy Ongeche')
  order by created_at nulls last, id
  limit 1
) a on true
where b.slug = 'the-pause-principle'
on conflict (book_id, author_id) do update set position = excluded.position;

insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from public.books b
join public.genres g on g.slug in ('nonfiction', 'self-help', 'habits')
where b.slug = 'the-pause-principle'
on conflict (book_id, genre_id) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url)
select b.id, r.id, source.url
from public.books b
join (
  values
    ('google-books', 'http://books.google.pt/books?id=hSFI0QEACAAJ&dq=intitle:The+Pause+Principle+inauthor:Timothy+Ongeche&hl=&source=gbs_api'),
    ('barnes-noble', 'https://www.barnesandnoble.com/w/the-pause-principle-timothy-ongeche/1147208390'),
    ('hatchards', 'https://www.hatchards.co.uk/book/the-pause-principle/timothy-ongeche/9798230003984')
) as source(retailer_slug, url) on true
join public.retailers r on r.slug = source.retailer_slug
where b.slug = 'the-pause-principle'
  and not exists (
    select 1
    from public.book_retailer_links existing
    where existing.book_id = b.id
      and existing.retailer_id = r.id
  );

insert into public.book_assets (book_id, asset_type, url, title)
select
  b.id,
  'cover',
  'https://books.google.com/books/content?id=hSFI0QEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
  'The Pause Principle cover'
from public.books b
where b.slug = 'the-pause-principle'
  and not exists (
    select 1
    from public.book_assets existing
    where existing.book_id = b.id
      and existing.asset_type = 'cover'
      and existing.url = 'https://books.google.com/books/content?id=hSFI0QEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api'
  );

insert into app_private.book_indie_classification_candidates (
  book_id,
  title,
  slug,
  author_names,
  current_publisher_name,
  detected_publishers,
  detected_isbns,
  classification,
  confidence,
  reason,
  signals,
  source_payload,
  evidence_urls,
  status,
  updated_at
)
select
  b.id,
  b.title,
  b.slug,
  array['Timothy Ongeche'],
  'Timothy Ongeche',
  array['Timothy Ongeche'],
  array['9798230003984'],
  'self_published',
  96,
  'Publisher metadata identifies Timothy Ongeche as the publisher/author, with matching Google Books and bookseller records.',
  jsonb_build_object(
    'seeded', true,
    'publisher_class', 'author_published',
    'publisher', 'Timothy Ongeche'
  ),
  jsonb_build_object(
    'sources', jsonb_build_array('google_books', 'barnes_and_noble', 'hatchards'),
    'google_books_volume_id', 'hSFI0QEACAAJ',
    'google_books_title_author_match', true,
    'barnes_and_noble_url', 'https://www.barnesandnoble.com/w/the-pause-principle-timothy-ongeche/1147208390',
    'hatchards_url', 'https://www.hatchards.co.uk/book/the-pause-principle/timothy-ongeche/9798230003984',
    'isbn13', '9798230003984',
    'pub_date', '2025-04-11',
    'page_count', 158
  ),
  array[
    'http://books.google.pt/books?id=hSFI0QEACAAJ&dq=intitle:The+Pause+Principle+inauthor:Timothy+Ongeche&hl=&source=gbs_api',
    'https://www.barnesandnoble.com/w/the-pause-principle-timothy-ongeche/1147208390',
    'https://www.hatchards.co.uk/book/the-pause-principle/timothy-ongeche/9798230003984'
  ],
  'applied',
  now()
from public.books b
where b.slug = 'the-pause-principle'
on conflict (book_id) do update set
  title = excluded.title,
  slug = excluded.slug,
  author_names = excluded.author_names,
  current_publisher_name = excluded.current_publisher_name,
  detected_publishers = excluded.detected_publishers,
  detected_isbns = excluded.detected_isbns,
  classification = excluded.classification,
  confidence = excluded.confidence,
  reason = excluded.reason,
  signals = excluded.signals,
  source_payload = excluded.source_payload,
  evidence_urls = excluded.evidence_urls,
  status = excluded.status,
  updated_at = now();
