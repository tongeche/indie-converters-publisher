import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { buildAssistantReply, sanitizeAssistantHistory } from '../../src/lib/assistant.js';
import { formatDisplayMoney } from '../../src/lib/currency.js';
import { buildPricingCoachScenarios } from '../../src/lib/royaltyCalculator.js';

const BOOK_SELECT = `
  id, slug, title, description, cover_url, formats, keywords, pub_year, price, language,
  trim_size, indie_status,
  book_retailer_links ( url, price, currency, source, retailers ( slug, label ) ),
  books_authors ( position, authors ( slug, display_name ) ),
  books_genres ( genres ( slug, label ) )
`;

const BLOG_SELECT = 'slug, title, pillar, excerpt, primary_keyword, secondary_keywords, published_at';
const PUBLISHING_ASSISTANT_FIELDS = new Set([
  'title', 'subtitle', 'language', 'edition', 'series', 'seriesVolume', 'description',
  'audience', 'genre', 'genreSecondary', 'keywords', 'pubYear', 'publisher', 'pageCount',
  'trimSize', 'price',
]);
const MATTER_TYPES = {
  copyright: { section: 'frontMatter', key: 'copyright', label: 'Copyright Page', legalTemplate: true },
  dedication: { section: 'frontMatter', key: 'dedication', label: 'Dedication', legalTemplate: false },
  author_bio: { section: 'backMatter', key: 'aboutAuthor', label: 'About the Author', legalTemplate: false },
  acknowledgements: { section: 'backMatter', key: 'acknowledgements', label: 'Acknowledgements', legalTemplate: false },
  also_by: { section: 'backMatter', key: 'alsoBy', label: 'Also by the Author', legalTemplate: false },
  reader_cta: { section: 'backMatter', key: 'readerCta', label: 'Reader Call to Action', legalTemplate: false },
  reading_group: { section: 'backMatter', key: 'readingGroup', label: 'Reading Group Questions', legalTemplate: false },
};

function cleanWorkflowText(value, maxLength = 500) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').trim().slice(0, maxLength)
    : '';
}

