import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchFreelancers } from '../lib/api';
import './HireBrowse.css';

const IconPin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>;

const SERVICE_FILTERS = [
  { slug: '',              label: 'All' },
  { slug: 'ghostwriting',  label: 'Ghostwriting' },
  { slug: 'editing',       label: 'Editing' },
  { slug: 'cover-design',  label: 'Cover Design' },
  { slug: 'formatting',    label: 'Formatting' },
  { slug: 'other',         label: 'Other' },
];

const SERVICE_LABELS = Object.fromEntries(SERVICE_FILTERS.filter(f => f.slug).map(f => [f.slug, f.label]));

function formatRate(min, max) {
  if (min != null && max != null) return `$${min} – $${max}`;
  if (min != null) return `From $${min}`;
  if (max != null) return `Up to $${max}`;
  return null;
}

export default function HireBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceType = searchParams.get('service') || '';

  const [freelancers, setFreelancers] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFreelancers({ serviceType: serviceType || undefined })
      .then(setFreelancers)
      .finally(() => setLoading(false));
  }, [serviceType]);

  function selectService(slug) {
    if (slug) setSearchParams({ service: slug });
    else setSearchParams({});
  }

  return (
    <div className="hb-page">
      <div className="container hb-header">
        <span className="hb-eyebrow">·· Hire Freelancer</span>
        <h1 className="hb-h1">Browse freelancers</h1>
        <p className="hb-sub">Real profiles from freelancers who've signed up to work with indie authors.</p>
      </div>

      <div className="container">
        <div className="hb-filters">
          {SERVICE_FILTERS.map(({ slug, label }) => (
            <button
              key={slug || 'all'}
              type="button"
              className={`hb-filter-chip ${serviceType === slug ? 'is-active' : ''}`}
              onClick={() => selectService(slug)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="hb-empty">Loading…</p>
        ) : freelancers.length === 0 ? (
          <p className="hb-empty">No freelancers yet for this service — check back soon.</p>
        ) : (
          <div className="hb-list">
            {freelancers.map(f => {
              const rate = formatRate(f.rate_min, f.rate_max);
              return (
                <div key={f.id} className="hb-card">
                  <div className="hb-card-avatar">
                    {f.photo_url
                      ? <img src={f.photo_url} alt={f.display_name} />
                      : <span>{f.display_name?.[0]?.toUpperCase() || '?'}</span>
                    }
                  </div>

                  <div className="hb-card-main">
                    <div className="hb-card-name-row">
                      <h3 className="hb-card-name">{f.display_name}</h3>
                      <span className="hb-badge hb-badge-service">{SERVICE_LABELS[f.service_type] || f.service_type}</span>
                      {f.hire_count > 0 && (
                        <span className="hb-badge hb-badge-hired">{`Hired ${f.hire_count}×`}</span>
                      )}
                    </div>
                    <p className="hb-card-bio">{f.bio}</p>
                    {f.location && (
                      <div className="hb-card-location"><IconPin />{f.location}</div>
                    )}
                  </div>

                  <div className="hb-card-side">
                    <div className="hb-card-price">
                      {rate || 'Contact for rate'}
                      {rate && <span className="hb-card-price-sub">per project</span>}
                    </div>
                    <div className="hb-card-actions">
                      {f.portfolio_url && (
                        <a href={f.portfolio_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">Portfolio</a>
                      )}
                      <a href={`mailto:${f.contact_email}`} className="btn btn-primary btn-sm">Contact</a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
