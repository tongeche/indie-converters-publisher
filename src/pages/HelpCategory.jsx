import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchBlogs } from '../lib/api';
import { HELP_CATEGORIES } from '../lib/helpCategories';
import ComingSoon from './ComingSoon';
import SEO from '../components/SEO';
import './HelpCenter.css';

export default function HelpCategory() {
  const { slug } = useParams();
  const category = HELP_CATEGORIES.find(c => c.slug === slug);
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    if (!category) return;
    fetchBlogs({ limit: 50 }).then(setArticles);
  }, [category]);

  if (!category) return <ComingSoon />;

  const matches = (articles || []).filter(a => category.pillars.includes(a.pillar));

  return (
    <div className="help-page">
      <SEO
        title={`${category.title} | Help Center | IndieConverters`}
        description={category.desc}
        path={`/help/${slug}`}
      />
      <section className="help-hero help-cat-hero">
        <div className="container help-hero-inner">
          <Link to="/help" className="help-cat-back">← Help Center</Link>
          <div className="help-cat-hero-icon">{category.icon}</div>
          <h1>{category.title}</h1>
          <p className="help-cat-hero-desc">{category.desc}</p>
        </div>
      </section>

      <section className="help-popular">
        <div className="container">
          <h2 className="help-section-title">
            {matches.length > 0 ? 'Articles in this topic' : 'Coming soon'}
          </h2>

          {articles === null ? (
            <div className="help-no-results"><p>Loading…</p></div>
          ) : matches.length === 0 ? (
            <div className="help-no-results">
              <p>We haven't published articles for this topic yet. In the meantime, <button className="help-link-btn" onClick={() => window.history.back()}>go back</button> or browse the <Link to="/help">Help Center</Link>.</p>
            </div>
          ) : (
            <ul className="help-article-list">
              {matches.map(a => (
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
    </div>
  );
}
