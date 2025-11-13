-- IndieConverters seed data for local development
-- Run via `supabase db reset` or `supabase db seed`.

insert into public.imprints (slug, name, mission)
values ('indieconverters-originals','IndieConverters Originals','Indie craft, major reach.')
on conflict (slug) do nothing;

insert into public.genres (slug, label) values
  ('fiction','Fiction'),
  ('nonfiction','Nonfiction'),
  ('sci-fi-fantasy','Sci-Fi & Fantasy'),
  ('children','Children''s Books'),
  ('cooking','Cooking')
on conflict (slug) do nothing;

insert into public.retailers (slug, label) values
  ('amazon','Amazon'),
  ('bookshop','Bookshop'),
  ('barnes-noble','Barnes & Noble'),
  ('target','Target')
on conflict (slug) do nothing;

insert into public.authors (slug, display_name, short_bio, website_url, photo_url)
values
  (
    'lexi-park',
    'Lexi Park',
    'Speculative fiction writer blending climate science with myth.',
    'https://lexipark.example.com',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'amir-nunez',
    'Amir Nuñez',
    'Essayist and poet documenting the pulse of electric cities.',
    'https://amirnunez.example.com',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'erin-morgenstern',
    'Erin Morgenstern',
    'Author of The Night Circus and The Starless Sea.',
    'https://erinmorgenstern.com',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'madeline-miller',
    'Madeline Miller',
    'Classicist bringing myth to life in Circe and The Song of Achilles.',
    'https://madelinemiller.com',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'tara-westover',
    'Tara Westover',
    'Memoirist behind Educated.',
    'https://tarawestover.com',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'andy-weir',
    'Andy Weir',
    'Science fiction author of Project Hail Mary and The Martian.',
    'https://andyweirauthor.com',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'brit-bennett',
    'Brit Bennett',
    'Bestselling author exploring identity and family.',
    'https://britbennett.com',
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'min-jin-lee',
    'Min Jin Lee',
    'National Book Award finalist, author of Pachinko.',
    'https://www.minjinlee.com',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'bonnie-garmus',
    'Bonnie Garmus',
    'Copywriter turned novelist behind Lessons in Chemistry.',
    'https://www.penguinrandomhouse.com/authors/2252141/bonnie-garmus/',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'matt-haig',
    'Matt Haig',
    'British author exploring mental health and wonder.',
    'https://www.matthaig.com',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'gabrielle-zevin',
    'Gabrielle Zevin',
    'Novelist crafting Tomorrow, and Tomorrow, and Tomorrow.',
    'https://www.gabriellezevin.com',
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80'
  ),
  (
    'emily-st-john-mandel',
    'Emily St. John Mandel',
    'Author of Station Eleven and Sea of Tranquility.',
    'https://www.emilymandel.com',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80'
  )
on conflict (slug) do nothing;

