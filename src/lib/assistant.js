import { assistantKnowledgeDocuments } from './assistantKnowledge.js';

export const ASSISTANT_PROMPTS = [
  'How do I publish a book?',
  'How should I price my book?',
  'Where can readers buy my book?',
  'Find books by African authors',
];

export function normaliseAssistantText(value) {
  return String(value || '').toLowerCase().replace(/[^\w\s-]/g, ' ');
}

export function getAssistantPageContext(pathname = '/') {
  const path = String(pathname || '/').toLowerCase();
  if (path.startsWith('/book/')) {
    return {
      section: 'book_detail',
      label: 'Book page',
      hint: 'The visitor is viewing a specific book page. Prioritise retailer options, formats, availability, saving, sharing, and similar catalogue titles.',
    };
  }
  if (path.startsWith('/shop')) {
    return {
      section: 'shop',
      label: 'Shop',
      hint: 'The visitor is browsing the catalogue. Prioritise finding books by title, author, genre, mood, format, and retailer availability.',
    };
  }
  if (path.startsWith('/checkout') || path.startsWith('/cart')) {
    return {
      section: 'checkout',
      label: 'Checkout',
      hint: 'The visitor is in the buying flow. Prioritise cart, shipping, payment, order, and direct-sale support.',
    };
  }
  if (path.startsWith('/upload') || path.startsWith('/publish')) {
    return {
      section: 'publishing',
      label: 'Publishing',
      hint: 'The visitor is interested in publishing. Prioritise manuscript upload, metadata, covers, pricing, retailers, preview, and launch readiness.',
    };
  }
  if (path.startsWith('/dashboard')) {
    return {
      section: 'dashboard',
      label: 'Dashboard',
      hint: 'The visitor is around author tools. Prioritise royalties, retailer links, book status, catalogue management, and account setup.',
    };
  }
  return {
    section: 'landing',
    label: 'Landing page',
    hint: 'The visitor is learning about Indie Converters. Prioritise a short orientation across publishing, discovery, pricing, retailers, and account setup.',
  };
}

const ASSISTANT_SEARCH_STOPWORDS = new Set([
  'find', 'show', 'give', 'get', 'book', 'books', 'title', 'titles',
  'author', 'authors', 'read', 'reads', 'reading', 'recommend',
  'recommendation', 'recommendations', 'by', 'from', 'with', 'about',
  'the', 'and', 'for', 'that', 'this', 'please', 'how', 'should', 'can',
  'does', 'need', 'here', 'directly', 'site', 'give', 'use', 'into', 'me',
  'my', 'your',
]);

const CONTEXT_TOPIC_BOOSTS = {
  book_detail: ['Retailer Links', 'Pricing', 'Finding & Saving Books'],
  shop: ['Finding & Saving Books', 'Retailer Links'],
  checkout: ['Checkout', 'Retailer Links', 'Pricing'],
  publishing: ['Publishing a Book', 'Pricing', 'Retailer Links'],
  dashboard: ['Account & Settings', 'Author Profiles', 'Publishing a Book'],
  landing: ['Getting Started', 'Publishing a Book', 'Finding & Saving Books'],
};

function extractAuthorQuery(query) {
  const match = String(query || '').match(/\bby\s+(.+)$/i);
  if (!match) return '';
  return normaliseAssistantText(match[1])
    .split(/\s+/)
    .filter(term => term.length > 2 && !ASSISTANT_SEARCH_STOPWORDS.has(term))
    .join(' ');
}

export function findAssistantBookMatches(query, books = []) {
  const cleaned = normaliseAssistantText(query);
  const authorQuery = extractAuthorQuery(query);
  const authorTerms = authorQuery.split(/\s+/).filter(Boolean);
  const terms = cleaned
    .split(/\s+/)
    .filter(term => term.length > 2 && !ASSISTANT_SEARCH_STOPWORDS.has(term));
  if (!terms.length) return [];

  const scored = books
    .map(book => {
      const author = normaliseAssistantText(book.author);
      const title = normaliseAssistantText(book.title);
      const metadata = normaliseAssistantText([
        book.title,
        book.author,
        book.genre,
        book.genres?.join(' '),
        book.blurb,
        book.keywords?.join(' '),
      ].filter(Boolean).join(' '));

      const authorScore = authorTerms.length
        ? authorTerms.reduce((sum, term) => sum + (author.includes(term) ? 6 : 0), 0)
        : 0;
      const titleScore = terms.reduce((sum, term) => sum + (title.includes(term) ? 3 : 0), 0);
      const metadataScore = terms.reduce((sum, term) => sum + (metadata.includes(term) ? 1 : 0), 0);
      const score = authorScore + titleScore + metadataScore;
      return { book, score };
    })
    .filter(item => item.score > 0);

  const authorMatches = authorTerms.length
    ? scored.filter(item => authorTerms.every(term => normaliseAssistantText(item.book.author).includes(term)))
    : [];

  return (authorMatches.length ? authorMatches : scored)
    .sort((a, z) => z.score - a.score)
    .slice(0, 3)
    .map(item => item.book);
}

