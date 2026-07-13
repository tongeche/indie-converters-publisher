-- Follow-up to 20260712200000_add_majuu_book.sql: the book was inserted
-- without is_published set, so it defaulted to false and was invisible to
-- fetchBooks()'s published-only query (src/lib/api.js) -- this is why
-- searching "nduta" surfaced nothing. Also adds the front cover image,
-- fetched directly from Amazon's legacy image CDN by ASIN
-- (m.media-amazon.com/images/P/<ASIN>.01.LZZZZZZZ.jpg) since Amazon
-- blocks scraping its own product pages.

update public.books
set is_published = true,
    cover_url = 'https://m.media-amazon.com/images/P/B0H7PY7BBB.01.LZZZZZZZ.jpg',
    cover_image_url = 'https://m.media-amazon.com/images/P/B0H7PY7BBB.01.LZZZZZZZ.jpg'
where slug = 'majuu-life-between-two-worlds';
