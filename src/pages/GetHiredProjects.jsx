import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchOpenBriefs } from '../lib/api';
import './GetHiredProjects.css';

const IconArrow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;

const SERVICE_FILTERS = [
  { slug: '',              label: 'All services' },
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

function initialsOf(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

export default function GetHiredProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceType = searchParams.get('service') || '';

  const [allBriefs, setAllBriefs] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetchOpenBriefs().then(setAllBriefs).finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = {};
    for (const b of allBriefs) c[b.service_type] = (c[b.service_type] || 0) + 1;
    return c;
  }, [allBriefs]);

  const visible = useMemo(() => {
    if (!serviceType) return allBriefs;
    return allBriefs.filter(b => b.service_type === serviceType);
  }, [allBriefs, serviceType]);

  function selectService(slug) {
    if (slug) setSearchParams({ service: slug });
    else setSearchParams({});
  }

  const activeLabel = serviceType ? (SERVICE_LABELS[serviceType] || serviceType) : 'all services';

  return (
    <div className="gp-page">
      <div className="container gp-layout">

        <aside className="gp-sidebar">
          <h2 className="gp-sidebar-title">Browse by service</h2>
          <nav className="gp-sidebar-nav">
            {SERVICE_FILTERS.map(({ slug, label }) => (
              <button
                key={slug || 'all'}
                type="button"
                className={`gp-sidebar-item ${serviceType === slug ? 'is-active' : ''}`}
                onClick={() => selectService(slug)}
              >
                <span className="gp-sidebar-item-label"><IconArrow />{label}</span>
                <span className="gp-sidebar-count">{slug ? (counts[slug] || 0) : allBriefs.length}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="gp-main">
          {loading ? (
            <p className="gp-empty">Loading…</p>
          ) : (
            <>
              <p className="gp-count-line">
                {visible.length} open brief{visible.length === 1 ? '' : 's'} for <strong>{activeLabel}</strong>
              </p>

              {visible.length === 0 ? (
                <p className="gp-empty">No open briefs for this service right now — check back soon.</p>
              ) : (
                <div className="gp-grid">
                  {visible.map(b => {
                    const budget = formatBudget(b.budget_min, b.budget_max);
                    return (
                      <div key={b.id} className="gp-card">
                        <Link to={`/get-hired/projects/${b.id}`} className="gp-card-link">
                          <div className="gp-card-cover">
                            <span className="gp-card-cover-tag">{SERVICE_LABELS[b.service_type] || b.service_type}</span>
                          </div>

                          <div className="gp-card-body">
                            <div className="gp-card-top">
                              <div className="gp-card-avatar">{initialsOf(b.contact_name)}</div>
                              <span className="gp-card-poster">{b.contact_name}</span>
                            </div>

                            <h3 className="gp-card-title">{b.title}</h3>
                            <p className="gp-card-desc">{b.description}</p>

                            <div className="gp-card-meta-row">
                              {budget && <span className="gp-card-budget">{budget}</span>}
                              {b.timeline && <span className="gp-card-timeline">{b.timeline}</span>}
                            </div>
                          </div>
                        </Link>

                        <div className="gp-card-footer">
                          <span className="gp-card-footer-hint">Reach out directly</span>
                          <a href={`mailto:${b.contact_email}`} className="btn btn-primary btn-sm">Contact</a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>

      </div>
    </div>
  );
}