export function findAssistantKnowledgeMatches(query, pageContext = getAssistantPageContext('/'), extraDocuments = []) {
  const cleaned = normaliseAssistantText(query);
  const terms = cleaned
    .split(/\s+/)
    .filter(term => term.length > 2 && !ASSISTANT_SEARCH_STOPWORDS.has(term));
  if (!terms.length) return [];

  const contextTopics = CONTEXT_TOPIC_BOOSTS[pageContext?.section || 'landing'] || [];
  const docs = [...assistantKnowledgeDocuments(), ...extraDocuments];

  return docs
    .map(doc => {
      const title = normaliseAssistantText(doc.title);
      const body = normaliseAssistantText(doc.body);
      const topic = normaliseAssistantText(doc.topic);
      const keywords = normaliseAssistantText(doc.keywords?.join(' '));
      const haystack = [title, body, topic, keywords].join(' ');

      const titleScore = terms.reduce((sum, term) => sum + (title.includes(term) ? 5 : 0), 0);
      const keywordScore = terms.reduce((sum, term) => sum + (keywords.includes(term) ? 4 : 0), 0);
      const bodyScore = terms.reduce((sum, term) => sum + (body.includes(term) ? 1 : 0), 0);
      const phraseScore = cleaned.length > 8 && haystack.includes(cleaned) ? 8 : 0;
      const matchScore = titleScore + keywordScore + bodyScore + phraseScore;
      const topicBoost = matchScore > 0 && contextTopics.includes(doc.topic) ? 2 : 0;
      return { doc, score: matchScore + topicBoost };
    })
    .filter(item => item.score > 0)
    .sort((a, z) => z.score - a.score)
    .slice(0, 3)
    .map(item => item.doc);
}

function buildKnowledgeText(matches) {
  if (!matches.length) return '';
  const [primary, ...related] = matches;
  const relatedText = related.length
    ? ` Related: ${related.map(item => item.title).join('; ')}.`
    : '';
  const ctaText = primary.cta?.label && primary.cta?.path
    ? ` Next step: ${primary.cta.label}.`
    : '';
  return `${primary.body}${relatedText}${ctaText}`;
}

function pickStarterBooks(books = []) {
  return books
    .filter(book => book?.slug && book?.title)
    .slice(0, 3);
}

