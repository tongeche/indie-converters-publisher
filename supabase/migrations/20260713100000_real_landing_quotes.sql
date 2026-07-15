-- Replaces the 4 placeholder "Indie Converters" brand-voice quotes on the
-- landing page with real, verified quotes from named authors about
-- self-publishing, indie authorship, and book discovery (2026-07-13).
-- Each quote was confirmed verbatim against a primary or clearly-cited
-- source before use:
--   - Hugh Howey: confirmed directly on hughhowey.com/my-advice-to-aspiring-authors/
--   - Mark Dawson: confirmed directly on thecreativepenn.com/2018/03/05/self-publishing-tips-mark-dawson/
--   - Neil Gaiman: confirmed on Goodreads, corroborated by AZQuotes
--   - Toni Morrison: confirmed on Goodreads (20k+ likes), corroborated by
--     multiple secondary sources citing her 1981 Ohio Arts Council remarks
--
-- Note: the QuoteRotator component previously never rendered the
-- author/role fields at all (footer always showed a static "indieconverters"
-- wordmark) -- fixed in the same change so these real people are actually
-- credited on screen.

update public.site_quotes
set slug = 'landing-howey-self-publishing',
    quote = 'Querying an agent won''t make your manuscript better. Self-publishing won''t make it worse. It''s either a story that appeals to readers or it isn''t.',
    author = 'Hugh Howey',
    role = 'Author of Wool'
where slug = 'landing-clean-file';

update public.site_quotes
set slug = 'landing-dawson-best-time',
    quote = 'It''s without question the best time to be both an author and a reader at the moment. It''s never been easier to put interesting new books into the world that would otherwise, 10 years ago, have been stymied by a gatekeeper.',
    author = 'Mark Dawson',
    role = 'Bestselling indie thriller author'
where slug = 'landing-different-craft';

update public.site_quotes
set slug = 'landing-gaiman-find-books',
    quote = 'People tend to find books when they are ready for them.',
    author = 'Neil Gaiman',
    role = 'Author'
where slug = 'landing-writing-leads';

update public.site_quotes
set slug = 'landing-morrison-write-it',
    quote = 'If there''s a book that you want to read, but it hasn''t been written yet, then you must write it.',
    author = 'Toni Morrison',
    role = 'Nobel laureate in Literature'
where slug = 'landing-reach-any-reader';
