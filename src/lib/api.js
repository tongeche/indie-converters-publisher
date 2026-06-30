import { supabase } from './supabase';

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
      id, slug, title, subtitle, description, cover_url, rating, formats, keywords, pub_date,
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

  return {
    id: b.slug,
    slug: b.slug,
    title: b.title,
    author: primaryAuthor?.display_name || 'Unknown',
    authorId: primaryAuthor?.slug || '',
    genre: genres[0] || 'nonfiction',
    genres,
    blurb: b.description,
    coverUrl: b.cover_url || null,
    coverColor: pickCoverColor(b.slug),
    rating: b.rating,
    price: b.price || null,
    buyLink: primaryLink?.url || '#',
    buyLinks,
  };
}

const COVER_CYCLE = ['cover-clay', 'cover-ink', 'cover-ochre', 'cover-clay-dark', 'cover-sand'];
function pickCoverColor(slug) {
  const hash = Array.from(slug || '').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVER_CYCLE[hash % COVER_CYCLE.length];
}
