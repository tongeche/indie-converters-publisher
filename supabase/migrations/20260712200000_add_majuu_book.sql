-- Adds a new self-published catalogue book, "Majuu: Life Between Two
-- Worlds" by Jane Nduta Wambura, found via user-supplied Amazon UK link
-- (amazon.co.uk/dp/B0H7PY7BBB) after search engines and Amazon's own
-- fetch/scrape endpoints returned no results for the title (2026-07-12).
-- Price (EUR 15.02) was read directly off the product page by the user
-- since Amazon blocks automated fetches of its own listings.

insert into public.authors (slug, display_name, short_bio)
values (
  'jane-nduta-wambura',
  'Jane Nduta Wambura',
  'Jane Nduta Wambura is a Kenyan community architect who has spent the last decade building a life between Nairobi and Lisbon. She is the founder of Inspire Abroad, an online community that supports Africans navigating the realities of diaspora life.'
)
on conflict (slug) do nothing;

insert into public.books (
  slug, title, subtitle, description, isbn13, formats, language,
  indie_status, indie_confidence, indie_source_summary, indie_evidence_urls
)
values (
  'majuu-life-between-two-worlds',
  'Majuu: Life Between Two Worlds',
  null,
  'What does it cost to leave everything you know, and is truly belonging somewhere else even possible? Majuu is a Swahili word whispered by those left behind for the ones who chased a life up there, somewhere beyond the horizon. From the chaotic, electric streets of Nairobi to the unfamiliar pavement of a new country, this is the raw, unfiltered diaspora story of what happens after the dream of relocating abroad comes true. Part expat survival guide and part cultural reflection, this contemporary African nonfiction book takes you through the invisible crossroads of the Kenyan immigrant experience.',
  '9798182205610',
  '{Paperback}',
  'English',
  'self_published',
  100,
  'Confirmed self-published via Amazon KDP listing (amazon.co.uk/dp/B0H7PY7BBB), supplied directly by the user.',
  '{https://www.amazon.co.uk/dp/B0H7PY7BBB}'
)
on conflict (slug) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b, public.authors a
where b.slug = 'majuu-life-between-two-worlds' and a.slug = 'jane-nduta-wambura'
on conflict (book_id, author_id) do nothing;

insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from public.books b, public.genres g
where b.slug = 'majuu-life-between-two-worlds' and g.slug in ('nonfiction', 'essays')
on conflict (book_id, genre_id) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.amazon.co.uk/dp/B0H7PY7BBB', 15.02, 'EUR', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'majuu-life-between-two-worlds' and r.slug = 'amazon'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
