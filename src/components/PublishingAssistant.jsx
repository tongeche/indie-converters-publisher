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

export default function PublishingAssistant({ workflowContext, onInsertSuggestion, supportContact = {} }) {
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
  const messageListRef = useRef(null);
  const dragStartRef = useRef(null);

  useEffect(() => {
    if (!open || !messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages, open, pending]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-40)));
  }, [messages, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth > 640 || !open || collapsed) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
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
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(storageKey);
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

  return (
    <div className={`publishing-assistant${open ? ' publishing-assistant--open' : ''}${collapsed ? ' publishing-assistant--collapsed' : ''}`}>
      {open && (
        <aside className="publishing-assistant-panel" role="dialog" aria-modal="false" aria-label="Publishing assistant">
          <header onTouchStart={startDrag} onTouchEnd={endDrag} onClick={expandFromHeader}>
            <div>
              <span className="publishing-assistant-mark" aria-hidden="true">.in</span>
              <span>
                <strong>Publishing assistant</strong>
                <small>{workflowContext.activeField?.label || workflowContext.stepLabel}</small>
              </span>
            </div>
            <nav aria-label="Chat controls">
              <button type="button" onClick={clearMessages} aria-label="Clear messages" title="Clear messages">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></svg>
              </button>
              <button type="button" onClick={() => { setOpen(false); setCollapsed(false); }} aria-label="Close assistant">×</button>
            </nav>
          </header>

          <div className="publishing-assistant-messages" ref={messageListRef} aria-live="polite">
            {messages.length === 0 && (
              <div className="publishing-assistant-empty">
                <span aria-hidden="true">✦</span>
                <p>Messages cleared. Select a field or ask about this publishing step.</p>
              </div>
            )}
            {messages.map(message => (
              <div key={message.id} className={`publishing-assistant-message publishing-assistant-message--${message.role}`}>
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
          </div>

          {!humanFlow && <form className="publishing-assistant-composer" onSubmit={event => { event.preventDefault(); sendMessage(input); }}>
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
          <small className="publishing-assistant-privacy">Book details may be sent to AI. Manuscript files are never included.</small>
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
