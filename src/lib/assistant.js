import { assistantKnowledgeDocuments } from './assistantKnowledge.js';

export const ASSISTANT_PROMPTS = [
  'How do I publish a book?',
  'How should I price my book?',
  'Where can readers buy my book?',
  'Find books by African authors',
];

export const ASSISTANT_HISTORY_LIMIT = 8;
const ASSISTANT_HISTORY_MESSAGE_LIMIT = 1200;

function isPrivateAssistantMessage(message) {
  if (!message || typeof message !== 'object') return true;
  if (
    message.handoffFlow
    || message.handoffSensitive
    || message.private
    || message.sensitive
    || message.pending
  ) return true;

  const kind = String(message.kind || '').toLowerCase();
  return message.id === 'welcome' || kind.includes('handoff') || kind.includes('human-offer');
}

function stripUnsafeControlCharacters(value) {
  return Array.from(value, character => {
    const code = character.charCodeAt(0);
    const unsafe = code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
    return unsafe ? ' ' : character;
  }).join('');
}

/**
 * Keep only a small, non-private transcript for conversational AI context.
 * Handoff/contact collection messages stay in the UI and are never forwarded.
 */
export function sanitizeAssistantHistory(history, currentMessage = '', limit = ASSISTANT_HISTORY_LIMIT) {
  if (!Array.isArray(history)) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || ASSISTANT_HISTORY_LIMIT, 1), 20);

  const sanitized = history.slice(-(safeLimit * 3)).flatMap(entry => {
    if (isPrivateAssistantMessage(entry)) return [];

    const role = entry.role === 'user' || entry.role === 'assistant' ? entry.role : null;
    const rawContent = typeof entry.content === 'string' ? entry.content : entry.text;
    if (!role || typeof rawContent !== 'string') return [];

    const content = stripUnsafeControlCharacters(rawContent)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, ASSISTANT_HISTORY_MESSAGE_LIMIT);

    return content ? [{ role, content }] : [];
  });

  const current = stripUnsafeControlCharacters(String(currentMessage || ''))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, ASSISTANT_HISTORY_MESSAGE_LIMIT);
  const last = sanitized.at(-1);
  if (current && last?.role === 'user' && last.content === current) sanitized.pop();

  return sanitized.slice(-safeLimit);
}

export function normaliseAssistantText(value) {
  return String(value || '').toLowerCase().replace(/[^\w\s-]/g, ' ');
}

const HUMAN_SUPPORT_PATTERNS = [
  /\b(?:talk|takl|speak|connect|transfer)(?:\s+me)?\s+(?:to|with)\s+(?:a\s+)?(?:human|person|someone|somebody|representative|support agent|team member)\b/i,
  /\b(?:can|could|may)\s+i\s+(?:talk|speak|chat)\s+(?:to|with)\s+(?:a\s+)?(?:human|person|someone|somebody|support|the team)\b/i,
  /\b(?:i\s+(?:need|want)|please\s+get\s+me)\s+(?:help\s+from\s+)?(?:a\s+)?(?:human|person|representative|support agent|team member|support)\b/i,
  /\b(?:i need|i want|please|can i get)\s+(?:some\s+)?customer service\b/i,
  /\b(?:human support|real person|support agent|team member|live chat)\b/i,
  /\b(?:real|actual|live)\s+(?:human|person|agent|assistant)\b/i,
  /\bhuman\s+(?:agent|assistant|representative|support)\b/i,
  /\b(?:someone|somebody|a person)\s+(?:to\s+)?(?:help|contact|email|call|reply)\b/i,
  /\b(?:can|could|will|would)\s+(?:someone|somebody|the team)\s+(?:contact|email|call|reply)\b/i,
  /\b(?:escalate (?:this|my (?:issue|request|case))|talk to support|speak to support)\b/i,
  /\b(?:message|contact|email)\s+(?:the|your|support)?\s*team\b/i,
];

export function isHumanSupportIntent(value) {
  const message = String(value || '');
  return HUMAN_SUPPORT_PATTERNS.some(pattern => pattern.test(message));
}