function sanitizePublishingWorkflow(value) {
  if (!value || value.mode !== 'publishing_upload') return null;
  const details = value.bookDetails && typeof value.bookDetails === 'object' ? value.bookDetails : {};
  const rawActive = value.activeField;
  const activeField = rawActive && PUBLISHING_ASSISTANT_FIELDS.has(rawActive.id)
    ? {
        id: rawActive.id,
        label: cleanWorkflowText(rawActive.label, 80),
        purpose: cleanWorkflowText(rawActive.purpose, 240),
        value: Array.isArray(rawActive.value)
          ? rawActive.value.slice(0, 12).map(item => cleanWorkflowText(item, 80))
          : cleanWorkflowText(rawActive.value, 4000),
        required: Boolean(rawActive.required),
        maxLength: Math.min(Math.max(Number(rawActive.maxLength) || 0, 0), 4000) || null,
        validation: cleanWorkflowText(rawActive.validation, 240),
      }
    : null;
  const readinessStatuses = new Set(['complete', 'recommended', 'missing', 'blocker']);
  const readinessItems = Array.isArray(value.readiness?.items)
    ? value.readiness.items.slice(0, 20).map(item => ({
        id: cleanWorkflowText(item?.id, 50),
        label: cleanWorkflowText(item?.label, 100),
        status: readinessStatuses.has(item?.status) ? item.status : 'recommended',
        message: cleanWorkflowText(item?.message, 240),
        step: Math.min(Math.max(Number(item?.step) || 0, 0), 19),
        field: PUBLISHING_ASSISTANT_FIELDS.has(item?.field) ? item.field : null,
      })).filter(item => item.id && item.label)
    : [];
  const readinessComplete = readinessItems.filter(item => item.status === 'complete').length;
  const rawDescriptionBrief = value.descriptionBrief && typeof value.descriptionBrief === 'object'
    ? value.descriptionBrief
    : null;
  const metadataGenres = Array.isArray(value.metadataOptions?.genres)
    ? value.metadataOptions.genres.slice(0, 100).map(item => ({
        value: cleanWorkflowText(item?.value, 80),
        label: cleanWorkflowText(item?.label, 100),
      })).filter(item => item.value && item.label)
    : [];
  const metadataAudiences = Array.isArray(value.metadataOptions?.audiences)
    ? value.metadataOptions.audiences.slice(0, 10).map(item => ({
        value: cleanWorkflowText(item?.value, 50),
        label: cleanWorkflowText(item?.label, 80),
      })).filter(item => item.value && item.label)
    : [];
  const wizardNavigation = Array.isArray(value.wizardNavigation)
    ? value.wizardNavigation.slice(0, 30).map(item => ({
        field: PUBLISHING_ASSISTANT_FIELDS.has(item?.field) ? item.field : null,
        step: Math.min(Math.max(Number(item?.step) || 0, 0), 19),
        label: cleanWorkflowText(item?.label, 80),
      })).filter(item => item.field && item.label)
    : [];
  const pricingContext = {
    formats: Array.isArray(value.pricingContext?.formats) ? value.pricingContext.formats.filter(format => ['eBook', 'Paperback', 'Hardcover', 'Audiobook'].includes(format)).slice(0, 4) : [],
    pageCount: Math.min(Math.max(Number(value.pricingContext?.pageCount) || 0, 0), 5000) || null,
    trimSize: cleanWorkflowText(value.pricingContext?.trimSize, 40),
    distributionChannels: Array.isArray(value.pricingContext?.distributionChannels) ? value.pricingContext.distributionChannels.map(item => cleanWorkflowText(item, 50)).filter(Boolean).slice(0, 20) : [],
    distributionStrategy: ['wide', 'amazon_exclusive', 'direct_first'].includes(value.pricingContext?.distributionStrategy) ? value.pricingContext.distributionStrategy : '',
    distributionPriority: cleanWorkflowText(value.pricingContext?.distributionPriority, 80),
  };
  const pricingObjectives = new Set(['readership', 'earnings', 'launch', 'series', 'premium']);
  const pricingObjective = pricingObjectives.has(value.pricingCoach?.objective) ? value.pricingCoach.objective : null;
  const matterType = MATTER_TYPES[value.matterRequest?.type] ? value.matterRequest.type : null;

  return {
    mode: 'publishing_upload',
    stepNumber: Math.min(Math.max(Number(value.stepNumber) || 1, 1), 20),
    totalSteps: Math.min(Math.max(Number(value.totalSteps) || 12, 1), 20),
    stepLabel: cleanWorkflowText(value.stepLabel, 80),
    stepGroup: cleanWorkflowText(value.stepGroup, 80),
    stepGuidance: cleanWorkflowText(value.stepGuidance, 500),
    stepTips: Array.isArray(value.stepTips) ? value.stepTips.slice(0, 5).map(tip => cleanWorkflowText(tip, 200)) : [],
    readiness: {
      score: readinessItems.length ? Math.round((readinessComplete / readinessItems.length) * 100) : 100,
      complete: readinessComplete,
      total: readinessItems.length,
      blockers: readinessItems.filter(item => item.status === 'blocker').length,
      missing: readinessItems.filter(item => item.status === 'missing').length,
      recommended: readinessItems.filter(item => item.status === 'recommended').length,
      items: readinessItems,
    },
    descriptionBrief: rawDescriptionBrief ? {
      premise: cleanWorkflowText(rawDescriptionBrief.premise, 700),
      subject: cleanWorkflowText(rawDescriptionBrief.subject, 500),
      conflict: cleanWorkflowText(rawDescriptionBrief.conflict, 500),
      appeal: cleanWorkflowText(rawDescriptionBrief.appeal, 400),
      tone: cleanWorkflowText(rawDescriptionBrief.tone, 80),
    } : null,
    metadataOptions: { genres: metadataGenres, audiences: metadataAudiences },
    wizardNavigation,
    pricingContext,
    pricingCoach: pricingObjective ? {
      objective: pricingObjective,
      objectiveLabel: cleanWorkflowText(value.pricingCoach?.objectiveLabel, 80),
      scenarios: buildPricingCoachScenarios({ objective: pricingObjective, ...pricingContext }),
    } : null,
    matterContext: {
      authorName: cleanWorkflowText(value.matterContext?.authorName, 160),
      publisher: cleanWorkflowText(value.matterContext?.publisher, 160),
      publicationYear: cleanWorkflowText(value.matterContext?.publicationYear, 10),
      isbn: cleanWorkflowText(value.matterContext?.isbn, 30),
      authorBio: cleanWorkflowText(value.matterContext?.authorBio, 1500),
    },
    matterRequest: matterType ? { type: matterType, authorAnswer: cleanWorkflowText(value.matterRequest?.authorAnswer, 2000) } : null,
    activeField,
    bookDetails: {
      title: cleanWorkflowText(details.title, 160),
      subtitle: cleanWorkflowText(details.subtitle, 200),
      description: cleanWorkflowText(details.description, 4000),
      language: cleanWorkflowText(details.language, 80),
      audience: cleanWorkflowText(details.audience, 80),
      genre: cleanWorkflowText(details.genre, 100),
      secondaryGenre: cleanWorkflowText(details.secondaryGenre, 100),
      keywords: Array.isArray(details.keywords) ? details.keywords.slice(0, 12).map(item => cleanWorkflowText(item, 80)) : [],
      formats: Array.isArray(details.formats) ? details.formats.slice(0, 8).map(item => cleanWorkflowText(item, 50)) : [],
      trimSize: cleanWorkflowText(details.trimSize, 40),
      price: cleanWorkflowText(details.price, 40),
      isFree: Boolean(details.isFree),
      publisher: cleanWorkflowText(details.publisher, 160),
    },
  };
}

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

