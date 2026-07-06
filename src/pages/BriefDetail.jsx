import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBriefById } from '../lib/api';
import './BriefDetail.css';

const SERVICE_LABELS = {
  ghostwriting: 'Ghostwriting',
  editing: 'Editing',
  'cover-design': 'Cover Design',
  formatting: 'Formatting',
  other: 'Other',
};

function formatBudget(min, max) {
  if (min != null && max != null) return `$${min} – $${max}`;
  if (min != null) return `From $${min}`;
  if (max != null) return `Up to $${max}`;
  return null;
}

function initialsOf(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export default function BriefDetail() {
  const { id } = useParams();
  const [brief,   setBrief]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchBriefById(id).then(b => {
      setBrief(b);
      setLoading(false);
    });
  }, [id]);

  if (loading) return null;

  if (!brief) {
    return (
      <div className="bd-page">
        <div className="container bd-notfound">
          <h1>Brief not found</h1>
          <p>This brief may have been filled or removed.</p>
          <Link to="/get-hired/projects" className="btn btn-primary">Back to Open Projects</Link>
        </div>
      </div>
    );
  }

  const b = brief;
  const budget = formatBudget(b.budget_min, b.budget_max);

  return (
    <div className="bd-page">
      <div className="bd-cover">
        <Link to="/get-hired/projects" className="bd-back-link">← Back to Open Projects</Link>
        <span className="bd-cover-tag">{SERVICE_LABELS[b.service_type] || b.service_type}</span>
      </div>

      <div className="container bd-body">
        <div className="bd-header-row">
          <div className="bd-avatar">{initialsOf(b.contact_name)}</div>
          <div className="bd-top-info">
            <h1 className="bd-title">{b.title}</h1>
            <span className="bd-poster">Posted by {b.contact_name}</span>
          </div>
        </div>

        {(budget || b.timeline) && (
          <div className="bd-meta-row">
            {budget && <span className="bd-meta-item">{budget}</span>}
            {b.timeline && <span className="bd-meta-item">{b.timeline}</span>}
          </div>
        )}

        <div className="bd-layout">
          <div className="bd-main">
            <div className="bd-main-card">
              <h2 className="bd-section-title">Project description</h2>
              <p className="bd-desc">{b.description}</p>
            </div>
          </div>

          <div className="bd-side">
            <div className="bd-side-card">
              <span className="bd-side-label">Budget</span>
              <div className="bd-budget">{budget || 'Not specified'}</div>
              <a href={`mailto:${b.contact_email}`} className="btn btn-primary bd-contact-btn">Contact {b.contact_name}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