export function getAssistantActionMessage(action) {
  const value = String(action?.value || '').trim();
  if (action?.type !== 'ask' || !value) return value;
  const soundsLikeAssistantQuestion = /^(?:what|which|how|where|when|why|who|can|could|would|do|does|are|is)\b[^?]*\?$/i.test(value)
    && /\b(?:you|your)\b/i.test(value);
  if (!soundsLikeAssistantQuestion) return value;

  const label = String(action?.label || '').trim().replace(/[?.!]+$/, '');
  const askTopic = label.match(/^ask about\s+(.+)$/i)?.[1];
  if (askTopic) return `Tell me about ${askTopic}.`;
  const learnTopic = label.match(/^learn about\s+(.+)$/i)?.[1];
  if (learnTopic) return `Tell me about ${learnTopic}.`;
  if (/^(?:i\b|help me\b|show me\b|tell me\b|find me\b|let's\b)/i.test(label)) return `${label}.`;
  return label ? `I'd like help with ${label.toLowerCase()}.` : 'Please tell me more.';
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
  return matches[0].body;
}

function buildKnowledgeActions(matches) {
  const cta = matches[0]?.cta;
  if (!cta?.label || !cta?.path) return [];
  return [{ label: cta.label, type: 'navigate', value: cta.path }];
}

function pickStarterBooks(books = []) {
  return books
    .filter(book => book?.slug && book?.title)
    .slice(0, 3);
}

/** Keep social moments human before Alex routes the author into a task. */
export function buildPublishingSocialReply(message = '', workflowContext = {}) {
  const text = normaliseAssistantText(message).trim();
  const currentWork = workflowContext?.activeField?.label || workflowContext?.stepLabel;

  if (/^(hi|hello|hey|hiya|good morning|good afternoon|good evening)[!. ]*$/.test(text)) {
    return {
      text: currentWork
        ? `Hi — good to see you. How are you feeling about ${currentWork.toLowerCase()} today?`
        : 'Hi — good to see you. How is the book going today?',
      actions: [], sources: ['publishing_social_policy'],
    };
  }
  if (/^(thanks|thank you|cheers|that helps|helpful|got it)[!. ]*$/.test(text)) {
    return { text: 'You’re welcome. We can take it one step at a time.', actions: [], sources: ['publishing_social_policy'] };
  }
  if (/\b(i(?: m| am)? (?:stuck|lost|confused|overwhelmed|frustrated)|this is (?:confusing|hard|difficult)|i don t understand)\b/.test(text)) {
    return {
      text: currentWork
        ? `I understand. ${currentWork} can feel like a lot when you’re already carrying the whole book. Tell me what feels unclear, and we’ll handle just that part first.`
        : 'I understand. Publishing can feel like a lot when you’re already carrying the whole book. Tell me what feels unclear, and we’ll handle just that part first.',
      actions: [], sources: ['publishing_social_policy'],
    };
  }
  if (/\b(i (?:finally )?finished|manuscript is (?:done|finished)|i did it|it'?s finished|i completed)\b/.test(text)) {
    return {
      text: 'That’s a real milestone — congratulations. Finishing a manuscript takes a great deal of persistence. When you’re ready, we can look at the next publishing step together.',
      actions: [], sources: ['publishing_social_policy'],
    };
  }
  if (/^(i don t know|not sure|i m not sure|no idea)[!. ]*$/.test(text)) {
    return {
      text: currentWork
        ? `That’s okay. You don’t need to have ${currentWork.toLowerCase()} figured out yet. Tell me what you already know, even if it is rough, and I’ll help shape the next step.`
        : 'That’s okay. Tell me what you already know about the book, even if it is rough, and I’ll help you find the next step.',
      actions: [], sources: ['publishing_social_policy'],
    };
  }
  return null;
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
  const humanSupportIntent = isHumanSupportIntent(text);
  const greetingIntent = /^(hi|hello|hey|hiya|good morning|good afternoon|good evening)\b/.test(text.trim());
  const thanksIntent = /^(thanks|thank you|cheers|got it|okay thanks|ok thanks)\b/.test(text.trim());
  const idleIntent = /^(nothing|nothing really|not much|just looking|just browsing|only looking|no reason|nope)\b/.test(text.trim());
  const unsureIntent = /^(not sure|i m not sure|unsure|i don t know|no idea|what can i do)\b/.test(text.trim());

  if (humanSupportIntent) {
    return {
      text: 'I can connect you with the Indie Converters team. They’ll continue with you by email.',
      context,
      sources: ['human_support_guidance'],
    };
  }

  if (idleIntent) {
    return {
      text: 'No pressure. Have a look around, and I’ll be here when you need me.',
      actions: [
        { label: 'Browse books', type: 'navigate', value: '/shop' },
        { label: 'Explore publishing', type: 'navigate', value: '/publish' },
      ],
      context,
      sources: ['conversation_guidance', 'page_context'],
    };
  }

  if (greetingIntent) {
    return {
      text: 'Hi! Are you here to find your next read, or are you working on a book?',
      actions: [
        { label: 'Find a book', type: 'ask', value: 'Help me find a book' },
        { label: 'Work on my book', type: 'ask', value: 'Help me publish my book' },
      ],
      context,
      sources: ['conversation_guidance', 'page_context'],
    };
  }

  if (thanksIntent) {
    return {
      text: 'You’re welcome.',
      context,
      sources: ['conversation_guidance'],
    };
  }

  if (unsureIntent) {
    return {
      text: 'That’s okay. Pick whichever feels closest and we’ll take it one step at a time.',
      actions: [
        { label: 'I want to publish', type: 'ask', value: 'I want to publish a book' },
        { label: 'I want something to read', type: 'ask', value: 'Help me find something to read' },
      ],
      context,
      sources: ['conversation_guidance', 'page_context'],
    };
  }

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
      actions: buildKnowledgeActions(knowledgeMatches),
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
      actions: buildKnowledgeActions(knowledgeMatches),
      context,
      sources: ['knowledge_base', 'publishing_guidance', 'page_context'],
    };
  }

  if (pricingIntent) {
    const knowledgeText = buildKnowledgeText(knowledgeMatches);
    return {
      text: knowledgeText || 'For pricing, use one clear default currency, compare retailer prices where available, and keep the final checkout price confirmed by the store. For authors, the key setup is list price, format, retailer links, and whether the book is direct-sale or discovery-only.',
      actions: buildKnowledgeActions(knowledgeMatches),
      context,
      sources: ['knowledge_base', 'pricing_guidance', 'page_context'],
    };
  }

  if (accountIntent) {
    const knowledgeText = buildKnowledgeText(knowledgeMatches);
    return {
      text: knowledgeText || 'Account setup starts with creating an author account, completing your profile, then using the dashboard to manage books, links, pricing, and publishing status. Once signed in, the assistant can later become account-aware.',
      actions: buildKnowledgeActions(knowledgeMatches),
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
      actions: buildKnowledgeActions(knowledgeMatches),
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
    text: `Hi${displayName ? ` ${displayName}` : ''}, I’m Jane. What are you working on today?`,
    time: formatAssistantTime(),
  };
}

export async function requestAssistantReply({ message, books = [], sessionId, resetSession = false, pageUrl, pageContext, workflowContext, requestType = 'chat', history = [] }) {
  const context = pageContext || getAssistantPageContext('/');
  if (typeof fetch !== 'function') return buildAssistantReply(message, books, context);

  const recentHistory = sanitizeAssistantHistory(
    history,
    message,
    workflowContext?.mode === 'publishing_upload' ? 16 : ASSISTANT_HISTORY_LIMIT,
  );

  try {
    let accessToken = '';
    if (workflowContext?.mode === 'publishing_upload') {
      try {
        const { supabase } = await import('./supabase.js');
        const { data } = await supabase.auth.getSession();
        accessToken = data?.session?.access_token || '';
      } catch {
        // The server can still provide a non-persistent reply when auth is unavailable.
      }
    }
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        message,
        sessionId,
        resetSession,
        pageUrl,
        pageContext: context,
        workflowContext: workflowContext || null,
        requestType,
        history: recentHistory,
      }),
    });

    if (!response.ok) throw new Error(`Assistant endpoint returned ${response.status}`);
    const data = await response.json();
    if (!data?.text && requestType !== 'proactive_guidance') throw new Error('Assistant endpoint returned an empty response');
    return {
      text: data.text,
      books: data.books || [],
      actions: data.actions || [],
      fieldSuggestions: data.fieldSuggestions || [],
      selectionReplacement: data.selectionReplacement || null,
      metadataAnalysis: data.metadataAnalysis || null,
      matterDraft: data.matterDraft || null,
      actionPlan: data.actionPlan || null,
      context: data.context || context.section,
      sources: data.sources || ['assistant_endpoint'],
    };
  } catch (error) {
    console.warn('[assistant] falling back to local reply:', error?.message || error);
    if (requestType === 'proactive_guidance') {
      return { text: '', books: [], actions: [], fieldSuggestions: [], context: context.section, sources: ['proactive_unavailable'] };
    }
    return buildAssistantReply(message, books, context);
  }
}
