import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchFreelancerById } from '../lib/api';
import './FreelancerProfile.css';

const IconPin = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>;

const SERVICE_LABELS = {
  ghostwriting: 'Ghostwriting',
  editing: 'Editing',
  'cover-design': 'Cover Design',
  formatting: 'Formatting',
  other: 'Other',
};

function formatRate(min, max) {
  if (min != null && max != null) return `$${min} – $${max}`;
  if (min != null) return `From $${min}`;
  if (max != null) return `Up to $${max}`;
  return null;
}

export default function FreelancerProfile() {
  const { id } = useParams();
  const [freelancer, setFreelancer] = useState(null);
  const [loading,     setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFreelancerById(id).then(f => {
      setFreelancer(f);
      setLoading(false);
    });
  }, [id]);

  if (loading) return null;

  if (!freelancer) {
    return (
      <div className="fp-page">
        <div className="container fp-notfound">
          <h1>Freelancer not found</h1>
          <p>This profile may have been removed.</p>
          <Link to="/hire/browse" className="btn btn-primary">Back to Browse Freelancers</Link>
        </div>
      </div>
    );
  }

  const f = freelancer;
  const rate = formatRate(f.rate_min, f.rate_max);

  return (
    <div className="fp-page">
      <div
        className="fp-cover"
        style={f.cover_image_url ? { backgroundImage: `url(${f.cover_image_url})` } : undefined}
      >
        <Link to="/hire/browse" className="fp-back-link">← Back to Browse Freelancers</Link>
        {!f.cover_image_url && <span className="fp-cover-fallback">{f.display_name}</span>}
      </div>

      <div className="container fp-body">
        <div className="fp-header-row">
          <div className="fp-avatar">
            {f.photo_url
              ? <img src={f.photo_url} alt={f.display_name} />
              : <span>{f.display_name?.[0]?.toUpperCase() || '?'}</span>
            }
          </div>
          <div className="fp-top-info">
            <h1 className="fp-name">{f.display_name}</h1>
            <div className="fp-badges">
              {(f.service_types || []).map(st => (
                <span key={st} className="fp-badge fp-badge-service">{SERVICE_LABELS[st] || st}</span>
              ))}
              {f.hire_count > 0 && <span className="fp-badge fp-badge-hired">{`Hired ${f.hire_count}×`}</span>}
            </div>
          </div>
        </div>

        {(f.location || f.languages?.length > 0) && (
          <div className="fp-meta-row">
            {f.location && <span className="fp-meta-item"><IconPin />{f.location}</span>}
            {f.languages?.length > 0 && <span className="fp-meta-item">{`Speaks ${f.languages.join(', ')}`}</span>}
          </div>
        )}

        <div className="fp-layout">
          <div className="fp-main">
            <div className="fp-main-card">
              <h2 className="fp-section-title">About</h2>
              <p className="fp-bio">{f.bio}</p>

              {f.skills?.length > 0 && (
                <>
                  <h2 className="fp-section-title">Skills</h2>
                  <div className="fp-tags">
                    {f.skills.map(s => <span key={s} className="fp-tag">{s}</span>)}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="fp-side">
            <div className="fp-side-card">
              <span className="fp-side-label">Project rate</span>
              <div className="fp-price">
                {rate || 'Contact for rate'}
                {rate && <span className="fp-price-sub">per project</span>}
              </div>
              <a href={`mailto:${f.contact_email}`} className="btn btn-primary fp-contact-btn">Contact</a>
              {f.portfolio_url && (
                <a href={f.portfolio_url} target="_blank" rel="noreferrer" className="btn btn-outline fp-contact-btn">
                  View portfolio
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
