import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchBlogBySlug, fetchBlogs } from '../lib/api';
import './BlogPost.css';

function BlogImage({ src, alt }) {
  const caption = alt?.trim();
  if (!src) {
    return (
      <figure className="bpost-fig-placeholder">
        <span className="bpost-fig-icon">▭</span>
        {caption && <figcaption className="bpost-fig-brief">{caption}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="bpost-fig">
      <img src={src} alt={caption} className="bpost-fig-img" />
      {caption && <figcaption className="bpost-fig-caption">{caption}</figcaption>}
    </figure>
  );
}

const MD_COMPONENTS = {
  // Title is already shown in the hero header — skip any H1 in the body
  h1: () => null,
  // Unwrap image-only paragraphs so <figure> isn't nested inside <p> (invalid HTML)
  p: ({ node, children }) => {
    const isImageOnly =
      node.children.length === 1 &&
      node.children[0].type === 'element' &&
      node.children[0].tagName === 'img';
    if (isImageOnly) return <>{children}</>;
    return <p>{children}</p>;
  },
  img: ({ src, alt }) => <BlogImage src={src} alt={alt} />,
};

// Guides are flat, image-free help articles — drop images entirely instead of placeholders
const GUIDE_MD_COMPONENTS = {
  ...MD_COMPONENTS,
  img: () => null,
  p: ({ node, children }) => {
    const isImageOnly =
      node.children.length === 1 &&
      node.children[0].type === 'element' &&
      node.children[0].tagName === 'img';
    if (isImageOnly) return null;
    return <p>{children}</p>;
  },
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
  const { slug }             = useParams();
  const navigate             = useNavigate();
  const [post, setPost]      = useState(null);
  const [others, setOthers]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchBlogBySlug(slug).then(data => {
      if (!data) { navigate('/blog', { replace: true }); return; }
      setPost(data);
      setLoading(false);
    });
    fetchBlogs({ limit: 20 }).then(all => {
      setOthers(all.filter(p => p.slug !== slug));
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
  const isGuide = post.pillar === 'Getting Started';
  const more = (isGuide ? others.filter(p => p.pillar === 'Getting Started') : others).slice(0, 2);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  function copyLink() {
    navigator.clipboard.writeText(pageUrl).catch(() => {});
  }

  if (isGuide) {
    return (
      <div className="bpost-page">
        <header className="bpost-guide-header">
          <div className="container bpost-guide-layout">
            <Link to="/help" className="bpost-back">← Help Center</Link>
            <span className="bpost-guide-pillar">{post.pillar}</span>
            <h1 className="bpost-guide-title">{post.title}</h1>
            <div className="bpost-guide-meta">
              <span>{formatDate(post.published_at)}</span>
              {mins && <><span className="bpost-guide-dot">·</span><span>{mins} min read</span></>}
            </div>
          </div>
        </header>

        <main className="bpost-guide-main">
          <div className="container bpost-guide-layout">
            <article className="bpost-body bpost-guide-body">
              {post.body
                ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={GUIDE_MD_COMPONENTS}>{post.body}</ReactMarkdown>
                : (
                  <div className="bpost-no-body">
                    <p>Full article coming soon.</p>
                    <Link to="/help" className="btn btn-primary">Back to Help Center</Link>
                  </div>
                )
              }
            </article>
          </div>
        </main>

        {more.length > 0 && (
          <section className="bpost-more">
            <div className="container bpost-guide-layout">
              <p className="bpost-more-label">More guides</p>
              <div className="bpost-more-grid">
                {more.map(p => (
                  <Link key={p.id} to={`/blog/${p.slug}`} className="bpost-more-card">
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

  return (
    <div className="bpost-page">

      {/* ── Header: split hero ── */}
      <header className="bpost-header">

        {/* Left — image */}
        <div className="bpost-header-img">
          {post.hero_image_url
            ? <img src={post.hero_image_url} alt={post.title} className="bpost-header-img-el" />
            : (
              <div className="bpost-header-img-ph">
                <span className="bpost-hero-img-icon">▭</span>
                {post.hero_image_brief && (
                  <span className="bpost-hero-img-brief">{post.hero_image_brief}</span>
                )}
              </div>
            )
          }
        </div>

        {/* Right — content */}
        <div className="bpost-header-content">
          <Link to="/blog" className="bpost-back">← Blog</Link>

          <h1 className="bpost-title">{post.title}</h1>

          <span className="bpost-date">{formatDate(post.published_at)}</span>

          {/* Share */}
          <div className="bpost-share">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="bpost-share-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              Share
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(post.title)}`}
              target="_blank" rel="noopener noreferrer"
              className="bpost-share-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Post
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="bpost-share-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
              Share
            </a>
            <button className="bpost-share-btn" onClick={copyLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Copy
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="bpost-main">
        <div className="container bpost-layout">
          <article className="bpost-body">
            {post.body
              ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{post.body}</ReactMarkdown>
              : (
                <div className="bpost-no-body">
                  <p>Full article coming soon.</p>
                  <Link to="/blog" className="btn btn-primary">Back to Blog</Link>
                </div>
              )
            }
          </article>
        </div>
      </main>

      {/* ── More posts ── */}
      {more.length > 0 && (
        <section className="bpost-more">
          <div className="container">
            <p className="bpost-more-label">More from the blog</p>
            <div className="bpost-more-grid">
              {more.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="bpost-more-card">
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
