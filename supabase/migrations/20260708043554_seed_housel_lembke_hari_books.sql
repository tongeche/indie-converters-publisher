-- Add more catalogue titles for Morgan Housel, Anna Lembke, and Johann Hari.
-- Bibliographic metadata and cover URLs were verified through Google Books.
-- These titles are marked likely_traditional because their publishers are
-- major or university presses rather than indie/small-press imprints.

insert into public.genres (slug, label) values
  ('business-economics', 'Business & Economics'),
  ('health', 'Health'),
  ('social-science', 'Social Science')
on conflict (slug) do update set label = excluded.label;

insert into public.retailers (slug, label) values
  ('google-books', 'Google Books'),
  ('bookshop', 'Bookshop.org')
on conflict (slug) do update set label = excluded.label;

create temp table _author_seed_books as
select *
from jsonb_to_recordset($seed$[
  {
    "title": "Same as Ever",
    "slug": "same-as-ever",
    "subtitle": "Timeless Lessons on Risk, Opportunity and Living a Good Life",
    "authors": ["Morgan Housel"],
    "author_slug": "morgan-housel",
    "publisher": "Pan Macmillan",
    "publisher_slug": "pan-macmillan",
    "publisher_url": "https://www.panmacmillan.com",
    "description": "A compact guide to the patterns that keep repeating in money, risk, history, and human behavior. Housel turns recurring lessons into practical mental models for calmer long-term decisions.",
    "cover_url": "https://books.google.com/books/content?id=-xrcEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    "pub_date": "2023-11-07",
    "page_count": 176,
    "isbn13": "9781804090640",
    "isbn10": "1804090646",
    "language": "English",
    "formats": ["Hardcover", "eBook", "Audiobook"],
    "keywords": ["risk", "decision-making", "money", "history", "behavior"],
    "genres": ["nonfiction", "psychology", "business-economics"],
    "retailer_links": [
      {"retailer": "google-books", "url": "https://play.google.com/store/books/details?id=-xrcEAAAQBAJ&source=gbs_api", "source": "google_books"},
      {"retailer": "bookshop", "url": "https://bookshop.org/search?keywords=Same%20as%20Ever%20Morgan%20Housel", "source": "author"}
    ],
    "classification": "likely_traditional",
    "confidence": 94,
    "reason": "Google Books metadata identifies Pan Macmillan as publisher; this is a traditional major publisher record.",
    "evidence_urls": ["https://play.google.com/store/books/details?id=-xrcEAAAQBAJ&source=gbs_api"]
  },
  {
    "title": "The Art of Spending Money",
    "slug": "the-art-of-spending-money",
    "subtitle": "Simple Choices for a Richer Life",
    "authors": ["Morgan Housel"],
    "author_slug": "morgan-housel",
    "publisher": "Penguin",
    "publisher_slug": "penguin",
    "publisher_url": "https://www.penguin.com",
    "description": "A personal-finance book about using money with intention. Housel focuses less on formulas and more on the choices, tradeoffs, and values that shape a richer life.",
    "cover_url": "https://books.google.com/books/content?id=DlpUEQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    "pub_date": "2025-10-07",
    "page_count": 257,
    "isbn13": "9780593716632",
    "isbn10": "0593716639",
    "language": "English",
    "formats": ["Hardcover", "eBook", "Audiobook"],
    "keywords": ["money", "personal finance", "spending", "wealth", "decision-making"],
    "genres": ["nonfiction", "business-economics", "self-help"],
    "retailer_links": [
      {"retailer": "google-books", "url": "https://play.google.com/store/books/details?id=DlpUEQAAQBAJ&source=gbs_api", "source": "google_books"},
      {"retailer": "bookshop", "url": "https://bookshop.org/search?keywords=The%20Art%20of%20Spending%20Money%20Morgan%20Housel", "source": "author"}
    ],
    "classification": "likely_traditional",
    "confidence": 94,
    "reason": "Google Books metadata identifies Penguin as publisher; this is a traditional major publisher record.",
    "evidence_urls": ["https://play.google.com/store/books/details?id=DlpUEQAAQBAJ&source=gbs_api"]
  },
  {
    "title": "Drug Dealer, MD",
    "slug": "drug-dealer-md",
    "subtitle": "How Doctors Were Duped, Patients Got Hooked, and Why It's So Hard to Stop",
    "authors": ["Anna Lembke"],
    "author_slug": "anna-lembke",
    "publisher": "JHU Press",
    "publisher_slug": "jhu-press",
    "publisher_url": "https://www.press.jhu.edu",
    "description": "A physician's account of prescription opioids, addiction medicine, and the systems that helped create a public-health crisis. Lembke connects clinical experience with a wider critique of overprescribing.",
    "cover_url": "https://books.google.com/books/content?id=FqfhDAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    "pub_date": "2016-11-15",
    "page_count": 187,
    "isbn13": "9781421421407",
    "isbn10": "1421421402",
    "language": "English",
    "formats": ["Hardcover", "eBook"],
    "keywords": ["addiction", "opioids", "medicine", "public health", "dopamine"],
    "genres": ["nonfiction", "psychology", "health"],
    "retailer_links": [
      {"retailer": "google-books", "url": "http://books.google.pt/books?id=FqfhDAAAQBAJ&dq=intitle:Drug+Dealer+MD+inauthor:Anna+Lembke&hl=&source=gbs_api", "source": "google_books"},
      {"retailer": "bookshop", "url": "https://bookshop.org/search?keywords=Drug%20Dealer%20MD%20Anna%20Lembke", "source": "author"}
    ],
    "classification": "likely_traditional",
    "confidence": 92,
    "reason": "Google Books metadata identifies JHU Press as publisher; this is a university/traditional press record.",
    "evidence_urls": ["http://books.google.pt/books?id=FqfhDAAAQBAJ&dq=intitle:Drug+Dealer+MD+inauthor:Anna+Lembke&hl=&source=gbs_api"]
  },
  {
    "title": "Lost Connections",
    "slug": "lost-connections",
    "subtitle": "Uncovering the Real Causes of Depression - and the Unexpected Solutions",
    "authors": ["Johann Hari"],
    "author_slug": "johann-hari",
    "publisher": "Bloomsbury Circus",
    "publisher_slug": "bloomsbury-circus",
    "publisher_url": "https://www.bloomsbury.com",
    "description": "A reported nonfiction book about depression, anxiety, social disconnection, and the conditions that shape mental health. Hari frames recovery as both personal and social.",
    "cover_url": "https://books.google.com/books/content?id=ak4UtAEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    "pub_date": "2018-01-01",
    "page_count": 336,
    "isbn13": "9781408878699",
    "isbn10": "1408878690",
    "language": "English",
    "formats": ["Paperback", "eBook", "Audiobook"],
    "keywords": ["depression", "anxiety", "mental health", "connection", "social science"],
    "genres": ["nonfiction", "psychology", "health"],
    "retailer_links": [
      {"retailer": "google-books", "url": "http://books.google.pt/books?id=ak4UtAEACAAJ&dq=intitle:Lost+Connections+inauthor:Johann+Hari&hl=&source=gbs_api", "source": "google_books"},
      {"retailer": "bookshop", "url": "https://bookshop.org/search?keywords=Lost%20Connections%20Johann%20Hari", "source": "author"}
    ],
    "classification": "likely_traditional",
    "confidence": 94,
    "reason": "Google Books metadata identifies Bloomsbury Circus as publisher; this is a traditional publisher record.",
    "evidence_urls": ["http://books.google.pt/books?id=ak4UtAEACAAJ&dq=intitle:Lost+Connections+inauthor:Johann+Hari&hl=&source=gbs_api"]
  },
  {
    "title": "Chasing the Scream",
    "slug": "chasing-the-scream",
    "subtitle": "The Inspiration for the Feature Film The United States vs. Billie Holiday",
    "authors": ["Johann Hari"],
    "author_slug": "johann-hari",
    "publisher": "Bloomsbury Publishing USA",
    "publisher_slug": "bloomsbury-publishing-usa",
    "publisher_url": "https://www.bloomsbury.com/us",
    "description": "A narrative history of the war on drugs, addiction, prohibition, and the people affected by policy. Hari follows the subject through law enforcement, medicine, activism, and lived experience.",
    "cover_url": "https://books.google.com/books/content?id=DxAbBQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    "pub_date": "2015-01-20",
    "page_count": 433,
    "isbn13": "9781620408926",
    "isbn10": "1620408929",
    "language": "English",
    "formats": ["Hardcover", "eBook", "Audiobook"],
    "keywords": ["addiction", "drug policy", "social science", "history", "criminal justice"],
    "genres": ["nonfiction", "social-science", "health"],
    "retailer_links": [
      {"retailer": "google-books", "url": "http://books.google.pt/books?id=DxAbBQAAQBAJ&dq=intitle:Chasing+the+Scream+inauthor:Johann+Hari&hl=&source=gbs_api", "source": "google_books"},
      {"retailer": "bookshop", "url": "https://bookshop.org/search?keywords=Chasing%20the%20Scream%20Johann%20Hari", "source": "author"}
    ],
    "classification": "likely_traditional",
    "confidence": 94,
    "reason": "Google Books metadata identifies Bloomsbury Publishing USA as publisher; this is a traditional publisher record.",
    "evidence_urls": ["http://books.google.pt/books?id=DxAbBQAAQBAJ&dq=intitle:Chasing+the+Scream+inauthor:Johann+Hari&hl=&source=gbs_api"]
  },
  {
    "title": "Magic Pill",
    "slug": "magic-pill",
    "subtitle": "The Extraordinary Benefits and Disturbing Risks of the New Weight Loss Drugs",
    "authors": ["Johann Hari"],
    "author_slug": "johann-hari",
    "publisher": "Bloomsbury Publishing",
    "publisher_slug": "bloomsbury-publishing",
    "publisher_url": "https://www.bloomsbury.com",
    "description": "A reported look at the new generation of weight-loss drugs, their promise, their risks, and the social questions they raise around appetite, health, stigma, and medicine.",
    "cover_url": "https://books.google.com/books/content?id=T2PoEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
    "pub_date": "2024-05-02",
    "page_count": 209,
    "isbn13": "9781526670137",
    "isbn10": "1526670135",
    "language": "English",
    "formats": ["Hardcover", "eBook", "Audiobook"],
    "keywords": ["weight loss", "medicine", "public health", "appetite", "social science"],
    "genres": ["nonfiction", "health", "social-science"],
    "retailer_links": [
      {"retailer": "google-books", "url": "https://play.google.com/store/books/details?id=T2PoEAAAQBAJ&source=gbs_api", "source": "google_books"},
      {"retailer": "bookshop", "url": "https://bookshop.org/search?keywords=Magic%20Pill%20Johann%20Hari", "source": "author"}
    ],
    "classification": "likely_traditional",
    "confidence": 94,
    "reason": "Google Books metadata identifies Bloomsbury Publishing as publisher; this is a traditional publisher record.",
    "evidence_urls": ["https://play.google.com/store/books/details?id=T2PoEAAAQBAJ&source=gbs_api"]
  }
]$seed$::jsonb) as r(
  title text,
  slug text,
  subtitle text,
  authors jsonb,
  author_slug text,
  publisher text,
  publisher_slug text,
  publisher_url text,
  description text,
  cover_url text,
  pub_date date,
  page_count integer,
  isbn13 text,
  isbn10 text,
  language text,
  formats jsonb,
  keywords jsonb,
  genres jsonb,
  retailer_links jsonb,
  classification text,
  confidence integer,
  reason text,
  evidence_urls jsonb
);

