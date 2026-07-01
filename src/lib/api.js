import { supabase } from './supabase';

/* ── Author: fetch own book for editing ── */
export async function fetchBookForEdit(slug, userId) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      id, slug, title, subtitle, description, cover_url, formats, keywords,
      pub_year, page_count, isbn_13, language, publisher_name, price,
      front_matter, back_matter, is_published,
      books_genres ( genres ( slug, label ) ),
      book_retailer_links ( url, retailers ( slug, label ) )
    `)
    .eq('slug', slug)
    .eq('author_user_id', userId)
    .single();
  if (error) return null;
  return data;
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

/* ── Author: upsert buy link ── */
export async function upsertBuyLink(bookId, retailerSlug, url) {
  if (!url) {
    // remove existing if URL cleared
    const { data: ret } = await supabase
      .from('retailers').select('id').eq('slug', retailerSlug).maybeSingle();
    if (ret) await supabase.from('book_retailer_links')
      .delete().eq('book_id', bookId).eq('retailer_id', ret.id);
    return;
  }
  const { data: ret } = await supabase
    .from('retailers').select('id').eq('slug', retailerSlug).maybeSingle();
  if (!ret) return;
  await supabase.from('book_retailer_links')
    .upsert({ book_id: bookId, retailer_id: ret.id, url }, { onConflict: 'book_id,retailer_id' });
}

/* ── Reader: toggle save ── */
export async function toggleSave(bookId, userId) {
  const { data: existing } = await supabase
    .from('reader_saves')
    .select('id')
    .eq('book_id', bookId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('reader_saves').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('reader_saves').insert({ book_id: bookId, user_id: userId });
    return true;
  }
}

/* ── Reader: check if book is saved ── */
export async function checkSaved(bookId, userId) {
  const { data } = await supabase
    .from('reader_saves').select('id')
    .eq('book_id', bookId).eq('user_id', userId).maybeSingle();
  return Boolean(data);
}

export async function fetchBooks({ genre, query, sort } = {}) {
  let q = supabase
    .from('books')
    .select(`
      id, slug, title, description, cover_url, rating, formats, keywords, pub_date,
      books_authors ( position, authors ( slug, display_name ) ),
      books_genres ( genres ( slug, label ) )
    `)
    .eq('is_published', true);

  if (genre) {
    const { data: genreRow } = await supabase
      .from('genres').select('id').eq('slug', genre).single();
    if (genreRow) {
      const { data: bookIds } = await supabase
        .from('books_genres').select('book_id').eq('genre_id', genreRow.id);
      if (bookIds?.length) q = q.in('id', bookIds.map(r => r.book_id));
    }
  }

  if (query) {
    q = q.or(`title.ilike.%${query}%`);
  }

  if (sort === 'title') q = q.order('title');
  else if (sort === 'newest') q = q.order('created_at', { ascending: false });
  else q = q.order('created_at', { ascending: false });

  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(normaliseBook);
}

export async function fetchBook(slug) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      id, slug, title, subtitle, description, cover_url, rating, formats, keywords,
      pub_year, page_count, isbn_13, language, publisher_name,
      books_authors ( position, authors ( id, slug, display_name, short_bio ) ),
      books_genres ( genres ( slug, label ) ),
      book_retailer_links ( url, retailers ( slug, label ) )
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
    .select('id, slug, display_name, short_bio, long_bio, website_url, photo_url')
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
      id, slug, title, description, cover_url, rating, formats, keywords, pub_year,
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

// Flatten Supabase join shape into the flat shape the UI already expects
function normaliseBook(b) {
  const primaryAuthor = b.books_authors
    ?.sort((a, z) => (a.position ?? 1) - (z.position ?? 1))[0]?.authors;
  const genres = b.books_genres?.map(bg => bg.genres?.slug).filter(Boolean) || [];

  const buyLinks = (b.book_retailer_links || []).map(rl => ({
    label: rl.retailers?.label || 'Buy',
    slug: rl.retailers?.slug || '',
    url: rl.url,
  }));

  // Prefer Bookshop.org as the primary buy link; fall back to first available
  const primaryLink = buyLinks.find(l => l.slug === 'bookshop')
    || buyLinks[0]
    || null;

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
    price: b.price || null,
    pubYear: b.pub_year || null,
    pageCount: b.page_count || null,
    isbn: b.isbn_13 || null,
    language: b.language || null,
    publisher: b.publisher_name || null,
    buyLink: primaryLink?.url || '#',
    buyLinks,
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
    .select('id, content_id, type, slug, title, pillar, excerpt, published_at, primary_keyword, secondary_keywords')
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
