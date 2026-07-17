import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { buildAssistantReply, buildPublishingSocialReply, getAssistantActionMessage, sanitizeAssistantHistory } from '../../src/lib/assistant.js';
import { formatDisplayMoney } from '../../src/lib/currency.js';
import { buildPricingCoachScenarios } from '../../src/lib/royaltyCalculator.js';
import { runAlexAgent } from './_alex-agent.js';
import {
  buildGroundedNextPublishingGuidance,
  createPublishingFactLedger,
  isBarePublishingContinuation,
} from '../../src/lib/publishingAgent.js';
import { actionPlanProgress, createPublishingActionPlan } from '../../src/lib/publishingPlan.js';
import { extractSelectionProposalFromText, isExplicitSelectionTransformationRequest } from '../../src/lib/selectionTask.js';

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
// Native text selections are deliberately limited to free-text publishing
// fields. Alex should never try to edit identifiers, prices, dates, or select
// values through a selected-text proposal.
const SELECTION_REWRITE_FIELDS = new Set(['title', 'subtitle', 'edition', 'series', 'description', 'publisher']);
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

function cleanSelectionText(value, maxLength = 800) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').slice(0, maxLength)
    : '';
}

function sanitizePublishingWorkflow(value) {
  if (!value || value.mode !== 'publishing_upload') return null;
  const details = value.bookDetails && typeof value.bookDetails === 'object' ? value.bookDetails : {};
  const rawActive = value.activeField;
  const rawActiveValue = typeof rawActive?.value === 'string' ? rawActive.value : '';
  // Preserve the exact character positions of a native text selection. Unlike
  // normal workflow copy, this must not trim leading/trailing whitespace.
  const activeTextValue = cleanSelectionText(rawActiveValue, 4000);
  const activeField = rawActive && PUBLISHING_ASSISTANT_FIELDS.has(rawActive.id)
    ? {
        id: rawActive.id,
        label: cleanWorkflowText(rawActive.label, 80),
        purpose: cleanWorkflowText(rawActive.purpose, 240),
        value: Array.isArray(rawActive.value)
          ? rawActive.value.slice(0, 12).map(item => cleanWorkflowText(item, 80))
          : activeTextValue,
        required: Boolean(rawActive.required),
        maxLength: Math.min(Math.max(Number(rawActive.maxLength) || 0, 0), 4000) || null,
        validation: cleanWorkflowText(rawActive.validation, 240),
      }
    : null;
  const rawSelection = rawActive?.selection;
  const selectionStart = Number(rawSelection?.start);
  const selectionEnd = Number(rawSelection?.end);
  if (activeField
    && SELECTION_REWRITE_FIELDS.has(activeField.id)
    && Number.isInteger(selectionStart)
    && Number.isInteger(selectionEnd)
    && selectionStart >= 0
    && selectionEnd > selectionStart
    && selectionEnd <= activeTextValue.length
    && selectionEnd - selectionStart <= 800) {
    const selectedText = cleanSelectionText(activeTextValue.slice(selectionStart, selectionEnd));
    if (selectedText.trim()) {
      activeField.selection = {
        start: selectionStart,
        end: selectionEnd,
        text: selectedText,
      };
    }
  }
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
  const wizardSteps = Array.isArray(value.wizardSteps)
    ? value.wizardSteps.slice(0, 20).map(item => ({
        step: Math.min(Math.max(Number(item?.step) || 0, 0), 19),
        label: cleanWorkflowText(item?.label, 100),
        group: cleanWorkflowText(item?.group, 80),
      })).filter(item => item.label)
    : [];
  const diagnosticSeverity = new Set(['critical', 'attention']);
  const conversionFindings = Array.isArray(value.conversionDiagnostics?.findings)
    ? value.conversionDiagnostics.findings.slice(0, 12).map(item => ({
        id: cleanWorkflowText(item?.id, 60),
        label: cleanWorkflowText(item?.label, 100),
        severity: diagnosticSeverity.has(item?.severity) ? item.severity : 'attention',
        message: cleanWorkflowText(item?.message, 1000),
      })).filter(item => item.id && item.label && item.message)
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
  const rawNextAction = value.nextAction && typeof value.nextAction === 'object' ? value.nextAction : null;
  const nextAction = rawNextAction && ['fix', 'continue', 'review'].includes(rawNextAction.kind) ? {
    kind: rawNextAction.kind,
    id: cleanWorkflowText(rawNextAction.id, 80),
    label: cleanWorkflowText(rawNextAction.label, 100),
    message: cleanWorkflowText(rawNextAction.message, 240),
    status: ['blocker', 'missing', 'recommended'].includes(rawNextAction.status) ? rawNextAction.status : null,
    step: Math.min(Math.max(Number(rawNextAction.step) || 0, 0), 19),
    field: PUBLISHING_ASSISTANT_FIELDS.has(rawNextAction.field) ? rawNextAction.field : null,
  } : null;

  return {
    mode: 'publishing_upload',
    aiWorkMode: value.aiWorkMode === true,
    draftKey: cleanWorkflowText(value.draftKey, 160) || 'new',
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
    wizardSteps,
    conversionDiagnostics: {
      score: Math.min(Math.max(Number(value.conversionDiagnostics?.score) || 0, 0), 100),
      summary: {
        good: Math.min(Math.max(Number(value.conversionDiagnostics?.summary?.good) || 0, 0), 50),
        attention: Math.min(Math.max(Number(value.conversionDiagnostics?.summary?.attention) || 0, 0), 50),
        critical: Math.min(Math.max(Number(value.conversionDiagnostics?.summary?.critical) || 0, 0), 50),
      },
      manuscript: value.conversionDiagnostics?.manuscript ? {
        wordCount: Math.min(Math.max(Number(value.conversionDiagnostics.manuscript.wordCount) || 0, 0), 10000000),
        estimatedPages: Math.min(Math.max(Number(value.conversionDiagnostics.manuscript.estimatedPages) || 0, 0), 100000) || null,
        readingTime: cleanWorkflowText(value.conversionDiagnostics.manuscript.readingTime, 40),
        headingCount: Math.min(Math.max(Number(value.conversionDiagnostics.manuscript.headingCount) || 0, 0), 10000),
        imageCount: Math.min(Math.max(Number(value.conversionDiagnostics.manuscript.imageCount) || 0, 0), 10000),
      } : null,
      findings: conversionFindings,
    },
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
    nextAction,
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolvePublishingAgentPersistence(req, sessionId, workflowContext, resetSession = false) {
  if (!workflowContext || !UUID_PATTERN.test(String(sessionId || ''))) return null;
  const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = req.headers.get('authorization') || '';
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!supabaseUrl || !serviceRoleKey || !accessToken) return null;

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData } = await supabase.auth.getUser(accessToken);
  const userId = authData?.user?.id;
  if (!userId) return null;

  const { data: session } = await supabase
    .from('assistant_sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!session) return null;

  const { data: state } = await supabase
    .from('publishing_agent_state')
    .select('*')
    .eq('user_id', userId)
    .eq('draft_key', workflowContext.draftKey)
    .maybeSingle();
  const historySessionId = state?.assistant_session_id || sessionId;
  const { data: storedMessages } = await supabase
    .from('assistant_messages')
    .select('role, content')
    .eq('session_id', historySessionId)
    .order('created_at', { ascending: false })
    .limit(16);
  const { data: approvals } = state?.id ? await supabase
    .from('publishing_agent_approvals')
    .select('id, tool_arguments, status, run_state, requested_at')
    .eq('agent_state_id', state.id)
    .in('status', ['pending', 'approved', 'completed'])
    .gt('expires_at', new Date().toISOString())
    .order('requested_at', { ascending: false })
    .limit(20) : { data: [] };
  return {
    supabase,
    userId,
    sessionId,
    state: resetSession ? null : state,
    history: resetSession ? [] : (storedMessages || []).reverse(),
    approvals: resetSession ? [] : (approvals || []),
  };
}

async function persistPublishingAgentTurn(persistence, workflowContext, message, reply, requestType) {
  if (!persistence) return;
  const ledger = createPublishingFactLedger(workflowContext);
  const agentRun = reply.agentRun || {};
  const unresolvedQuestion = /\?\s*$/.test(reply.text || '') ? String(reply.text).slice(0, 600) : null;
  const previousWorkingState = persistence.state?.working_state && typeof persistence.state.working_state === 'object'
    ? persistence.state.working_state
    : {};
  const workingState = {
    ...previousWorkingState,
    currentStep: workflowContext.stepNumber,
    activeField: workflowContext.activeField?.id || null,
    currentTask: requestType,
    unresolvedQuestion,
    pendingProposal: Boolean(reply.fieldSuggestions?.length),
    actionPlan: reply.actionPlan || previousWorkingState.actionPlan || null,
  };
  const now = new Date().toISOString();
  const { data: savedState, error: stateError } = await persistence.supabase.from('publishing_agent_state').upsert({
    assistant_session_id: persistence.sessionId,
    user_id: persistence.userId,
    draft_key: workflowContext.draftKey,
    confirmed_facts: ledger.confirmed,
    author_decisions: ledger.decisions,
    working_state: workingState,
    last_response_id: agentRun.responseId || persistence.state?.last_response_id || null,
    last_agent: agentRun.agent || 'Alex',
    last_tools: agentRun.tools || [],
    expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: now,
  }, { onConflict: 'user_id,draft_key' }).select('id').single();
  if (stateError) console.error('[assistant function] agent state save failed:', stateError.code || stateError.message);

  if (savedState?.id && reply.fieldSuggestions?.length) {
    const existingSuggestions = reply.fieldSuggestions.filter(suggestion => suggestion.approvalId);
    for (const suggestion of existingSuggestions) {
      const { error: decisionError } = await persistence.supabase.from('publishing_agent_approvals').update({
        status: suggestion.approved ? 'approved' : 'pending',
        decided_at: suggestion.approved ? now : null,
      }).eq('id', suggestion.approvalId).eq('user_id', persistence.userId);
      if (decisionError) console.error('[assistant function] approval decision save failed:', decisionError.code || decisionError.message);
    }
    const newSuggestions = reply.fieldSuggestions.filter(suggestion => !suggestion.approvalId);
    const approvals = newSuggestions.map(suggestion => ({
      agent_state_id: savedState.id,
      user_id: persistence.userId,
      tool_name: 'update_publishing_field',
      tool_arguments: {
        field: suggestion.field,
        label: suggestion.label,
        proposedValue: suggestion.value,
        previousValue: workflowContext.activeField?.id === suggestion.field ? workflowContext.activeField.value : null,
      },
      status: suggestion.approved ? 'approved' : 'pending',
      decided_at: suggestion.approved ? now : null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));
    const { data: savedApprovals, error: approvalError } = approvals.length
      ? await persistence.supabase.from('publishing_agent_approvals').insert(approvals).select('id')
      : { data: [], error: null };
    if (approvalError) console.error('[assistant function] approval save failed:', approvalError.code || approvalError.message);
    (savedApprovals || []).forEach((approval, index) => {
      newSuggestions[index].approvalId = approval.id;
    });
  }

  const rows = [
    { session_id: persistence.sessionId, user_id: persistence.userId, role: 'user', content: String(message).slice(0, 1200), metadata: { requestType } },
    { session_id: persistence.sessionId, user_id: persistence.userId, role: 'assistant', content: String(reply.text).slice(0, 4000), metadata: { requestType, mode: reply.sources?.includes('openai_agents_sdk') ? 'agents_sdk' : 'fallback', tools: agentRun.tools || [] } },
  ];
  const { error: messageError } = await persistence.supabase.from('assistant_messages').insert(rows);
  if (messageError) console.error('[assistant function] agent messages save failed:', messageError.code || messageError.message);
}

function buildActionPlanReply(baseReply, message, workflowContext) {
  const actionPlan = createPublishingActionPlan(workflowContext, message);
  const progress = actionPlanProgress(actionPlan);
  const first = actionPlan.steps[0];
  return {
    ...baseReply,
    text: `I made a focused ${progress.total}-step plan. We’ll take one task at a time, and I’ll only change a field after you approve a proposal. Start with **${first.title}**.`,
    actions: [],
    fieldSuggestions: [],
    metadataAnalysis: null,
    matterDraft: null,
    actionPlan,
    sources: ['publishing_action_plan'],
  };
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
  const selectionTaskRequestsTransformation = requestType === 'selection_task'
    && isExplicitSelectionTransformationRequest(message);
  const recentHistory = sanitizeAssistantHistory(history, message, isUploadWorkflow ? 16 : undefined);
  const roleInstructions = isUploadWorkflow
    ? [
        'You are Alex, a focused publishing workflow assistant inside the Indie Converters book-upload wizard.',
        'You are also the author’s steady publishing coworker. Relate to the person before routing the task: respond naturally to greetings, gratitude, uncertainty, frustration, overwhelm, and celebration. Do not turn a social message into a publishing menu or generic offer.',
        'Use a calm, human rhythm. Briefly acknowledge emotion without exaggerating it, then help with one manageable thing. Never claim to be human, conscious, or personally experienced.',
        'Only help the author complete the publishing wizard: book metadata, description, genre, keywords, publication details, manuscript preparation, reading style, cover, pricing, distribution, front and back matter, structure, and final review.',
        'Prioritise the current wizard step supplied below. If the question belongs to another publishing step, answer briefly and name that step. Politely redirect unrelated requests back to publishing.',
        'Help the author think and write; never claim you changed, saved, uploaded, validated, or published anything. The author must enter and confirm all values in the wizard.',
        'Do not invent facts about the book. When information is missing, ask one focused question. When brainstorming copy, provide 2 or 3 concise options that preserve the author’s voice.',
        'Never draft a description, blurb, subtitle, keywords, or marketing copy from only a title or genre. First collect enough real material from the author—such as premise, protagonist or subject, central goal or conflict, stakes, tone, and intended reader. Ask for the most important missing detail one question at a time.',
        'The activeField is the field the author is currently using. Resolve words like “this”, “it”, “here”, and “the field” against activeField without asking them to identify it again.',
        'Use inspect_publishing_context before answering when the request depends on the current field or established book facts. Treat its author_confirmed facts and decisions as authoritative. Never treat inferred suggestions as confirmed facts.',
        'Use check_publishing_readiness for readiness questions, get_next_publishing_action for short continuation requests, and inspect_pricing_and_distribution for price or distribution decisions. Do not claim you used a tool or expose tool names to the author.',
        'The propose_active_field_wording tool creates a reviewable proposal only. It never saves. Describe the proposal honestly and return the same wording in fieldSuggestions so the interface can ask the author to approve it.',
        'When activeField.selection is supplied, it is exact text the author deliberately highlighted in that field. Treat it as the focus when they say “this”, “this sentence”, or “selected text”. Never imply that highlighted text has been changed until the author explicitly chooses a proposal.',
        'Treat publishing_workflow.readiness as the authoritative readiness checklist. Never invent or upgrade a readiness status. When asked whether the book is ready, mention blockers first, then missing essentials, then at most one recommendation.',
        'On Conversion Readiness, publishing_workflow.conversionDiagnostics is the authoritative health-check result. When asked about issues, name the exact highest-severity finding, explain its publishing impact, and repeat its concrete repair instructions. Never answer with only counts or generic advice when findings are supplied.',
        'When pricingContext.distributionStrategy is present, remember it as the author’s chosen distribution strategy and use it consistently in pricing, distribution, and final-review answers. Do not silently replace it with another strategy.',
        'nextAction is the application’s authoritative answer to short messages such as “next”, “what next?”, “continue”, or “what should I do now?”. For kind fix, explain that single issue and use a wizard action when its field is mapped. For kind continue, say the current step is ready and return {"label":"Continue to [label]","type":"wizard_next","value":"continue"}. For kind review, guide the author to final review. Never recite completed fields or ask what they want to do next.',
        'wizardNavigation maps fields to steps. wizardSteps maps complete publishing sections. When directing the author to a named section, include a wizard_step action using its numeric step value, such as {"label":"Go to Manuscript","type":"wizard_step","value":"3"}. Use wizard for a mapped field. Never name a destination without returning its clickable action.',
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
        ...(requestType === 'selection_rewrite' ? [
          'The author explicitly asked to transform activeField.selection. Rewrite only that selected passage according to their requested change, preserving its meaning and using only author-confirmed facts. Do not rewrite the whole field, add new plot facts, or make claims not supported by the book details.',
          'Return exactly one selectionReplacement with this shape: {"field":"the active field id","replacement":"replacement for the selected span only","reason":"brief explanation"}. Do not give multiple options in text. Return fieldSuggestions as an empty array and no actions. The interface will verify the original text and ask the author to press Use it before replacing anything.',
          'Keep the replacement concise and compatible with the surrounding wording. If a safe improvement is not possible, return selectionReplacement as null and ask one focused question in text.',
        ] : []),
        ...(requestType === 'selection_task' ? [
          'The author deliberately highlighted activeField.selection and then asked a task about it. The selection is context, not permission to improve, replace, or otherwise change it.',
          'Answer the author’s specific task about only the selected passage, using the surrounding active-field wording and author-confirmed facts as context. Do not treat selecting text alone as a request for an edit.',
          ...(selectionTaskRequestsTransformation ? [
            'The task explicitly asks for a transformation. Return at most one reviewable selectionReplacement with exactly this shape: {"field":"the active field id","replacement":"replacement for the selected span only","reason":"brief explanation"}. Rewrite only the selected span, preserve its meaning and confirmed facts, and never apply it automatically.',
            'Return fieldSuggestions as an empty array and no actions. If a safe replacement is not possible, set selectionReplacement to null and explain what you need in text.',
          ] : [
            'This task does not explicitly ask for a rewrite. Set selectionReplacement to null, return fieldSuggestions as an empty array, and do not offer a replacement as though it had been requested. Give the useful answer, analysis, explanation, or recommendation in text instead.',
          ]),
          'If no valid activeField.selection is supplied, explain briefly that the author should select the passage they want to discuss. Never invent selected text.',
        ] : []),
        ...(['metadata_intelligence', 'metadata_plan'].includes(requestType) ? [
          'Perform a metadata review using only author-confirmed bookDetails. The description must contain enough substance; otherwise ask for the missing facts and return metadataAnalysis as null.',
          'Clearly separate confirmedFacts from inferred recommendations. An inference is not a fact. Give a short evidence-based rationale and confidence of high, medium, or low for each inferred recommendation.',
          'Genre and audience values must use exact values from metadataOptions. Suggest 2 subtitle alternatives, one primary genre, up to 2 secondary genres, exactly 7 specific multi-word search phrases, one audience, 2 or 3 BISAC-style category labels, and 2 comparable positioning statements.',
          'Comparable positioning must describe likely readership or market adjacency without claiming sales, awards, equivalence, or knowledge of the manuscript. Do not invent plot details, author credentials, or named comparable titles.',
          'Also return metadataAnalysis with this shape: {"confirmedFacts":[{"label":"...","value":"..."}],"descriptionRevision":{"value":"grounded improved description","rationale":"...","confidence":"high|medium|low"},"subtitleAlternatives":[{"value":"...","rationale":"...","confidence":"high|medium|low"}],"primaryGenre":{"value":"allowed-slug","label":"...","rationale":"...","confidence":"..."},"secondaryGenres":[same genre shape],"searchPhrases":["..."],"audience":{"value":"allowed-value","label":"...","rationale":"...","confidence":"..."},"bisacCategories":[{"value":"...","rationale":"...","confidence":"..."}],"comparablePositioning":[{"value":"...","rationale":"...","confidence":"..."}]}.',
          'descriptionRevision must improve clarity and reader appeal using only facts already present in the author description. Do not add new plot events, places, character traits, outcomes, praise, or market claims.',
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
        'You are Jane, the general Indie Converters assistant.',
        'Help authors and readers with publishing, manuscript uploads, pricing, retailer links, account setup, and public book discovery.',
      ];

  return [
    {
      role: 'system',
      content: [
        ...roleInstructions,
        'Sound like a capable publishing guide: direct, warm, specific, and calm.',
        'Lead with the answer. Keep the text under 70 words and usually to 1 to 3 short sentences.',
        'Use clean Markdown when formatting helps: **bold** for short labels and a new line for every list item. Never place multiple numbered items on one line. Do not use Markdown tables or raw HTML.',
        'When catalogue_matches are supplied, the interface renders book cards with title, author, format, and price. Give only a short introduction or recommendation rationale in text; do not repeat the full card details as a numbered list.',
        'Give only the most useful next step. Do not add background, summaries, related topics, or generic offers to help.',
        'If one detail is required to help well, ask one focused question instead of guessing.',
        'Use the supplied catalogue context for book facts. Do not invent books, prices, availability, retailer links, or account data.',
        'Prices are EUR estimates when shown. Always explain that final price, taxes, delivery, and availability are confirmed by the retailer or checkout flow.',
        'If a user asks for private account details and no account data is supplied, explain that account-aware support is coming and give the next best general step.',
        'If a user asks for a person, briefly say that you can connect them with the Indie Converters team.',
        'Do not ask for or repeat contact details in AI replies; the guided human-support steps in the chat collect those details outside OpenAI.',
        'Return valid JSON only with this shape: {"text":"...", "actions":[{"label":"...","type":"ask|navigate|wizard|wizard_next","value":"..."}], "fieldSuggestions":[{"field":"...","label":"...","value":"..."}], "selectionReplacement":null, "metadataAnalysis":null, "matterDraft":null, "sources":["..."]}. For selection_rewrite, and only for an explicitly transformational selection_task, replace selectionReplacement with the required structured result. For metadata_intelligence or matter_generator, replace the corresponding null with the required structured result.',
        'Return at most 2 actions. Use ask for a useful suggested reply and navigate only for a supplied site path. Keep action labels under 28 characters.',
        'For every ask action, value must be the exact natural sentence the user would say next, written in the user’s voice (for example, “Show me the publishing steps”). Never put an assistant follow-up question or second-person wording such as “What are you working on?” in an ask value.',
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
    descriptionRevision: recommendation(value.descriptionRevision, 4000),
    subtitleAlternatives: list(value.subtitleAlternatives, 2, 200),
    primaryGenre: genre(value.primaryGenre),
    secondaryGenres: (Array.isArray(value.secondaryGenres) ? value.secondaryGenres : []).map(genre).filter(Boolean).slice(0, 2),
    searchPhrases,
    audience: safeAudience,
    bisacCategories: list(value.bisacCategories, 3, 160),
    comparablePositioning: list(value.comparablePositioning, 2, 300),
  };
}

function sanitizeSelectionReplacement(value, workflowContext) {
  const active = workflowContext?.activeField;
  const selection = active?.selection;
  if (!selection || !value || typeof value !== 'object') return null;
  if (!SELECTION_REWRITE_FIELDS.has(active.id) || value.field !== active.id) return null;
  const replacement = cleanWorkflowText(value.replacement, active.maxLength || 4000);
  if (!replacement || replacement === selection.text) return null;
  const selectedLeadingWhitespace = selection.text.match(/^\s*/)?.[0] || '';
  const selectedTrailingWhitespace = selection.text.match(/\s*$/)?.[0] || '';
  const resultingLength = String(active.value || '').length
    - selection.text.length
    + selectedLeadingWhitespace.length
    + replacement.length
    + selectedTrailingWhitespace.length;
  if (active.maxLength && resultingLength > active.maxLength) return null;
  return {
    field: active.id,
    start: selection.start,
    end: selection.end,
    original: selection.text,
    replacement,
    reason: cleanWorkflowText(value.reason, 240),
  };
}

async function generateAssistantReply({ message, baseReply, books, pageContext, articles, history, workflowContext, requestType, sessionId }) {
  if (workflowContext && requestType === 'action_plan') {
    return buildActionPlanReply(baseReply, message, workflowContext);
  }
  const selectionReplacementAllowed = requestType === 'selection_rewrite'
    || (requestType === 'selection_task' && isExplicitSelectionTransformationRequest(message));
  const deterministicNextGuidance = workflowContext && requestType === 'chat' && isBarePublishingContinuation(message)
    ? buildGroundedNextPublishingGuidance(workflowContext)
    : null;
  const openaiBaseUrl = getEnv('OPENAI_BASE_URL');
  const openaiApiKey = getEnv('OPENAI_API_KEY');
  if (!openaiBaseUrl && !openaiApiKey) {
    return deterministicNextGuidance
      ? {
          ...baseReply,
          ...deterministicNextGuidance,
          actionPlan: null,
          metadataAnalysis: null,
          matterDraft: null,
          selectionReplacement: null,
          sources: Array.from(new Set([...(baseReply.sources || []), 'publishing_workflow'])),
        }
      : baseReply;
  }

  try {
    // An explicitly requested selected-text transformation uses the stricter
    // rewrite contract. A selection question keeps the broader selection_task
    // contract and can answer without proposing an edit.
    const modelRequestType = requestType === 'selection_task' && selectionReplacementAllowed
      ? 'selection_rewrite'
      : requestType;
    const modelMessages = buildModelMessages({ message, baseReply, books, pageContext, articles, history, workflowContext, requestType: modelRequestType });
    let content;
    let agentRun = null;
    if (workflowContext && ['chat', 'proactive_guidance'].includes(requestType)) {
      try {
        agentRun = await runAlexAgent({
          messages: modelMessages,
          userMessage: message,
          workflowContext,
          model: getAssistantModel(),
          baseURL: openaiBaseUrl,
          apiKey: openaiApiKey,
          sessionId,
        });
        content = agentRun.content;
      } catch (agentError) {
        console.error('[assistant function] Agents SDK run failed; using direct completion:', agentError?.message || agentError);
      }
    }
    // “next” is a command to follow the wizard’s computed readiness state, not
    // a request for new prose. Keep the specialist run for context/telemetry,
    // then make the final response deterministic so model wording cannot drift
    // into unrelated field suggestions.
    if (deterministicNextGuidance) {
      return {
        ...baseReply,
        ...deterministicNextGuidance,
        actionPlan: null,
        metadataAnalysis: null,
        matterDraft: null,
        selectionReplacement: null,
        sources: Array.from(new Set([
          ...(baseReply.sources || []),
          'publishing_workflow',
          ...(agentRun ? ['openai_agents_sdk'] : []),
        ])),
        agentRun: agentRun ? {
          agent: agentRun.agent,
          tools: agentRun.toolCalls,
          responseId: agentRun.lastResponseId,
        } : null,
      };
    }
    let parsed = null;
    if (content && agentRun) {
      try {
        parsed = JSON.parse(content);
      } catch {
        const jsonStart = content.indexOf('{"text"');
        if (jsonStart >= 0) {
          try {
            parsed = JSON.parse(content.slice(jsonStart).replace(/```\s*$/, '').trim());
          } catch {
            parsed = null;
          }
        }
        // The Agents SDK commonly returns a natural-language finalOutput. That is
        // already the desired contract for ordinary chat; structured workflows
        // still need the JSON completion below for suggestions and generated data.
        if (!parsed && (requestType === 'chat' || requestType === 'proactive_guidance')) {
          parsed = { text: content, actions: [], sources: ['openai_agents_sdk'] };
        } else if (!parsed) {
          content = null;
          agentRun = null;
        }
      }
    }
    if (!content) {
      const openai = new OpenAI({ apiKey: openaiApiKey || 'netlify-ai-gateway', baseURL: openaiBaseUrl || undefined });
      const completion = await openai.chat.completions.create({
        model: getAssistantModel(),
        messages: modelMessages,
        response_format: { type: 'json_object' },
        temperature: 0.35,
        max_tokens: ['metadata_intelligence', 'metadata_plan'].includes(requestType) ? 1400 : requestType === 'matter_generator' ? 1000 : requestType === 'description_builder' ? 500 : ['selection_rewrite', 'selection_task'].includes(requestType) ? 420 : 220,
      });
      content = completion.choices?.[0]?.message?.content;
    }
    if (!content) return baseReply;

    if (!parsed) parsed = JSON.parse(content);
    if (['metadata_intelligence', 'metadata_plan'].includes(requestType) && !parsed.metadataAnalysis) {
      const openai = new OpenAI({ apiKey: openaiApiKey || 'netlify-ai-gateway', baseURL: openaiBaseUrl || undefined });
      const metadataCompletion = await openai.chat.completions.create({
        model: getAssistantModel(),
        messages: [
          {
            role: 'system',
            content: 'Return JSON only. Build grounded book metadata using only supplied facts. Do not add plot facts. Use exact allowed genre and audience values. Shape: {"descriptionRevision":{"value":"...","rationale":"...","confidence":"high|medium|low"},"subtitleAlternatives":[{"value":"...","rationale":"...","confidence":"..."}],"primaryGenre":{"value":"allowed value","rationale":"...","confidence":"..."},"secondaryGenres":[same],"searchPhrases":[exactly 7 multi-word phrases],"audience":{"value":"allowed value","rationale":"...","confidence":"..."},"bisacCategories":[{"value":"...","rationale":"...","confidence":"..."}],"comparablePositioning":[{"value":"...","rationale":"...","confidence":"..."}]}. Keep descriptionRevision grounded and 80-170 words.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              bookFacts: workflowContext.bookDetails,
              allowedGenres: workflowContext.metadataOptions?.genres,
              allowedAudiences: workflowContext.metadataOptions?.audiences,
            }),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.25,
        max_tokens: 1200,
      });
      const compactAnalysis = JSON.parse(metadataCompletion.choices?.[0]?.message?.content || '{}');
      parsed.metadataAnalysis = compactAnalysis.metadataAnalysis || compactAnalysis;
      parsed.text = 'I prepared a grounded metadata plan for your review.';
    }
    if (requestType !== 'proactive_guidance' && !parsed?.text && !(selectionReplacementAllowed && parsed?.selectionReplacement)) return baseReply;
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
    const allowedWizardSteps = new Map(
      (workflowContext?.wizardSteps || []).map(item => [String(item.step), item]),
    );
    if (agentRun && (!Array.isArray(parsed.actions) || parsed.actions.length === 0)) {
      const replyText = String(parsed.text || '').toLowerCase();
      const namedStep = [...allowedWizardSteps.values()]
        .map(item => {
          const label = item.label.toLowerCase();
          const boldPosition = replyText.lastIndexOf(`**${label}**`);
          const explicitPositions = [
            replyText.lastIndexOf(`${label} step`),
            replyText.lastIndexOf(`${label} section`),
          ];
          return {
            ...item,
            priority: boldPosition >= 0 ? 2 : Math.max(...explicitPositions) >= 0 ? 1 : 0,
            position: boldPosition >= 0 ? boldPosition : Math.max(...explicitPositions),
          };
        })
        .filter(item => item.position >= 0)
        .sort((a, b) => b.priority - a.priority || b.position - a.position)[0];
      if (namedStep) {
        parsed.actions = [{
          label: `Go to ${namedStep.label}`,
          type: 'wizard_step',
          value: String(namedStep.step),
        }];
      }
    }
    const diagnosticFindings = workflowContext?.conversionDiagnostics?.findings || [];
    if (/\b(?:issue|issues|problem|problems|fix|wrong|attention|critical)\b/i.test(message) && diagnosticFindings.length) {
      const topFinding = [...diagnosticFindings].sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1))[0];
      parsed.actions = [{ label: `Open ${topFinding.label} details`, type: 'health_detail', value: topFinding.id }];
    }
    const safeActions = (Array.isArray(parsed.actions) ? parsed.actions : baseReply.actions || [])
      .filter(action => (
        action && typeof action.label === 'string' && typeof action.value === 'string'
        && ['ask', 'navigate', 'wizard', 'wizard_step', 'wizard_next', 'health_detail'].includes(action.type)
        && (action.type !== 'navigate' || allowedNavigatePaths.has(action.value))
        && (action.type !== 'wizard' || allowedWizardFields.has(action.value))
        && (action.type !== 'wizard_step' || allowedWizardSteps.has(action.value))
        && (action.type !== 'health_detail' || diagnosticFindings.some(item => item.id === action.value))
        && (action.type !== 'wizard_next' || (workflowContext?.nextAction?.kind === 'continue' && action.value === 'continue'))
      ))
      .slice(0, 2)
      .map(action => ({
        label: action.label.trim().slice(0, 28),
        type: action.type,
        value: action.value.trim().slice(0, 240),
      }))
      .map(action => action.type === 'ask' ? { ...action, value: getAssistantActionMessage(action).slice(0, 240) } : action);
    const selectionTaskActions = ['selection_rewrite', 'selection_task'].includes(requestType) ? [] : safeActions;
    const activeFieldId = requestType === 'description_builder' ? 'description' : workflowContext?.activeField?.id;
    const maxFieldLength = requestType === 'description_builder' ? 4000 : workflowContext?.activeField?.maxLength || 4000;
    const approvalIntent = /^(?:yes[, ]+)?(?:i\s+)?(?:approve|accept)(?:\s+(?:it|that|this|the\s+(?:revision|version|wording|description|text)))?[.!]?$/i.test(message.trim())
      || /^(?:please\s+)?(?:apply|insert|use)(?:\s+(?:it|that|this|the\s+(?:revision|version|wording|description|text)))(?:\s+(?:now|for me))?[.!]?$/i.test(message.trim())
      || /^(?:yes[, ]+)?(?:go ahead|looks good)(?:\s+with\s+(?:it|that|this))?[.!]?$/i.test(message.trim());
    function extractProposedValue(source) {
      const quoted = [...String(source || '').matchAll(/[“"]([\s\S]{20,}?)[”"]/g)]
        .map(match => match[1].trim())
        .sort((a, b) => b.length - a.length)[0];
      const bold = [...String(source || '').matchAll(/\*\*([\s\S]{20,}?)\*\*/g)]
        .map(match => match[1].trim())
        .sort((a, b) => b.length - a.length)[0];
      const labelled = String(source || '').match(/(?:revised wording|description|title|subtitle|biography|keywords?):\s*([\s\S]{20,}?)(?=(?:\s+(?:would you|shall i|let me know)\b|$))/i)?.[1]
        ?.replace(/^\*+|\*+$/g, '').trim();
      return quoted || bold || labelled || '';
    }
    let inferredApprovedSuggestion = null;
    if (approvalIntent && activeFieldId && agentRun) {
      const pendingAction = workflowContext?.rememberedAgentState?.pendingActions
        ?.find(action => action.field === activeFieldId && action.proposedValue);
      const proposalSources = [
        pendingAction?.proposedValue ? `"${pendingAction.proposedValue}"` : '',
        ...[...history].reverse().filter(entry => entry.role === 'assistant').map(entry => entry.content),
        String(parsed.text || ''),
      ];
      let proposedValue = '';
      for (const source of proposalSources) {
        proposedValue = extractProposedValue(source);
        if (proposedValue) break;
      }
      if (proposedValue) {
        inferredApprovedSuggestion = {
          field: activeFieldId,
          label: `Apply to ${workflowContext.activeField?.label || 'field'}`,
          value: proposedValue.slice(0, maxFieldLength),
          approved: true,
          approvalId: pendingAction?.id || null,
        };
        parsed.text = `I’ve prepared the approved revision for **${workflowContext.activeField?.label || activeFieldId}**.`;
      }
    }
    const proposedSuggestions = Array.isArray(parsed.fieldSuggestions) ? parsed.fieldSuggestions : [];
    if (inferredApprovedSuggestion && proposedSuggestions.length === 0) {
      proposedSuggestions.push(inferredApprovedSuggestion);
    }
    if (!approvalIntent && activeFieldId && agentRun && proposedSuggestions.length === 0
      && /\b(?:drafted|revised|proposed|suggested|approve this|use this)\b/i.test(String(parsed.text || ''))) {
      const proposedValue = extractProposedValue(parsed.text);
      if (proposedValue) {
        proposedSuggestions.push({
          field: activeFieldId,
          label: `Use this ${workflowContext.activeField?.label || 'wording'}`,
          value: proposedValue.slice(0, maxFieldLength),
          approved: false,
        });
      }
    }
    let safeFieldSuggestions = activeFieldId
      ? proposedSuggestions
          .filter(suggestion => (
            suggestion && suggestion.field === activeFieldId
            && typeof suggestion.label === 'string' && typeof suggestion.value === 'string'
          ))
          .slice(0, 3)
          .map(suggestion => ({
            field: activeFieldId,
            label: suggestion.label.trim().slice(0, 36),
            value: suggestion.value.trim().slice(0, maxFieldLength),
            approved: suggestion.approved === true,
            approvalId: UUID_PATTERN.test(String(suggestion.approvalId || '')) ? suggestion.approvalId : null,
          }))
      : [];
    const recoveredSelectionProposal = selectionReplacementAllowed && !parsed.selectionReplacement
      ? extractSelectionProposalFromText(parsed.text)
      : '';
    const safeSelectionReplacement = selectionReplacementAllowed
      ? sanitizeSelectionReplacement(
          parsed.selectionReplacement || (recoveredSelectionProposal
            ? {
                field: workflowContext?.activeField?.id,
                replacement: recoveredSelectionProposal,
                reason: 'Alex suggested this focused revision.',
              }
            : null),
          workflowContext,
        )
      : null;
    if (['selection_rewrite', 'selection_task'].includes(requestType)) safeFieldSuggestions = [];
    const safeMetadataAnalysis = ['metadata_intelligence', 'metadata_plan'].includes(requestType)
      ? sanitizeMetadataAnalysis(parsed.metadataAnalysis, workflowContext)
      : null;
    if (requestType === 'metadata_plan' && safeMetadataAnalysis) {
      safeFieldSuggestions = [
        safeMetadataAnalysis.descriptionRevision && { field: 'description', label: 'Use description', value: safeMetadataAnalysis.descriptionRevision.value },
        safeMetadataAnalysis.subtitleAlternatives?.[0] && { field: 'subtitle', label: 'Use subtitle', value: safeMetadataAnalysis.subtitleAlternatives[0].value },
        safeMetadataAnalysis.primaryGenre && { field: 'genre', label: 'Use primary genre', value: safeMetadataAnalysis.primaryGenre.value },
        safeMetadataAnalysis.secondaryGenres?.[0] && { field: 'genreSecondary', label: 'Use secondary genre', value: safeMetadataAnalysis.secondaryGenres[0].value },
        safeMetadataAnalysis.audience && { field: 'audience', label: 'Use audience', value: safeMetadataAnalysis.audience.value },
        safeMetadataAnalysis.searchPhrases?.length && { field: 'keywords', label: 'Use search phrases', value: safeMetadataAnalysis.searchPhrases.join('\n') },
      ].filter(Boolean).map(suggestion => ({ ...suggestion, approved: false, approvalId: null }));
    }
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
        : selectionReplacementAllowed && safeSelectionReplacement
          ? 'I prepared a focused edit for the selected text. Review it below before using it.'
          : String(parsed.text || '').trim().slice(0, 600),
      actions: selectionTaskActions,
      fieldSuggestions: safeFieldSuggestions,
      selectionReplacement: safeSelectionReplacement,
      metadataAnalysis: safeMetadataAnalysis,
      matterDraft: safeMatterDraft,
      actionPlan: null,
      sources: Array.from(new Set([
        ...(baseReply.sources || []),
        ...(Array.isArray(parsed.sources) ? parsed.sources : []),
        'openai',
        ...(agentRun ? ['openai_agents_sdk'] : []),
      ])),
      agentRun: agentRun ? {
        agent: agentRun.agent,
        tools: agentRun.toolCalls,
        responseId: agentRun.lastResponseId,
      } : null,
    };
  } catch (error) {
    console.error('[assistant function] OpenAI reply failed:', error?.message || error);
    return deterministicNextGuidance
      ? {
          ...baseReply,
          ...deterministicNextGuidance,
          actionPlan: null,
          metadataAnalysis: null,
          matterDraft: null,
          selectionReplacement: null,
          sources: Array.from(new Set([...(baseReply.sources || []), 'publishing_workflow'])),
        }
      : baseReply;
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
  let workflowContext = sanitizePublishingWorkflow(payload?.workflowContext);
  const requestType = workflowContext && ['proactive_guidance', 'description_builder', 'metadata_intelligence', 'metadata_plan', 'pricing_coach', 'matter_generator', 'action_plan', 'selection_rewrite', 'selection_task'].includes(payload?.requestType)
    ? payload.requestType
    : 'chat';
  const persistence = await resolvePublishingAgentPersistence(req, payload?.sessionId, workflowContext, payload?.resetSession === true).catch(error => {
    console.error('[assistant function] durable memory lookup failed:', error?.message || error);
    return null;
  });
    if (workflowContext && persistence?.state) {
    workflowContext = {
      ...workflowContext,
      rememberedAgentState: {
        confirmedFacts: persistence.state.confirmed_facts || [],
        authorDecisions: persistence.state.author_decisions || [],
        workingState: persistence.state.working_state || {},
        pendingActions: (persistence.approvals || [])
          .filter(item => item.status === 'pending' || item.status === 'approved')
          .map(item => ({ id: item.id, status: item.status, ...item.tool_arguments })),
      },
    };
  }
  const historySource = persistence?.history?.length ? persistence.history : payload?.history;
  const history = sanitizeAssistantHistory(historySource, message, workflowContext ? 16 : undefined);
  const baseReply = buildAssistantReply(message, books, pageContext, articles);
  const socialReply = workflowContext && requestType === 'chat'
    ? buildPublishingSocialReply(message, workflowContext)
    : null;
  if (socialReply) {
    const response = { ...baseReply, ...socialReply, mode: 'publishing_social', sessionId: payload?.sessionId || null };
    await persistPublishingAgentTurn(persistence, workflowContext, message, response, requestType);
    return json(response);
  }
  const reply = await generateAssistantReply({
    message,
    baseReply,
    books: baseReply.books || books,
    pageContext,
    articles,
    history,
    workflowContext,
    requestType,
    sessionId: payload?.sessionId || null,
  });

  await persistPublishingAgentTurn(persistence, workflowContext, message, reply, requestType);

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
