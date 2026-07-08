-- Seed two more Daniel Kahneman books so his author profile isn't a
-- single-title catalogue. Bibliographic data (publisher, page count, cover,
-- ISBN) verified against Open Library edition records.

-- Co-authors not yet in the catalogue.
insert into public.authors (slug, display_name, short_bio, long_bio, bio_source, bio_attribution, bio_updated_at)
values
  (
    'olivier-sibony',
    'Olivier Sibony',
    'Professor and consultant writing on decision-making and organizational bias.',
    'Olivier Sibony is a professor at HEC Paris and a former senior partner at McKinsey & Company, writing on decision-making, cognitive bias, and organizational strategy. He co-authored Noise: A Flaw in Human Judgment with Daniel Kahneman and Cass R. Sunstein.',
    'IndieConverters catalogue metadata',
    'Generated from existing author, book, and genre metadata in IndieConverters.',
    now()
  ),
  (
    'cass-r-sunstein',
    'Cass R. Sunstein',
    'Harvard Law School professor and prolific author on behavioural economics and law.',
    'Cass R. Sunstein is a legal scholar at Harvard Law School whose work spans behavioural economics, regulation, and constitutional law. He is a co-author of Nudge and, with Daniel Kahneman and Olivier Sibony, of Noise: A Flaw in Human Judgment.',
    'IndieConverters catalogue metadata',
    'Generated from existing author, book, and genre metadata in IndieConverters.',
    now()
  ),
  (
    'paul-slovic',
    'Paul Slovic',
    'Psychologist and pioneer of research into risk perception and judgment.',
    'Paul Slovic is a professor of psychology at the University of Oregon and founder of Decision Research, known for foundational work on risk perception and human judgment. He co-edited Judgment Under Uncertainty: Heuristics and Biases with Daniel Kahneman and Amos Tversky.',
    'IndieConverters catalogue metadata',
    'Generated from existing author, book, and genre metadata in IndieConverters.',
    now()
  ),
  (
    'amos-tversky',
    'Amos Tversky',
    'Cognitive psychologist and co-founder, with Daniel Kahneman, of the heuristics-and-biases research program.',
    'Amos Tversky was a cognitive and mathematical psychologist whose collaboration with Daniel Kahneman established the heuristics-and-biases research program underlying modern behavioural economics. He co-edited Judgment Under Uncertainty: Heuristics and Biases.',
    'IndieConverters catalogue metadata',
    'Generated from existing author, book, and genre metadata in IndieConverters.',
    now()
  )
on conflict (slug) do nothing;

-- Noise: A Flaw in Human Judgment (2021, Little, Brown Spark)
insert into public.books (
  slug, title, subtitle, pub_date, description, cover_url, formats, keywords,
  is_published, rating, pub_year, page_count, language, publisher_name,
  indie_status, indie_confidence, indie_verified_at, indie_source_summary
) values (
  'noise-a-flaw-in-human-judgment',
  'Noise',
  'A Flaw in Human Judgment',
  '2021-05-18',
  'Wherever there is judgment, there is noise — and more of it than anyone expects. Kahneman, Sibony, and Sunstein show how inconsistent human judgment undermines decisions in medicine, law, and business, and what can be done about it.',
  'https://covers.openlibrary.org/b/id/10981966-L.jpg',
  array['Hardcover','eBook','Audiobook']::public.book_format[],
  array['psychology','decision-making','behavioural-economics','judgment'],
  true, 0.0, 2021, 454, 'English', 'Little, Brown Spark',
  'likely_traditional', 92, now(),
  'Little, Brown Spark is a Hachette Book Group imprint — traditional publisher, matching Open Library edition metadata.'
)
on conflict (slug) do nothing;

-- Judgment Under Uncertainty: Heuristics and Biases (1982, Cambridge University Press)
insert into public.books (
  slug, title, subtitle, pub_date, isbn10, isbn13, description, cover_url, formats,
  keywords, is_published, rating, pub_year, page_count, language, publisher_name,
  indie_status, indie_confidence, indie_verified_at, indie_source_summary
) values (
  'judgment-under-uncertainty-heuristics-and-biases',
  'Judgment Under Uncertainty',
  'Heuristics and Biases',
  '1982-01-01',
  '0521240646',
  '9780521240642',
  'The foundational collection of research on how people make judgments under uncertainty — and the systematic heuristics and biases that shape those judgments. Edited by Daniel Kahneman, Paul Slovic, and Amos Tversky.',
  'https://covers.openlibrary.org/b/id/9357958-L.jpg',
  array['Paperback','Hardcover']::public.book_format[],
  array['psychology','cognition','heuristics','decision-making'],
  true, 0.0, 1982, 555, 'English', 'Cambridge University Press',
  'likely_traditional', 90, now(),
  'Cambridge University Press is a major academic press, matching Open Library edition metadata.'
)
on conflict (slug) do nothing;

-- Link authors (Kahneman first on both, matching real byline order).
insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, v.position
from (values
  ('noise-a-flaw-in-human-judgment', 'daniel-kahneman', 1),
  ('noise-a-flaw-in-human-judgment', 'olivier-sibony', 2),
  ('noise-a-flaw-in-human-judgment', 'cass-r-sunstein', 3),
  ('judgment-under-uncertainty-heuristics-and-biases', 'daniel-kahneman', 1),
  ('judgment-under-uncertainty-heuristics-and-biases', 'paul-slovic', 2),
  ('judgment-under-uncertainty-heuristics-and-biases', 'amos-tversky', 3)
) as v(book_slug, author_slug, position)
join public.books b on b.slug = v.book_slug
join public.authors a on a.slug = v.author_slug
on conflict (book_id, author_id) do update set position = excluded.position;

-- Genres (both already exist in the catalogue).
insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from public.books b
join public.genres g on g.slug in ('nonfiction', 'psychology')
where b.slug in ('noise-a-flaw-in-human-judgment', 'judgment-under-uncertainty-heuristics-and-biases')
on conflict (book_id, genre_id) do nothing;
