import { supabase } from './supabase';

/* ── Landing: dynamic quote cards ── */
export async function fetchLandingQuotes() {
  try {
    const { data, error } = await supabase
      .from('site_quotes')
      .select('quote, author, role, sort_order')
      .eq('placement', 'landing')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(8);

    if (error) return [];
    return (data || []).filter(row => row.quote?.trim());
  } catch {
    return [];
  }
}

/* ── Author: fetch own book for editing ── */
export async function fetchBookForEdit(slug, userId) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      id, slug, title, subtitle, description, cover_url, formats, keywords,
      pub_year, page_count, trim_size, isbn_13, language, publisher_name, price,
      front_matter, back_matter, is_published,
      books_genres ( genres ( slug, label ) ),
      book_retailer_links ( id, url, price, source, retailers ( slug, label ) )
    `)
    .eq('slug', slug)
    .eq('author_user_id', userId)
    .single();
  if (error) return null;
  // Authors only ever see/edit their own declared links — Google-Books-sourced
  // rows are managed entirely by scripts/enrich-google-books-prices.mjs and
  // must never appear in (or be overwritten by) the author's edit form.
  return {
    ...data,
    book_retailer_links: (data.book_retailer_links || []).filter(l => l.source !== 'google_books'),
  };
}

/* ── Author: update book metadata ── */
export async function updateBook(slug, userId, data) {
  const { error } = await supabase
    .from('books')
    .update(data)
    .eq('slug', slug)
    .eq('author_user_id', userId);
  if (error) throw error;
}

/* ── Author: replace all genres for a book ── */
export async function updateBookGenres(bookId, genreSlugs) {
  await supabase.from('books_genres').delete().eq('book_id', bookId);
  for (const gs of genreSlugs.filter(Boolean)) {
    const { data: gr } = await supabase
      .from('genres').select('id').eq('slug', gs).maybeSingle();
    if (gr) await supabase.from('books_genres').insert({ book_id: bookId, genre_id: gr.id });
  }
}

/* ── Replace all retailer links (and their prices) for a book ──
   Upserts on (book_id, retailer_id) rather than plain-inserting, so picking
   the same retailer in two rows doesn't hit the unique constraint — the
   later row for that retailer just wins. `source` tags who supplied this
   ('author' from the wizard/EditBook, 'editor' from the catalogue-price
   curation tool for books with no author account). The cleanup delete is
   scoped to that same source, so it never removes a Google-Books-verified
   row that scripts/enrich-google-books-prices.mjs maintains separately, nor
   an editor's rows when an author saves (or vice versa). */
export async function replaceRetailerLinks(bookId, links, source = 'author') {
  const wanted = (links || []).filter(x => x.url?.trim());
  const keepRetailerIds = [];
  for (const l of wanted) {
    const { data: ret } = await supabase.from('retailers').select('id').eq('slug', l.retailer).maybeSingle();
    if (!ret) continue;
    keepRetailerIds.push(ret.id);
    const { error } = await supabase.from('book_retailer_links').upsert(
      {
        book_id: bookId, retailer_id: ret.id, url: l.url.trim(),
        price: l.price ? parseFloat(l.price) : null,
        source, price_updated_at: new Date().toISOString(),
      },
      { onConflict: 'book_id,retailer_id' }
    );
    if (error) throw error;
  }
  let del = supabase.from('book_retailer_links').delete().eq('book_id', bookId).eq('source', source);
  if (keepRetailerIds.length > 0) del = del.not('retailer_id', 'in', `(${keepRetailerIds.join(',')})`);
  await del;
}

/* ── Editor: is this user allowed to curate catalogue-wide retailer prices? ── */
export async function checkIsEditor(userId) {
  if (!userId) return false;
  const { data } = await supabase.from('editors').select('user_id').eq('user_id', userId).maybeSingle();
  return Boolean(data);
}

/* ── Editor: search any published book by title, for price curation ── */
export async function searchBooksForPriceCuration(query) {
  let q = supabase
    .from('books')
    .select('id, slug, title, cover_url, author_user_id')
    .eq('is_published', true)
    .order('title')
    .limit(15);
  if (query?.trim()) q = q.ilike('title', `%${query.trim()}%`);
  const { data, error } = await q;
  if (error) return [];
  return data;
}

/* ── Editor: fetch a single book's retailer links for curation (any book,
   not just ones the current user authored) ── */
export async function fetchBookRetailerLinksForCuration(bookId) {
  const { data, error } = await supabase
    .from('book_retailer_links')
    .select('id, url, price, source, retailers ( slug, label )')
    .eq('book_id', bookId);
  if (error) return [];
  // Editors curate on top of whatever's already there (author or prior editor
  // entries) but never touch the Google-Books-verified row.
  return data.filter(l => l.source !== 'google_books');
}

/* ── Hire: submit a brief ── */
export async function createHireBrief(brief) {
  const { error } = await supabase.from('hire_briefs').insert(brief);
  if (error) throw error;
}

/* ── Hire: browse freelancers ── */
export async function fetchFreelancers({ serviceType } = {}) {
  let q = supabase.from('freelancers').select('*').order('created_at', { ascending: false });
  if (serviceType) q = q.contains('service_types', [serviceType]);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

/* ── Hire: single freelancer detail ── */
export async function fetchFreelancerById(id) {
  const { data, error } = await supabase.from('freelancers').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/* ── Get Hired: browse open briefs ── */
export async function fetchOpenBriefs({ serviceType } = {}) {
  let q = supabase.from('hire_briefs').select('*').eq('status', 'open').order('created_at', { ascending: false });
  if (serviceType) q = q.eq('service_type', serviceType);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function fetchBriefById(id) {
  const { data, error } = await supabase.from('hire_briefs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

/* ── Hire: manage my posted briefs ── */
export async function fetchMyBriefs(userId, userEmail) {
  const { data, error } = await supabase
    .from('hire_briefs')
    .select('*, freelancers(display_name)')
    .or(`user_id.eq.${userId},and(user_id.is.null,contact_email.eq.${userEmail})`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function markBriefFilled(briefId, freelancerId) {
  const { error } = await supabase.rpc('mark_brief_filled', {
    p_brief_id: briefId,
    p_freelancer_id: freelancerId || null,
  });
  if (error) throw error;
}

/* ── Get Hired: freelancer profile ── */
export async function fetchFreelancerProfile(userId) {
  const { data, error } = await supabase.from('freelancers').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertFreelancerProfile(userId, profile) {
  const { error } = await supabase.from('freelancers').upsert({ ...profile, user_id: userId }, { onConflict: 'user_id' });
  if (error) throw error;
}

/* ── Reader: toggle save ── */
export async function fetchSavedBooks(userId) {
  const { data, error } = await supabase
    .from('reader_saves')
    .select(`
      created_at,
      books!inner (
        id, slug, title, description, cover_url, rating, formats, keywords,
        pub_year, page_count, trim_size, isbn_13, language, publisher_name,
        books_authors ( position, authors ( id, slug, display_name, short_bio ) ),
        books_genres ( genres ( slug, label ) ),
        book_retailer_links ( url, price, currency, source, retailers ( slug, label ) )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('[fetchSavedBooks]', error); return []; }
  return (data || []).map(row => normaliseBook(row.books)).filter(Boolean);
}

