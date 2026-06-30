import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './ComingSoon.css';

export default function Authors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('authors')
      .select('slug, display_name, short_bio, photo_url')
      .order('display_name')
      .then(({ data }) => { setAuthors(data || []); setLoading(false); });
  }, []);

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-hero">
        <div className="container">
          <div className="eyebrow">Authors</div>
          <h1>The writers<br /><em>behind the work.</em></h1>
          <p>Author profiles, career spotlights, and the people producing the books on this site. Deep-dives into what made them and what they're making next.</p>
        </div>
      </div>

      <div className="container coming-soon-body">
        {loading ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading authors…</p>
        ) : (
          <>
            <div className="coming-soon-notice">
              <span className="notice-dot">··</span>
              <strong>Author Corner profiles coming soon.</strong> For now, explore individual author pages via any book.
            </div>

            <div className="authors-grid">
              {authors.map(a => {
                const initials = a.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <Link to={`/author/${a.slug}`} key={a.slug} className="author-chip">
                    <div className="author-chip-avatar">
                      {a.photo_url
                        ? <img src={a.photo_url} alt={a.display_name} />
                        : <span>{initials}</span>
                      }
                    </div>
                    <div className="author-chip-info">
                      <strong>{a.display_name}</strong>
                      {a.short_bio && <p>{a.short_bio.slice(0, 80)}{a.short_bio.length > 80 ? '…' : ''}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
