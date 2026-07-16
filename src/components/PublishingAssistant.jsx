import { useEffect, useRef, useState } from 'react';
import { isHumanSupportIntent, requestAssistantReply } from '../lib/assistant';
import { submitAssistantHandoff } from '../lib/api';
import { buildPricingCoachScenarios, formatRoyaltyMoney } from '../lib/royaltyCalculator';
import './PublishingAssistant.css';

function newMessage(role, text, extra = {}) {
  return { id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, text, ...extra };
}

const PUBLISHING_SUPPORT_REASONS = [
  { value: 'book-details', label: 'Book details or metadata' },
  { value: 'manuscript', label: 'Manuscript upload or conversion' },
  { value: 'cover', label: 'Cover setup or requirements' },
  { value: 'pricing', label: 'Pricing or royalties' },
  { value: 'distribution', label: 'Distribution or retailers' },
  { value: 'technical', label: 'A technical problem' },
  { value: 'other', label: 'Other' },
];

const EMPTY_DESCRIPTION_BRIEF = { premise: '', subject: '', conflict: '', appeal: '', tone: 'warm and compelling' };
const PRICING_OBJECTIVES = [
  { value: 'readership', label: 'Maximize readership' },
  { value: 'earnings', label: 'Maximize earnings' },
  { value: 'launch', label: 'Launch promotion' },
  { value: 'series', label: 'Series entry point' },
  { value: 'premium', label: 'Premium specialist book' },
];
const MATTER_OPTIONS = [
  { value: 'copyright', label: 'Copyright page', question: 'I can prepare a legal template for review. Are there any edition, rights, permissions, or publisher details that should appear? Say “use my book details” if not.' },
  { value: 'dedication', label: 'Dedication', question: 'Who or what is the dedication for, and what feeling would you like it to convey?' },
  { value: 'author_bio', label: 'Author biography', question: 'Share the author details readers should know: location, writing focus, relevant experience, and an optional website or social link.' },
  { value: 'acknowledgements', label: 'Acknowledgements', question: 'Who would you like to thank, and what did each person or group contribute?' },
  { value: 'also_by', label: 'Also-by page', question: 'List the other books or series to include, with years or reading order if useful.' },
  { value: 'reader_cta', label: 'Reader call-to-action', question: 'What one action should readers take next, and what destination should they use?' },
  { value: 'reading_group', label: 'Reading-group questions', question: 'Which themes, choices, or ideas should a reading group discuss? Add any spoiler boundaries.' },
];
const DISTRIBUTION_PRIORITIES = [
  { value: 'reach', label: 'Reach more retailers', strategy: 'wide' },
  { value: 'libraries', label: 'Reach libraries', strategy: 'wide' },
  { value: 'amazon_programs', label: 'Amazon program benefits', strategy: 'amazon_exclusive' },
  { value: 'flexibility', label: 'Keep future flexibility', strategy: 'wide' },
  { value: 'direct_readers', label: 'Build direct readership', strategy: 'direct_first' },
];

function readSessionMessages(storageKey) {
  if (typeof window === 'undefined') return null;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(storageKey));
    return Array.isArray(saved) && saved.length ? saved.slice(-40) : null;
  } catch {
    return null;
  }
}

function TypewriterText({ text, animate, onComplete }) {
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [visibleText, setVisibleText] = useState(animate && !reduceMotion ? '' : text);

  useEffect(() => {
    if (!animate || reduceMotion) {
      setVisibleText(text);
      onComplete?.();
      return undefined;
    }
    setVisibleText('');
    let position = 0;
    const timer = window.setInterval(() => {
      position = Math.min(position + 2, text.length);
      setVisibleText(text.slice(0, position));
      if (position >= text.length) {
        window.clearInterval(timer);
        onComplete?.();
      }
    }, 18);
    return () => window.clearInterval(timer);
  }, [animate, onComplete, reduceMotion, text]);

  return (
    <>
      <span aria-hidden={animate ? 'true' : undefined}>{visibleText}</span>
      {animate && <span className="publishing-assistant-sr-only">{text}</span>}
      {animate && visibleText.length < text.length && <span className="publishing-assistant-cursor" aria-hidden="true" />}
    </>
  );
}

function MetadataItem({ title, item, applyLabel, applied, onApply }) {
  if (!item) return null;
  return <article className="publishing-assistant-metadata-item"><div><strong>{title}</strong><span className={`is-${item.confidence}`}>{item.confidence} confidence</span></div><p>{item.label || item.value}</p>{item.rationale && <small>{item.rationale}</small>}{onApply && <button type="button" onClick={onApply} disabled={applied}>{applied ? 'Applied ✓' : applyLabel}</button>}</article>;
}