insert into public.books (
  slug,
  title,
  subtitle,
  imprint_id,
  pub_date,
  isbn13,
  description,
  cover_url,
  formats,
  keywords,
  is_published
)
values
  (
    'luminous-tide',
    'Luminous Tide',
    'A Chronicle of Rising Oceans',
    (select id from public.imprints where slug = 'indieconverters-originals'),
    '2024-05-14',
    '9780000000001',
    'A near-future saga tracing a family of coastal cartographers as seas transform the Atlantic Seaboard.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','eBook']::public.book_format[],
    array['climate','speculative','ocean'],
    true
  ),
  (
    'afterglow-parkway',
    'Afterglow Parkway',
    'Stories from the Electric City',
    (select id from public.imprints where slug = 'indieconverters-originals'),
    '2023-09-12',
    '9780000000002',
    'Linked short stories set across a luminous megacity where music and memory power the grid.',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
    array['Paperback','Audiobook']::public.book_format[],
    array['short stories','urban','music'],
    true
  ),
  (
    'the-night-circus',
    'The Night Circus',
    null,
    null,
    '2011-09-13',
    '9780385534635',
    'A black-and-white Victorian circus appears without warning, setting the stage for a duel between two illusionists who unexpectedly fall in love.',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook']::public.book_format[],
    array['fantasy','magic','circus'],
    true
  ),
  (
    'circe',
    'Circe',
    null,
    null,
    '2018-04-10',
    '9780316556347',
    'Madeline Miller reimagines the Greek sorceress Circe as she forges her own destiny away from the gods who dismissed her.',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook','Audiobook']::public.book_format[],
    array['myth retelling','gods','feminist'],
    true
  ),
  (
    'educated',
    'Educated',
    null,
    null,
    '2018-02-20',
    '9780399590504',
    'Tara Westover chronicles her journey from a survivalist family in Idaho to earning a PhD from Cambridge.',
    'https://images.unsplash.com/photo-1455885666463-1ea8d96c6733?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook','Audiobook']::public.book_format[],
    array['memoir','education','resilience'],
    true
  ),
  (
    'project-hail-mary',
    'Project Hail Mary',
    null,
    null,
    '2021-05-04',
    '9780593135204',
    'Astronaut Ryland Grace awakens alone on a spacecraft tasked with saving Earth from a cosmic threat.',
    'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook','Audiobook']::public.book_format[],
    array['science fiction','space','mission'],
    true
  ),
  (
    'the-vanishing-half',
    'The Vanishing Half',
    null,
    null,
    '2020-06-02',
    '9780525536291',
    'Twin sisters from a Louisiana town run away—one living as a Black woman, the other passing as white.',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook']::public.book_format[],
    array['family','identity','race'],
    true
  ),
  (
    'pachinko',
    'Pachinko',
    null,
    null,
    '2017-02-07',
    '9781455563920',
    'A sweeping saga of a Korean family who migrates to Japan during the 20th century.',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook']::public.book_format[],
    array['historical fiction','korea','family'],
    true
  ),
  (
    'lessons-in-chemistry',
    'Lessons in Chemistry',
    null,
    null,
    '2022-04-05',
    '9780385547345',
    'Chemist Elizabeth Zott accidentally becomes a television cooking star in 1960s California.',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook','Audiobook']::public.book_format[],
    array['1960s','science','feminism'],
    true
  ),
  (
    'the-midnight-library',
    'The Midnight Library',
    null,
    null,
    '2020-09-29',
    '9780525559474',
    'Nora Seed steps into a library between life and death, exploring alternate versions of her life.',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook','Audiobook']::public.book_format[],
    array['speculative','regret','second chances'],
    true
  ),
  (
    'tomorrow-and-tomorrow-and-tomorrow',
    'Tomorrow, and Tomorrow, and Tomorrow',
    null,
    null,
    '2022-07-05',
    '9780593321201',
    'Two friends build video games together across decades, exploring creativity, friendship, and love.',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook']::public.book_format[],
    array['gaming','friendship','creativity'],
    true
  ),
  (
    'sea-of-tranquility',
    'Sea of Tranquility',
    null,
    null,
    '2022-04-05',
    '9780593321447',
    'Emily St. John Mandel traverses centuries and worlds in a time-bending novel about art and survival.',
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80',
    array['Hardcover','Paperback','eBook','Audiobook']::public.book_format[],
    array['time travel','speculative','literary'],
    true
  )
on conflict (slug) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'lexi-park'
where b.slug = 'luminous-tide'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'amir-nunez'
where b.slug = 'afterglow-parkway'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'erin-morgenstern'
where b.slug = 'the-night-circus'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'madeline-miller'
where b.slug = 'circe'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'tara-westover'
where b.slug = 'educated'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'andy-weir'
where b.slug = 'project-hail-mary'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'brit-bennett'
where b.slug = 'the-vanishing-half'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'min-jin-lee'
where b.slug = 'pachinko'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'bonnie-garmus'
where b.slug = 'lessons-in-chemistry'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'matt-haig'
where b.slug = 'the-midnight-library'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'gabrielle-zevin'
where b.slug = 'tomorrow-and-tomorrow-and-tomorrow'
on conflict (book_id, author_id) do nothing;

insert into public.books_authors (book_id, author_id, position)
select b.id, a.id, 1
from public.books b
join public.authors a on a.slug = 'emily-st-john-mandel'
where b.slug = 'sea-of-tranquility'
on conflict (book_id, author_id) do nothing;

insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from public.books b
join public.genres g on g.slug = 'sci-fi-fantasy'
where b.slug = 'luminous-tide'
on conflict (book_id, genre_id) do nothing;

insert into public.books_genres (book_id, genre_id)
select b.id, g.id
from public.books b
join public.genres g on g.slug = 'fiction'
where b.slug = 'afterglow-parkway'
on conflict (book_id, genre_id) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url)
select b.id, r.id, 'https://bookshop.org/books/luminous-tide'
from public.books b
join public.retailers r on r.slug = 'bookshop'
where b.slug = 'luminous-tide'
  and not exists (
    select 1
    from public.book_retailer_links brl
    where brl.book_id = b.id and brl.retailer_id = r.id
  );

