-- Seed a first verified independent/small-press discovery batch.
-- Source metadata was checked against Google Books and/or Open Library.
-- Catalogue copy and author bios are original seed copy based on bibliographic metadata.

create temporary table _indie_seed_books on commit drop as
select *
from jsonb_to_recordset($indie_seed$[{"title":"In the Dream House","slug":"in-the-dream-house","subtitle":"A Memoir","authors":["Carmen Maria Machado"],"author_slug":"carmen-maria-machado","short_bio":"Author of In the Dream House.","long_bio":"Carmen Maria Machado is the author of In the Dream House, an independent-press title first published in 2019 and listed here from verified Google Books and Open Library metadata. This seed bio is original catalogue copy and should be replaced with an author-supplied biography when available.","bio_source":"generated_from_google_books_open_library_metadata","bio_source_url":"https://openlibrary.org/authors/OL7486498A","bio_attribution":"Original catalogue bio based on Google Books and Open Library metadata","author_photo_url":null,"photo_source":null,"photo_license":null,"photo_attribution":null,"publisher":"Graywolf Press","publisher_slug":"graywolf-press","description":"A sharp independent-press nonfiction work by Carmen Maria Machado, published by Graywolf Press, selected for readers looking beyond mainstream lists.","cover_url":"https://books.google.com/books/content?id=t7ifDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api","pub_year":2019,"page_count":224,"isbn13":"9781644451021","isbn10":"1644451026","language":"English","formats":["eBook","Paperback"],"keywords":["memoir","domestic abuse","queer literature","essays"],"genres":["nonfiction"],"google_books_url":"https://www.googleapis.com/books/v1/volumes?q=intitle%3AIn+the+Dream+House+inauthor%3ACarmen+Maria+Machado&maxResults=5&projection=lite","google_info_link":"http://books.google.pt/books?id=t7ifDwAAQBAJ&dq=intitle:In+the+Dream+House+inauthor:Carmen+Maria+Machado&hl=&source=gbs_api","open_library_url":"https://openlibrary.org/works/OL20470143W","open_library_key":"/works/OL20470143W","retailer_links":[{"retailer":"google-books","url":"http://books.google.pt/books?id=t7ifDwAAQBAJ&dq=intitle:In+the+Dream+House+inauthor:Carmen+Maria+Machado&hl=&source=gbs_api"},{"retailer":"open-library","url":"https://openlibrary.org/works/OL20470143W"}],"classification":"small_press","confidence":94,"reason":"Verified independent/small-press title. Metadata source includes Google Books and/or Open Library; selected publisher: Graywolf Press."},{"title":"Temporary","slug":"temporary","subtitle":null,"authors":["Hilary Leichter"],"author_slug":"hilary-leichter","short_bio":"Author of Temporary.","long_bio":"Hilary Leichter is the author of Temporary, an independent-press title first published in 2020 and listed here from verified Google Books and Open Library metadata. This seed bio is original catalogue copy and should be replaced with an author-supplied biography when available.","bio_source":"generated_from_google_books_open_library_metadata","bio_source_url":"https://openlibrary.org/authors/OL7875421A","bio_attribution":"Original catalogue bio based on Google Books and Open Library metadata","author_photo_url":null,"photo_source":null,"photo_license":null,"photo_attribution":null,"publisher":"Coffee House Press","publisher_slug":"coffee-house-press","description":"An independent-press speculative novel by Hilary Leichter, published by Coffee House Press, using unreal premises to look closely at power, identity, and everyday life.","cover_url":"https://covers.openlibrary.org/b/id/9399083-L.jpg","pub_year":2020,"page_count":200,"isbn13":"9781566895668","isbn10":"1566895669","language":"English","formats":["eBook","Paperback"],"keywords":["literary fiction","work","surrealism","contemporary fiction"],"genres":["fiction","speculative-fiction"],"google_books_url":"https://www.googleapis.com/books/v1/volumes?q=intitle%3ATemporary+inauthor%3AHilary+Leichter&maxResults=5&projection=lite","google_info_link":"https://play.google.com/store/books/details?id=x_nwDwAAQBAJ&source=gbs_api","open_library_url":"https://openlibrary.org/works/OL20717458W","open_library_key":"/works/OL20717458W","retailer_links":[{"retailer":"google-books","url":"https://play.google.com/store/books/details?id=x_nwDwAAQBAJ&source=gbs_api"},{"retailer":"open-library","url":"https://openlibrary.org/works/OL20717458W"}],"classification":"small_press","confidence":94,"reason":"Verified independent/small-press title. Metadata source includes Google Books and/or Open Library; selected publisher: Coffee House Press."},{"title":"The Book of X","slug":"the-book-of-x","subtitle":null,"authors":["Sarah Rose Etter"],"author_slug":"sarah-rose-etter","short_bio":"Author of The Book of X.","long_bio":"Sarah Rose Etter is the author of The Book of X, an independent-press title first published in 2019 and listed here from verified Google Books and Open Library metadata. This seed bio is original catalogue copy and should be replaced with an author-supplied biography when available.","bio_source":"generated_from_google_books_open_library_metadata","bio_source_url":"https://openlibrary.org/search.json?title=The+Book+of+X&author=Sarah+Rose+Etter&fields=key%2Ctitle%2Cauthor_name%2Cauthor_key%2Cfirst_publish_year%2Cpublisher%2Cisbn%2Ccover_i%2Cedition_key%2Clanguage%2Csubject%2Cnumber_of_pages_median%2Cia%2Chas_fulltext&limit=5","bio_attribution":"Original catalogue bio based on Google Books and Open Library metadata","author_photo_url":null,"photo_source":null,"photo_license":null,"photo_attribution":null,"publisher":"Seven Stories Press","publisher_slug":"seven-stories-press","description":"A strange, body-conscious independent-press novel by Sarah Rose Etter, published by Seven Stories Press, where surreal pressure becomes emotional horror.","cover_url":"https://books.google.com/books/content?id=4EWcEQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api","pub_year":2019,"page_count":284,"isbn13":"9781937512811","isbn10":"1937512819","language":"English","formats":["eBook","Paperback"],"keywords":["literary horror","body","surrealism","feminist fiction"],"genres":["literary-horror","fiction"],"google_books_url":"https://www.googleapis.com/books/v1/volumes?q=intitle%3AThe+Book+of+X+inauthor%3ASarah+Rose+Etter&maxResults=5&projection=lite","google_info_link":"http://books.google.pt/books?id=4EWcEQAAQBAJ&dq=intitle:The+Book+of+X+inauthor:Sarah+Rose+Etter&hl=&source=gbs_api","open_library_url":"https://openlibrary.org/search.json?title=The+Book+of+X&author=Sarah+Rose+Etter&fields=key%2Ctitle%2Cauthor_name%2Cauthor_key%2Cfirst_publish_year%2Cpublisher%2Cisbn%2Ccover_i%2Cedition_key%2Clanguage%2Csubject%2Cnumber_of_pages_median%2Cia%2Chas_fulltext&limit=5","open_library_key":null,"retailer_links":[{"retailer":"google-books","url":"http://books.google.pt/books?id=4EWcEQAAQBAJ&dq=intitle:The+Book+of+X+inauthor:Sarah+Rose+Etter&hl=&source=gbs_api"}],"classification":"small_press","confidence":94,"reason":"Verified independent/small-press title. Metadata source includes Google Books and/or Open Library; selected publisher: Seven Stories Press."},{"title":"The Employees","slug":"the-employees","subtitle":"a workplace novel of the 22nd century","authors":["Olga Ravn"],"author_slug":"olga-ravn","short_bio":"Author of The Employees.","long_bio":"Olga Ravn is the author of The Employees, an independent-press title first published in 2022 and listed here from verified Google Books and Open Library metadata. This seed bio is original catalogue copy and should be replaced with an author-supplied biography when available.","bio_source":"generated_from_google_books_open_library_metadata","bio_source_url":"https://openlibrary.org/search.json?title=The+Employees&author=Olga+Ravn&fields=key%2Ctitle%2Cauthor_name%2Cauthor_key%2Cfirst_publish_year%2Cpublisher%2Cisbn%2Ccover_i%2Cedition_key%2Clanguage%2Csubject%2Cnumber_of_pages_median%2Cia%2Chas_fulltext&limit=5","bio_attribution":"Original catalogue bio based on Google Books and Open Library metadata","author_photo_url":null,"photo_source":null,"photo_license":null,"photo_attribution":null,"publisher":"Book*hug Press","publisher_slug":"book-hug-press","description":"An independent-press speculative novel by Olga Ravn, published by Book*hug Press, using unreal premises to look closely at power, identity, and everyday life.","cover_url":"https://books.google.com/books/content?id=A2OZEQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api","pub_year":2022,"page_count":140,"isbn13":"9781771667616","isbn10":"1771667613","language":"English","formats":["eBook","Paperback"],"keywords":["speculative fiction","workplace","science fiction","translation"],"genres":["speculative-fiction","fiction"],"google_books_url":"https://www.googleapis.com/books/v1/volumes?q=intitle%3AThe+Employees+inauthor%3AOlga+Ravn&maxResults=5&projection=lite","google_info_link":"http://books.google.pt/books?id=A2OZEQAAQBAJ&dq=intitle:The+Employees+inauthor:Olga+Ravn&hl=&source=gbs_api","open_library_url":"https://openlibrary.org/search.json?title=The+Employees&author=Olga+Ravn&fields=key%2Ctitle%2Cauthor_name%2Cauthor_key%2Cfirst_publish_year%2Cpublisher%2Cisbn%2Ccover_i%2Cedition_key%2Clanguage%2Csubject%2Cnumber_of_pages_median%2Cia%2Chas_fulltext&limit=5","open_library_key":null,"retailer_links":[{"retailer":"google-books","url":"http://books.google.pt/books?id=A2OZEQAAQBAJ&dq=intitle:The+Employees+inauthor:Olga+Ravn&hl=&source=gbs_api"}],"classification":"small_press","confidence":94,"reason":"Verified independent/small-press title. Metadata source includes Google Books and/or Open Library; selected publisher: Book*hug Press."},{"title":"The Seep","slug":"the-seep","subtitle":null,"authors":["Chana Porter"],"author_slug":"chana-porter","short_bio":"Author of The Seep.","long_bio":"Chana Porter is the author of The Seep, an independent-press title first published in 2020 and listed here from verified Google Books and Open Library metadata. This seed bio is original catalogue copy and should be replaced with an author-supplied biography when available.","bio_source":"generated_from_google_books_open_library_metadata","bio_source_url":"https://openlibrary.org/authors/OL7821780A","bio_attribution":"Original catalogue bio based on Google Books and Open Library metadata","author_photo_url":null,"photo_source":null,"photo_license":null,"photo_attribution":null,"publisher":"Soho Press","publisher_slug":"soho-press","description":"An independent-press speculative novel by Chana Porter, published by Soho Press, using unreal premises to look closely at power, identity, and everyday life.","cover_url":"https://books.google.com/books/content?id=QwSUDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api","pub_year":2020,"page_count":216,"isbn13":"9781641290876","isbn10":"1641290870","language":"English","formats":["eBook","Paperback"],"keywords":["speculative fiction","alien contact","queer fiction","identity"],"genres":["speculative-fiction","fiction"],"google_books_url":"https://www.googleapis.com/books/v1/volumes?q=intitle%3AThe+Seep+inauthor%3AChana+Porter&maxResults=5&projection=lite","google_info_link":"https://play.google.com/store/books/details?id=QwSUDwAAQBAJ&source=gbs_api","open_library_url":"https://openlibrary.org/works/OL20639876W","open_library_key":"/works/OL20639876W","retailer_links":[{"retailer":"google-books","url":"https://play.google.com/store/books/details?id=QwSUDwAAQBAJ&source=gbs_api"},{"retailer":"open-library","url":"https://openlibrary.org/works/OL20639876W"}],"classification":"small_press","confidence":94,"reason":"Verified independent/small-press title. Metadata source includes Google Books and/or Open Library; selected publisher: Soho Press."},{"title":"The Queue","slug":"the-queue","subtitle":null,"authors":["Basma Abdel Aziz"],"author_slug":"basma-abdel-aziz","short_bio":"Author of The Queue.","long_bio":"Basma Abdel Aziz is the author of The Queue, an independent-press title first published in 2016 and listed here from verified Google Books and Open Library metadata. This seed bio is original catalogue copy and should be replaced with an author-supplied biography when available.","bio_source":"generated_from_google_books_open_library_metadata","bio_source_url":"https://openlibrary.org/authors/OL7511794A","bio_attribution":"Original catalogue bio based on Google Books and Open Library metadata","author_photo_url":null,"photo_source":null,"photo_license":null,"photo_attribution":null,"publisher":"Melville House","publisher_slug":"melville-house","description":"An independent-press speculative novel by Basma Abdel Aziz, published by Melville House, using unreal premises to look closely at power, identity, and everyday life.","cover_url":"https://books.google.com/books/content?id=-bpVCgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api","pub_year":2016,"page_count":224,"isbn13":"9781612195179","isbn10":"1612195172","language":"English","formats":["eBook","Paperback"],"keywords":["dystopian fiction","politics","translation","satire"],"genres":["speculative-fiction","fiction"],"google_books_url":"https://www.googleapis.com/books/v1/volumes?q=intitle%3AThe+Queue+inauthor%3ABasma+Abdel+Aziz&maxResults=5&projection=lite","google_info_link":"https://play.google.com/store/books/details?id=-bpVCgAAQBAJ&source=gbs_api","open_library_url":"https://openlibrary.org/works/OL19661249W","open_library_key":"/works/OL19661249W","retailer_links":[{"retailer":"google-books","url":"https://play.google.com/store/books/details?id=-bpVCgAAQBAJ&source=gbs_api"},{"retailer":"open-library","url":"https://openlibrary.org/works/OL19661249W"}],"classification":"small_press","confidence":94,"reason":"Verified independent/small-press title. Metadata source includes Google Books and/or Open Library; selected publisher: Melville House."}]$indie_seed$::jsonb) as r(
  title text,
  slug text,
  subtitle text,
  authors jsonb,
  author_slug text,
  short_bio text,
  long_bio text,
  bio_source text,
  bio_source_url text,
  bio_attribution text,
  author_photo_url text,
  photo_source text,
  photo_license text,
  photo_attribution text,
  publisher text,
  publisher_slug text,
  description text,
  cover_url text,
  pub_year integer,
  page_count integer,
  isbn13 text,
  isbn10 text,
  language text,
  formats jsonb,
  keywords jsonb,
  genres jsonb,
  google_books_url text,
  google_info_link text,
  open_library_url text,
  open_library_key text,
  retailer_links jsonb,
  classification text,
  confidence integer,
  reason text
);

