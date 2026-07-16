import { useEffect, useRef, useState } from 'react';
import { isHumanSupportIntent, requestAssistantReply } from '../lib/assistant';
import { submitAssistantHandoff } from '../lib/api';
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

export default function PublishingAssistant({ workflowContext, onInsertSuggestion, onNavigateReadiness, supportContact = {} }) {
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
  const [descriptionBuilderError, setDescriptionBuilderError] = useState('');
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
    if (!open || collapsed || pending || humanFlow || showReadiness || showDescriptionBuilder || input.trim()) return undefined;
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
  }, [collapsed, humanFlow, input, messages, open, pending, showDescriptionBuilder, showReadiness, storageKey, workflowContext]);

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

  async function buildDescription(event) {
    event.preventDefault();
    const required = ['premise', 'subject', 'conflict'];
    if (required.some(field => descriptionBrief[field].trim().length < 12)) {
      setDescriptionBuilderError('Add a little more detail to the first three answers.');
      return;
    }
    setDescriptionBuilderError('');
    setPending(true);
    const reply = await requestAssistantReply({
      message: 'Create my guided book description from the completed brief.',
      requestType: 'description_builder',
      history: messages,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '/upload',
      pageContext: { section: 'publishing', label: 'Guided description builder', hint: 'The author completed a structured factual brief.' },
      workflowContext: {
        ...workflowContext,
        activeField: { id: 'description', label: 'Description', purpose: 'Reader-facing book description', value: workflowContext.bookDetails?.description || '', required: true, maxLength: 4000 },
        descriptionBrief,
      },
    });
    const result = newMessage('assistant', reply.text, { ...reply, kind: 'description-builder' });
    setTypingMessageId(result.id);
    setMessages(current => [...current, result]);
    setPending(false);
    setShowDescriptionBuilder(false);
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

          {workflowContext.stepNumber === 2 && !showDescriptionBuilder && !showReadiness && (
            <button type="button" className="publishing-assistant-description-trigger" onClick={() => setShowDescriptionBuilder(true)}>
              <span aria-hidden="true">✦</span><span><strong>Build my description</strong><small>Answer 4 short questions</small></span><em>Start →</em>
            </button>
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
          ) : showDescriptionBuilder ? (
            <form className="publishing-assistant-description-builder" onSubmit={buildDescription}>
              <div className="publishing-assistant-builder-heading"><span>✦</span><div><strong>Guided description builder</strong><small>Use facts from your book. Indie will shape the wording.</small></div></div>
              <label><span>1. What is the book about?</span><textarea rows="2" value={descriptionBrief.premise} onChange={event => setDescriptionBrief(current => ({ ...current, premise: event.target.value }))} maxLength="700" placeholder="Summarise the premise or main idea…" autoFocus /></label>
              <label><span>2. Who or what is at its centre?</span><textarea rows="2" value={descriptionBrief.subject} onChange={event => setDescriptionBrief(current => ({ ...current, subject: event.target.value }))} maxLength="500" placeholder="The protagonist, subject, or reader problem…" /></label>
              <label><span>3. What is the central conflict or value?</span><textarea rows="2" value={descriptionBrief.conflict} onChange={event => setDescriptionBrief(current => ({ ...current, conflict: event.target.value }))} maxLength="500" placeholder="The stakes, challenge, transformation, or takeaway…" /></label>
              <label><span>4. What should make readers choose it? <em>Optional</em></span><textarea rows="2" value={descriptionBrief.appeal} onChange={event => setDescriptionBrief(current => ({ ...current, appeal: event.target.value }))} maxLength="400" placeholder="A distinctive angle, experience, or promise…" /></label>
              <label><span>Tone</span><select value={descriptionBrief.tone} onChange={event => setDescriptionBrief(current => ({ ...current, tone: event.target.value }))}><option value="warm and compelling">Warm and compelling</option><option value="intriguing and atmospheric">Intriguing and atmospheric</option><option value="clear and authoritative">Clear and authoritative</option><option value="energetic and direct">Energetic and direct</option><option value="reflective and literary">Reflective and literary</option></select></label>
              {descriptionBuilderError && <p role="alert">{descriptionBuilderError}</p>}
              <div><button type="submit" disabled={pending}>{pending ? 'Writing…' : 'Create description'}</button><button type="button" onClick={() => setShowDescriptionBuilder(false)}>Cancel</button></div>
              <small>Nothing is inserted until you approve it.</small>
            </form>
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
                <p>
                  {message.role === 'assistant' ? (
                    <TypewriterText
                      text={message.text}
                      animate={typingMessageId === message.id}
                      onComplete={() => setTypingMessageId(current => current === message.id ? '' : current)}
                    />
                  ) : message.text}
                </p>
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
                {typingMessageId !== message.id && message.actions?.filter(action => action.type === 'ask' && !isHumanSupportIntent(action.value)).length > 0 && (
                  <div className="publishing-assistant-suggestions">
                    {message.actions.filter(action => action.type === 'ask' && !isHumanSupportIntent(action.value)).map(action => (
                      <button key={action.value} type="button" onClick={() => sendMessage(action.value)}>{action.label}</button>
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

          {!humanFlow && !showReadiness && !showDescriptionBuilder && <form className="publishing-assistant-composer" onSubmit={event => { event.preventDefault(); sendMessage(input); }}>
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={`Ask about ${workflowContext.stepLabel.toLowerCase()}…`}
              aria-label="Ask the publishing assistant"
              maxLength={600}
              disabled={pending}
            />
            <button type="submit" disabled={!input.trim() || pending} aria-label="Send message">→</button>
          </form>}
          {!showReadiness && !showDescriptionBuilder && <small className="publishing-assistant-privacy">Book details may be sent to AI. Manuscript files are never included.</small>}
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
