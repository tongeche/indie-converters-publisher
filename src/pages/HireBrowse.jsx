import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchFreelancers } from '../lib/api';
import './HireBrowse.css';

const IconPin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>;
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

function formatRate(min, max) {
  if (min != null && max != null) return `$${min} – $${max}`;
  if (min != null) return `From $${min}`;
  if (max != null) return `Up to $${max}`;
  return null;
}

const MAX_VISIBLE_SKILLS = 3;
const MAX_VISIBLE_LANGUAGES = 2;

export default function HireBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const serviceType = searchParams.get('service') || '';

  const [allFreelancers, setAllFreelancers] = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    fetchFreelancers().then(setAllFreelancers).finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = {};
    for (const f of allFreelancers) {
      for (const st of f.service_types || []) c[st] = (c[st] || 0) + 1;
    }
    return c;
  }, [allFreelancers]);

  const visible = useMemo(() => {
    if (!serviceType) return allFreelancers;
    return allFreelancers.filter(f => (f.service_types || []).includes(serviceType));
  }, [allFreelancers, serviceType]);

  function selectService(slug) {
    if (slug) setSearchParams({ service: slug });
    else setSearchParams({});
  }

  const activeLabel = serviceType ? (SERVICE_LABELS[serviceType] || serviceType) : 'all services';

  return (
    <div className="hb-page">
      <div className="container hb-layout">

        <aside className="hb-sidebar">
          <h2 className="hb-sidebar-title">Browse by service</h2>
          <nav className="hb-sidebar-nav">
            {SERVICE_FILTERS.map(({ slug, label }) => (
              <button
                key={slug || 'all'}
                type="button"
                className={`hb-sidebar-item ${serviceType === slug ? 'is-active' : ''}`}
                onClick={() => selectService(slug)}
              >
                <span className="hb-sidebar-item-label"><IconArrow />{label}</span>
                <span className="hb-sidebar-count">{slug ? (counts[slug] || 0) : allFreelancers.length}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="hb-main">
          {loading ? (
            <p className="hb-empty">Loading…</p>
          ) : (
            <>
              <p className="hb-count-line">
                {visible.length} freelancer{visible.length === 1 ? '' : 's'} for <strong>{activeLabel}</strong>
              </p>

              {visible.length === 0 ? (
                <p className="hb-empty">No freelancers yet for this service — check back soon.</p>
              ) : (
                <div className="hb-grid">
                  {visible.map(f => {
                    const rate = formatRate(f.rate_min, f.rate_max);
                    const skills = f.skills || [];
                    const visibleSkills = skills.slice(0, MAX_VISIBLE_SKILLS);
                    const extraSkills = skills.length - visibleSkills.length;
                    const languages = f.languages || [];
                    const visibleLanguages = languages.slice(0, MAX_VISIBLE_LANGUAGES);
                    const extraLanguages = languages.length - visibleLanguages.length;
                    return (
                      <div key={f.id} className="hb-card">
                        <Link to={`/hire/freelancer/${f.id}`} className="hb-card-link">
                          <div
                            className="hb-card-cover"
                            style={f.cover_image_url ? { backgroundImage: `url(${f.cover_image_url})` } : undefined}
                          >
                            {!f.cover_image_url && <span className="hb-card-cover-fallback">{f.display_name}</span>}
                          </div>

                          <div className="hb-card-body">
                            <div className="hb-card-top">
                              <div className="hb-card-avatar">
                                {f.photo_url
                                  ? <img src={f.photo_url} alt={f.display_name} />
                                  : <span>{f.display_name?.[0]?.toUpperCase() || '?'}</span>
                                }
                              </div>
                              <div className="hb-card-name-col">
                                <h3 className="hb-card-name">{f.display_name}</h3>
                                {f.hire_count > 0 && (
                                  <span className="hb-badge hb-badge-hired">{`Hired ${f.hire_count}×`}</span>
                                )}
                              </div>
                            </div>

                            <p className="hb-card-bio">{f.bio}</p>

                            <div className="hb-card-tags">
                              {(f.service_types || []).map(st => (
                                <span key={st} className="hb-badge hb-badge-service">{SERVICE_LABELS[st] || st}</span>
                              ))}
                              {visibleSkills.map(s => (
                                <span key={s} className="hb-tag">{s}</span>
                              ))}
                              {extraSkills > 0 && <span className="hb-tag hb-tag-more">{`+${extraSkills} more`}</span>}
                            </div>

                            {(f.location || languages.length > 0) && (
                              <div className="hb-card-meta-row">
                                {f.location && <span className="hb-card-location"><IconPin />{f.location}</span>}
                                {languages.length > 0 && (
                                  <span className="hb-card-languages">
                                    {`Speaks ${visibleLanguages.join(', ')}`}
                                    {extraLanguages > 0 && ` +${extraLanguages} more`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>

                        {f.portfolio_url && (
                          <a
                            href={f.portfolio_url}
                            target="_blank"
                            rel="noreferrer"
                            className="hb-card-portfolio-link"
                          >
                            View portfolio ↗
                          </a>
                        )}

                        <div className="hb-card-footer">
                          <div className="hb-card-price">
                            {rate || 'Contact for rate'}
                            {rate && <span className="hb-card-price-sub">per project</span>}
                          </div>
                          <a href={`mailto:${f.contact_email}`} className="btn btn-primary btn-sm">Contact</a>
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