insert into public.publishers (slug, name, description, website_url)
select distinct
  publisher_slug,
  publisher,
  'Traditional publisher record seeded from verified Google Books metadata.',
  publisher_url
from _author_seed_books
on conflict (slug) do update set
  name = excluded.name,
  description = coalesce(public.publishers.description, excluded.description),
  website_url = coalesce(public.publishers.website_url, excluded.website_url),
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
values
  (
    'morgan-housel',
    'Morgan Housel',
    'Author and investor writing on money, risk, behavior, and long-term decision-making.',
    'Morgan Housel is an author and partner at Collaborative Fund whose nonfiction uses story, history, and behavioral psychology to explain money and risk. On Indie Converters, his profile brings together The Psychology of Money, Same as Ever, and The Art of Spending Money for readers interested in calmer financial decision-making.',
    'IndieConverters catalogue metadata',
    'https://www.googleapis.com/books/v1/volumes?q=inauthor:Morgan%20Housel',
    'Original catalogue bio based on Google Books and public publisher metadata.',
    now()
  ),
  (
    'anna-lembke',
    'Anna Lembke',
    'Stanford psychiatrist and addiction-medicine specialist writing on dopamine, craving, and recovery.',
    'Anna Lembke is a psychiatrist and addiction-medicine specialist whose books examine dopamine, prescription opioids, craving, and modern overconsumption. On Indie Converters, her profile brings together Dopamine Nation and Drug Dealer, MD for readers exploring addiction, recovery, and the neuroscience of desire.',
    'IndieConverters catalogue metadata',
    'https://www.googleapis.com/books/v1/volumes?q=inauthor:Anna%20Lembke',
    'Original catalogue bio based on Google Books and public publisher metadata.',
    now()
  ),
  (
    'johann-hari',
    'Johann Hari',
    'Journalist and nonfiction author writing on attention, addiction, depression, and modern health.',
    'Johann Hari is a journalist and nonfiction author whose books investigate attention, depression, addiction, drug policy, and new medical frontiers. On Indie Converters, his profile brings together Stolen Focus, Lost Connections, Chasing the Scream, and Magic Pill for readers looking at how modern life shapes mental and physical health.',
    'IndieConverters catalogue metadata',
    'https://www.googleapis.com/books/v1/volumes?q=inauthor:Johann%20Hari',
    'Original catalogue bio based on Google Books and public publisher metadata.',
    now()
  )