function MetadataRecommendations({ analysis, applied, onApply }) {
  return <div className="publishing-assistant-metadata-recommendations">
    <h4>AI-inferred recommendations</h4>
    {analysis.subtitleAlternatives?.map((item, index) => <MetadataItem key={`subtitle-${item.value}`} title={`Subtitle option ${index + 1}`} item={item} applyLabel="Use subtitle" applied={applied.has(`subtitle-${index}`)} onApply={() => onApply(`subtitle-${index}`, 'subtitle', item.value)} />)}
    <MetadataItem title="Primary genre" item={analysis.primaryGenre} applyLabel="Use primary genre" applied={applied.has('primary-genre')} onApply={() => onApply('primary-genre', 'genre', analysis.primaryGenre.value)} />
    {analysis.secondaryGenres?.map((item, index) => <MetadataItem key={`secondary-${item.value}`} title="Secondary genre" item={item} applyLabel="Use secondary genre" applied={applied.has(`secondary-${index}`)} onApply={() => onApply(`secondary-${index}`, 'genreSecondary', item.value)} />)}
    {analysis.searchPhrases?.length > 0 && <article className="publishing-assistant-metadata-item"><div><strong>Seven search phrases</strong><span className="is-medium">inferred</span></div><div className="publishing-assistant-metadata-chips">{analysis.searchPhrases.map(value => <span key={value}>{value}</span>)}</div><button type="button" onClick={() => onApply('keywords', 'keywords', analysis.searchPhrases)} disabled={applied.has('keywords')}>{applied.has('keywords') ? 'Applied ✓' : 'Use all phrases'}</button></article>}
    <MetadataItem title="Audience" item={analysis.audience} applyLabel="Use audience" applied={applied.has('audience')} onApply={() => onApply('audience', 'audience', analysis.audience.value)} />
    {analysis.bisacCategories?.map(item => <MetadataItem key={`bisac-${item.value}`} title="BISAC-style category" item={item} />)}
    {analysis.comparablePositioning?.map(item => <MetadataItem key={`position-${item.value}`} title="Comparable positioning" item={item} />)}
  </div>;
}

function PricingScenarios({ scenarios }) {
  return <div className="publishing-assistant-pricing-scenarios">{scenarios.map(scenario => <details key={scenario.id} open={scenario.id === 'balanced'}><summary className="publishing-assistant-pricing-scenario-head"><strong>{scenario.label}</strong><small>Estimated per sale</small></summary>{scenario.comparisons.map((item, index) => <div key={`${item.channel}-${item.format}-${index}`}><span><strong>{item.format} · {item.channel}</strong><small>{formatRoyaltyMoney(item.listPrice)} list{item.platformFees == null ? ` · ${item.note}` : ` · ${formatRoyaltyMoney(item.platformFees)} fees${item.printCost ? ` · ${formatRoyaltyMoney(item.printCost)} print` : ''}`}</small></span><em>{item.estimatedRoyalty == null ? 'Not available' : formatRoyaltyMoney(item.estimatedRoyalty)}</em></div>)}</details>)}</div>;
}

