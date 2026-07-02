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

const SERVICE_TYPES = [
  { slug: 'ghostwriting',  label: 'Ghostwriting',  Icon: IconBook },
  { slug: 'editing',       label: 'Editing',       Icon: IconEdit },
  { slug: 'cover-design',  label: 'Cover Design',  Icon: IconImage },
  { slug: 'formatting',    label: 'Formatting',    Icon: IconLayout },
  { slug: 'other',         label: 'Other',         Icon: IconEdit },
];

const EMPTY_ERRORS = {};

export default function PostBrief() {
  const { user } = useAuth();

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

  function validate() {
    const next = {};
    if (!form.serviceType)         next.serviceType  = 'Pick a service type';
    if (!form.title.trim())        next.title        = 'Give your project a title';
    if (!form.description.trim())  next.description  = 'Describe what you need';
    if (!form.contactName.trim())  next.contactName   = 'Your name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.contactEmail)) next.contactEmail = 'Enter a valid email';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

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

  return (
    <div className="pb-page">
      <div className="container pb-header">
        <span className="pb-eyebrow">·· Hire Freelancer</span>
        <h1 className="pb-h1">Post a brief</h1>
        <p className="pb-sub">Tell us about your project. We'll follow up by email with next steps.</p>
      </div>

      <div className="container pb-body">
        <form className="pb-form" onSubmit={handleSubmit} noValidate>

          <div className="pb-field">
            <label>Service type<span className="pb-req">*</span></label>
            <div className="pb-service-grid">
              {SERVICE_TYPES.map(({ slug, label, Icon }) => (
                <button
                  key={slug}
                  type="button"
                  className={`pb-service-chip ${form.serviceType === slug ? 'is-active' : ''}`}
                  onClick={() => setField('serviceType', slug)}
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {errors.serviceType && <span className="pb-error">{errors.serviceType}</span>}
          </div>

          <div className="pb-field">
            <label htmlFor="title">Project title<span className="pb-req">*</span></label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Copy editor for 80k-word fantasy novel"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
            />
            {errors.title && <span className="pb-error">{errors.title}</span>}
          </div>

          <div className="pb-field">
            <label htmlFor="description">Description<span className="pb-req">*</span></label>
            <textarea
              id="description"
              rows={6}
              placeholder="Genre, word count, what you need done, and anything else that helps us find the right fit."
              value={form.description}
              onChange={e => setField('description', e.target.value)}
            />
            {errors.description && <span className="pb-error">{errors.description}</span>}
          </div>

          <div className="pb-row">
            <div className="pb-field">
              <label htmlFor="budgetMin">Budget min <span className="pb-opt">optional</span></label>
              <input
                id="budgetMin"
                type="number"
                min="0"
                placeholder="$"
                value={form.budgetMin}
                onChange={e => setField('budgetMin', e.target.value)}
              />
            </div>
            <div className="pb-field">
              <label htmlFor="budgetMax">Budget max <span className="pb-opt">optional</span></label>
              <input
                id="budgetMax"
                type="number"
                min="0"
                placeholder="$"
                value={form.budgetMax}
                onChange={e => setField('budgetMax', e.target.value)}
              />
            </div>
            <div className="pb-field">
              <label htmlFor="timeline">Timeline <span className="pb-opt">optional</span></label>
              <input
                id="timeline"
                type="text"
                placeholder="e.g. 6 weeks"
                value={form.timeline}
                onChange={e => setField('timeline', e.target.value)}
              />
            </div>
          </div>

          <div className="pb-row">
            <div className="pb-field">
              <label htmlFor="contactName">Your name<span className="pb-req">*</span></label>
              <input
                id="contactName"
                type="text"
                placeholder="Jane Doe"
                value={form.contactName}
                onChange={e => setField('contactName', e.target.value)}
              />
              {errors.contactName && <span className="pb-error">{errors.contactName}</span>}
            </div>
            <div className="pb-field">
              <label htmlFor="contactEmail">Contact email<span className="pb-req">*</span></label>
              <input
                id="contactEmail"
                type="email"
                placeholder="you@example.com"
                value={form.contactEmail}
                onChange={e => setField('contactEmail', e.target.value)}
              />
              {errors.contactEmail && <span className="pb-error">{errors.contactEmail}</span>}
            </div>
          </div>

          {submitError && <div className="pb-submit-error">{submitError}</div>}

          <div className="pb-actions">
            <Link to="/hire" className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit brief'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