function buildModelMessages({ message, baseReply, books, pageContext, articles, history, workflowContext, requestType }) {
  const context = pageContext || {};
  const bookContext = books.slice(0, 5).map(summariseBook);
  const isUploadWorkflow = workflowContext?.mode === 'publishing_upload';
  const recentHistory = sanitizeAssistantHistory(history, message, isUploadWorkflow ? 16 : undefined);
  const roleInstructions = isUploadWorkflow
    ? [
        'You are Indie, a focused publishing workflow assistant inside the Indie Converters book-upload wizard.',
        'Only help the author complete the publishing wizard: book metadata, description, genre, keywords, publication details, manuscript preparation, reading style, cover, pricing, distribution, front and back matter, structure, and final review.',
        'Prioritise the current wizard step supplied below. If the question belongs to another publishing step, answer briefly and name that step. Politely redirect unrelated requests back to publishing.',
        'Help the author think and write; never claim you changed, saved, uploaded, validated, or published anything. The author must enter and confirm all values in the wizard.',
        'Do not invent facts about the book. When information is missing, ask one focused question. When brainstorming copy, provide 2 or 3 concise options that preserve the author’s voice.',
        'Never draft a description, blurb, subtitle, keywords, or marketing copy from only a title or genre. First collect enough real material from the author—such as premise, protagonist or subject, central goal or conflict, stakes, tone, and intended reader. Ask for the most important missing detail one question at a time.',
        'The activeField is the field the author is currently using. Resolve words like “this”, “it”, “here”, and “the field” against activeField without asking them to identify it again.',
        'Treat publishing_workflow.readiness as the authoritative readiness checklist. Never invent or upgrade a readiness status. When asked whether the book is ready, mention blockers first, then missing essentials, then at most one recommendation.',
        'When pricingContext.distributionStrategy is present, remember it as the author’s chosen distribution strategy and use it consistently in pricing, distribution, and final-review answers. Do not silently replace it with another strategy.',
        'wizardNavigation is the authoritative map of fields to wizard steps. When the user asks how to find, set, edit, or change a mapped field on the current or an earlier step, include one wizard action with that exact field value, such as {"label":"Go to Title","type":"wizard","value":"title"}. Never create a wizard action for an unmapped field or a future locked step.',
        'When you can provide ready-to-insert wording for activeField, include it in fieldSuggestions. Suggest only activeField.id and never another field. Do not suggest values for numeric, legal, identifier, file, price, or distribution fields.',
        ...(requestType === 'proactive_guidance' ? [
          'This is a proactive review, not a user question. Identify at most one concrete, actionable issue supported by the current step, active field, validation, or book details.',
          'Do not give generic tips, praise, summaries, or broad offers to help. Do not repeat advice already obvious from the field label.',
          'Do not return placeholder wording or generic insertable copy. Return fieldSuggestions only when you can revise meaningful existing text without inventing book facts; otherwise explain the issue or ask one targeted question.',
          'Keep useful guidance under 45 words. If there is no meaningful issue worth interrupting the author about, return an empty text string and no actions or fieldSuggestions.',
        ] : []),
        ...(requestType === 'description_builder' ? [
          'The author has completed the guided description brief. Write one polished reader-facing book description using only facts in descriptionBrief and bookDetails.',
          'Use 2 or 3 short paragraphs and 100 to 170 words. Lead with a hook, establish the subject or central character and conflict, convey stakes or reader value, and end with a concise invitation suited to the supplied tone.',
          'Do not add names, events, claims, credentials, reviews, comparisons, or outcomes the author did not provide. Return exactly one fieldSuggestion for the description field, labelled “Use this description”.',
        ] : []),
        ...(requestType === 'metadata_intelligence' ? [
          'Perform a metadata review using only author-confirmed bookDetails. The description must contain enough substance; otherwise ask for the missing facts and return metadataAnalysis as null.',
          'Clearly separate confirmedFacts from inferred recommendations. An inference is not a fact. Give a short evidence-based rationale and confidence of high, medium, or low for each inferred recommendation.',
          'Genre and audience values must use exact values from metadataOptions. Suggest 2 subtitle alternatives, one primary genre, up to 2 secondary genres, exactly 7 specific multi-word search phrases, one audience, 2 or 3 BISAC-style category labels, and 2 comparable positioning statements.',
          'Comparable positioning must describe likely readership or market adjacency without claiming sales, awards, equivalence, or knowledge of the manuscript. Do not invent plot details, author credentials, or named comparable titles.',
          'Also return metadataAnalysis with this shape: {"confirmedFacts":[{"label":"...","value":"..."}],"subtitleAlternatives":[{"value":"...","rationale":"...","confidence":"high|medium|low"}],"primaryGenre":{"value":"allowed-slug","label":"...","rationale":"...","confidence":"..."},"secondaryGenres":[same genre shape],"searchPhrases":["..."],"audience":{"value":"allowed-value","label":"...","rationale":"...","confidence":"..."},"bisacCategories":[{"value":"...","rationale":"...","confidence":"..."}],"comparablePositioning":[{"value":"...","rationale":"...","confidence":"..."}]}.',
          'For this request, keep text to one short sentence and return no fieldSuggestions.',
        ] : []),
        ...(requestType === 'pricing_coach' ? [
          'Act as a careful pricing coach. pricingCoach.scenarios are deterministic estimates calculated by the application; do not redo or alter the arithmetic.',
          'Explain the most important trade-off for the author’s stated objective in no more than 65 words. Compare accessible, balanced, and higher-value scenarios across the supplied formats and channels.',
          'Mention when low eBook pricing may use a lower royalty tier and when print cost affects earnings. State that fees, print costs, taxes, marketplace rules, and final royalties can vary.',
          'Never claim or imply that any price guarantees readership, sales, ranking, revenue, or profit. Return no fieldSuggestions and at most one short follow-up action.',
          'If pricingContext.distributionStrategy is present, treat it as the author’s remembered decision and make the pricing explanation consistent with it.',
        ] : []),
        ...(requestType === 'matter_generator' ? [
          'Create one editable front- or back-matter draft for matterRequest.type, grounded only in bookDetails, matterContext, and matterRequest.authorAnswer.',
          'Do not invent names, relationships, credentials, book titles, URLs, quotations, awards, legal registrations, or facts. Preserve placeholders in square brackets when required information is missing.',
          'For copyright, provide a conventional plain-language template only. Do not give legal advice or claim legal sufficiency. Include “[Author review required: verify rights, jurisdiction, permissions, edition details, and ISBN before publication.]” at the end.',
          'For reading-group questions, create 6 to 10 open-ended questions grounded in supplied themes or description, without pretending to know manuscript events that were not supplied.',
          'For all types, return matterDraft with shape {"type":"exact requested type","content":"editable draft"}. Keep text to one short sentence and return no fieldSuggestions.',
        ] : []),
        'Treat supplied book details as private working context. Do not request manuscript text, passwords, payment data, contact details, or other sensitive information.',
      ]
    : [
        'You are the Indie Converters assistant.',
        'Help authors and readers with publishing, manuscript uploads, pricing, retailer links, account setup, and public book discovery.',
      ];

  return [
    {
      role: 'system',
      content: [
        ...roleInstructions,
        'Sound like a capable publishing guide: direct, warm, specific, and calm.',
        'Lead with the answer. Keep the text under 70 words and usually to 1 to 3 short sentences.',
        'Give only the most useful next step. Do not add background, summaries, related topics, or generic offers to help.',
        'If one detail is required to help well, ask one focused question instead of guessing.',
        'Use the supplied catalogue context for book facts. Do not invent books, prices, availability, retailer links, or account data.',
        'Prices are EUR estimates when shown. Always explain that final price, taxes, delivery, and availability are confirmed by the retailer or checkout flow.',
        'If a user asks for private account details and no account data is supplied, explain that account-aware support is coming and give the next best general step.',
        'If a user asks for a person, briefly say that you can connect them with the Indie Converters team.',
        'Do not ask for or repeat contact details in AI replies; the guided human-support steps in the chat collect those details outside OpenAI.',
        'Return valid JSON only with this shape: {"text":"...", "actions":[{"label":"...","type":"ask|navigate|wizard","value":"..."}], "fieldSuggestions":[{"field":"...","label":"...","value":"..."}], "metadataAnalysis":null, "matterDraft":null, "sources":["..."]}. For metadata_intelligence or matter_generator, replace the corresponding null with the required structured result.',
        'Return at most 2 actions. Use ask for a useful suggested reply and navigate only for a supplied site path. Keep action labels under 28 characters.',
      ].join('\n'),
    },
    ...recentHistory,
    {
      role: 'user',
      content: JSON.stringify({
        user_message: message,
        request_type: requestType,
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
        publishing_workflow: isUploadWorkflow ? workflowContext : null,
      }),
    },
  ];
}

