import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createHireBrief } from '../lib/api';
import './PostBrief.css';

const IconEdit   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconBook   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconImage  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconLayout = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
const IconCheck  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="28" height="28"><polyline points="20 6 9 17 4 12"/></svg>;
const IconX      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>;

const SERVICE_TYPES = [
  { slug: 'ghostwriting',  label: 'Ghostwriting',  Icon: IconBook },
  { slug: 'editing',       label: 'Editing',       Icon: IconEdit },
  { slug: 'cover-design',  label: 'Cover Design',  Icon: IconImage },
  { slug: 'formatting',    label: 'Formatting',    Icon: IconLayout },
  { slug: 'other',         label: 'Other',         Icon: IconEdit },
];

const STEP_SERVICE     = 0;
const STEP_TITLE       = 1;
const STEP_DESCRIPTION = 2;
const STEP_BUDGET      = 3;
const STEP_NAME        = 4;
const STEP_EMAIL       = 5;
const STEP_REVIEW      = 6;
const TOTAL_STEPS      = 7;

const EMPTY_ERRORS = {};

export default function PostBrief() {
  const { user } = useAuth();

  const [step, setStep] = useState(STEP_SERVICE);
  const [form, setForm] = useState({
    serviceType:  '',
    title:        '',
    description:  '',
    budgetMin:    '',
    budgetMax:    '',
    timeline:     '',
    contactName:  '',
    contactEmail: user?.email || '',
  });
  const [errors,    setErrors]    = useState(EMPTY_ERRORS);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [done, setDone] = useState(false);

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function validateStep(s) {
    const next = {};
    if (s === STEP_SERVICE     && !form.serviceType)        next.serviceType  = 'Pick a service type';
    if (s === STEP_TITLE       && !form.title.trim())       next.title        = 'Give your project a title';
    if (s === STEP_DESCRIPTION && !form.description.trim()) next.description  = 'Describe what you need';
    if (s === STEP_NAME        && !form.contactName.trim()) next.contactName  = 'Your name is required';
    if (s === STEP_EMAIL       && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) next.contactEmail = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setErrors(EMPTY_ERRORS);
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setErrors(EMPTY_ERRORS);
    setStep(s => Math.max(s - 1, 0));
  }

  function goTo(s) {
    setErrors(EMPTY_ERRORS);
    setStep(s);
  }

  function selectService(slug) {
    setField('serviceType', slug);
    setErrors(EMPTY_ERRORS);
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleEnterAdvance(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      goNext();
    }
  }

  function handleDescriptionKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      goNext();
    }
  }

  async function handleSubmit() {
    setSubmitError('');
    setSubmitting(true);
    try {
      await createHireBrief({
        user_id:       user?.id ?? null,
        service_type:  form.serviceType,
        title:         form.title.trim(),
        description:   form.description.trim(),
        budget_min:    form.budgetMin ? Number(form.budgetMin) : null,
        budget_max:    form.budgetMax ? Number(form.budgetMax) : null,
        timeline:      form.timeline.trim() || null,
        contact_name:  form.contactName.trim(),
        contact_email: form.contactEmail.trim(),
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="pb-page">
        <div className="container pb-done">
          <div className="pb-done-icon"><IconCheck /></div>
          <h1 className="pb-done-h1">Brief received</h1>
          <p className="pb-done-sub">
            Thanks — we'll review your project and follow up by email within 2 business days.
          </p>
          <Link to="/hire" className="btn btn-primary">Back to Hire</Link>
        </div>
      </div>
    );
  }

  const serviceLabel = SERVICE_TYPES.find(s => s.slug === form.serviceType)?.label || '—';
  const budgetSummary = (form.budgetMin || form.budgetMax)
    ? `$${form.budgetMin || '0'} – $${form.budgetMax || '…'}`
    : 'Not specified';

  return (
    <div className="pb-page">
      <div className="container pb-header">
        <span className="pb-eyebrow">·· Hire Freelancer</span>
        <h1 className="pb-h1">Post a brief</h1>
      </div>

      <div className="container pb-body">
        <div className="pb-progress-track">
          <div className="pb-progress-fill" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
        </div>

        <div className="pb-step-card">
          <Link to="/hire" className="pb-close"><IconX /></Link>

          {step > 0 && (
            <button type="button" className="pb-back" onClick={goBack}>← Back</button>
          )}
          <span className="pb-step-count">{step === STEP_REVIEW ? 'Review' : `${step + 1} of ${TOTAL_STEPS}`}</span>

          <div key={step} className="pb-step-enter">

            {step === STEP_SERVICE && (
              <>
                <h2 className="pb-question">What kind of help do you need?<span className="pb-req">*</span></h2>
                <div className="pb-service-grid">
                  {SERVICE_TYPES.map(({ slug, label, Icon }) => (
                    <button
                      key={slug}
                      type="button"
                      className={`pb-service-chip ${form.serviceType === slug ? 'is-active' : ''}`}
                      onClick={() => selectService(slug)}
                    >
                      <Icon />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                {errors.serviceType && <span className="pb-error">{errors.serviceType}</span>}
              </>
            )}

            {step === STEP_TITLE && (
              <>
                <h2 className="pb-question">Give your project a title<span className="pb-req">*</span></h2>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. Copy editor for 80k-word fantasy novel"
                  value={form.title}
                  onChange={e => setField('title', e.target.value)}
                  onKeyDown={handleEnterAdvance}
                />
                {errors.title && <span className="pb-error">{errors.title}</span>}
                <button type="button" className="btn btn-primary pb-continue" onClick={goNext}>Continue</button>
              </>
            )}

            {step === STEP_DESCRIPTION && (
              <>
                <h2 className="pb-question">Describe what you need<span className="pb-req">*</span></h2>
                <p className="pb-hint">Genre, word count, and anything else that helps us find the right fit.</p>
                <textarea
                  autoFocus
                  rows={6}
                  placeholder="Type your answer here…"
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  onKeyDown={handleDescriptionKeyDown}
                />
                {errors.description && <span className="pb-error">{errors.description}</span>}
                <button type="button" className="btn btn-primary pb-continue" onClick={goNext}>Continue</button>
              </>
            )}

            {step === STEP_BUDGET && (
              <>
                <h2 className="pb-question">What's your budget and timeline? <span className="pb-opt">optional</span></h2>
                <div className="pb-row">
                  <div className="pb-field">
                    <label htmlFor="budgetMin">Budget min</label>
                    <input
                      id="budgetMin"
                      autoFocus
                      type="number"
                      min="0"
                      placeholder="$"
                      value={form.budgetMin}
                      onChange={e => setField('budgetMin', e.target.value)}
                      onKeyDown={handleEnterAdvance}
                    />
                  </div>
                  <div className="pb-field">
                    <label htmlFor="budgetMax">Budget max</label>
                    <input
                      id="budgetMax"
                      type="number"
                      min="0"
                      placeholder="$"
                      value={form.budgetMax}
                      onChange={e => setField('budgetMax', e.target.value)}
                      onKeyDown={handleEnterAdvance}
                    />
                  </div>
                  <div className="pb-field">
                    <label htmlFor="timeline">Timeline</label>
                    <input
                      id="timeline"
                      type="text"
                      placeholder="e.g. 6 weeks"
                      value={form.timeline}
                      onChange={e => setField('timeline', e.target.value)}
                      onKeyDown={handleEnterAdvance}
                    />
                  </div>
                </div>
                <button type="button" className="btn btn-primary pb-continue" onClick={goNext}>Continue</button>
              </>
            )}

            {step === STEP_NAME && (
              <>
                <h2 className="pb-question">What's your name?<span className="pb-req">*</span></h2>
                <input
                  autoFocus
                  type="text"
                  placeholder="Jane Doe"
                  value={form.contactName}
                  onChange={e => setField('contactName', e.target.value)}
                  onKeyDown={handleEnterAdvance}
                />
                {errors.contactName && <span className="pb-error">{errors.contactName}</span>}
                <button type="button" className="btn btn-primary pb-continue" onClick={goNext}>Continue</button>
              </>
            )}

            {step === STEP_EMAIL && (
              <>
                <h2 className="pb-question">Where should we reach you?<span className="pb-req">*</span></h2>
                <input
                  autoFocus
                  type="email"
                  placeholder="you@example.com"
                  value={form.contactEmail}
                  onChange={e => setField('contactEmail', e.target.value)}
                  onKeyDown={handleEnterAdvance}
                />
                {errors.contactEmail && <span className="pb-error">{errors.contactEmail}</span>}
                <button type="button" className="btn btn-primary pb-continue" onClick={goNext}>Continue</button>
              </>
            )}

            {step === STEP_REVIEW && (
              <>
                <h2 className="pb-question">Review your brief</h2>

                <div className="pb-review-list">
                  <div className="pb-review-row">
                    <div>
                      <span className="pb-review-label">Service</span>
                      <span className="pb-review-value">{serviceLabel}</span>
                    </div>
                    <button type="button" className="pb-edit-link" onClick={() => goTo(STEP_SERVICE)}>Edit</button>
                  </div>
                  <div className="pb-review-row">
                    <div>
                      <span className="pb-review-label">Project title</span>
                      <span className="pb-review-value">{form.title}</span>
                    </div>
                    <button type="button" className="pb-edit-link" onClick={() => goTo(STEP_TITLE)}>Edit</button>
                  </div>
                  <div className="pb-review-row">
                    <div>
                      <span className="pb-review-label">Description</span>
                      <span className="pb-review-value">{form.description}</span>
                    </div>
                    <button type="button" className="pb-edit-link" onClick={() => goTo(STEP_DESCRIPTION)}>Edit</button>
                  </div>
                  <div className="pb-review-row">
                    <div>
                      <span className="pb-review-label">Budget & timeline</span>
                      <span className="pb-review-value">{budgetSummary}{form.timeline ? ` · ${form.timeline}` : ''}</span>
                    </div>
                    <button type="button" className="pb-edit-link" onClick={() => goTo(STEP_BUDGET)}>Edit</button>
                  </div>
                  <div className="pb-review-row">
                    <div>
                      <span className="pb-review-label">Your name</span>
                      <span className="pb-review-value">{form.contactName}</span>
                    </div>
                    <button type="button" className="pb-edit-link" onClick={() => goTo(STEP_NAME)}>Edit</button>
                  </div>
                  <div className="pb-review-row">
                    <div>
                      <span className="pb-review-label">Contact email</span>
                      <span className="pb-review-value">{form.contactEmail}</span>
                    </div>
                    <button type="button" className="pb-edit-link" onClick={() => goTo(STEP_EMAIL)}>Edit</button>
                  </div>
                </div>

                {submitError && <div className="pb-submit-error">{submitError}</div>}

                <button type="button" className="btn btn-primary pb-continue" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? 'Submitting…' : 'Submit brief'}
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
