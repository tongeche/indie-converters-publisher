import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchBlogs } from '../lib/api';
import SEO from '../components/SEO';
import blogHero from '../assets/blog-page-hero.webp';
import './News.css';

const PILLAR_COLORS = ['#441CB2', '#8266E0', '#B3592B', '#1A7A35', '#0D5FA6', '#A6234A'];
function pillarColor(pillar) {
  const label = pillar || 'General';
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  return PILLAR_COLORS[h % PILLAR_COLORS.length];
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function readingTime(excerpt) {
  if (!excerpt) return null;
  const words = excerpt.trim().split(/\s+/).length * 10;
  return Math.max(3, Math.round(words / 200));
}

function PillarTag({ pillar }) {
  if (!pillar) return null;
  return <span className="blist-pillar-tag" style={{ background: pillarColor(pillar) }}>{pillar}</span>;
}

function PostCardLarge({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blist-card blist-card--large">
      <div className="blist-card-img-wrap">
        {post.hero_image_url
          ? <img src={post.hero_image_url} alt={post.title} className="blist-card-img" />
          : <div className="blist-card-img-ph" />
        }
        <PillarTag pillar={post.pillar} />
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

function PostListRow({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blist-list-row">
      <div className="blist-list-meta">
        <PillarTag pillar={post.pillar} />
        <span className="blist-list-date">{formatDate(post.published_at)}</span>
      </div>
      <h3 className="blist-list-title">{post.title}</h3>
      {post.excerpt && <p className="blist-list-excerpt">{post.excerpt}</p>}
      <span className="blist-list-more">Read more <span aria-hidden="true">&rarr;</span></span>
    </Link>
  );
}

function MostReadRow({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blist-mostread-row">
      <div className="blist-mostread-thumb">
        {post.hero_image_url
          ? <img src={post.hero_image_url} alt="" />
          : <div className="blist-mostread-thumb-ph" style={{ background: pillarColor(post.pillar) }} />
        }
      </div>
      <div className="blist-mostread-info">
        <span className="blist-mostread-date">{formatDate(post.published_at)}</span>
        <h3 className="blist-mostread-title">{post.title}</h3>
        {post.excerpt && <p className="blist-mostread-excerpt">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

function RecentRow({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className="blist-recent-row">
      <div className="blist-recent-thumb">
        {post.hero_image_url
          ? <img src={post.hero_image_url} alt="" />
          : <div className="blist-recent-thumb-ph" />
        }
      </div>
      <div className="blist-recent-info">
        <PillarTag pillar={post.pillar} />
        <p className="blist-recent-title">{post.title}</p>
        <span className="blist-recent-date">{formatDate(post.published_at)}</span>
      </div>
    </Link>
  );
}

function TopicTile({ topic }) {
  return (
    <div className="blist-topic-tile">
      <div className="blist-topic-img-wrap">
        {topic.image
          ? <img src={topic.image} alt="" className="blist-topic-img" />
          : <div className="blist-topic-img-ph" style={{ background: pillarColor(topic.pillar) }} />
        }
      </div>
      <div className="blist-topic-caption">
        <span className="blist-topic-name">{topic.pillar}</span>
        <span className="blist-topic-count">{topic.count} {topic.count === 1 ? 'article' : 'articles'}</span>
      </div>
    </div>
  );
}

export default function Blog() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');

  useEffect(() => {
    fetchBlogs({ limit: 40 }).then(data => { setPosts(data); setLoading(false); });
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

  const featured    = filtered[0] || null;
  const recent      = filtered.slice(1, 4);
  const gridPosts    = filtered.slice(4);
  const sidebarRecent = filtered.slice(0, 5);

  const mostRead = useMemo(() => {
    return [...filtered]
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0) || new Date(b.published_at) - new Date(a.published_at))
      .slice(0, 4);
  }, [filtered]);

  const topics = useMemo(() => {
    const byPillar = new Map();
    filtered.forEach(p => {
      const key = p.pillar || 'General';
      if (!byPillar.has(key)) byPillar.set(key, { pillar: key, count: 0, image: p.hero_image_url });
      byPillar.get(key).count += 1;
    });
    return [...byPillar.values()].sort((a, b) => b.count - a.count);
  }, [filtered]);

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

      <div className="container">
        {loading ? (
          <div className="blist-skeletons">
            <div className="blist-skeleton blist-skeleton--lg" />
            <div className="blist-skeleton-row">
              <div className="blist-skeleton" />
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
            {/* ── Featured + recent ── */}
            <section className="blist-top-section">
              {featured && <PostCardLarge post={featured} />}
              {recent.length > 0 && (
                <div className="blist-recent-col">
                  {recent.map(p => <RecentRow key={p.id} post={p} />)}
                </div>
              )}
            </section>

            {/* ── Most read ── */}
            {mostRead.length > 0 && (
              <section className="blist-mostread-section">
                <div className="blist-section-head">
                  <div>
                    <h2 className="blist-section-title">Most read</h2>
                    <p className="blist-section-sub">The posts readers keep coming back to.</p>
                  </div>
                </div>
                <div className="blist-mostread-list">
                  {mostRead.map(p => <MostReadRow key={p.id} post={p} />)}
                </div>
              </section>
            )}

            {/* ── Browse by topic ── */}
            {topics.length > 1 && (
              <section className="blist-topics-section">
                <div className="blist-topics-head">
                  <h2 className="blist-topics-title">Explore the blog<strong>by topic.</strong></h2>
                  <p className="blist-topics-sub">
                    Publishing craft, indie career advice, and platform news —
                    sorted by what's actually on your mind.
                  </p>
                </div>
                <div className="blist-topics-row">
                  {topics.map(t => (
                    <TopicTile key={t.pillar} topic={t} />
                  ))}
                </div>
                <div className="blist-topics-hint">
                  <span>Scroll to view gallery</span>
                  <span aria-hidden="true">↓</span>
                </div>
              </section>
            )}

            {/* ── Latest articles ── */}
            {gridPosts.length > 0 && (
              <section className="blist-articles-section">
                <div className="blist-section-head">
                  <div>
                    <h2 className="blist-section-title">Latest articles</h2>
                    <p className="blist-section-sub">Publishing craft, indie career advice, and platform news.</p>
                  </div>
                </div>
                <div className="blist-articles-layout">
                  <div className="blist-articles-list">
                    {gridPosts.map(p => <PostListRow key={p.id} post={p} />)}
                  </div>
                  <aside className="blist-sidebar">
                    <div className="blist-sidebar-block">
                      <span className="blist-sidebar-label">Search</span>
                      <div className="blist-search-wrap blist-search-wrap--sidebar">
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
                    </div>
                    {sidebarRecent.length > 0 && (
                      <div className="blist-sidebar-block">
                        <span className="blist-sidebar-label">Recent posts</span>
                        <div className="blist-sidebar-recent-list">
                          {sidebarRecent.map(p => <RecentRow key={p.id} post={p} />)}
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* ── Newsletter ── */}
      <section className="blist-subscribe-band">
        <div className="container blist-subscribe-inner">
          <div>
            <h2 className="blist-subscribe-title">Get new posts in your inbox</h2>
            <p className="blist-subscribe-text">No noise, just good reading — publishing craft and platform updates.</p>
          </div>
          <SubscribeForm />
        </div>
      </section>
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