function sanitizeMetadataAnalysis(value, workflowContext) {
  if (!value || typeof value !== 'object') return null;
  const allowedGenres = new Map((workflowContext?.metadataOptions?.genres || []).map(item => [item.value, item.label]));
  const allowedAudiences = new Map((workflowContext?.metadataOptions?.audiences || []).map(item => [item.value, item.label]));
  const confidence = input => ['high', 'medium', 'low'].includes(input) ? input : 'low';
  const recommendation = (item, maxValue = 300) => item && typeof item === 'object' && cleanWorkflowText(item.value, maxValue)
    ? { value: cleanWorkflowText(item.value, maxValue), rationale: cleanWorkflowText(item.rationale, 240), confidence: confidence(item.confidence) }
    : null;
  const genre = item => {
    const safe = recommendation(item, 80);
    if (!safe || !allowedGenres.has(safe.value)) return null;
    return { ...safe, label: allowedGenres.get(safe.value) };
  };
  const audience = recommendation(value.audience, 50);
  const safeAudience = audience && allowedAudiences.has(audience.value)
    ? { ...audience, label: allowedAudiences.get(audience.value) }
    : null;
  const list = (items, limit, maxValue) => (Array.isArray(items) ? items : [])
    .map(item => recommendation(item, maxValue)).filter(Boolean).slice(0, limit);
  const searchPhrases = [...new Set((Array.isArray(value.searchPhrases) ? value.searchPhrases : [])
    .map(item => cleanWorkflowText(item, 100).toLowerCase()).filter(item => item.split(/\s+/).length >= 2))].slice(0, 7);
  const details = workflowContext?.bookDetails || {};
  const confirmedFacts = [
    details.title && { label: 'Title', value: details.title },
    details.subtitle && { label: 'Subtitle', value: details.subtitle },
    details.description && { label: 'Description', value: `Provided by author (${details.description.length} characters)` },
    details.genre && { label: 'Primary genre', value: allowedGenres.get(details.genre) || details.genre },
    details.secondaryGenre && { label: 'Secondary genre', value: allowedGenres.get(details.secondaryGenre) || details.secondaryGenre },
    details.audience && { label: 'Audience', value: allowedAudiences.get(details.audience) || details.audience },
    details.keywords?.length && { label: 'Existing keywords', value: details.keywords.join(', ') },
  ].filter(Boolean);

  return {
    confirmedFacts,
    subtitleAlternatives: list(value.subtitleAlternatives, 2, 200),
    primaryGenre: genre(value.primaryGenre),
    secondaryGenres: (Array.isArray(value.secondaryGenres) ? value.secondaryGenres : []).map(genre).filter(Boolean).slice(0, 2),
    searchPhrases,
    audience: safeAudience,
    bisacCategories: list(value.bisacCategories, 3, 160),
    comparablePositioning: list(value.comparablePositioning, 2, 300),
  };
}

