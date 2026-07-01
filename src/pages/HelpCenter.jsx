import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../lib/api';
import './HelpCenter.css';

const CATEGORIES = [
  {
    slug: 'getting-started',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
    title: 'Getting Started',
    desc: 'New to IndieConverters? Start here — account setup, first steps, and platform overview.',
    count: 8,
  },
  {
    slug: 'publishing',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M9 7h6M9 11h4" />
      </svg>
    ),
    title: 'Publishing a Book',
    desc: 'Upload wizard, cover art, formatting, pricing, buy links, and going live.',
    count: 14,
  },
  {
    slug: 'buying-reading',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: 'Finding & Saving Books',
    desc: 'Browsing the catalog, mood-based discovery, saving books, and where to buy.',
    count: 6,
  },
  {
    slug: 'authors',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Author Profiles',
    desc: 'Setting up your public profile, bio, social links, and author verification.',
    count: 10,
  },
  {
    slug: 'freelancers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
    title: 'Freelancers & Hiring',
    desc: 'Post a brief, hire cover designers, editors, and ghostwriters — or get hired yourself.',
    count: 12,
  },
  {
    slug: 'account',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    title: 'Account & Settings',
    desc: 'Password, email, notifications, privacy controls, and closing your account.',
    count: 9,
  },
];

const POPULAR_TAGS = ['Publishing a book', 'Formatting EPUB', 'Hiring a freelancer', 'Buy links'];

export default function HelpCenter() {
  const [query, setQuery]       = useState('');
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetchBlogs({ limit: 6 }).then(setArticles);
  }, []);

  const filteredArticles = query.trim()
    ? articles.filter(a => a.title.toLowerCase().includes(query.toLowerCase()))
    : articles;

  return (
    <div className="help-page">

      {/* ═══ HERO ═══ */}
      <section className="help-hero">
        <div className="container help-hero-inner">
          <span className="eyebrow">Support</span>
          <h1>How can we help?</h1>
          <div className="help-search-wrap">
            <svg className="help-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="9" r="6" />
              <path d="M15 15l3 3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="help-search-input"
              placeholder="Search for articles…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="help-popular-tags">
            <span>Popular:</span>
            {POPULAR_TAGS.map(t => (
              <button key={t} className="help-tag" onClick={() => setQuery(t)}>{t}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CATEGORIES ═══ */}
      {!query && (
        <section className="help-categories">
          <div className="container">
            <h2 className="help-section-title">Browse by topic</h2>
            <div className="help-cat-grid">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.slug}
                  to={`/help/${cat.slug}`}
                  className="help-cat-card"
                >
                  <div className="help-cat-icon">{cat.icon}</div>
                  <div className="help-cat-body">
                    <h3 className="help-cat-title">{cat.title}</h3>
                    <p className="help-cat-desc">{cat.desc}</p>
                  </div>
                  <div className="help-cat-foot">
                    <span className="help-cat-count">{cat.count} articles</span>
                    <svg className="help-cat-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8h10M9 4l4 4-4 4" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ POPULAR / SEARCH RESULTS ═══ */}
      <section className="help-popular">
        <div className="container">
          <h2 className="help-section-title">
            {query ? `Results for "${query}"` : 'Latest from the blog'}
          </h2>

          {articles.length === 0 && !query ? (
            <div className="help-no-results"><p>Loading…</p></div>
          ) : filteredArticles.length === 0 ? (
            <div className="help-no-results">
              <p>No articles match. Try a different search or <button className="help-link-btn" onClick={() => setQuery('')}>browse topics</button>.</p>
            </div>
          ) : (
            <ul className="help-article-list">
              {filteredArticles.map(a => (
                <li key={a.slug} className="help-article-item">
                  <Link to={`/blog/${a.slug}`} className="help-article-link">
                    <svg className="help-article-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                      <path d="M5 10h10M12 6l4 4-4 4" />
                    </svg>
                    <span>{a.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ═══ CONTACT CTA ═══ */}
      <section className="help-cta">
        <div className="container">
          <div className="help-cta-banner">
            <h2>Need help? We've got you covered.</h2>
            <p>
              Email us at{' '}
              <a href="mailto:info@indieconverters.uk">info@indieconverters.uk</a>
              {' '}for general support, or{' '}
              <a href="mailto:authors@indieconverters.uk">authors@indieconverters.uk</a>
              {' '}for publishing enquiries. We usually reply within a few hours.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
