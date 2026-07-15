import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { buildAssistantReply } from '../../src/lib/assistant.js';
import { formatDisplayMoney } from '../../src/lib/currency.js';

const BOOK_SELECT = `
  id, slug, title, description, cover_url, formats, keywords, pub_year, price, language,
  trim_size, indie_status,
  book_retailer_links ( url, price, currency, source, retailers ( slug, label ) ),
  books_authors ( position, authors ( slug, display_name ) ),
  books_genres ( genres ( slug, label ) )
`;

const BLOG_SELECT = 'slug, title, pillar, excerpt, primary_keyword, secondary_keywords, published_at';

const CATALOGUE_QUERY_STOPWORDS = new Set([
  'find', 'show', 'give', 'get', 'book', 'books', 'read', 'reading', 'recommend',
  'recommendation', 'recommendations', 'for', 'me', 'my', 'your', 'please', 'a',
  'an', 'the', 'to', 'by', 'with', 'about',
]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getEnv(name) {
  return globalThis.Netlify?.env?.get(name) || process.env[name];
}

function getAssistantModel() {
  return getEnv('OPENAI_MODEL') || 'gpt-4o-mini';
}

function normaliseBook(row) {
  const primaryAuthor = row.books_authors
    ?.sort((a, z) => (a.position ?? 1) - (z.position ?? 1))[0]?.authors;
  const genres = row.books_genres?.map(bg => bg.genres?.slug).filter(Boolean) || [];
  const genreLabels = row.books_genres?.map(bg => bg.genres?.label).filter(Boolean) || [];
  const buyLinks = (row.book_retailer_links || [])
    .map(link => ({
      label: link.retailers?.label || 'Retailer',
      slug: link.retailers?.slug || '',
      url: link.url,
      price: link.price ?? null,
      currency: link.currency || 'USD',
      verified: link.source === 'google_books',
    }))
    .sort((a, z) => {
      if (a.price == null && z.price == null) return 0;
      if (a.price == null) return 1;
      if (z.price == null) return -1;
      return Number(a.price) - Number(z.price);
    });
  const lowestLink = buyLinks.find(link => link.price != null);
  const formatLabel = Array.isArray(row.formats) && row.formats.length
    ? String(row.formats[0]).replace(/_/g, ' ')
    : null;
  const priceLabel = lowestLink ? `from ${formatDisplayMoney(lowestLink.price, lowestLink.currency)}` : null;

  return {
    dbId: row.id,
    id: row.slug,
    slug: row.slug,
    title: row.title,
    author: primaryAuthor?.display_name || 'Unknown',
    authorId: primaryAuthor?.slug || '',
    genre: genres[0] || 'fiction',
    genreLabel: genreLabels[0] || genres[0] || 'Fiction',
    genres,
    blurb: row.description,
    keywords: row.keywords || [],
    formats: row.formats || [],
    formatLabel,
    coverUrl: row.cover_url || null,
    pubYear: row.pub_year || null,
    language: row.language || null,
    lowestPrice: lowestLink?.price ?? null,
    lowestCurrency: lowestLink?.currency || 'USD',
    priceLabel,
  };
}

function hasSpecificCatalogueTerms(message) {
  const terms = String(message || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !CATALOGUE_QUERY_STOPWORDS.has(term));
  return terms.length > 0;
}

async function fetchCatalogueContext(message) {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const safe = String(message || '').trim();
  const baseQuery = () => supabase
    .from('books')
    .select(BOOK_SELECT)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(120);

  let query = baseQuery();
  if (safe.length >= 3 && hasSpecificCatalogueTerms(safe)) {
    query = supabase
      .from('books')
      .select(BOOK_SELECT)
      .eq('is_published', true)
      .textSearch('search_tsv', safe, { type: 'websearch', config: 'english' })
      .order('created_at', { ascending: false })
      .limit(40);
  }

  let { data, error } = await query;
  if (!error && safe.length >= 3 && !data?.length) {
    ({ data, error } = await baseQuery());
  }

  if (error) {
    console.error('[assistant function] catalogue lookup failed:', error.message);
    return [];
  }

  return (data || []).map(normaliseBook);
}

function normaliseArticle(row) {
  return {
    id: `article-${row.slug}`,
    type: 'article',
    topic: row.pillar || 'Help article',
    title: row.title,
    body: row.excerpt || '',
    keywords: [
      row.pillar,
      row.primary_keyword,
      ...(row.secondary_keywords || []),
    ].filter(Boolean),
    cta: { label: 'Read article', path: `/blog/${row.slug}` },
    slug: row.slug,
  };
}

async function fetchArticleContext(message) {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseKey) return [];

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const safe = String(message || '').trim();
  let query = supabase
    .from('blogs')
    .select(BLOG_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(8);

  if (safe.length >= 3) {
    query = query.or([
      `title.ilike.%${safe}%`,
      `excerpt.ilike.%${safe}%`,
      `primary_keyword.ilike.%${safe}%`,
    ].join(','));
  }

  const { data, error } = await query;
  if (error) {
    console.error('[assistant function] article lookup failed:', error.message);
    return [];
  }

  return (data || []).map(normaliseArticle);
}

function summariseBook(book) {
  return {
    slug: book.slug,
    title: book.title,
    author: book.author,
    genres: book.genres?.length ? book.genres : [book.genre].filter(Boolean),
    format: book.formatLabel || book.formats?.[0] || null,
    price: book.priceLabel || null,
    year: book.pubYear || null,
    language: book.language || null,
    description: book.blurb ? String(book.blurb).slice(0, 420) : null,
  };
}

function buildModelMessages({ message, baseReply, books, pageContext, articles }) {
  const context = pageContext || {};
  const bookContext = books.slice(0, 5).map(summariseBook);

  return [
    {
      role: 'system',
      content: [
        'You are the Indie Converters assistant.',
        'Help authors and readers with publishing, manuscript uploads, pricing, retailer links, account setup, and public book discovery.',
        'Be warm, practical, concise, and honest. Prefer 2 to 5 short sentences.',
        'Use the supplied catalogue context for book facts. Do not invent books, prices, availability, retailer links, or account data.',
        'Prices are EUR estimates when shown. Always explain that final price, taxes, delivery, and availability are confirmed by the retailer or checkout flow.',
        'If a user asks for private account details and no account data is supplied, explain that account-aware support is coming and give the next best general step.',
        'Return valid JSON only with this shape: {"text":"...", "sources":["..."]}.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: JSON.stringify({
        user_message: message,
        page_context: {
          section: context.section || 'landing',
          label: context.label || 'Landing page',
          hint: context.hint || '',
        },
        rule_based_draft: {
          text: baseReply.text,
          sources: baseReply.sources || [],
        },
        catalogue_matches: bookContext,
        help_articles: articles.slice(0, 3).map(article => ({
          title: article.title,
          topic: article.topic,
          excerpt: article.body,
          path: article.cta?.path,
        })),
      }),
    },
  ];
}