on conflict (slug) do update set
  display_name = excluded.display_name,
  short_bio = excluded.short_bio,
  long_bio = excluded.long_bio,
  bio_source = excluded.bio_source,
  bio_source_url = excluded.bio_source_url,
  bio_attribution = excluded.bio_attribution,
  bio_updated_at = excluded.bio_updated_at;

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
  publisher_name,
  indie_status,
  indie_confidence,
  indie_verified_at,
  indie_source_summary,
  indie_evidence_urls
)
select
  r.slug,
  r.title,
  r.subtitle,
  r.pub_date,
  r.isbn10,
  r.isbn13,
  r.description,
  r.cover_url,
  array(select jsonb_array_elements_text(r.formats)::public.book_format),
  array(select jsonb_array_elements_text(r.keywords)),
  true,
  array['author-profile', 'traditional-press', 'verified-google-books'],
  0.0,
  p.id,
  extract(year from r.pub_date)::smallint,
  r.page_count::smallint,
  r.isbn13,
  r.language,
  r.publisher,
  r.classification,
  r.confidence::smallint,
  now(),
  r.reason,
  array(select jsonb_array_elements_text(r.evidence_urls))
from _author_seed_books r
left join public.publishers p on p.slug = r.publisher_slug
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
  rating = coalesce(public.books.rating, excluded.rating),
  publisher_id = excluded.publisher_id,
  pub_year = excluded.pub_year,
  page_count = excluded.page_count,
  isbn_13 = excluded.isbn_13,
  language = excluded.language,
  publisher_name = excluded.publisher_name,
  indie_status = excluded.indie_status,
  indie_confidence = excluded.indie_confidence,
  indie_verified_at = excluded.indie_verified_at,
  indie_source_summary = excluded.indie_source_summary,
  indie_evidence_urls = excluded.indie_evidence_urls,
  updated_at = now();

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from _author_seed_books r
join public.books b on b.slug = r.slug
join public.authors a on a.slug = r.author_slug
on conflict (book_id, author_id) do update set position = excluded.position;

insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from _author_seed_books r
join public.books b on b.slug = r.slug
cross join lateral jsonb_array_elements_text(r.genres) genre_slug
join public.genres g on g.slug = genre_slug
on conflict (book_id, genre_id) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url, source, price_updated_at)
select
  b.id,
  ret.id,
  link->>'url',
  coalesce(link->>'source', 'author'),
  now()
from _author_seed_books r
join public.books b on b.slug = r.slug
cross join lateral jsonb_array_elements(r.retailer_links) link
join public.retailers ret on ret.slug = link->>'retailer'
where coalesce(link->>'url', '') <> ''
on conflict (book_id, retailer_id) do update set
  url = excluded.url,
  source = excluded.source,
  price_updated_at = excluded.price_updated_at;

update public.book_assets ba
set url = r.cover_url,
    title = b.title || ' cover'
from _author_seed_books r
join public.books b on b.slug = r.slug
where ba.book_id = b.id
  and ba.asset_type = 'cover';

insert into public.book_assets (book_id, asset_type, url, title)
select b.id, 'cover', r.cover_url, r.title || ' cover'
from _author_seed_books r
join public.books b on b.slug = r.slug
where coalesce(r.cover_url, '') <> ''
  and not exists (
    select 1
    from public.book_assets existing
    where existing.book_id = b.id
      and existing.asset_type = 'cover'
  );

