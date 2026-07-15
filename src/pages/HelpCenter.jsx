import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../lib/api';
import { HELP_CATEGORIES as CATEGORIES } from '../lib/helpCategories';
import { ASSISTANT_FAQS as FAQS } from '../lib/assistantKnowledge';
import SEO from '../components/SEO';
import './HelpCenter.css';

const POPULAR_TAGS = ['Getting started', 'EPUB', 'Book metadata', 'Author marketing'];

export default function HelpCenter() {
  const [query, setQuery]             = useState('');
  const [articles, setArticles]       = useState([]);
  const [openFaq, setOpenFaq]         = useState(null);
  const [activeFaqTopic, setActiveFaqTopic] = useState(null);
  const faqPanelRef = useRef(null);

  function toggleFaqTopic(topic) {
    setActiveFaqTopic(activeFaqTopic === topic ? null : topic);
    setOpenFaq(null);
  }

  useEffect(() => {
    if (activeFaqTopic && faqPanelRef.current) {
      faqPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeFaqTopic]);

  useEffect(() => {
    fetchBlogs({ limit: 50 }).then(setArticles);
  }, []);

  const filteredArticles = query.trim()
    ? articles.filter(a => {
        const q = query.toLowerCase();
        return a.title.toLowerCase().includes(q)
          || (a.excerpt || '').toLowerCase().includes(q)
          || (a.pillar || '').toLowerCase().includes(q);
      })
    : articles;

  const categoryCounts = Object.fromEntries(
    CATEGORIES.map(cat => [
      cat.slug,
      articles.filter(a => cat.pillars.includes(a.pillar)).length,
    ])
  );

  const displayArticles = query.trim() ? filteredArticles : filteredArticles.slice(0, 9);

  return (
    <div className="help-page">
      <SEO
        title="Help Center | IndieConverters"
        description="Answers on publishing, formatting, discovery, and hiring freelancers on IndieConverters."
        path="/help"
      />

      {/* ═══ HERO ═══ */}
      <section className="help-hero">
        <div className="container help-hero-inner">
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
                    {categoryCounts[cat.slug] > 0 ? (
                      <span className="help-cat-count">
                        {categoryCounts[cat.slug]} article{categoryCounts[cat.slug] === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="help-cat-count help-cat-count--soon">Coming soon</span>
                    )}
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

      {!query && (
        <section className="help-tools">
          <div className="container">
            <div className="help-tool-card">
              <div>
                <span className="help-tool-kicker">Publishing tool</span>
                <h2>Print cover calculator</h2>
                <p>Calculate full-wrap paperback cover size, spine width, bleed, safe area, and 300 DPI export dimensions before you design.</p>
              </div>
              <Link to="/tools/print-cover-calculator" className="help-tool-link">Open calculator</Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ SEARCH RESULTS ═══ */}
      {query && (
        <section className="help-popular">
          <div className="container">
            <h2 className="help-section-title">Results for "{query}"</h2>

            {filteredArticles.length === 0 ? (
              <div className="help-no-results">
                <p>No articles match. Try a different search or <button className="help-link-btn" onClick={() => setQuery('')}>browse topics</button>.</p>
              </div>
            ) : (
              <ul className="help-article-list">
                {displayArticles.map(a => (
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
      )}

      {/* ═══ FAQ ═══ */}
      {!query && (
        <section className="help-faq-section">
          <div className="container">
            <h2 className="help-section-title">Frequently asked questions</h2>
            <div className="help-cat-grid help-faq-grid">
              {CATEGORIES.map(cat => {
                const topicFaqs = FAQS.filter(f => f.topic === cat.title);
                if (topicFaqs.length === 0) return null;
                const isActive = activeFaqTopic === cat.title;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    className={`help-cat-card help-faq-card${isActive ? ' active' : ''}`}
                    onClick={() => toggleFaqTopic(cat.title)}
                  >
                    <div className="help-cat-icon">{cat.icon}</div>
                    <div className="help-cat-body">
                      <h3 className="help-cat-title">{cat.title}</h3>
                      <p className="help-cat-desc">{cat.desc}</p>
                    </div>
                    <div className="help-cat-foot">
                      <span className="help-cat-count">
                        {topicFaqs.length} question{topicFaqs.length === 1 ? '' : 's'}
                      </span>
                      <svg className={`help-cat-arrow${isActive ? ' help-cat-arrow--open' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeFaqTopic && (
              <div className="help-faq-list" ref={faqPanelRef}>
                {FAQS.filter(f => f.topic === activeFaqTopic).map((faq, i) => (
                  <div key={i} className={`help-faq-item${openFaq === i ? ' open' : ''}`}>
                    <button className="help-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <span>{faq.q}</span>
                      <span className="help-faq-icon">{openFaq === i ? '−' : '+'}</span>
                    </button>
                    {openFaq === i && <div className="help-faq-answer"><p>{faq.a}</p></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══ CONTACT CTA ═══ */}
      <section className="help-cta">
        <div className="container">
          <div className="help-cta-banner">
            <h2>Need help? We've got you covered ✨</h2>
            <p>
              Browse our articles above, or reach our support team through our{' '}
              <a href="mailto:info@indieconverters.uk">email</a>.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