export function buildAssistantReply(message, books = [], pageContext = getAssistantPageContext('/'), extraKnowledgeDocuments = []) {
  const text = normaliseAssistantText(message);
  const bookMatches = findAssistantBookMatches(message, books);
  const knowledgeMatches = findAssistantKnowledgeMatches(message, pageContext, extraKnowledgeDocuments);
  const context = pageContext?.section || 'landing';
  const pricingIntent = /(price|pricing|royalt|earn|sell|retailer|distribution|amazon|kobo|google|store)/.test(text);
  const buyingIntent = /(buy|buying|cart|checkout|payment|shipping|order|direct sale|directly|available|availability)/.test(text);
  const publishingIntent = /(publish|publishing|start|launch|upload|manuscript|cover|file|isbn)/.test(text);
  const accountIntent = /(account|setup|sign|login|profile|dashboard)/.test(text);
  const catalogueIntent = /(find|show|recommend|discover|browse|search|title|author|genre|african|fiction|poetry|novel|essay|read|reader)/.test(text);

  if (bookMatches.length && catalogueIntent && !pricingIntent && !buyingIntent && !publishingIntent && !accountIntent) {
    return {
      text: 'I found catalogue matches. Open any title to check the description, formats, availability, and retailer options.',
      books: bookMatches,
      context,
      sources: ['public_catalogue', 'page_context'],
    };
  }

  if (catalogueIntent && !pricingIntent && !buyingIntent && !publishingIntent && !accountIntent) {
    const starterBooks = pickStarterBooks(books);
    return {
      text: starterBooks.length
        ? 'Absolutely. Here are a few books to start with. If you tell me a mood, genre, author, or whether you want fiction or nonfiction, I can narrow it down.'
        : 'Absolutely. Tell me what you are in the mood for: fiction or nonfiction, something tender or fast-paced, a genre, an author, or even one book you already liked.',
      books: starterBooks,
      context,
      sources: ['public_catalogue', 'discovery_guidance', 'page_context'],
    };
  }

  if (context === 'checkout') {
    return {
      text: 'You are in the buying flow. I can help with cart items, shipping choices, payment methods, order details, and whether a book is direct-sale or handled by an external retailer.',
      context,
      sources: ['checkout_context'],
    };
  }

  if (buyingIntent) {
    const knowledgeText = buildKnowledgeText(knowledgeMatches);
    return {
      text: knowledgeText || 'Direct-sale books use the Indie Converters cart and checkout. Discovery-only books open retailer, publisher, library, or author store options. Final price, tax, delivery, and availability are confirmed at checkout or on the retailer site.',
      context,
      sources: ['knowledge_base', 'retailer_guidance', 'page_context'],
    };
  }

  if (context === 'book_detail' && /(buy|get|store|retailer|price|format|available|availability|save|share)/.test(text)) {
    return {
      text: 'On a book page, use “Get it” to compare available stores and prices. Final price, delivery, tax, and availability are confirmed by the retailer before purchase.',
      context,
      sources: ['book_page_context', 'pricing_guidance'],
    };
  }

  if (context === 'shop' && /(help|browse|discover|find|search|recommend|genre|mood|author)/.test(text)) {
    return {
      text: 'In the shop, you can search by title, author, genre, or mood. If a title is discovery-only, we point readers to retailer options; if it is direct-sale, checkout happens through Indie Converters.',
      books: bookMatches,
      context,
      sources: ['shop_context', 'public_catalogue'],
    };
  }

  if (publishingIntent) {
    const knowledgeText = buildKnowledgeText(knowledgeMatches);
    return {
      text: knowledgeText || 'To publish, start with your manuscript, cover, book details, formats, price, and retailer links. Indie Converters keeps the process private first, then lets you preview before launch so you stay in control of the listing.',
      context,
      sources: ['knowledge_base', 'publishing_guidance', 'page_context'],
    };
  }

  if (pricingIntent) {
    const knowledgeText = buildKnowledgeText(knowledgeMatches);
    return {
      text: knowledgeText || 'For pricing, use one clear default currency, compare retailer prices where available, and keep the final checkout price confirmed by the store. For authors, the key setup is list price, format, retailer links, and whether the book is direct-sale or discovery-only.',
      context,
      sources: ['knowledge_base', 'pricing_guidance', 'page_context'],
    };
  }

  if (accountIntent) {
    const knowledgeText = buildKnowledgeText(knowledgeMatches);
    return {
      text: knowledgeText || 'Account setup starts with creating an author account, completing your profile, then using the dashboard to manage books, links, pricing, and publishing status. Once signed in, the assistant can later become account-aware.',
      context,
      sources: ['knowledge_base', 'account_guidance', 'page_context'],
    };
  }

  if (/(discover|browse|mood|reader|recommend|search)/.test(text)) {
    return {
      text: 'Readers can browse by genre, mood, author, or title. Try asking for a title, author, genre, or mood and I can look through the public catalogue.',
      books: bookMatches,
      context,
      sources: ['discovery_guidance', 'page_context'],
    };
  }

  if (/(help|support|contact|problem|issue)/.test(text)) {
    const knowledgeText = buildKnowledgeText(knowledgeMatches);
    return {
      text: knowledgeText || 'I can help with publishing, uploading, pricing, retailers, account setup, and public book discovery. This is still a test assistant, so complex account-specific support will come after the backend integration.',
      context,
      sources: ['knowledge_base', 'support_guidance', 'page_context'],
    };
  }

  if (knowledgeMatches.length) {
    return {
      text: buildKnowledgeText(knowledgeMatches),
      context,
      sources: ['knowledge_base', 'page_context'],
    };
  }

  return {
    text: 'I can help with publishing, uploads, pricing, retailer links, account setup, and finding books. Try asking for a mood, genre, author, or a publishing step you are working on.',
    context,
    sources: ['fallback_guidance', 'page_context'],
  };
}

export function formatAssistantTime(date = new Date()) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function getAssistantDisplayName(user) {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;
  if (!name) return '';
  return String(name).split('@')[0].trim().split(/\s+/)[0];
}

export function createWelcomeMessage(user) {
  const displayName = getAssistantDisplayName(user);
  return {
    id: 'welcome',
    role: 'assistant',
    text: displayName
      ? `Hi there ${displayName}, what are we writing today?`
      : 'Hi, I can help with publishing, uploading, pricing, retailer links, account setup, and finding books in the catalogue.',
    time: formatAssistantTime(),
  };
}

export async function requestAssistantReply({ message, books = [], sessionId, pageUrl, pageContext }) {
  const context = pageContext || getAssistantPageContext('/');
  if (typeof fetch !== 'function') return buildAssistantReply(message, books, context);

  try {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId, pageUrl, pageContext: context }),
    });

    if (!response.ok) throw new Error(`Assistant endpoint returned ${response.status}`);
    const data = await response.json();
    if (!data?.text) throw new Error('Assistant endpoint returned an empty response');
    return {
      text: data.text,
      books: data.books || [],
      context: data.context || context.section,
      sources: data.sources || ['assistant_endpoint'],
    };
  } catch (error) {
    console.warn('[assistant] falling back to local reply:', error?.message || error);
    return buildAssistantReply(message, books, context);
  }
}
