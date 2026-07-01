import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchBlogBySlug, fetchBlogs } from '../lib/api';
import './BlogPost.css';

function BlogImage({ src, alt }) {
  if (!src) {
    return (
      <span className="bpost-fig-placeholder">
        <span className="bpost-fig-icon">▭</span>
        {alt && <span className="bpost-fig-brief">{alt}</span>}
      </span>
    );
  }
  return (
    <span className="bpost-fig">
      <img src={src} alt={alt} className="bpost-fig-img" />
      {alt && <span className="bpost-fig-caption">{alt}</span>}
    </span>
  );
}

const MD_COMPONENTS = {
  img: ({ src, alt }) => <BlogImage src={src} alt={alt} />,
};

function readingTime(body) {
  if (!body) return null;
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPost() {
  const { slug }          = useParams();
  const navigate          = useNavigate();
  const [post, setPost]   = useState(null);
  const [more, setMore]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchBlogBySlug(slug).then(data => {
      if (!data) { navigate('/news', { replace: true }); return; }
      setPost(data);
      setLoading(false);
    });
    fetchBlogs({ limit: 3 }).then(all => {
      setMore(all.filter(p => p.slug !== slug).slice(0, 2));
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="bpost-page">
        <div className="bpost-skeleton-hero container" />
        <div className="bpost-skeleton-body container" />
      </div>
    );
  }

  const mins = readingTime(post.body);

  return (
    <div className="bpost-page">

      {/* ── Header ── */}
      <header className="bpost-header">
        <div className="container bpost-header-inner">
          <Link to="/news" className="bpost-back">← Journal</Link>

          <div className="bpost-meta-row">
            <span className="bpost-pillar">{post.pillar}</span>
            {mins && <span className="bpost-readtime">{mins} min read</span>}
          </div>

          <h1 className="bpost-title">{post.title}</h1>

          {post.excerpt && (
            <p className="bpost-deck">{post.excerpt}</p>
          )}

          <div className="bpost-byline">
            <span className="bpost-date">{formatDate(post.published_at)}</span>
            {post.secondary_keywords?.length > 0 && (
              <div className="bpost-tags">
                {post.secondary_keywords.map(k => (
                  <span key={k} className="bpost-tag">{k}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero image ── */}
      <div className="bpost-hero-img-wrap">
        {post.hero_image_url
          ? <img src={post.hero_image_url} alt={post.title} className="bpost-hero-img" />
          : (
            <div className="bpost-hero-img-placeholder">
              <span className="bpost-hero-img-icon">▭</span>
              {post.hero_image_brief && (
                <span className="bpost-hero-img-brief">{post.hero_image_brief}</span>
              )}
            </div>
          )
        }
      </div>

      {/* ── Body ── */}
      <main className="bpost-main">
        <div className="container bpost-layout">
          <article className="bpost-body">
            {post.body
              ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{post.body}</ReactMarkdown>
              : (
                <div className="bpost-no-body">
                  <p>Full article coming soon.</p>
                  <Link to="/news" className="btn btn-primary">Back to Journal</Link>
                </div>
              )
            }
          </article>

          {/* ── Sidebar ── */}
          <aside className="bpost-sidebar">
            {post.cta && (
              <div className="bpost-sidebar-card bpost-cta-card">
                <p className="bpost-sidebar-label">From Indie Converters</p>
                <p className="bpost-cta-text">{post.cta}</p>
                <Link to="/publish" className="btn btn-primary bpost-cta-btn">Get started →</Link>
              </div>
            )}

            {post.secondary_keywords?.length > 0 && (
              <div className="bpost-sidebar-card">
                <p className="bpost-sidebar-label">Topics</p>
                <div className="bpost-sidebar-tags">
                  {post.secondary_keywords.map(k => (
                    <span key={k} className="bpost-tag">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* ── More posts ── */}
      {more.length > 0 && (
        <section className="bpost-more">
          <div className="container">
            <p className="bpost-more-label">More from the journal</p>
            <div className="bpost-more-grid">
              {more.map(p => (
                <Link key={p.id} to={`/news/${p.slug}`} className="bpost-more-card">
                  <span className="bpost-pillar">{p.pillar}</span>
                  <h3 className="bpost-more-title">{p.title}</h3>
                  <span className="bpost-date">{formatDate(p.published_at)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