async function generateAssistantReply({ message, baseReply, books, pageContext, articles }) {
  const openaiBaseUrl = getEnv('OPENAI_BASE_URL');
  const openaiApiKey = getEnv('OPENAI_API_KEY');
  if (!openaiBaseUrl && !openaiApiKey) return baseReply;

  try {
    const openai = new OpenAI({
      apiKey: openaiApiKey || 'netlify-ai-gateway',
      baseURL: openaiBaseUrl || undefined,
    });
    const completion = await openai.chat.completions.create({
      model: getAssistantModel(),
      messages: buildModelMessages({ message, baseReply, books, pageContext, articles }),
      response_format: { type: 'json_object' },
      temperature: 0.35,
      max_tokens: 420,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) return baseReply;

    const parsed = JSON.parse(content);
    if (!parsed?.text) return baseReply;

    return {
      ...baseReply,
      text: String(parsed.text).trim(),
      sources: Array.from(new Set([
        ...(baseReply.sources || []),
        ...(Array.isArray(parsed.sources) ? parsed.sources : []),
        'openai',
      ])),
    };
  } catch (error) {
    console.error('[assistant function] OpenAI reply failed:', error?.message || error);
    return baseReply;
  }
}

export default async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON payload' }, 400);
  }

  const message = String(payload?.message || '').trim();
  if (!message) {
    return json({ error: 'Message is required' }, 400);
  }

  const [books, articles] = await Promise.all([
    fetchCatalogueContext(message),
    fetchArticleContext(message),
  ]);
  const pageContext = payload?.pageContext || null;
  const baseReply = buildAssistantReply(message, books, pageContext, articles);
  const reply = await generateAssistantReply({
    message,
    baseReply,
    books: baseReply.books || books,
    pageContext,
    articles,
  });

  return json({
    ...reply,
    mode: reply.sources?.includes('openai') ? 'openai_grounded' : 'rule_based',
    sessionId: payload?.sessionId || null,
  });
};

export const config = {
  path: '/api/assistant',
  method: ['POST'],
};