export async function toggleSave(bookId, userId) {
  const { data: existing, error: checkErr } = await supabase
    .from('reader_saves')
    .select('id')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkErr) {
    console.error('[toggleSave] check error:', checkErr);
    throw checkErr;
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from('reader_saves').delete().eq('id', existing.id);
    if (delErr) { console.error('[toggleSave] delete error:', delErr); throw delErr; }
    return false;
  } else {
    const { error: insErr } = await supabase
      .from('reader_saves').insert({ book_id: bookId, user_id: userId });
    if (insErr) { console.error('[toggleSave] insert error:', insErr); throw insErr; }
    return true;
  }
}

/* ── Reader: check if book is saved ── */
export async function checkSaved(bookId, userId) {
  const { data, error } = await supabase
    .from('reader_saves').select('id')
    .eq('book_id', bookId).eq('user_id', userId).maybeSingle();
  if (error) console.error('[checkSaved] error:', error);
  return Boolean(data);
}

export async function fetchBooks({ genres = [], query, sort = 'newest', formats = [], language, limit = 24, offset = 0, indieOnly = false } = {}) {
  const SELECT = `
    id, slug, title, description, cover_url, rating, formats, keywords, pub_year, price, language,
    trim_size, indie_status,
    books_authors ( position, authors ( slug, display_name ) ),
    books_genres ( genres ( slug, label ) )
  `;

  function buildBase() {
    let q = supabase.from('books').select(SELECT).eq('is_published', true);
    if (indieOnly)          q = q.in('indie_status', ['small_press', 'self_published', 'likely_indie']);
    if (formats.length > 0) q = q.contains('formats', formats);
    if (language)           q = q.eq('language', language);
    if (sort === 'title')   q = q.order('title');
    else                    q = q.order('created_at', { ascending: false });
    return q;
  }

  // ── Text search: FTS on book metadata + parallel author name search ──
  if (query?.trim()) {
    const safe = query.trim();

    const [ftsRes, authorRes] = await Promise.all([
      (() => {
        const q = safe.length >= 3
          ? buildBase().textSearch('search_tsv', safe, { type: 'websearch', config: 'english' })
          : buildBase().ilike('title', `%${safe}%`);
        return q;
      })(),
      (async () => {
        const { data: authors } = await supabase
          .from('authors').select('id').ilike('display_name', `%${safe}%`);
        if (!authors?.length) return { data: [] };
        const { data: ba } = await supabase
          .from('books_authors').select('book_id')
          .in('author_id', authors.map(a => a.id));
        if (!ba?.length) return { data: [] };
        return buildBase().in('id', ba.map(r => r.book_id));
      })(),
    ]);

    const seen = new Set();
    const merged = [];
    for (const b of [...(ftsRes.data || []), ...(authorRes.data || [])]) {
      if (!seen.has(b.id)) { seen.add(b.id); merged.push(b); }
    }

    let books = merged.map(normaliseBook);
    if (genres.length > 0) books = books.filter(b => genres.every(g => b.genres.includes(g)));

    return { books: books.slice(offset, offset + limit), total: books.length };
  }

  // ── No text query: server-side filters + pagination ──────────────
  let q = supabase
    .from('books')
    .select(SELECT, { count: 'exact' })
    .eq('is_published', true);
  if (indieOnly)          q = q.in('indie_status', ['small_press', 'self_published', 'likely_indie']);
  if (formats.length > 0) q = q.contains('formats', formats);
  if (language)           q = q.eq('language', language);
  if (sort === 'title')   q = q.order('title');
  else                    q = q.order('created_at', { ascending: false });

  if (genres.length > 0) {
    const { data: gr } = await supabase
      .from('genres').select('id').eq('slug', genres[0]).maybeSingle();
    if (gr) {
      const { data: bids } = await supabase
        .from('books_genres').select('book_id').eq('genre_id', gr.id);
      if (!bids?.length) return { books: [], total: 0 };
      q = q.in('id', bids.map(r => r.book_id));
    }
  }

  q = q.range(offset, offset + limit - 1);
  const { data, error, count } = await q;
  if (error) throw error;

  let books = (data || []).map(normaliseBook);
  if (genres.length > 1) books = books.filter(b => genres.every(g => b.genres.includes(g)));

  return { books, total: count ?? 0 };
}