insert into public.genres (slug, label) values
  ('fiction', 'Fiction'),
  ('literary-horror', 'Literary Horror'),
  ('nonfiction', 'Nonfiction'),
  ('speculative-fiction', 'Speculative Fiction')
on conflict (slug) do update set label = excluded.label;

insert into public.retailers (slug, label) values
  ('google-books', 'Google Books'),
  ('open-library', 'Open Library')
on conflict (slug) do update set label = excluded.label;

insert into public.publishers (name, slug, description)
select distinct
  publisher,
  publisher_slug,
  'Independent/small-press publisher seeded from verified book metadata.'
from _indie_seed_books
on conflict (slug) do update set
  name = excluded.name,
  description = coalesce(public.publishers.description, excluded.description),
  updated_at = now();

insert into public.authors (
  slug,
  display_name,
  short_bio,
  long_bio,
  photo_url,
  photo_source,
  photo_license,
  photo_attribution,
  bio_source,
  bio_source_url,
  bio_attribution,
  bio_updated_at
)
select
  author_slug,
  authors->>0,
  short_bio,
  long_bio,
  author_photo_url,
  photo_source,
  photo_license,
  photo_attribution,
  bio_source,
  bio_source_url,
  bio_attribution,
  now()
from _indie_seed_books
on conflict (slug) do update set
  display_name = excluded.display_name,
  short_bio = coalesce(public.authors.short_bio, excluded.short_bio),
  long_bio = coalesce(public.authors.long_bio, excluded.long_bio),
  photo_url = coalesce(public.authors.photo_url, excluded.photo_url),
  photo_source = coalesce(public.authors.photo_source, excluded.photo_source),
  photo_license = coalesce(public.authors.photo_license, excluded.photo_license),
  photo_attribution = coalesce(public.authors.photo_attribution, excluded.photo_attribution),
  bio_source = coalesce(public.authors.bio_source, excluded.bio_source),
  bio_source_url = coalesce(public.authors.bio_source_url, excluded.bio_source_url),
  bio_attribution = coalesce(public.authors.bio_attribution, excluded.bio_attribution),
  bio_updated_at = coalesce(public.authors.bio_updated_at, excluded.bio_updated_at);