insert into public.book_retailer_links (book_id, retailer_id, url)
select b.id, r.id, 'https://www.amazon.com/dp/0000000002'
from public.books b
join public.retailers r on r.slug = 'amazon'
where b.slug = 'afterglow-parkway'
  and not exists (
    select 1
    from public.book_retailer_links brl
    where brl.book_id = b.id and brl.retailer_id = r.id
  );

-- NEWS ARTICLES
insert into public.news_articles (slug, title, dek, body, hero_image_url, published_at, is_published, type)
values
  (
    'lexi-park-announces-luminous-tour',
    'Lexi Park Announces the Luminous Tide Tour',
    'Climate fiction meets coastal science in a multi-city experience.',
    'Lexi Park and the IndieConverters Originals crew will visit Boston, Portland, and Miami to share early excerpts, audio experiences, and ocean data visualizations inspired by Luminous Tide.',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    now() - interval '3 days',
    true,
    'news'
  ),
  (
    'afterglow-sessions-live',
    'Afterglow Parkway Sessions Go Live',
    'Amir Nuñez curates an immersive sonic reading room.',
    'The Electric City Studio is streaming a weekly session where jazz, spoken word, and neon-lighting merge to dramatize scenes from Afterglow Parkway.',
    'https://images.unsplash.com/photo-1482192597420-4817fdd7e8b0?auto=format&fit=crop&w=1400&q=80',
    now() - interval '7 days',
    true,
    'news'
  ),
  (
    'indieconverters-acquires-new-imprint',
    'IndieConverters Acquires New Mythic Imprint',
    'Imprint expands to focus on mythic retellings and speculative memoir.',
    'Led by editor Min Jin Lee, the new imprint will commission cross-genre epics with strong international partnerships, syncing with Circe, Pachinko, and future catalog releases.',
    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1400&q=80',
    now() - interval '14 days',
    true,
    'news'
  ),
  (
    'manuscript-lab-behind-the-scenes',
    'Inside the IndieConverters Manuscript Lab',
    'How our editors, designers, and data team scope every release.',
    'From editorial scorecards to cover mood boards, this blog pulls back the curtain on our internal playbooks for helping authors launch faster.',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80',
    now() - interval '5 days',
    true,
    'blog'
  ),
  (
    'global-distribution-playbook',
    'A Distribution Playbook for Indie Authors',
    'Where and how we place your titles for maximum reach.',
    'We outline the eBook, audiobook, and print-on-demand channels available through IndieConverters along with tips for pricing, metadata, and pre-orders.',
    'https://images.unsplash.com/photo-1515165562835-c4c1bfa1c83d?auto=format&fit=crop&w=1400&q=80',
    now() - interval '9 days',
    true,
    'blog'
  )
on conflict (slug) do update
set
  title = excluded.title,
  dek = excluded.dek,
  body = excluded.body,
  hero_image_url = excluded.hero_image_url,
  published_at = excluded.published_at,
  is_published = excluded.is_published,
  type = excluded.type;

-- EVENTS
insert into public.events (slug, title, location, starts_at, ends_at, body, hero_image_url, is_published)
values
  (
    'luminous-tide-tour-boston',
    'Luminous Tide: Harborfront Conversation',
    'Boston Public Library · Boston, MA',
    '2025-02-12T18:00:00-05:00',
    '2025-02-12T20:00:00-05:00',
    'Lexi Park joins marine biologists for an immersive talk on storytelling and coastal resilience. Book signing to follow.',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
    true
  ),
  (
    'afterglow-parkway-live-nyc',
    'Afterglow Parkway · Live Session',
    'IndieConverters Loft · Brooklyn, NY',
    '2025-03-05T19:30:00-05:00',
    null,
    'Amir Nuñez performs new vignettes scored by live synths, exploring the electric city that powers Afterglow Parkway.',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80',
    true
  ),
  (
    'editors-roundtable-sf',
    'Editors Roundtable: Speculative Futures',
    'The Interval at Long Now · San Francisco, CA',
    '2025-04-18T17:00:00-07:00',
    '2025-04-18T19:00:00-07:00',
    'IndieConverters editors discuss climate fiction, AI narratives, and what comes next for boundary-pushing books.',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80',
    true
  ),
  (
    'indieconverters-summer-market',
    'IndieConverters Summer Book Market',
    'Union Station · Chicago, IL',
    '2025-06-08T10:00:00-05:00',
    '2025-06-08T16:00:00-05:00',
    'Dozens of IndieConverters authors gather for a day-long marketplace with pop-up readings, workshops, and sneak peeks.',
    'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1400&q=80',
    true
  )
on conflict (slug) do update
set
  title = excluded.title,
  location = excluded.location,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  body = excluded.body,
  hero_image_url = excluded.hero_image_url,
  is_published = excluded.is_published;