with candidate_rows as (
  select
    b.id as book_id,
    r.title,
    r.slug,
    array(select jsonb_array_elements_text(r.authors)) as author_names,
    r.publisher as current_publisher_name,
    array[r.publisher] as detected_publishers,
    array_remove(array[r.isbn13, r.isbn10], null) as detected_isbns,
    r.classification,
    r.confidence::smallint as confidence,
    r.reason,
    jsonb_build_object(
      'publisher_class', 'traditional_press',
      'metadata_source', 'Google Books API',
      'selected_isbn13', r.isbn13
    ) as signals,
    jsonb_build_object(
      'google_info_links', r.evidence_urls,
      'cover_url', r.cover_url,
      'publisher', r.publisher
    ) as source_payload,
    array(select jsonb_array_elements_text(r.evidence_urls)) as evidence_urls,
    'applied' as status,
    'Seeded as additional author-profile catalogue metadata.' as notes,
    now() as updated_at
  from _author_seed_books r
  join public.books b on b.slug = r.slug
),
updated_candidates as (
  update app_private.book_indie_classification_candidates existing
  set title = candidate_rows.title,
      slug = candidate_rows.slug,
      author_names = candidate_rows.author_names,
      current_publisher_name = candidate_rows.current_publisher_name,
      detected_publishers = candidate_rows.detected_publishers,
      detected_isbns = candidate_rows.detected_isbns,
      classification = candidate_rows.classification,
      confidence = candidate_rows.confidence,
      reason = candidate_rows.reason,
      signals = candidate_rows.signals,
      source_payload = candidate_rows.source_payload,
      evidence_urls = candidate_rows.evidence_urls,
      status = candidate_rows.status,
      notes = candidate_rows.notes,
      updated_at = candidate_rows.updated_at
  from candidate_rows
  where existing.book_id = candidate_rows.book_id
  returning existing.book_id
)
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
  notes,
  updated_at
)
select
  candidate_rows.book_id,
  candidate_rows.title,
  candidate_rows.slug,
  candidate_rows.author_names,
  candidate_rows.current_publisher_name,
  candidate_rows.detected_publishers,
  candidate_rows.detected_isbns,
  candidate_rows.classification,
  candidate_rows.confidence,
  candidate_rows.reason,
  candidate_rows.signals,
  candidate_rows.source_payload,
  candidate_rows.evidence_urls,
  candidate_rows.status,
  candidate_rows.notes,
  candidate_rows.updated_at
from candidate_rows
where not exists (
  select 1
  from updated_candidates
  where updated_candidates.book_id = candidate_rows.book_id
)
and not exists (
  select 1
  from app_private.book_indie_classification_candidates existing
  where existing.book_id = candidate_rows.book_id
);

drop table _author_seed_books;
