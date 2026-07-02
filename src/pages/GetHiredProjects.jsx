import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchOpenBriefs } from '../lib/api';
import './GetHiredProjects.css';

const SERVICE_FILTERS = [
  { slug: '',              label: 'All' },
  { slug: 'ghostwriting',  label: 'Ghostwriting' },
  { slug: 'editing',       label: 'Editing' },
  { slug: 'cover-design',  label: 'Cover Design' },
  { slug: 'formatting',    label: 'Formatting' },
  { slug: 'other',         label: 'Other' },
];

const SERVICE_LABELS = Object.fromEntries(SERVICE_FILTERS.filter(f => f.slug).map(f => [f.slug, f.label]));

function formatBudget(min, max) {
  if (min != null && max != null) return `$${min} – $${max}`;
  if (min != null) return `From $${min}`;
  if (max != null) return `Up to $${max}`;
  return null;
}

export default function GetHiredProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceType = searchParams.get('service') || '';

  const [briefs,  setBriefs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchOpenBriefs({ serviceType: serviceType || undefined })
      .then(setBriefs)
      .finally(() => setLoading(false));
  }, [serviceType]);

  function selectService(slug) {
    if (slug) setSearchParams({ service: slug });
    else setSearchParams({});
  }

  return (
    <div className="gh-page">
      <div className="container gh-projects-header">
        <span className="gh-hero-eyebrow">·· Get Hired</span>
        <h1 className="gh-section-h2">Open projects</h1>
        <p className="gh-section-sub">Real briefs posted by authors right now. Reach out directly — no bidding, no middleman.</p>
      </div>

      <div className="container">
        <div className="gh-project-filters">
          {SERVICE_FILTERS.map(({ slug, label }) => (
            <button
              key={slug || 'all'}
              type="button"
              className={`gh-project-filter-chip ${serviceType === slug ? 'is-active' : ''}`}
              onClick={() => selectService(slug)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="gh-projects-empty">Loading…</p>
        ) : briefs.length === 0 ? (
          <p className="gh-projects-empty">No open briefs right now — check back soon.</p>
        ) : (
          <div className="gh-projects-grid">
            {briefs.map(b => (
              <a key={b.id} href={`mailto:${b.contact_email}`} className="gh-project-card">
                <span className="gh-project-tag">{SERVICE_LABELS[b.service_type] || b.service_type}</span>
                <h3 className="gh-project-title">{b.title}</h3>
                <p className="gh-project-desc">{b.description}</p>
                <div className="gh-project-meta">
                  {formatBudget(b.budget_min, b.budget_max) && (
                    <span className="gh-project-budget">{formatBudget(b.budget_min, b.budget_max)}</span>
                  )}
                  {b.timeline && <span className="gh-project-deadline">{b.timeline}</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