export async function fetchBook(slug) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      id, slug, title, subtitle, description, cover_url, rating, formats, keywords,
      pub_year, page_count, trim_size, isbn_13, language, publisher_name,
      books_authors ( position, authors ( id, slug, display_name, short_bio ) ),
      books_genres ( genres ( slug, label ) ),
      book_retailer_links ( url, price, currency, source, retailers ( slug, label ) )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error) return null;
  return normaliseBook(data);
}

export async function fetchAuthor(slug) {
  const { data, error } = await supabase
    .from('authors')
    .select(`
      id, slug, display_name, short_bio, long_bio, website_url, goodreads_url,
      photo_url, bio_source, bio_source_url, bio_attribution, bio_updated_at
    `)
    .eq('slug', slug)
    .single();
  if (error) return null;
  return data;
}

export async function fetchAuthorBooks(authorSlug) {
  const { data: author } = await supabase
    .from('authors').select('id').eq('slug', authorSlug).single();
  if (!author) return [];

  const { data, error } = await supabase
    .from('books')
    .select(`
      id, slug, title, description, cover_url, rating, formats, keywords,
      pub_year, page_count, trim_size, publisher_name, indie_status,
      books_authors ( position, authors ( slug, display_name ) ),
      books_genres ( genres ( slug, label ) )
    `)
    .eq('is_published', true)
    .in('id',
      (await supabase.from('books_authors').select('book_id').eq('author_id', author.id))
        .data?.map(r => r.book_id) || []
    );
  if (error) return [];
  return (data || []).map(normaliseBook);
}

export async function fetchGenres() {
  const { data } = await supabase.from('genres').select('slug, label').order('label');
  return data || [];
}

/* ── Browse: books grouped into rows by genre (most-populated first) ── */
export async function fetchBooksGroupedByGenre({ perGenreLimit = 12 } = {}) {
  const genres = await fetchGenres();
  const rows = await Promise.all(
    genres.map(genre =>
      fetchBooks({ genres: [genre.slug], limit: perGenreLimit, sort: 'newest' })
        .then(({ books, total }) => ({ genre, books, total }))
    )
  );
  return rows
    .filter(row => row.books.length > 0)
    .sort((a, b) => b.total - a.total);
}