insert into public.books (
  slug,
  title,
  subtitle,
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
  isbn13,
  isbn10,
  language,
  publisher_name
)
select
  r.slug,
  r.title,
  r.subtitle,
  r.description,
  r.cover_url,
  array(select jsonb_array_elements_text(r.formats)::public.book_format),
  array(select jsonb_array_elements_text(r.keywords)),
  true,
  array['verified-indie', 'small-press', 'indie-discovery'],
  0.0,
  p.id,
  r.pub_year::smallint,
  r.page_count::smallint,
  r.isbn13,
  r.isbn13,
  r.isbn10,
  r.language,
  r.publisher
from _indie_seed_books r
left join public.publishers p on p.slug = r.publisher_slug
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
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
  isbn13 = excluded.isbn13,
  isbn10 = excluded.isbn10,
  language = excluded.language,
  publisher_name = excluded.publisher_name,
  updated_at = now();

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from _indie_seed_books r
join public.books b on b.slug = r.slug
join public.authors a on a.slug = r.author_slug
on conflict (book_id, author_id) do update set position = excluded.position;

insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from _indie_seed_books r
join public.books b on b.slug = r.slug
cross join lateral jsonb_array_elements_text(r.genres) genre_slug
join public.genres g on g.slug = genre_slug
on conflict (book_id, genre_id) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url)
select b.id, ret.id, link->>'url'
from _indie_seed_books r
join public.books b on b.slug = r.slug
cross join lateral jsonb_array_elements(r.retailer_links) link
join public.retailers ret on ret.slug = link->>'retailer'
where coalesce(link->>'url', '') <> ''
  and not exists (
    select 1
    from public.book_retailer_links existing
    where existing.book_id = b.id
      and existing.retailer_id = ret.id
  );

