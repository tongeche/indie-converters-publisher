import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatAvatar from './ChatAvatar';
import { getAssistantActionMessage, isHumanSupportIntent, requestAssistantReply } from '../lib/assistant';
import { createAssistantSession, loadAssistantActions, reportAssistantAction, saveAssistantPlan, submitAssistantHandoff } from '../lib/api';
import { buildPricingCoachScenarios, formatRoyaltyMoney } from '../lib/royaltyCalculator';
import { actionPlanProgress, updatePublishingActionPlan } from '../lib/publishingPlan';
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

function readSessionPlan(storageKey) {
  if (typeof window === 'undefined') return null;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(`${storageKey}_action_plan`));
    return saved?.id && Array.isArray(saved.steps) ? saved : null;
  } catch {
    return null;
  }
}

function isActionPlanRequest(value) {
  const text = String(value || '').toLowerCase();
  return /^(?:plan|roadmap)$/i.test(text.trim())
    || /\b(?:make|create|build|give me)\s+(?:a\s+)?(?:publishing\s+)?plan\b/.test(text)
    || /\b(?:publishing|launch|book)\s+(?:plan|roadmap)\b/.test(text)
    || /\b(?:plan|roadmap)\b.*\b(?:publish|publishing|launch|book|ready|finish|complete)\b/.test(text)
    || /\b(?:help me|help us)\b.*\b(?:get|prepare|finish|launch)\b.*\b(?:book|publishing)\b/.test(text)
    || /\bstep[- ]by[- ]step\b.*\b(?:publish|publishing|launch|book|ready)\b/.test(text);
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

function PublishingMessageContent({ text }) {
  return <div className="publishing-assistant-rich-text"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} target={href?.startsWith('/') ? undefined : '_blank'} rel={href?.startsWith('/') ? undefined : 'noreferrer'}>{children}</a> }}>{text}</ReactMarkdown></div>;
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

function SelectionReplacement({ proposal, applied, dismissed, onApply, onRedo, onReject }) {
  if (!proposal || dismissed) return null;
  return <section className="publishing-assistant-selection-replacement" aria-label={`Alex’s proposed replacement for ${proposal.label || proposal.field}`}>
    <small>Selected text · {proposal.label || proposal.field}</small>
    <div><span>Current</span><del>{proposal.original}</del></div>
    <div><span>Alex’s edit</span><strong>{proposal.replacement}</strong></div>
    {proposal.reason && <p>{proposal.reason}</p>}
    <footer>
      <button type="button" onClick={() => onApply(proposal)} disabled={applied}>{applied ? 'Applied' : 'Use it'}</button>
      <button type="button" onClick={() => onRedo(proposal)} disabled={applied}>Redo</button>
      <button type="button" onClick={() => onReject(proposal)} disabled={applied}>Keep mine</button>
    </footer>
  </section>;
}

function PublishingActionPlan({ plan, onOpen, onAsk, onComplete }) {
  const progress = actionPlanProgress(plan);
  const activeStep = plan.steps.find(step => step.status === 'current' || step.status === 'in_progress');
  return <section className="publishing-assistant-action-plan" aria-label="Your publishing plan">
    <header>
      <span aria-hidden="true">✦</span>
      <div><strong>{plan.status === 'completed' ? 'Publishing plan complete' : plan.title}</strong><small>{progress.complete} of {progress.total} tasks complete</small></div>
      <b>{progress.percent}%</b>
    </header>
    <div className="publishing-assistant-action-plan-progress" aria-hidden="true"><i style={{ width: `${progress.percent}%` }} /></div>
    {plan.status === 'completed' ? <p>You completed every task in this plan. Alex can help with your final review whenever you are ready.</p> : <>
      <ol>
        {plan.steps.map((step, index) => <li key={step.id} className={`is-${step.status}`}>
          <span>{step.status === 'completed' ? '✓' : index + 1}</span>
          <div><strong>{step.title}</strong><small>{step.status === 'completed' ? 'Complete' : step.detail}</small></div>
        </li>)}
      </ol>
      {activeStep && <div className="publishing-assistant-action-plan-current">
        <small>Current task</small>
        <strong>{activeStep.title}</strong>
        <p>{activeStep.detail}</p>
        <div>
          <button type="button" onClick={() => onOpen(activeStep)}>{activeStep.field || activeStep.step ? 'Open task' : 'Work here'}</button>
          <button type="button" onClick={() => onAsk(activeStep)}>Ask Alex</button>
          <button type="button" onClick={() => onComplete(activeStep)}>Mark complete</button>
        </div>
        <em>{activeStep.completionHint}</em>
      </div>}
    </>}
  </section>;
}