export async function fetchRelatedBooks(currentSlug, genreSlugs = [], pubYear = null) {
  if (!genreSlugs.length) return [];

  // Resolve genre slugs → IDs
  const { data: genreRows } = await supabase
    .from('genres').select('id').in('slug', genreSlugs);
  if (!genreRows?.length) return [];

  const genreIds = genreRows.map(g => g.id);

  // Find all books that share at least one genre
  const { data: links } = await supabase
    .from('books_genres').select('book_id, genre_id').in('genre_id', genreIds);
  if (!links?.length) return [];

  // Count genre overlaps per book_id (UUID)
  const overlapCount = {};
  for (const { book_id } of links) {
    overlapCount[book_id] = (overlapCount[book_id] || 0) + 1;
  }

  const bookIds = Object.keys(overlapCount);

  const { data, error } = await supabase
    .from('books')
    .select(`
      id, slug, title, description, cover_url, rating, formats, keywords, pub_year, trim_size,
      books_authors ( position, authors ( slug, display_name ) ),
      books_genres ( genres ( slug, label ) )
    `)
    .eq('is_published', true)
    .in('id', bookIds)
    .neq('slug', currentSlug);

  if (error || !data) return [];

  return data
    .map(b => ({ ...normaliseBook(b), _overlap: overlapCount[b.id] || 0 }))
    .sort((a, z) => {
      // Primary: most shared genres first
      if (z._overlap !== a._overlap) return z._overlap - a._overlap;
      // Secondary: closest publication year
      if (pubYear) {
        return Math.abs((a.pubYear || 0) - pubYear) - Math.abs((z.pubYear || 0) - pubYear);
      }
      return 0;
    })
    .slice(0, 8);
}

function extractGoogleVolumeId(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('id') || null;
  } catch {
    return null;
  }
}

// Flatten Supabase join shape into the flat shape the UI already expects
function normaliseBook(b) {
  const primaryAuthor = b.books_authors
    ?.sort((a, z) => (a.position ?? 1) - (z.position ?? 1))[0]?.authors;
  const genres = b.books_genres?.map(bg => bg.genres?.slug).filter(Boolean) || [];

  const buyLinks = (b.book_retailer_links || [])
    .map(rl => ({
      label: rl.retailers?.label || 'Buy',
      slug: rl.retailers?.slug || '',
      url: rl.url,
      price: rl.price ?? null,
      currency: rl.currency || 'USD',
      verified: rl.source === 'google_books',
    }))
    .sort((a, z) => {
      // Note: compares raw numbers, not converted amounts — fine while only
      // a handful of non-USD entries exist, but not real FX-aware sorting.
      if (a.price == null && z.price == null) return 0;
      if (a.price == null) return 1;   // no-price rows sort last
      if (z.price == null) return -1;
      return a.price - z.price;         // cheapest first
    });

  const lowestLink = buyLinks.find(l => l.price != null) || null;
  const lowestPrice = lowestLink?.price ?? null;
  const lowestCurrency = lowestLink?.currency ?? 'USD';

  // Prefer Bookshop.org as the primary buy link; fall back to first available
  const primaryLink = buyLinks.find(l => l.slug === 'bookshop')
    || buyLinks[0]
    || null;
  const googleBooksLink = buyLinks.find(l => l.slug === 'google-books')?.url || null;
  const googleVolumeId = extractGoogleVolumeId(googleBooksLink);

  // Collect all authors for co-author display
  const allAuthors = (b.books_authors || [])
    .sort((a, z) => (a.position ?? 1) - (z.position ?? 1))
    .map(e => e.authors)
    .filter(Boolean);

  return {
    dbId: b.id,
    id: b.slug,
    slug: b.slug,
    title: b.title,
    subtitle: b.subtitle || null,
    author: primaryAuthor?.display_name || 'Unknown',
    authors: allAuthors,
    authorId: primaryAuthor?.slug || '',
    genre: genres[0] || 'nonfiction',
    genres,
    blurb: b.description,
    keywords: b.keywords || [],
    formats: b.formats || [],
    coverUrl: b.cover_url || null,
    coverColor: pickCoverColor(b.slug),
    rating: b.rating,
    indieStatus: b.indie_status || null,
    price: b.price || null,
    lowestPrice,
    lowestCurrency,
    pubYear: b.pub_year || null,
    pageCount: b.page_count || null,
    trimSize: b.trim_size || null,
    isbn: b.isbn_13 || null,
    language: b.language || null,
    publisher: b.publisher_name || null,
    buyLink: primaryLink?.url || '#',
    buyLinks,
    googleBooksLink,
    googleVolumeId,
  };
}

const COVER_CYCLE = ['cover-clay', 'cover-ink', 'cover-ochre', 'cover-clay-dark', 'cover-sand'];
function pickCoverColor(slug) {
  const hash = Array.from(slug || '').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVER_CYCLE[hash % COVER_CYCLE.length];
}

/* ── Blogs ── */
export async function fetchBlogs({ limit = 12, type = null } = {}) {
  let q = supabase
    .from('blogs')
    .select('id, content_id, type, slug, title, pillar, excerpt, hero_image_url, published_at, primary_keyword, secondary_keywords')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (type) q = q.eq('type', type);
  const { data, error } = await q;
  if (error) return [];
  return data;
}

export async function fetchBlogBySlug(slug) {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error) return null;
  supabase.rpc('increment_blog_view', { blog_slug: slug });
  return data;
}
