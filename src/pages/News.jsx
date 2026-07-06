import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../lib/api';
import SEO from '../components/SEO';
import blogHero from '../assets/blog-page-hero.webp';
import './News.css';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function readingTime(excerpt) {
  if (!excerpt) return null;
  const words = excerpt.trim().split(/\s+/).length * 10;
  return Math.max(3, Math.round(words / 200));
}

function PostCardLarge({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blist-card blist-card--large">
      <div className="blist-card-img-wrap">
        {post.hero_image_url
          ? <img src={post.hero_image_url} alt={post.title} className="blist-card-img" />
          : <div className="blist-card-img-ph" />
        }
        <span className="blist-card-pillar">{post.pillar}</span>
      </div>
      <div className="blist-card-body">
        <h2 className="blist-card-title">{post.title}</h2>
        {post.excerpt && <p className="blist-card-excerpt">{post.excerpt}</p>}
        <div className="blist-card-meta">
          <span className="blist-card-date">{formatDate(post.published_at)}</span>
          {readingTime(post.excerpt) && (
            <span className="blist-card-time">{readingTime(post.excerpt)} min read</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function PostCardSmall({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blist-card blist-card--small">
      <div className="blist-card-img-wrap">
        {post.hero_image_url
          ? <img src={post.hero_image_url} alt={post.title} className="blist-card-img" />
          : <div className="blist-card-img-ph" />
        }
        <span className="blist-card-pillar">{post.pillar}</span>
      </div>
      <div className="blist-card-body">
        <h3 className="blist-card-title">{post.title}</h3>
        <div className="blist-card-meta">
          <span className="blist-card-date">{formatDate(post.published_at)}</span>
        </div>
      </div>
    </Link>
  );
}

function SidebarPost({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blist-side-post">
      <div className="blist-side-thumb">
        {post.hero_image_url
          ? <img src={post.hero_image_url} alt={post.title} />
          : <div className="blist-side-thumb-ph" />
        }
      </div>
      <div className="blist-side-info">
        <span className="blist-side-date">{formatDate(post.published_at)}</span>
        <p className="blist-side-title">{post.title}</p>
      </div>
    </Link>
  );
}

export default function Blog() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');

  useEffect(() => {
    fetchBlogs({ limit: 20 }).then(data => { setPosts(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return posts;
    const q = query.toLowerCase();
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.pillar?.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q) ||
      p.primary_keyword?.toLowerCase().includes(q)
    );
  }, [posts, query]);

  const [featured, ...rest] = filtered;
  const sidebar = posts.slice(0, 3);
  const latest  = posts.slice(0, 4);

  return (
    <div className="blist-page">
      <SEO
        title="Blog | IndieConverters"
        description="Guides and articles on publishing, formatting, and building a career as an indie author."
        path="/blog"
      />

      {/* ── Hero ── */}
      <section className="blist-hero" style={{ backgroundImage: `url(${blogHero})` }}>
        <div className="container blist-hero-inner">
          <p className="blist-hero-eyebrow">Blog</p>
          <h1 className="blist-hero-heading">Stories, guides &amp; news.</h1>
          <p className="blist-hero-sub">
            Publishing advice, author interviews, EPUB guides and what's worth reading
            in the world of independent books.
          </p>
          <div className="blist-search-row">
            <div className="blist-search-wrap">
              <svg className="blist-search-icon" viewBox="0 0 20 20" fill="none">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                className="blist-search-input"
                placeholder="Search posts…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            {query && (
              <button className="blist-search-clear" onClick={() => setQuery('')}>Clear</button>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="container blist-layout">

        {/* Main feed */}
        <main className="blist-main">
          {loading ? (
            <div className="blist-skeletons">
              <div className="blist-skeleton blist-skeleton--lg" />
              <div className="blist-skeleton-row">
                <div className="blist-skeleton" />
                <div className="blist-skeleton" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="blist-empty">
              <p>No posts match "<strong>{query}</strong>".</p>
              <button className="btn btn-primary" onClick={() => setQuery('')}>Clear search</button>
            </div>
          ) : (
            <>
              {featured && <PostCardLarge post={featured} />}
              {rest.length > 0 && (
                <div className="blist-grid">
                  {rest.map(p => <PostCardSmall key={p.id} post={p} />)}
                </div>
              )}
            </>
          )}
        </main>

        {/* Sidebar */}
        <aside className="blist-sidebar">
          {sidebar.length > 0 && (
            <div className="blist-side-section">
              <p className="blist-side-label">Featured</p>
              <div className="blist-side-list">
                {sidebar.map(p => <SidebarPost key={p.id} post={p} />)}
              </div>
            </div>
          )}

          {latest.length > 0 && (
            <div className="blist-side-section">
              <p className="blist-side-label">Latest</p>
              <div className="blist-side-list">
                {latest.map(p => (
                  <Link key={p.id} to={`/blog/${p.slug}`} className="blist-latest-row">
                    <span className="blist-latest-date">{formatDate(p.published_at)}</span>
                    <span className="blist-latest-title">{p.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="blist-side-section blist-subscribe-box">
            <p className="blist-side-label">Newsletter</p>
            <p className="blist-subscribe-text">Get new posts in your inbox — no noise, just good reading.</p>
            <SubscribeForm />
          </div>
        </aside>
      </div>

    </div>
  );
}

function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);
  if (sent) return <p className="blist-subscribe-done">You're on the list.</p>;
  return (
    <form className="blist-subscribe-form" onSubmit={e => { e.preventDefault(); if (email) setSent(true); }}>
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="blist-subscribe-input"
        required
      />
      <button type="submit" className="btn btn-primary blist-subscribe-btn">Subscribe</button>
    </form>
  );
}