export default function PublishingAssistant({ workflowContext, selectionRequest, onSelectionRequestHandled, onInsertSuggestion, onReplaceSelection, onClearSelection, onNavigateReadiness, onInsertMatterDraft, onApplyDistributionStrategy, onRememberBookFacts, onContinue, onOpenHealthDetail, supportContact = {} }) {
  const storageKey = `ic_publishing_assistant_${workflowContext.draftKey || 'new'}`;
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [darkMode, setDarkMode] = useState(() => (
    typeof window !== 'undefined' && window.localStorage.getItem('ic_alex_theme') === 'dark'
  ));
  const [aiWorkMode, setAiWorkMode] = useState(() => (
    typeof window !== 'undefined' && window.localStorage.getItem('ic_alex_work_mode') === 'on'
  ));
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState(() => readSessionMessages(storageKey) || [
    newMessage('assistant', 'Hi, I’m Alex. I can help with each publishing step. Select a field or ask me what to do next.'),
  ]);
  const [insertedSuggestions, setInsertedSuggestions] = useState(new Set());
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set());
  const [appliedSelectionReplacements, setAppliedSelectionReplacements] = useState(new Set());
  const [dismissedSelectionReplacements, setDismissedSelectionReplacements] = useState(new Set());
  const [lastAppliedChange, setLastAppliedChange] = useState(null);
  const [actionPlan, setActionPlan] = useState(() => readSessionPlan(storageKey));
  const [typingMessageId, setTypingMessageId] = useState('');
  const [humanFlow, setHumanFlow] = useState(null);
  const [showReadiness, setShowReadiness] = useState(false);
  const [selectedTextContext, setSelectedTextContext] = useState(null);
  const agentSessionIdRef = useRef(null);
  const agentSessionPromiseRef = useRef(null);
  const agentSessionNeedsCreateRef = useRef(false);
  const agentSessionResetRef = useRef(false);
  if (!agentSessionIdRef.current) {
    const savedSessionId = typeof window !== 'undefined' ? window.sessionStorage.getItem(`${storageKey}_agent_session`) : null;
    const validSavedId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(savedSessionId || '') ? savedSessionId : null;
    agentSessionIdRef.current = validSavedId || crypto.randomUUID();
    agentSessionNeedsCreateRef.current = !validSavedId;
    if (typeof window !== 'undefined' && !validSavedId) window.sessionStorage.setItem(`${storageKey}_agent_session`, agentSessionIdRef.current);
  }

  useEffect(() => {
    window.localStorage.setItem('ic_alex_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  useEffect(() => {
    window.localStorage.setItem('ic_alex_work_mode', aiWorkMode ? 'on' : 'off');
  }, [aiWorkMode]);
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
  const restoredActionsKeyRef = useRef('');
  const handledSelectionRequestRef = useRef('');
  const composerInputRef = useRef(null);
  const activeTextSelection = selectedTextContext || workflowContext.activeField?.selection || null;

  const ensureAgentSession = useCallback(async () => {
    if (!agentSessionNeedsCreateRef.current) return agentSessionIdRef.current;
    if (!agentSessionPromiseRef.current) {
      agentSessionPromiseRef.current = createAssistantSession({
        id: agentSessionIdRef.current,
        userId: supportContact.userId,
        visitorId: null,
        consentAcceptedAt: new Date().toISOString(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      }).then(sessionId => {
        agentSessionNeedsCreateRef.current = false;
        return sessionId;
      }).catch(error => {
        agentSessionPromiseRef.current = null;
        console.error('[publishing assistant] could not create durable session:', error?.message || error);
        return agentSessionIdRef.current;
      });
    }
    return agentSessionPromiseRef.current;
  }, [supportContact.userId]);

  useEffect(() => { ensureAgentSession(); }, [ensureAgentSession]);

  useEffect(() => {
    const draftKey = workflowContext.draftKey || 'new';
    const restoreKey = `${supportContact.userId || 'anonymous'}:${draftKey}:${workflowContext.activeField?.id || ''}`;
    if (!supportContact.userId || restoredActionsKeyRef.current === restoreKey) return;
    restoredActionsKeyRef.current = restoreKey;
    loadAssistantActions(draftKey).then(result => {
      if (!result) return;
      if (result.lastUndoable) {
        setLastAppliedChange({
          field: result.lastUndoable.field,
          label: result.lastUndoable.label || result.lastUndoable.field,
          previousValue: Array.isArray(result.lastUndoable.previousValue) ? result.lastUndoable.previousValue.join('\n') : String(result.lastUndoable.previousValue || ''),
          appliedValue: result.lastUndoable.appliedValue || result.lastUndoable.value,
          approvalId: result.lastUndoable.approvalId,
        });
      }
      if (result.actionPlan) {
        setActionPlan(result.actionPlan);
        setMessages(current => current.some(message => message.actionPlan?.id === result.actionPlan.id)
          ? current
          : [...current, newMessage('assistant', 'Your publishing plan is ready to resume. We’ll continue with one task at a time.', {
              kind: 'restored-action-plan', actionPlan: result.actionPlan,
            })]);
      }
      const pending = (result.pending || []).find(action => action.field === workflowContext.activeField?.id && action.value);
      if (!pending) return;
      setMessages(current => current.some(message => message.fieldSuggestions?.some(suggestion => suggestion.approvalId === pending.approvalId))
        ? current
        : [...current, newMessage('assistant', `You still have an unfinished proposal for **${workflowContext.activeField?.label || pending.field}**.`, {
            kind: 'restored-proposal',
            fieldSuggestions: [{ field: pending.field, label: pending.label || `Use this ${pending.field}`, value: pending.value, approved: pending.status === 'approved', approvalId: pending.approvalId }],
          })]);
    }).catch(error => console.error('[publishing assistant] could not restore actions:', error?.message || error));
  }, [supportContact.userId, workflowContext.activeField?.id, workflowContext.activeField?.label, workflowContext.draftKey]);

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
    const planKey = `${storageKey}_action_plan`;
    if (actionPlan) window.sessionStorage.setItem(planKey, JSON.stringify(actionPlan));
    else window.sessionStorage.removeItem(planKey);
  }, [actionPlan, storageKey]);

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
      await ensureAgentSession();
      const reply = await requestAssistantReply({
        sessionId: agentSessionIdRef.current,
        resetSession: agentSessionResetRef.current,
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
      agentSessionResetRef.current = false;
      if (proactiveRequestRef.current !== requestId || !reply.text?.trim()) return;
      const guidance = newMessage('assistant', reply.text, { ...reply, kind: 'proactive-guidance' });
      setTypingMessageId(guidance.id);
      setMessages(current => [...current, guidance]);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      proactiveRequestRef.current += 1;
    };
  }, [collapsed, ensureAgentSession, humanFlow, input, messages, open, pending, showDescriptionBuilder, showDistributionAdvisor, showMatterGenerator, showMetadataIntelligence, showPricingCoach, showReadiness, storageKey, workflowContext]);

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

  useEffect(() => {
    if (!selectionRequest?.id || handledSelectionRequestRef.current === selectionRequest.id) return;
    handledSelectionRequestRef.current = selectionRequest.id;
    // Highlighting text only gives Alex context. The author chooses the task in
    // the composer; we never manufacture an “improve this” message for them.
    setSelectedTextContext(selectionRequest);
    setInput('');
    setOpen(true);
    setCollapsed(false);
    setShowReadiness(false);
    setShowMetadataIntelligence(false);
    onSelectionRequestHandled?.();
    window.requestAnimationFrame(() => composerInputRef.current?.focus());
  }, [onSelectionRequestHandled, selectionRequest?.id]);

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
    if (activeTextSelection?.field && activeTextSelection?.original) {
      await sendSelectionTask(text, userMessage, activeTextSelection);
      return;
    }
    if (isActionPlanRequest(text)) {
      setInput('');
      await buildActionPlan(userMessage);
      return;
    }
    if (!showDescriptionBuilder && /\b(?:help|build|write|create|improve|draft)\b.*\b(?:description|blurb)\b/i.test(text)) {
      setInput('');
      setMessages(current => [...current, userMessage]);
      startDescriptionBuilder();
      return;
    }
    if (/\b(?:improve|review|optimise|optimize|fix|build)\b.*\b(?:metadata|discoverability|book details)\b/i.test(text)) {
      setInput('');
      await buildMetadataPlan(userMessage);
      return;
    }
    if (!showPricingCoach && /\b(?:price|pricing|royalt|earnings)\b/i.test(text) && /\b(?:help|coach|compare|choose|recommend|scenario)\b/i.test(text)) {
      setInput('');
      setMessages(current => [...current, userMessage]);
      startPricingCoach();
      return;
    }
    if (!showDistributionAdvisor && /\b(?:distribution|wide|exclusive|exclusivity|retailers|libraries)\b/i.test(text) && /\b(?:help|choose|decide|compare|strategy)\b/i.test(text)) {
      setInput('');
      setMessages(current => [...current, userMessage]);
      startDistributionAdvisor();
      return;
    }
    if (!showMatterGenerator && /\b(?:copyright|dedication|biography|bio|acknowledgements|also.by|reader call|reading.group|front matter|back matter)\b/i.test(text) && /\b(?:write|create|draft|generate|help)\b/i.test(text)) {
      setInput('');
      setMessages(current => [...current, userMessage]);
      startMatterGenerator();
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
    if (/^(?:next|what(?:'s| is) next|continue|what should i do (?:now|next))\??$/i.test(text)) {
      const next = workflowContext.nextAction;
      const actions = next?.kind === 'fix' && next.field
        ? [{ type: 'wizard', label: `Go to ${next.label}`, value: next.field }]
        : next?.kind === 'continue'
          ? [{ type: 'wizard_next', label: `Continue to ${next.label}`, value: 'continue' }]
          : [];
      const replyText = next?.kind === 'fix'
        ? `Next, ${next.message || `complete ${next.label}`}`
        : next?.kind === 'continue'
          ? `This step is ready. Continue to **${next.label}**.`
          : 'Your publishing details are ready for final review. Check the readiness list, then confirm your release plan.';
      const nextMessage = newMessage('assistant', replyText, { kind: 'next-guidance', actions });
      setInput('');
      setMessages(current => [...current, userMessage, nextMessage]);
      setTypingMessageId(nextMessage.id);
      return;
    }
    const history = [...messages, userMessage];
    setInput('');
    setPending(true);
    setMessages(current => [...current, userMessage]);

    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
      message: text,
      history,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: {
        section: 'publishing',
        label: 'Publishing upload wizard',
        hint: `The author is completing the ${workflowContext.stepLabel} step.`,
      },
      workflowContext: { ...workflowContext, aiWorkMode },
    });
    agentSessionResetRef.current = false;

    const approvedSuggestions = aiWorkMode
      ? (reply.fieldSuggestions || []).filter(suggestion => suggestion.approved)
      : [];
    const appliedSuggestions = approvedSuggestions.filter(suggestion => applyFieldSuggestion(suggestion));
    const appliedLabel = appliedSuggestions[0]
      ? workflowContext.activeField?.label || appliedSuggestions[0].field
      : '';
    const navigationApproval = aiWorkMode && /^(?:yes|yes please|proceed|continue|go ahead|take me there|do it)[.!]?$/i.test(text);
    const navigationAction = navigationApproval
      ? (reply.actions || []).find(action => action.type === 'wizard_step' || action.type === 'wizard_next')
      : null;
    if (navigationAction?.type === 'wizard_step') followWizardStep(navigationAction.value);
    if (navigationAction?.type === 'wizard_next') onContinue?.();
    const confirmations = [
      appliedLabel ? `✓ Applied to **${appliedLabel}**.` : '',
      navigationAction ? `✓ Opened **${navigationAction.label.replace(/^Go to |^Continue to /, '')}**.` : '',
    ].filter(Boolean);
    const assistantText = confirmations.length ? `${reply.text}\n\n${confirmations.join('\n')}` : reply.text;
    const assistantMessage = newMessage('assistant', assistantText, { ...reply, text: assistantText });
    setTypingMessageId(assistantMessage.id);
    setMessages(current => [...current, assistantMessage]);
    setPending(false);
  }

  async function sendSelectionRewrite(selection) {
    if (!selection?.field || !selection?.original || pending) return;
    const selectedField = {
      ...workflowContext.activeField,
      id: selection.field,
      label: selection.label,
      purpose: selection.purpose || workflowContext.activeField?.purpose || '',
      value: selection.sourceValue,
      maxLength: selection.maxLength || (workflowContext.activeField?.id === selection.field ? workflowContext.activeField.maxLength : null),
      selection,
    };
    const text = `Improve the selected text in my ${selection.label}.`;
    const userMessage = newMessage('user', text, { kind: 'selection-request', selection: { field: selection.field, label: selection.label, text: selection.text } });
    const history = [...messages, userMessage];
    setInput('');
    setPending(true);
    setMessages(current => [...current, userMessage]);

    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
      message: text,
      history,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: {
        section: 'publishing',
        label: 'Publishing upload wizard',
        hint: `The author selected wording in ${selection.label} and asked Alex to improve only that passage.`,
      },
      workflowContext: { ...workflowContext, aiWorkMode, activeField: selectedField },
      requestType: 'selection_rewrite',
    });
    agentSessionResetRef.current = false;
    const selectionReplacement = reply.selectionReplacement
      ? { ...reply.selectionReplacement, label: selection.label, selection }
      : null;
    const assistantMessage = newMessage('assistant', reply.text, { ...reply, selectionReplacement });
    setTypingMessageId(assistantMessage.id);
    setMessages(current => [...current, assistantMessage]);
    setPending(false);
  }

  async function sendSelectionTask(text, userMessage, selection) {
    if (!selection?.field || !selection?.original || pending) return;
    const selectedField = {
      ...workflowContext.activeField,
      id: selection.field,
      label: selection.label,
      purpose: selection.purpose || workflowContext.activeField?.purpose || '',
      value: selection.sourceValue,
      maxLength: selection.maxLength || (workflowContext.activeField?.id === selection.field ? workflowContext.activeField.maxLength : null),
      selection,
    };
    const history = [...messages, userMessage];
    setInput('');
    setPending(true);
    setMessages(current => [...current, userMessage]);

    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
      message: text,
      history,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: {
        section: 'publishing',
        label: 'Publishing upload wizard',
        hint: `The author selected wording in ${selection.label}. Answer the author’s stated task about that passage; do not assume they want a rewrite.`,
      },
      workflowContext: { ...workflowContext, aiWorkMode, activeField: selectedField },
      requestType: 'selection_task',
    });
    agentSessionResetRef.current = false;
    const selectionReplacement = reply.selectionReplacement
      ? { ...reply.selectionReplacement, label: selection.label, selection }
      : null;
    const assistantMessage = newMessage('assistant', reply.text, { ...reply, selectionReplacement });
    setTypingMessageId(assistantMessage.id);
    setMessages(current => [...current, assistantMessage]);
    setPending(false);
  }

  function clearSelectedTextContext() {
    setSelectedTextContext(null);
    onClearSelection?.();
  }

  function clearMessages() {
    setMessages([]);
    setInput('');
    setInsertedSuggestions(new Set());
    setDismissedSuggestions(new Set());
    setAppliedSelectionReplacements(new Set());
    setDismissedSelectionReplacements(new Set());
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
    setLastAppliedChange(null);
    setActionPlan(null);
    clearSelectedTextContext();
    saveAssistantPlan({ draftKey: workflowContext.draftKey || 'new', plan: null })
      .catch(error => console.error('[publishing assistant] plan reset failed:', error?.message || error));
    proactiveRequestRef.current += 1;
    proactiveReviewedRef.current = new Set();
    if (typeof window !== 'undefined') {
      const nextSessionId = crypto.randomUUID();
      agentSessionIdRef.current = nextSessionId;
      agentSessionPromiseRef.current = null;
      agentSessionNeedsCreateRef.current = true;
      agentSessionResetRef.current = true;
      window.sessionStorage.setItem(`${storageKey}_agent_session`, nextSessionId);
      window.sessionStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(`${storageKey}_reviewed`);
      window.sessionStorage.removeItem(`${storageKey}_action_plan`);
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
    applyFieldSuggestion(suggestion);
  }

  function selectionReplacementKey(proposal) {
    return `${proposal.field}:${proposal.start}:${proposal.end}:${proposal.original}:${proposal.replacement}`;
  }

  function applySelectionReplacement(proposal) {
    const result = onReplaceSelection?.(proposal);
    if (!result?.applied) {
      const notice = newMessage('assistant', result?.error || 'I could not apply that selected-text edit. Please select the passage again and try once more.', { kind: 'selection-apply-error' });
      setTypingMessageId(notice.id);
      setMessages(current => [...current, notice]);
      return;
    }
    const key = selectionReplacementKey(proposal);
    setAppliedSelectionReplacements(current => new Set([...current, key]));
    setSelectedTextContext(current => current?.field === proposal.field ? null : current);
    setLastAppliedChange({
      field: proposal.field,
      label: `selected text in ${result.label || proposal.label || proposal.field}`,
      previousValue: result.previousValue,
      appliedValue: result.appliedValue,
      approvalId: null,
    });
    const confirmation = newMessage('assistant', `✓ Updated the selected text in **${result.label || proposal.label || proposal.field}**.`, { kind: 'selection-applied' });
    setTypingMessageId(confirmation.id);
    setMessages(current => [...current, confirmation]);
  }

  function redoSelectionReplacement(proposal) {
    setDismissedSelectionReplacements(current => new Set([...current, selectionReplacementKey(proposal)]));
    sendSelectionRewrite(proposal.selection);
  }

  function rejectSelectionReplacement(proposal) {
    setDismissedSelectionReplacements(current => new Set([...current, selectionReplacementKey(proposal)]));
  }

  function rejectSuggestion(suggestionKey, suggestion = null) {
    setDismissedSuggestions(current => new Set([...current, suggestionKey]));
    reportAssistantAction({ approvalId: suggestion?.approvalId, outcome: 'rejected' })
      .catch(error => console.error('[publishing assistant] rejection receipt failed:', error?.message || error));
  }

  function redoSuggestion(suggestion, suggestionKey) {
    rejectSuggestion(suggestionKey, suggestion);
    sendMessage(`Give me another version for the ${workflowContext.activeField?.label || suggestion.field}. Keep the established book facts, but make the wording meaningfully different.`);
  }

  function applyFieldSuggestion(suggestion) {
    const active = workflowContext.activeField;
    const destination = workflowContext.wizardNavigation?.find(item => item.field === suggestion?.field);
    if (!suggestion?.field || (!destination && suggestion.field !== active?.id)) return false;
    const detailKey = suggestion.field === 'genreSecondary' ? 'secondaryGenre' : suggestion.field;
    const rawPreviousValue = suggestion.field === active?.id ? active.value : workflowContext.bookDetails?.[detailKey];
    const previousValue = Array.isArray(rawPreviousValue) ? rawPreviousValue.join('\n') : String(rawPreviousValue || '');
    if (!onInsertSuggestion?.(suggestion)) return false;
    setInsertedSuggestions(current => new Set([...current, `${suggestion.field}:${suggestion.value}`]));
    setLastAppliedChange({
      field: suggestion.field,
      label: suggestion.label?.replace(/^Use\s+/i, '') || destination?.label || active?.label || suggestion.field,
      previousValue,
      appliedValue: suggestion.value,
      approvalId: suggestion.approvalId || null,
    });
    reportAssistantAction({ approvalId: suggestion.approvalId, outcome: 'applied', appliedValue: suggestion.value, previousValue })
      .catch(error => console.error('[publishing assistant] action receipt failed:', error?.message || error));
    return true;
  }

  function undoLastChange() {
    if (!lastAppliedChange) return;
    if (!onInsertSuggestion?.({
      field: lastAppliedChange.field,
      value: lastAppliedChange.previousValue,
      label: `Restore ${lastAppliedChange.label}`,
    })) return;
    reportAssistantAction({
      approvalId: lastAppliedChange.approvalId,
      outcome: 'undone',
      appliedValue: lastAppliedChange.appliedValue,
      previousValue: lastAppliedChange.previousValue,
    }).catch(error => console.error('[publishing assistant] undo receipt failed:', error?.message || error));
    const confirmation = newMessage('assistant', `Undone. **${lastAppliedChange.label}** has been restored to its previous value.`, { kind: 'action-confirmation' });
    setInsertedSuggestions(new Set());
    reopenPlanStepForField(lastAppliedChange.field);
    setLastAppliedChange(null);
    setTypingMessageId(confirmation.id);
    setMessages(current => [...current, confirmation]);
  }

  function saveActionPlan(plan) {
    setActionPlan(plan);
    saveAssistantPlan({ draftKey: workflowContext.draftKey || 'new', plan })
      .catch(error => console.error('[publishing assistant] plan save failed:', error?.message || error));
  }

  function openActionPlanStep(step) {
    if (!actionPlan) return;
    const updated = updatePublishingActionPlan(actionPlan, step.id, 'in_progress');
    if (updated) saveActionPlan(updated);
    if (step.field) followWizardAction(step.field);
    else if (step.step) followWizardStep(step.step);
  }

  function askAboutActionPlanStep(step) {
    sendMessage(`I’m working through my publishing plan. Help me complete ${step.title}. ${step.detail}`);
  }

  function completeActionPlanStep(step) {
    if (!actionPlan) return;
    const updated = updatePublishingActionPlan(actionPlan, step.id, 'completed');
    if (!updated) return;
    saveActionPlan(updated);
    const next = updated.steps.find(item => item.status === 'current' || item.status === 'in_progress');
    const confirmation = newMessage('assistant', next
      ? `✓ **${step.title}** marked complete. Next: **${next.title}**.`
      : '✓ Your publishing plan is complete. You’re ready for a final review of the remaining publishing details.', { kind: 'action-plan-progress', actionPlan: updated });
    setTypingMessageId(confirmation.id);
    setMessages(current => [...current, confirmation]);
  }

  function reopenPlanStepForField(field) {
    const completed = actionPlan?.steps.find(step => step.field === field && step.status === 'completed');
    if (!completed) return;
    const updated = updatePublishingActionPlan(actionPlan, completed.id, 'current');
    if (updated) saveActionPlan(updated);
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

  function followWizardStep(stepValue) {
    const destination = workflowContext.wizardSteps?.find(item => String(item.step) === String(stepValue));
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
    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
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
    agentSessionResetRef.current = false;
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
    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
      message: 'Review my established book facts and suggest grounded publishing metadata.',
      requestType: 'metadata_intelligence',
      history: messages,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Metadata intelligence', hint: 'Separate author-confirmed facts from AI-inferred recommendations.' },
      workflowContext,
    });
    agentSessionResetRef.current = false;
    setMetadataAnalysis(reply.metadataAnalysis);
    if (!reply.metadataAnalysis) setMetadataError('I could not produce reliable suggestions from the available facts. Add more detail to the description and try again.');
    setPending(false);
  }

  async function buildMetadataPlan(userMessage) {
    setMessages(current => [...current, userMessage]);
    if (!workflowContext.bookDetails?.title?.trim() || (workflowContext.bookDetails?.description || '').trim().length < 80) {
      const missing = newMessage('assistant', 'Before I build a metadata plan, add a title and a meaningful description. Those facts keep the recommendations specific and prevent me from inventing details.');
      setTypingMessageId(missing.id);
      setMessages(current => [...current, missing]);
      return;
    }
    setPending(true);
    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
      message: 'Build a grounded multi-field metadata improvement plan for my approval.',
      requestType: 'metadata_plan',
      history: [...messages, userMessage],
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Metadata action plan', hint: 'Prepare separate safe changes for author review.' },
      workflowContext: { ...workflowContext, aiWorkMode },
    });
    agentSessionResetRef.current = false;
    const plan = newMessage('assistant', reply.fieldSuggestions?.length
      ? `I prepared ${reply.fieldSuggestions.length} grounded metadata changes. Review them individually or apply all safe changes.`
      : reply.text, { ...reply, kind: 'metadata-plan' });
    setTypingMessageId(plan.id);
    setMessages(current => [...current, plan]);
    setPending(false);
  }

  async function buildActionPlan(userMessage) {
    setMessages(current => [...current, userMessage]);
    setPending(true);
    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
      message: userMessage.text,
      requestType: 'action_plan',
      history: [...messages, userMessage],
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Publishing action plan', hint: 'Build a concise, approval-first plan from the author’s actual readiness state.' },
      workflowContext: { ...workflowContext, aiWorkMode },
    });
    agentSessionResetRef.current = false;
    if (reply.actionPlan) setActionPlan(reply.actionPlan);
    const response = newMessage('assistant', reply.text, { ...reply, kind: 'action-plan', actionPlan: reply.actionPlan });
    setTypingMessageId(response.id);
    setMessages(current => [...current, response]);
    setPending(false);
  }

  function applyAllSuggestions(suggestions) {
    suggestions
      .filter(suggestion => !dismissedSuggestions.has(`${suggestion.field}:${suggestion.value}`))
      .forEach(suggestion => applyFieldSuggestion(suggestion));
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
    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
      message: `My pricing objective is: ${choice.label}. Explain the trade-offs in the calculated scenarios.`,
      requestType: 'pricing_coach',
      history: [...messages, userMessage],
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Pricing coach', hint: 'Explain deterministic royalty scenarios without promising sales.' },
      workflowContext: { ...workflowContext, pricingCoach: { objective: choice.value, objectiveLabel: choice.label, scenarios } },
    });
    agentSessionResetRef.current = false;
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
    await ensureAgentSession();
    const reply = await requestAssistantReply({
      sessionId: agentSessionIdRef.current,
      resetSession: agentSessionResetRef.current,
      message: `Create an editable ${option.label} draft from my answer.`,
      requestType: 'matter_generator',
      history: [...messages, userMessage],
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Front and back matter generator', hint: 'Generate one editable, fact-grounded matter section.' },
      workflowContext: { ...workflowContext, matterRequest: { type: matterType, authorAnswer: answer } },
    });
    agentSessionResetRef.current = false;
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
    <div className={`publishing-assistant${open ? ' publishing-assistant--open' : ''}${collapsed ? ' publishing-assistant--collapsed' : ''}${open && maximized ? ' publishing-assistant--maximized' : ''}${darkMode ? ' publishing-assistant--dark' : ''}`}>
      {open && (
        <aside ref={panelRef} className="publishing-assistant-panel" role="dialog" aria-modal="false" aria-label="Publishing assistant">
          <aside className="publishing-assistant-max-sidebar publishing-assistant-max-sidebar--left" aria-label="Publishing context">
            <div className="publishing-assistant-max-sidebar-heading"><ChatAvatar variant="alex" /><span><strong>Alex</strong><small>Your publishing guide</small></span></div>
            <span className="publishing-assistant-max-eyebrow">Current position</span>
            <div className="publishing-assistant-max-current-step"><b>{workflowContext.stepNumber || '•'}</b><span><strong>{workflowContext.stepLabel}</strong><small>{workflowContext.activeField?.label ? `Working on ${workflowContext.activeField.label}` : 'Publishing workflow'}</small></span></div>
            <nav>
              <button type="button" onClick={() => sendMessage('What should I do next?')}><span aria-hidden="true">→</span><span><strong>Continue publishing</strong><small>Get the next useful action</small></span></button>
              <button type="button" onClick={() => sendMessage('Help me with this field')}><span aria-hidden="true">?</span><span><strong>Help with this field</strong><small>Explain what readers need</small></span></button>
              <button type="button" onClick={() => sendMessage('Review my publishing readiness and tell me the most important next action')}><span aria-hidden="true">✓</span><span><strong>Check readiness</strong><small>Review missing details</small></span></button>
            </nav>
          </aside>
          <header onTouchStart={startDrag} onTouchEnd={endDrag} onClick={expandFromHeader}>
            <div>
              <ChatAvatar variant="alex" />
              <span>
                <strong>Alex</strong>
              </span>
            </div>
            <nav aria-label="Chat controls">
              <button type="button" className="publishing-assistant-collapse" onClick={() => setCollapsed(true)} aria-label="Collapse assistant" title="Collapse assistant">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              <details className="publishing-assistant-overflow">
                <summary aria-label="More chat options" title="More options">⋮</summary>
                <div role="menu">
                  <button type="button" role="menuitem" onClick={clearMessages}><span aria-hidden="true">＋</span>New conversation</button>
                  <button type="button" role="menuitem" onClick={() => setDarkMode(value => !value)}><span aria-hidden="true">◐</span>{darkMode ? 'Light mode' : 'Dark mode'}</button>
                  <button type="button" role="menuitem" onClick={() => setAiWorkMode(value => !value)}><span aria-hidden="true">✦</span>{aiWorkMode ? 'Turn off AI work mode' : 'Turn on AI work mode'}</button>
                  {lastAppliedChange && <button type="button" role="menuitem" onClick={undoLastChange}><span aria-hidden="true">↶</span>Undo last change</button>}
                  <button type="button" role="menuitem" onClick={() => { setCollapsed(false); setMaximized(value => !value); }}><span aria-hidden="true">↗</span>{maximized ? 'Restore window' : 'Expand window'}</button>
                </div>
              </details>
              <button type="button" onClick={() => { setOpen(false); setCollapsed(false); setMaximized(false); }} aria-label="Close assistant">×</button>
            </nav>
          </header>

          {aiWorkMode && <div className="publishing-assistant-conversation-mode"><span aria-hidden="true">✦</span><span><strong>AI work mode</strong><small>Alex can apply changes after you approve them.</small></span>{lastAppliedChange && <button type="button" onClick={undoLastChange}>Undo</button>}</div>}

          {showMetadataIntelligence ? (
            <section className="publishing-assistant-metadata">
              <div className="publishing-assistant-builder-heading"><span>◎</span><div><strong>Metadata intelligence</strong><small>Confirmed facts stay separate from AI recommendations.</small></div></div>
              {!metadataAnalysis ? <>
                <div className="publishing-assistant-metadata-note"><strong>Before the review</strong><p>Alex uses your title, description, current genres, audience, and keywords. Alex does not read or send your manuscript.</p></div>
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
                <ChatAvatar variant={message.role === 'assistant' ? 'alex' : 'user'} name={supportContact.name || supportContact.email || 'You'} photoUrl={supportContact.photoUrl || ''} className="publishing-assistant-message-avatar" />
                {message.kind === 'proactive-guidance' && <small className="publishing-assistant-guidance-label">Suggestion</small>}
                {message.kind === 'description-builder-question' && <small className="publishing-assistant-guidance-label">Description builder</small>}
                {message.role === 'assistant' ? (
                  typingMessageId === message.id ? <p>
                    <TypewriterText
                      text={message.text}
                      animate
                      onComplete={() => setTypingMessageId(current => current === message.id ? '' : current)}
                    />
                  </p> : <PublishingMessageContent text={message.text} />
                ) : <p>{message.text}</p>}
                {typingMessageId !== message.id && message.pricingScenarios?.length > 0 && <PricingScenarios scenarios={message.pricingScenarios} />}
                {typingMessageId !== message.id && message.matterDraft && (
                  <div className="publishing-assistant-matter-draft">
                    <div><strong>{message.matterDraft.label}</strong>{message.matterDraft.legalTemplate && <span>Legal template · author review required</span>}</div>
                    <pre>{message.matterDraft.content}</pre>
                    <button type="button" onClick={() => insertMatterDraft(message.matterDraft)} disabled={insertedMatter === `${message.matterDraft.section}:${message.matterDraft.key}`}>{insertedMatter === `${message.matterDraft.section}:${message.matterDraft.key}` ? 'Inserted ✓' : `Insert into ${message.matterDraft.label}`}</button>
                  </div>
                )}
                {typingMessageId !== message.id && message.actionPlan && (
                  <PublishingActionPlan
                    plan={actionPlan?.id === message.actionPlan.id ? actionPlan : message.actionPlan}
                    onOpen={openActionPlanStep}
                    onAsk={askAboutActionPlanStep}
                    onComplete={completeActionPlanStep}
                  />
                )}
                {typingMessageId !== message.id && message.selectionReplacement && (
                  <SelectionReplacement
                    proposal={message.selectionReplacement}
                    applied={appliedSelectionReplacements.has(selectionReplacementKey(message.selectionReplacement))}
                    dismissed={dismissedSelectionReplacements.has(selectionReplacementKey(message.selectionReplacement))}
                    onApply={applySelectionReplacement}
                    onRedo={redoSelectionReplacement}
                    onReject={rejectSelectionReplacement}
                  />
                )}
                {typingMessageId !== message.id && message.fieldSuggestions?.length > 0 && (
                  <div className="publishing-assistant-field-suggestions">
                    {message.fieldSuggestions.length > 1 && <div className="publishing-assistant-plan-summary">
                      <span><strong>{message.fieldSuggestions.length} proposed changes</strong><small>Each change remains undoable and is recorded separately.</small></span>
                      <button type="button" onClick={() => applyAllSuggestions(message.fieldSuggestions)} disabled={message.fieldSuggestions.every(suggestion => insertedSuggestions.has(`${suggestion.field}:${suggestion.value}`))}>Use all safe changes</button>
                    </div>}
                    {message.fieldSuggestions.map(suggestion => {
                      const suggestionKey = `${suggestion.field}:${suggestion.value}`;
                      if (dismissedSuggestions.has(suggestionKey)) return null;
                      const inserted = insertedSuggestions.has(suggestionKey);
                      return (
                        <div key={suggestionKey}>
                          <small>Alex’s proposed {suggestion.label?.replace(/^Use\s+/i, '') || suggestion.field}</small>
                          <span>{suggestion.value}</span>
                          <div className="publishing-assistant-proposal-actions" aria-label="Review Alex’s proposal">
                            <button type="button" className="is-approve" onClick={() => insertSuggestion(suggestion)} disabled={inserted} title="Use this wording">
                              <span aria-hidden="true">✓</span>{inserted ? 'Applied' : 'Use it'}
                            </button>
                            <button type="button" className="is-redo" onClick={() => redoSuggestion(suggestion, suggestionKey)} disabled={inserted || pending} title="Ask for another version">
                              <span aria-hidden="true">↻</span>Redo
                            </button>
                            <button type="button" className="is-reject" onClick={() => rejectSuggestion(suggestionKey, suggestion)} disabled={inserted} title="Reject this wording" aria-label="Reject this wording">
                              <span aria-hidden="true">×</span>Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {typingMessageId !== message.id && message.actions?.filter(action => ['wizard', 'wizard_step', 'wizard_next', 'health_detail', 'ask', 'pricing_objective', 'matter_type', 'distribution_priority', 'distribution_strategy'].includes(action.type) && !isHumanSupportIntent(action.value)).length > 0 && (
                  <div className="publishing-assistant-suggestions">
                    {message.actions.filter(action => ['wizard', 'wizard_step', 'wizard_next', 'health_detail', 'ask', 'pricing_objective', 'matter_type', 'distribution_priority', 'distribution_strategy'].includes(action.type) && !isHumanSupportIntent(action.value)).map(action => (
                      <button key={`${action.type}:${action.value}`} className={action.type === 'wizard' || action.type === 'wizard_step' || action.type === 'wizard_next' || action.type === 'health_detail' || action.type === 'distribution_strategy' ? 'is-wizard-link' : undefined} type="button" onClick={() => action.type === 'wizard' ? followWizardAction(action.value) : action.type === 'wizard_step' ? followWizardStep(action.value) : action.type === 'wizard_next' ? onContinue?.() : action.type === 'health_detail' ? onOpenHealthDetail?.(action.value) : action.type === 'pricing_objective' ? choosePricingObjective(action.value) : action.type === 'matter_type' ? chooseMatterType(action.value) : action.type === 'distribution_priority' ? chooseDistributionPriority(action.value) : action.type === 'distribution_strategy' ? applyDistributionStrategy(action.value) : sendMessage(getAssistantActionMessage(action))}>
                        {(action.type === 'wizard' || action.type === 'wizard_step' || action.type === 'wizard_next' || action.type === 'health_detail') && <span aria-hidden="true">↗</span>}{action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pending && <div className="publishing-assistant-thinking" aria-label="Alex is thinking"><i /><i /><i /></div>}
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

          {!humanFlow && !showReadiness && !showMetadataIntelligence && activeTextSelection && (
            <div className="publishing-assistant-selection-context">
              <span>
                <b>Selected in {activeTextSelection.label}</b>
                <small>“{String(activeTextSelection.text || '').replace(/\s+/g, ' ').trim().slice(0, 72)}{String(activeTextSelection.text || '').trim().length > 72 ? '…' : ''}” · Tell Alex what you want to do with it.</small>
              </span>
              <button type="button" onClick={clearSelectedTextContext} aria-label="Remove selected text context">×</button>
            </div>
          )}
          {!humanFlow && !showReadiness && !showMetadataIntelligence && <form className="publishing-assistant-composer" onSubmit={event => { event.preventDefault(); sendMessage(input); }}>
            <input
              ref={composerInputRef}
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={activeTextSelection ? 'What would you like Alex to do with this text?' : showDescriptionBuilder || (showMatterGenerator && matterType) ? 'Type your answer…' : showPricingCoach ? 'Choose an objective or type it…' : showDistributionAdvisor ? 'Choose a priority or type it…' : showMatterGenerator ? 'Choose a section or type it…' : `Ask about ${workflowContext.stepLabel.toLowerCase()}…`}
              aria-label="Ask the publishing assistant"
              maxLength={600}
              disabled={pending}
            />
            <button type="submit" disabled={!input.trim() || pending} aria-label="Send message">→</button>
          </form>}
          {!showReadiness && !showMetadataIntelligence && <small className="publishing-assistant-privacy">{showDescriptionBuilder ? 'Your answers are used only to draft this description. Nothing is inserted until you approve it.' : 'Book details may be sent to AI. Manuscript files are never included.'}</small>}
          <aside className="publishing-assistant-max-sidebar publishing-assistant-max-sidebar--right" aria-label="Publishing readiness summary">
            <span className="publishing-assistant-max-eyebrow">Publishing readiness</span>
            {readiness ? <>
              <div className="publishing-assistant-max-score"><strong>{readiness.score}</strong><span><b>{readiness.complete} of {readiness.total}</b><small>checks complete</small></span></div>
              <div className="publishing-assistant-max-issues">
                {readinessIssues.slice(0, 5).map(item => <button key={item.id || item.label} type="button" onClick={() => onNavigateReadiness?.(item)}><span className={`is-${item.status}`}>{item.status === 'blocker' ? '!' : '•'}</span><span><strong>{item.label}</strong><small>{item.message || item.detail}</small></span><i aria-hidden="true">→</i></button>)}
                {!readinessIssues.length && <p>Your essential publishing details are complete.</p>}
              </div>
              <button type="button" className="publishing-assistant-max-review" onClick={() => sendMessage('Review my publishing readiness and tell me what to fix first')}>Ask Alex what to fix first</button>
            </> : <p>Complete your book details and Alex will track what is ready and what needs attention.</p>}
            <div className="publishing-assistant-max-note"><strong>Context aware</strong><span>Alex uses the current step and the details already entered in this publishing session.</span></div>
          </aside>
        </aside>
      )}
      <button
        type="button"
        className="publishing-assistant-toggle"
        onClick={() => setOpen(value => {
          const next = !value;
          if (next) setCollapsed(false);
          else setMaximized(false);
          return next;
        })}
        aria-expanded={open}
        aria-label={open ? 'Close publishing assistant' : 'Open publishing assistant'}
      >
        {open ? '×' : <><span aria-hidden="true">✦</span> Ask Alex</>}
      </button>
    </div>
  );
}