insert into public.book_assets (book_id, asset_type, url, title)
select b.id, 'cover', r.cover_url, r.title || ' cover'
from _indie_seed_books r
join public.books b on b.slug = r.slug
where coalesce(r.cover_url, '') <> ''
  and not exists (
    select 1
    from public.book_assets existing
    where existing.book_id = b.id
      and existing.asset_type = 'cover'
      and existing.url = r.cover_url
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
  r.title,
  r.slug,
  array(select jsonb_array_elements_text(r.authors)),
  r.publisher,
  array[r.publisher],
  array_remove(array[r.isbn13, r.isbn10], null),
  r.classification,
  r.confidence::smallint,
  r.reason,
  jsonb_build_object(
    'seeded', true,
    'publisher_class', 'independent_or_small_press',
    'publisher', r.publisher
  ),
  jsonb_build_object(
    'sources', jsonb_build_array('google_books', 'open_library'),
    'google_books_url', r.google_books_url,
    'google_info_link', r.google_info_link,
    'open_library_url', r.open_library_url,
    'open_library_key', r.open_library_key,
    'selected_publisher', r.publisher,
    'selected_isbn13', r.isbn13,
    'selected_isbn10', r.isbn10
  ),
  array_remove(array[r.google_info_link, r.open_library_url], null),
  'applied',
  now()
from _indie_seed_books r
join public.books b on b.slug = r.slug
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