async function generateAssistantReply({ message, baseReply, books, pageContext, articles, history, workflowContext, requestType }) {
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
      messages: buildModelMessages({ message, baseReply, books, pageContext, articles, history, workflowContext, requestType }),
      response_format: { type: 'json_object' },
      temperature: 0.35,
      max_tokens: requestType === 'metadata_intelligence' ? 1100 : requestType === 'matter_generator' ? 1000 : requestType === 'description_builder' ? 500 : 220,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) return baseReply;

    const parsed = JSON.parse(content);
    if (requestType !== 'proactive_guidance' && !parsed?.text) return baseReply;
    if (requestType === 'proactive_guidance' && !String(parsed?.text || '').trim()) {
      return { ...baseReply, text: '', actions: [], fieldSuggestions: [], sources: ['openai', 'proactive_review'] };
    }

    const allowedNavigatePaths = new Set(
      (baseReply.actions || [])
        .filter(action => action?.type === 'navigate')
        .map(action => action.value),
    );
    const allowedWizardFields = new Set(
      (workflowContext?.wizardNavigation || [])
        .filter(item => item.step <= workflowContext.stepNumber - 1)
        .map(item => item.field),
    );
    const safeActions = (Array.isArray(parsed.actions) ? parsed.actions : baseReply.actions || [])
      .filter(action => (
        action && typeof action.label === 'string' && typeof action.value === 'string'
        && ['ask', 'navigate', 'wizard'].includes(action.type)
        && (action.type !== 'navigate' || allowedNavigatePaths.has(action.value))
        && (action.type !== 'wizard' || allowedWizardFields.has(action.value))
      ))
      .slice(0, 2)
      .map(action => ({
        label: action.label.trim().slice(0, 28),
        type: action.type,
        value: action.value.trim().slice(0, 240),
      }));
    const activeFieldId = requestType === 'description_builder' ? 'description' : workflowContext?.activeField?.id;
    const maxFieldLength = requestType === 'description_builder' ? 4000 : workflowContext?.activeField?.maxLength || 4000;
    const safeFieldSuggestions = activeFieldId
      ? (Array.isArray(parsed.fieldSuggestions) ? parsed.fieldSuggestions : [])
          .filter(suggestion => (
            suggestion && suggestion.field === activeFieldId
            && typeof suggestion.label === 'string' && typeof suggestion.value === 'string'
          ))
          .slice(0, 3)
          .map(suggestion => ({
            field: activeFieldId,
            label: suggestion.label.trim().slice(0, 36),
            value: suggestion.value.trim().slice(0, maxFieldLength),
          }))
      : [];
    const safeMetadataAnalysis = requestType === 'metadata_intelligence'
      ? sanitizeMetadataAnalysis(parsed.metadataAnalysis, workflowContext)
      : null;
    const requestedMatter = MATTER_TYPES[workflowContext?.matterRequest?.type];
    let safeMatterDraft = null;
    if (requestType === 'matter_generator' && requestedMatter && parsed.matterDraft?.type === workflowContext.matterRequest.type
      && typeof parsed.matterDraft?.content === 'string' && parsed.matterDraft.content.trim()) {
      let matterContent = cleanWorkflowText(parsed.matterDraft.content, 7800);
      if (requestedMatter.legalTemplate && !matterContent.toLowerCase().includes('author review required')) {
        matterContent += '\n\n[Author review required: verify rights, jurisdiction, permissions, edition details, and ISBN before publication.]';
      }
      safeMatterDraft = { ...requestedMatter, type: workflowContext.matterRequest.type, content: matterContent };
    }

    return {
      ...baseReply,
      text: requestType === 'description_builder' && safeFieldSuggestions.length
        ? 'I drafted a description from your answers. Review it below, then insert it or adjust your brief.'
        : String(parsed.text).trim().slice(0, 600),
      actions: safeActions,
      fieldSuggestions: safeFieldSuggestions,
      metadataAnalysis: safeMetadataAnalysis,
      matterDraft: safeMatterDraft,
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
  const workflowContext = sanitizePublishingWorkflow(payload?.workflowContext);
  const requestType = workflowContext && ['proactive_guidance', 'description_builder', 'metadata_intelligence', 'pricing_coach', 'matter_generator'].includes(payload?.requestType)
    ? payload.requestType
    : 'chat';
  const history = sanitizeAssistantHistory(payload?.history, message, workflowContext ? 16 : undefined);
  const baseReply = buildAssistantReply(message, books, pageContext, articles);
  const reply = await generateAssistantReply({
    message,
    baseReply,
    books: baseReply.books || books,
    pageContext,
    articles,
    history,
    workflowContext,
    requestType,
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