export default function PublishingAssistant({ workflowContext, onInsertSuggestion, onNavigateReadiness, onInsertMatterDraft, onApplyDistributionStrategy, onRememberBookFacts, supportContact = {} }) {
  const storageKey = `ic_publishing_assistant_${workflowContext.draftKey || 'new'}`;
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState(() => readSessionMessages(storageKey) || [
    newMessage('assistant', 'I can help with each publishing step. Select a field or ask me what to do next.'),
  ]);
  const [insertedSuggestion, setInsertedSuggestion] = useState('');
  const [typingMessageId, setTypingMessageId] = useState('');
  const [humanFlow, setHumanFlow] = useState(null);
  const [showReadiness, setShowReadiness] = useState(false);
  const [showDescriptionBuilder, setShowDescriptionBuilder] = useState(false);
  const [descriptionBrief, setDescriptionBrief] = useState(EMPTY_DESCRIPTION_BRIEF);
  const [descriptionBuilderStep, setDescriptionBuilderStep] = useState(0);
  const [showMetadataIntelligence, setShowMetadataIntelligence] = useState(false);
  const [metadataAnalysis, setMetadataAnalysis] = useState(null);
  const [metadataError, setMetadataError] = useState('');
  const [appliedMetadata, setAppliedMetadata] = useState(new Set());
  const [showPricingCoach, setShowPricingCoach] = useState(false);
  const [showMatterGenerator, setShowMatterGenerator] = useState(false);
  const [matterType, setMatterType] = useState('');
  const [insertedMatter, setInsertedMatter] = useState('');
  const [showDistributionAdvisor, setShowDistributionAdvisor] = useState(false);
  const messageListRef = useRef(null);
  const panelRef = useRef(null);
  const dragStartRef = useRef(null);
  const proactiveReviewedRef = useRef(new Set());
  const proactiveRequestRef = useRef(0);

  useEffect(() => {
    if (!open || !messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, open, pending]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
  }, [messages, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(`${storageKey}_reviewed`) || '[]');
      proactiveReviewedRef.current = new Set(Array.isArray(saved) ? saved : []);
    } catch {
      proactiveReviewedRef.current = new Set();
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open || collapsed || pending || humanFlow || showReadiness || showDescriptionBuilder || showMetadataIntelligence || showPricingCoach || showMatterGenerator || showDistributionAdvisor || input.trim()) return undefined;
    const activeField = workflowContext.activeField;
    const rawValue = activeField?.value;
    const hasFieldValue = Array.isArray(rawValue) ? rawValue.length > 0 : String(rawValue || '').trim().length > 0;
    const reviewKey = hasFieldValue && activeField?.id
      ? `step:${workflowContext.stepNumber}:field:${activeField.id}`
      : `step:${workflowContext.stepNumber}`;
    if (proactiveReviewedRef.current.has(reviewKey)) return undefined;

    const requestId = proactiveRequestRef.current + 1;
    proactiveRequestRef.current = requestId;
    const timer = window.setTimeout(async () => {
      proactiveReviewedRef.current.add(reviewKey);
      window.sessionStorage.setItem(`${storageKey}_reviewed`, JSON.stringify([...proactiveReviewedRef.current]));
      const reply = await requestAssistantReply({
        message: 'Review the current publishing context and surface one important issue only if it is genuinely useful.',
        requestType: 'proactive_guidance',
        history: messages,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
        pageContext: {
          section: 'publishing',
          label: 'Publishing upload wizard',
          hint: `The author is completing the ${workflowContext.stepLabel} step.`,
        },
        workflowContext,
      });
      if (proactiveRequestRef.current !== requestId || !reply.text?.trim()) return;
      const guidance = newMessage('assistant', reply.text, { ...reply, kind: 'proactive-guidance' });
      setTypingMessageId(guidance.id);
      setMessages(current => [...current, guidance]);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      proactiveRequestRef.current += 1;
    };
  }, [collapsed, humanFlow, input, messages, open, pending, showDescriptionBuilder, showDistributionAdvisor, showMatterGenerator, showMetadataIntelligence, showPricingCoach, showReadiness, storageKey, workflowContext]);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 640 || !open || collapsed) return undefined;
    const collapseForFormInteraction = event => {
      if (panelRef.current?.contains(event.target)) return;
      setCollapsed(true);
    };
    document.addEventListener('pointerdown', collapseForFormInteraction, true);
    document.addEventListener('focusin', collapseForFormInteraction, true);
    return () => {
      document.removeEventListener('pointerdown', collapseForFormInteraction, true);
      document.removeEventListener('focusin', collapseForFormInteraction, true);
    };
  }, [open, collapsed]);

  async function sendMessage(value) {
    const text = value.trim();
    if (!text || pending) return;
    const userMessage = newMessage('user', text);
    if (isHumanSupportIntent(text)) {
      setInput('');
      setMessages(current => [...current, userMessage]);
      setHumanFlow({
        email: supportContact.email || '',
        reason: '',
        otherDetails: '',
        error: '',
        sent: false,
        pending: false,
        formStartedAt: Date.now(),
      });
      setShowDescriptionBuilder(false);
      setShowPricingCoach(false);
      setShowMatterGenerator(false);
      setShowDistributionAdvisor(false);
      return;
    }
    if (showDescriptionBuilder) {
      setInput('');
      await answerDescriptionQuestion(text, userMessage);
      return;
    }
    if (showPricingCoach) {
      const normalized = text.toLowerCase();
      const objective = PRICING_OBJECTIVES.find(item => normalized.includes(item.value) || normalized.includes(item.label.toLowerCase().replace('maximize ', '')));
      if (!objective) {
        const retry = newMessage('assistant', 'Choose the closest objective below so I can compare the right pricing scenarios.', { kind: 'pricing-coach-question', actions: PRICING_OBJECTIVES.map(item => ({ type: 'pricing_objective', label: item.label, value: item.value })) });
        setInput('');
        setMessages(current => [...current, userMessage, retry]);
        return;
      }
      setInput('');
      await choosePricingObjective(objective.value, userMessage);
      return;
    }
    if (showMatterGenerator) {
      setInput('');
      if (!matterType) {
        const match = MATTER_OPTIONS.find(item => text.toLowerCase().includes(item.value.replace('_', ' ')) || text.toLowerCase().includes(item.label.toLowerCase()));
        if (match) await chooseMatterType(match.value, userMessage);
        else setMessages(current => [...current, userMessage, newMessage('assistant', 'Choose the section you want to draft from the options below.', { kind: 'matter-generator-question', actions: MATTER_OPTIONS.map(item => ({ type: 'matter_type', label: item.label, value: item.value })) })]);
      } else {
        await generateMatterDraft(text, userMessage);
      }
      return;
    }
    if (showDistributionAdvisor) {
      setInput('');
      const normalized = text.toLowerCase();
      const priority = DISTRIBUTION_PRIORITIES.find(item => normalized.includes(item.value.replace('_', ' ')) || normalized.includes(item.label.toLowerCase()));
      if (priority) chooseDistributionPriority(priority.value, userMessage);
      else setMessages(current => [...current, userMessage, newMessage('assistant', 'Choose the closest priority below. You can revise the strategy later.', { kind: 'distribution-advisor-question', actions: DISTRIBUTION_PRIORITIES.map(item => ({ type: 'distribution_priority', label: item.label, value: item.value })) })]);
      return;
    }
    const history = [...messages, userMessage];
    setInput('');
    setPending(true);
    setMessages(current => [...current, userMessage]);

    const reply = await requestAssistantReply({
      message: text,
      history,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: {
        section: 'publishing',
        label: 'Publishing upload wizard',
        hint: `The author is completing the ${workflowContext.stepLabel} step.`,
      },
      workflowContext,
    });

    const assistantMessage = newMessage('assistant', reply.text, reply);
    setTypingMessageId(assistantMessage.id);
    setMessages(current => [...current, assistantMessage]);
    setPending(false);
  }

  function clearMessages() {
    setMessages([]);
    setInput('');
    setInsertedSuggestion('');
    setTypingMessageId('');
    setHumanFlow(null);
    setShowReadiness(false);
    setShowDescriptionBuilder(false);
    setDescriptionBuilderStep(0);
    setDescriptionBrief(EMPTY_DESCRIPTION_BRIEF);
    setShowMetadataIntelligence(false);
    setMetadataAnalysis(null);
    setAppliedMetadata(new Set());
    setShowPricingCoach(false);
    setShowMatterGenerator(false);
    setMatterType('');
    setInsertedMatter('');
    setShowDistributionAdvisor(false);
    proactiveRequestRef.current += 1;
    proactiveReviewedRef.current = new Set();
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(`${storageKey}_reviewed`);
    }
  }

  async function sendHumanRequest(event) {
    event.preventDefault();
    if (!humanFlow || humanFlow.pending) return;
    const email = humanFlow.email.trim().toLowerCase();
    const reason = PUBLISHING_SUPPORT_REASONS.find(option => option.value === humanFlow.reason);
    const otherDetails = humanFlow.otherDetails.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !reason || (reason.value === 'other' && otherDetails.length < 10)) {
      setHumanFlow(current => ({
        ...current,
        error: !reason
          ? 'Choose what you need help with.'
          : reason.value === 'other' && otherDetails.length < 10
            ? 'Add a short description so the team knows how to help.'
            : 'Enter a valid email address.',
      }));
      return;
    }
    setHumanFlow(current => ({ ...current, pending: true, error: '' }));
    try {
      await submitAssistantHandoff({
        sessionId: null,
        visitorId: null,
        contactName: supportContact.name || null,
        contactEmail: email,
        topic: 'publishing',
        message: `[${workflowContext.stepLabel} step] ${reason.label}${reason.value === 'other' ? `: ${otherDetails}` : ''}`,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
        consentAccepted: true,
        verification: '',
        formStartedAt: humanFlow.formStartedAt,
      });
      setHumanFlow(current => ({ ...current, pending: false, sent: true }));
      setMessages(current => [...current, newMessage('assistant', 'Your request has been sent. The team will reply by email.', { private: true })]);
    } catch (error) {
      setHumanFlow(current => ({ ...current, pending: false, error: error?.message || 'Could not send your request.' }));
    }
  }

  function insertSuggestion(suggestion) {
    if (!onInsertSuggestion?.(suggestion)) return;
    setInsertedSuggestion(`${suggestion.field}:${suggestion.value}`);
  }

  function startDrag(event) {
    if (typeof window === 'undefined' || window.innerWidth > 640) return;
    dragStartRef.current = event.touches?.[0]?.clientY ?? null;
  }

  function endDrag(event) {
    if (dragStartRef.current == null) return;
    const endY = event.changedTouches?.[0]?.clientY ?? dragStartRef.current;
    const distance = endY - dragStartRef.current;
    dragStartRef.current = null;
    if (distance > 64) setCollapsed(true);
    if (distance < -48) setCollapsed(false);
  }

  function expandFromHeader(event) {
    if (!collapsed || event.target.closest('button')) return;
    setCollapsed(false);
  }

  function goToReadinessItem(item) {
    if (!onNavigateReadiness?.(item)) return;
    setShowReadiness(false);
    if (typeof window !== 'undefined' && window.innerWidth <= 640) setCollapsed(true);
  }

  function followWizardAction(field) {
    const destination = workflowContext.wizardNavigation?.find(item => item.field === field);
    if (!destination) return;
    goToReadinessItem(destination);
  }

  function startDescriptionBuilder() {
    const firstQuestion = newMessage('assistant', 'Let’s build it together. First, what is your book about? Give me the premise or main idea in your own words.', { kind: 'description-builder-question' });
    setDescriptionBrief(EMPTY_DESCRIPTION_BRIEF);
    setDescriptionBuilderStep(0);
    setShowMetadataIntelligence(false);
    setShowDescriptionBuilder(true);
    setTypingMessageId(firstQuestion.id);
    setMessages(current => [...current, firstQuestion]);
  }

  async function answerDescriptionQuestion(text, userMessage) {
    const fields = ['premise', 'subject', 'conflict', 'appeal'];
    const questions = [
      'Got it. Who or what is at the centre of the book—the protagonist, subject, or reader problem?',
      'That gives me the focus. What is the central conflict, stakes, transformation, or practical value for the reader?',
      'Good. Finally, what should make readers choose this book, and what tone should the description have? You can say “skip” if you are unsure.',
    ];
    if (descriptionBuilderStep < 3 && text.length < 12) {
      const retry = newMessage('assistant', 'Could you add one or two more concrete details? I want to avoid inventing anything about your book.', { kind: 'description-builder-question' });
      setMessages(current => [...current, userMessage, retry]);
      setTypingMessageId(retry.id);
      return;
    }
    const field = fields[descriptionBuilderStep];
    const nextBrief = { ...descriptionBrief, [field]: /^skip$/i.test(text) ? '' : text };
    setDescriptionBrief(nextBrief);
    setMessages(current => [...current, userMessage]);
    if (descriptionBuilderStep < 3) {
      const nextQuestion = newMessage('assistant', questions[descriptionBuilderStep], { kind: 'description-builder-question' });
      setDescriptionBuilderStep(step => step + 1);
      setTypingMessageId(nextQuestion.id);
      setMessages(current => [...current, nextQuestion]);
      return;
    }
    await buildDescription(nextBrief, [...messages, userMessage]);
  }

  async function buildDescription(completedBrief, history) {
    onRememberBookFacts?.({ centralSubject: completedBrief.subject });
    setPending(true);
    const reply = await requestAssistantReply({
      message: 'Create my guided book description from the completed brief.',
      requestType: 'description_builder',
      history,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Guided description builder', hint: 'The author completed a structured factual brief.' },
      workflowContext: {
        ...workflowContext,
        activeField: { id: 'description', label: 'Description', purpose: 'Reader-facing book description', value: workflowContext.bookDetails?.description || '', required: true, maxLength: 4000 },
        descriptionBrief: completedBrief,
      },
    });
    const result = newMessage('assistant', reply.text, { ...reply, kind: 'description-builder' });
    setTypingMessageId(result.id);
    setMessages(current => [...current, result]);
    setPending(false);
    setShowDescriptionBuilder(false);
    setDescriptionBuilderStep(0);
  }

  async function reviewMetadata() {
    if (!workflowContext.bookDetails?.title?.trim() || (workflowContext.bookDetails?.description || '').trim().length < 80) {
      setMetadataError('Add a title and a meaningful description first so suggestions can be grounded in your book.');
      return;
    }
    setMetadataError('');
    setPending(true);
    const reply = await requestAssistantReply({
      message: 'Review my established book facts and suggest grounded publishing metadata.',
      requestType: 'metadata_intelligence',
      history: messages,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Metadata intelligence', hint: 'Separate author-confirmed facts from AI-inferred recommendations.' },
      workflowContext,
    });
    setMetadataAnalysis(reply.metadataAnalysis);
    if (!reply.metadataAnalysis) setMetadataError('I could not produce reliable suggestions from the available facts. Add more detail to the description and try again.');
    setPending(false);
  }

  function startPricingCoach() {
    const question = newMessage('assistant', 'What is your main pricing objective for this book?', {
      kind: 'pricing-coach-question',
      actions: PRICING_OBJECTIVES.map(item => ({ type: 'pricing_objective', label: item.label, value: item.value })),
    });
    setShowPricingCoach(true);
    setTypingMessageId(question.id);
    setMessages(current => [...current, question]);
  }

  async function choosePricingObjective(objective, suppliedUserMessage) {
    const choice = PRICING_OBJECTIVES.find(item => item.value === objective);
    if (!choice || pending) return;
    const userMessage = suppliedUserMessage || newMessage('user', choice.label);
    const pricing = workflowContext.pricingContext || {};
    const scenarios = buildPricingCoachScenarios({ objective, ...pricing });
    setMessages(current => [...current, userMessage]);
    setPending(true);
    const reply = await requestAssistantReply({
      message: `My pricing objective is: ${choice.label}. Explain the trade-offs in the calculated scenarios.`,
      requestType: 'pricing_coach',
      history: [...messages, userMessage],
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Pricing coach', hint: 'Explain deterministic royalty scenarios without promising sales.' },
      workflowContext: { ...workflowContext, pricingCoach: { objective: choice.value, objectiveLabel: choice.label, scenarios } },
    });
    const result = newMessage('assistant', reply.text, { ...reply, kind: 'pricing-coach-result', pricingScenarios: scenarios });
    setTypingMessageId(result.id);
    setMessages(current => [...current, result]);
    setPending(false);
    setShowPricingCoach(false);
  }

  function startMatterGenerator() {
    const question = newMessage('assistant', 'Which front- or back-matter section would you like to draft?', {
      kind: 'matter-generator-question',
      actions: MATTER_OPTIONS.map(item => ({ type: 'matter_type', label: item.label, value: item.value })),
    });
    setMatterType('');
    setShowMatterGenerator(true);
    setTypingMessageId(question.id);
    setMessages(current => [...current, question]);
  }

  async function chooseMatterType(type, suppliedUserMessage) {
    const option = MATTER_OPTIONS.find(item => item.value === type);
    if (!option || pending) return;
    const userMessage = suppliedUserMessage || newMessage('user', option.label);
    const question = newMessage('assistant', option.question, { kind: 'matter-generator-question' });
    setShowMatterGenerator(true);
    setMatterType(type);
    setTypingMessageId(question.id);
    setMessages(current => [...current, userMessage, question]);
  }

  async function generateMatterDraft(answer, userMessage) {
    const option = MATTER_OPTIONS.find(item => item.value === matterType);
    if (!option || pending) return;
    if (answer.trim().length < 8) {
      const retry = newMessage('assistant', 'Add a little more detail so I can create a useful draft without inventing facts.', { kind: 'matter-generator-question' });
      setTypingMessageId(retry.id);
      setMessages(current => [...current, userMessage, retry]);
      return;
    }
    setMessages(current => [...current, userMessage]);
    setPending(true);
    const reply = await requestAssistantReply({
      message: `Create an editable ${option.label} draft from my answer.`,
      requestType: 'matter_generator',
      history: [...messages, userMessage],
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Front and back matter generator', hint: 'Generate one editable, fact-grounded matter section.' },
      workflowContext: { ...workflowContext, matterRequest: { type: matterType, authorAnswer: answer } },
    });
    const result = newMessage('assistant', reply.matterDraft ? `I drafted your ${option.label.toLowerCase()}. Review it carefully before inserting it.` : 'I could not create a reliable draft from those details. Add more specific facts and try again.', { ...reply, kind: 'matter-generator-result' });
    setTypingMessageId(result.id);
    setMessages(current => [...current, result]);
    setPending(false);
    setShowMatterGenerator(false);
    setMatterType('');
  }

  function insertMatterDraft(draft) {
    if (!onInsertMatterDraft?.(draft)) return;
    setInsertedMatter(`${draft.section}:${draft.key}`);
  }

  function startDistributionAdvisor() {
    const question = newMessage('assistant', 'What matters most for this book’s distribution?', { kind: 'distribution-advisor-question', actions: DISTRIBUTION_PRIORITIES.map(item => ({ type: 'distribution_priority', label: item.label, value: item.value })) });
    setShowDistributionAdvisor(true);
    setTypingMessageId(question.id);
    setMessages(current => [...current, question]);
  }

  function chooseDistributionPriority(value, suppliedUserMessage) {
    const priority = DISTRIBUTION_PRIORITIES.find(item => item.value === value);
    if (!priority) return;
    const userMessage = suppliedUserMessage || newMessage('user', priority.label);
    const explanation = priority.strategy === 'amazon_exclusive'
      ? 'Amazon ebook exclusivity may unlock program-specific benefits, but the ebook cannot also be distributed through other retailers or library platforms while enrolled. Print distribution can still be handled separately.'
      : priority.strategy === 'direct_first'
        ? 'A direct-first strategy prioritises your reader relationship and direct margin. It offers less retailer and library discovery unless you add wide channels later.'
        : 'Wide distribution makes the ebook available across more retailers and can include library platforms. It preserves flexibility, but it is incompatible with ebook-exclusive programmes while those terms apply.';
    const reply = newMessage('assistant', explanation, { kind: 'distribution-advisor-result', actions: [{ type: 'distribution_strategy', label: `Use ${priority.strategy === 'wide' ? 'wide distribution' : priority.strategy === 'amazon_exclusive' ? 'Amazon exclusivity' : 'direct-first'}`, value: `${priority.strategy}:${priority.value}` }] });
    setTypingMessageId(reply.id);
    setMessages(current => [...current, userMessage, reply]);
    setShowDistributionAdvisor(false);
  }

  function applyDistributionStrategy(value) {
    const [strategy, priority] = value.split(':');
    if (!onApplyDistributionStrategy?.({ strategy, priority })) return;
    const label = strategy === 'wide' ? 'Wide distribution' : strategy === 'amazon_exclusive' ? 'Amazon ebook exclusivity' : 'Direct-first';
    const confirmation = newMessage('assistant', `${label} is now your remembered strategy. I’ll use it in pricing and final-review guidance.`, { kind: 'distribution-strategy-confirmed' });
    setTypingMessageId(confirmation.id);
    setMessages(current => [...current, confirmation]);
  }

  function applyMetadata(key, field, value) {
    const normalized = Array.isArray(value) ? value.join('\n') : value;
    if (!onInsertSuggestion?.({ field, value: normalized, label: `Use for ${field}` })) return;
    setAppliedMetadata(current => new Set([...current, key]));
  }

  const readiness = workflowContext.readiness;
  const readinessIssues = readiness?.items?.filter(item => item.status !== 'complete') || [];

  return (
    <div className={`publishing-assistant${open ? ' publishing-assistant--open' : ''}${collapsed ? ' publishing-assistant--collapsed' : ''}`}>
      {open && (
        <aside ref={panelRef} className="publishing-assistant-panel" role="dialog" aria-modal="false" aria-label="Publishing assistant">
          <header onTouchStart={startDrag} onTouchEnd={endDrag} onClick={expandFromHeader}>
            <div>
              <span className="publishing-assistant-mark" aria-hidden="true">.in</span>
              <span>
                <strong>Publishing assistant</strong>
                <small>{workflowContext.activeField?.label || workflowContext.stepLabel}</small>
              </span>
            </div>
            <nav aria-label="Chat controls">
              <button type="button" className="publishing-assistant-collapse" onClick={() => setCollapsed(true)} aria-label="Collapse assistant" title="Collapse assistant">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <button type="button" onClick={clearMessages} aria-label="Clear messages" title="Clear messages">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg>
              </button>
              <button type="button" onClick={() => { setOpen(false); setCollapsed(false); }} aria-label="Close assistant">×</button>
            </nav>
          </header>

          {readiness && (
            <button
              type="button"
              className={`publishing-assistant-readiness-trigger${showReadiness ? ' is-active' : ''}`}
              onClick={() => setShowReadiness(value => !value)}
              aria-expanded={showReadiness}
            >
              <span className="publishing-assistant-readiness-score" style={{ '--readiness-score': readiness.score }} aria-hidden="true">{readiness.score}</span>
              <span><strong>Publishing readiness</strong><small>{readiness.complete} of {readiness.total} checks complete</small></span>
              {(readiness.blockers > 0 || readiness.missing > 0) && (
                <em>{readiness.blockers ? `${readiness.blockers} blocker${readiness.blockers === 1 ? '' : 's'}` : `${readiness.missing} missing`}</em>
              )}
              <span className="publishing-assistant-readiness-chevron" aria-hidden="true">{showReadiness ? '↑' : '↓'}</span>
            </button>
          )}

          {workflowContext.stepNumber === 2 && !showDescriptionBuilder && !showMetadataIntelligence && !showReadiness && (
            <div className="publishing-assistant-tools">
              <button type="button" className="publishing-assistant-description-trigger" onClick={startDescriptionBuilder}>
                <span aria-hidden="true">✦</span><span><strong>Build my description</strong><small>Answer 4 short questions</small></span><em>Start →</em>
              </button>
              <button type="button" className="publishing-assistant-metadata-trigger" onClick={() => { setShowDescriptionBuilder(false); setShowMetadataIntelligence(true); }}>
                <span aria-hidden="true">◎</span><span><strong>Metadata intelligence</strong><small>Genres, keywords and positioning</small></span><em>Review →</em>
              </button>
            </div>
          )}
          {workflowContext.stepNumber === 8 && !showPricingCoach && !showReadiness && (
            <div className="publishing-assistant-tools"><button type="button" className="publishing-assistant-metadata-trigger" onClick={startPricingCoach}><span aria-hidden="true">$</span><span><strong>Pricing coach</strong><small>Compare royalties by objective</small></span><em>Start →</em></button></div>
          )}
          {workflowContext.stepNumber === 9 && !showDistributionAdvisor && !showReadiness && (
            <div className="publishing-assistant-tools"><button type="button" className="publishing-assistant-metadata-trigger" onClick={startDistributionAdvisor}><span aria-hidden="true">⇄</span><span><strong>Distribution advisor</strong><small>{workflowContext.pricingContext?.distributionStrategy ? 'Review your remembered strategy' : 'Wide, exclusive, or direct-first'}</small></span><em>{workflowContext.pricingContext?.distributionStrategy ? 'Review →' : 'Start →'}</em></button></div>
          )}
          {workflowContext.stepNumber === 10 && !showMatterGenerator && !showReadiness && (
            <div className="publishing-assistant-tools"><button type="button" className="publishing-assistant-metadata-trigger" onClick={startMatterGenerator}><span aria-hidden="true">¶</span><span><strong>Matter generator</strong><small>Draft book-opening and closing pages</small></span><em>Start →</em></button></div>
          )}
          {showDescriptionBuilder && !showReadiness && (
            <div className="publishing-assistant-conversation-mode">
              <span aria-hidden="true">✦</span><span><strong>Building your description</strong><small>Question {Math.min(descriptionBuilderStep + 1, 4)} of 4</small></span>
              <button type="button" onClick={() => { setShowDescriptionBuilder(false); setDescriptionBuilderStep(0); }}>Exit</button>
            </div>
          )}
          {showPricingCoach && !showReadiness && (
            <div className="publishing-assistant-conversation-mode"><span aria-hidden="true">$</span><span><strong>Pricing coach</strong><small>Choose your main objective</small></span><button type="button" onClick={() => setShowPricingCoach(false)}>Exit</button></div>
          )}
          {showDistributionAdvisor && !showReadiness && (
            <div className="publishing-assistant-conversation-mode"><span aria-hidden="true">⇄</span><span><strong>Distribution advisor</strong><small>Choose your main priority</small></span><button type="button" onClick={() => setShowDistributionAdvisor(false)}>Exit</button></div>
          )}
          {showMatterGenerator && !showReadiness && (
            <div className="publishing-assistant-conversation-mode"><span aria-hidden="true">¶</span><span><strong>Front &amp; back matter</strong><small>{matterType ? MATTER_OPTIONS.find(item => item.value === matterType)?.label : 'Choose a section'}</small></span><button type="button" onClick={() => { setShowMatterGenerator(false); setMatterType(''); }}>Exit</button></div>
          )}

          {showReadiness ? (
            <section className="publishing-assistant-readiness" aria-label="Publishing readiness checklist">
              <div className="publishing-assistant-readiness-summary">
                <div><strong>{readiness.score}%</strong><span>ready</span></div>
                <div>
                  <strong>{readiness.blockers ? 'Resolve blockers first' : readiness.missing ? 'Complete the essentials' : 'Ready for final review'}</strong>
                  <span>{readiness.blockers} blockers · {readiness.missing} missing · {readiness.recommended} recommended</span>
                </div>
              </div>
              <div className="publishing-assistant-readiness-progress" aria-hidden="true"><i style={{ width: `${readiness.score}%` }} /></div>
              {readinessIssues.length ? (
                <div className="publishing-assistant-readiness-list">
                  {readinessIssues.map(item => {
                    const available = item.step <= workflowContext.stepNumber - 1;
                    return (
                      <button key={item.id} type="button" onClick={() => goToReadinessItem(item)} disabled={!available}>
                        <span className={`publishing-assistant-readiness-status is-${item.status}`} aria-hidden="true">
                          {item.status === 'blocker' ? '!' : item.status === 'missing' ? '•' : 'i'}
                        </span>
                        <span><strong>{item.label}</strong><small>{item.message}</small></span>
                        <em>{available ? 'Open' : `Step ${item.step + 1}`}</em>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="publishing-assistant-readiness-complete"><span aria-hidden="true">✓</span><strong>All readiness checks are complete.</strong><small>Review the details before publishing.</small></div>
              )}
            </section>
          ) : showMetadataIntelligence ? (
            <section className="publishing-assistant-metadata">
              <div className="publishing-assistant-builder-heading"><span>◎</span><div><strong>Metadata intelligence</strong><small>Confirmed facts stay separate from AI recommendations.</small></div></div>
              {!metadataAnalysis ? <>
                <div className="publishing-assistant-metadata-note"><strong>Before the review</strong><p>Indie uses your title, description, current genres, audience, and keywords. It does not read or send your manuscript.</p></div>
                {metadataError && <p className="publishing-assistant-metadata-error" role="alert">{metadataError}</p>}
                <div className="publishing-assistant-metadata-actions"><button type="button" onClick={reviewMetadata} disabled={pending}>{pending ? 'Reviewing…' : 'Review my metadata'}</button><button type="button" onClick={() => setShowMetadataIntelligence(false)}>Cancel</button></div>
              </> : <>
                <div className="publishing-assistant-metadata-facts"><strong>Author-confirmed facts</strong>{metadataAnalysis.confirmedFacts.map(fact => <div key={`${fact.label}:${fact.value}`}><span>{fact.label}</span><p>{fact.value}</p></div>)}</div>
                <MetadataRecommendations analysis={metadataAnalysis} applied={appliedMetadata} onApply={applyMetadata} />
                <div className="publishing-assistant-metadata-actions"><button type="button" onClick={reviewMetadata} disabled={pending}>{pending ? 'Reviewing…' : 'Refresh suggestions'}</button><button type="button" onClick={() => setShowMetadataIntelligence(false)}>Back to chat</button></div>
              </>}
            </section>
          ) : <div className="publishing-assistant-messages" ref={messageListRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="publishing-assistant-empty">
                <span aria-hidden="true">✦</span>
                <p>Messages cleared. Select a field or ask about this publishing step.</p>
              </div>
            )}
            {messages.map(message => (
              <div key={message.id} className={`publishing-assistant-message publishing-assistant-message--${message.role}`}>
                {message.kind === 'proactive-guidance' && <small className="publishing-assistant-guidance-label">Suggestion</small>}
                {message.kind === 'description-builder-question' && <small className="publishing-assistant-guidance-label">Description builder</small>}
                <p>
                  {message.role === 'assistant' ? (
                    <TypewriterText
                      text={message.text}
                      animate={typingMessageId === message.id}
                      onComplete={() => setTypingMessageId(current => current === message.id ? '' : current)}
                    />
                  ) : message.text}
                </p>
                {typingMessageId !== message.id && message.pricingScenarios?.length > 0 && <PricingScenarios scenarios={message.pricingScenarios} />}
                {typingMessageId !== message.id && message.matterDraft && (
                  <div className="publishing-assistant-matter-draft">
                    <div><strong>{message.matterDraft.label}</strong>{message.matterDraft.legalTemplate && <span>Legal template · author review required</span>}</div>
                    <pre>{message.matterDraft.content}</pre>
                    <button type="button" onClick={() => insertMatterDraft(message.matterDraft)} disabled={insertedMatter === `${message.matterDraft.section}:${message.matterDraft.key}`}>{insertedMatter === `${message.matterDraft.section}:${message.matterDraft.key}` ? 'Inserted ✓' : `Insert into ${message.matterDraft.label}`}</button>
                  </div>
                )}
                {typingMessageId !== message.id && message.fieldSuggestions?.length > 0 && (
                  <div className="publishing-assistant-field-suggestions">
                    {message.fieldSuggestions.map(suggestion => {
                      const suggestionKey = `${suggestion.field}:${suggestion.value}`;
                      const inserted = insertedSuggestion === suggestionKey;
                      return (
                        <div key={suggestionKey}>
                          <span>{suggestion.value}</span>
                          <button type="button" onClick={() => insertSuggestion(suggestion)} disabled={inserted}>
                            {inserted ? 'Inserted ✓' : suggestion.label || `Insert into ${workflowContext.activeField?.label || 'field'}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {typingMessageId !== message.id && message.actions?.filter(action => ['wizard', 'ask', 'pricing_objective', 'matter_type', 'distribution_priority', 'distribution_strategy'].includes(action.type) && !isHumanSupportIntent(action.value)).length > 0 && (
                  <div className="publishing-assistant-suggestions">
                    {message.actions.filter(action => ['wizard', 'ask', 'pricing_objective', 'matter_type', 'distribution_priority', 'distribution_strategy'].includes(action.type) && !isHumanSupportIntent(action.value)).map(action => (
                      <button key={`${action.type}:${action.value}`} className={action.type === 'wizard' || action.type === 'distribution_strategy' ? 'is-wizard-link' : undefined} type="button" onClick={() => action.type === 'wizard' ? followWizardAction(action.value) : action.type === 'pricing_objective' ? choosePricingObjective(action.value) : action.type === 'matter_type' ? chooseMatterType(action.value) : action.type === 'distribution_priority' ? chooseDistributionPriority(action.value) : action.type === 'distribution_strategy' ? applyDistributionStrategy(action.value) : sendMessage(action.value)}>
                        {action.type === 'wizard' && <span aria-hidden="true">↗</span>}{action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pending && <div className="publishing-assistant-thinking" aria-label="Indie is thinking"><i /><i /><i /></div>}
            {humanFlow && !humanFlow.sent && (
              <form className="publishing-assistant-handoff" onSubmit={sendHumanRequest}>
                <div className="publishing-assistant-handoff-heading">
                  <span aria-hidden="true">↗</span>
                  <div><strong>Contact the publishing team</strong><small>They’ll reply by email.</small></div>
                </div>
                <label>
                  <span>Email</span>
                  <input type="email" value={humanFlow.email} onChange={event => setHumanFlow(current => ({ ...current, email: event.target.value }))} autoComplete="email" />
                </label>
                <label>
                  <span>What do you need help with?</span>
                  <select
                    value={humanFlow.reason}
                    onChange={event => setHumanFlow(current => ({ ...current, reason: event.target.value, error: '' }))}
                    autoFocus
                  >
                    <option value="">Choose a topic</option>
                    {PUBLISHING_SUPPORT_REASONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                {humanFlow.reason === 'other' && (
                  <label>
                    <span>Tell us a little more</span>
                    <textarea
                      rows="3"
                      value={humanFlow.otherDetails}
                      onChange={event => setHumanFlow(current => ({ ...current, otherDetails: event.target.value, error: '' }))}
                      maxLength="1000"
                      placeholder="Briefly describe what you need help with"
                    />
                  </label>
                )}
                {humanFlow.error && <p role="alert">{humanFlow.error}</p>}
                <div>
                  <button type="submit" disabled={humanFlow.pending}>{humanFlow.pending ? 'Sending…' : 'Send request'}</button>
                  <button type="button" onClick={() => setHumanFlow(null)}>Cancel</button>
                </div>
              </form>
            )}
          </div>}

          {!humanFlow && !showReadiness && !showMetadataIntelligence && <form className="publishing-assistant-composer" onSubmit={event => { event.preventDefault(); sendMessage(input); }}>
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={showDescriptionBuilder || (showMatterGenerator && matterType) ? 'Type your answer…' : showPricingCoach ? 'Choose an objective or type it…' : showDistributionAdvisor ? 'Choose a priority or type it…' : showMatterGenerator ? 'Choose a section or type it…' : `Ask about ${workflowContext.stepLabel.toLowerCase()}…`}
              aria-label="Ask the publishing assistant"
              maxLength={600}
              disabled={pending}
            />
            <button type="submit" disabled={!input.trim() || pending} aria-label="Send message">→</button>
          </form>}
          {!showReadiness && !showMetadataIntelligence && <small className="publishing-assistant-privacy">{showDescriptionBuilder ? 'Your answers are used only to draft this description. Nothing is inserted until you approve it.' : 'Book details may be sent to AI. Manuscript files are never included.'}</small>}
        </aside>
      )}
      <button
        type="button"
        className="publishing-assistant-toggle"
        onClick={() => setOpen(value => {
          const next = !value;
          if (next) setCollapsed(false);
          return next;
        })}
        aria-expanded={open}
        aria-label={open ? 'Close publishing assistant' : 'Open publishing assistant'}
      >
        {open ? '×' : <><span aria-hidden="true">✦</span> Ask Indie</>}
      </button>
    </div>
  );
}
