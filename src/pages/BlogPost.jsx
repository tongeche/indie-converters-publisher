import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchBlogBySlug, fetchBlogs } from '../lib/api';
import { BLOG_AUTO_LINKS } from '../lib/blogAutoLinks';
import SEO from '../components/SEO';
import './BlogPost.css';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Pulls the plain text out of a markdown AST node so headings with inline
// formatting (bold, links, etc.) still produce a clean, stable slug.
function nodeText(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (node.children) return node.children.map(nodeText).join('');
  return '';
}

function Heading({ level, node, children }) {
  const Tag = `h${level}`;
  const id = slugify(nodeText(node));
  return <Tag id={id}>{children}</Tag>;
}

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

// Inserts real markdown links for the first mention of each auto-link
// keyword — a one-time, pure text transform run on the raw body before it
// reaches ReactMarkdown, so the resulting links are just normal markdown
// (no custom render-time bookkeeping that could be replayed by React's own
// re-renders). Heading lines and image-only lines are left untouched so a
// keyword can't get linked inside a heading or an image caption.
function autoLinkMarkdown(body, currentSlug) {
  if (!body) return body;
  const usedUrls = new Set();
  return body
    .split(/\n{2,}/)
    .map(block => {
      if (/^#{1,6}\s/.test(block) || /^!\[/.test(block)) return block;
      return linkifyBlock(block, usedUrls, currentSlug);
    })
    .join('\n\n');
}

function linkifyBlock(text, usedUrls, currentSlug) {
  for (const entry of BLOG_AUTO_LINKS) {
    if (usedUrls.has(entry.url)) continue;
    if (entry.selfSlug && entry.selfSlug === currentSlug) continue;
    const match = entry.pattern.exec(text);
    if (!match) continue;
    usedUrls.add(entry.url);
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + match[0].length);
    return `${before}[${match[0]}](${entry.url})${linkifyBlock(after, usedUrls, currentSlug)}`;
  }
  return text;
}

const MD_COMPONENTS = {
  // Title is already shown in the hero header — skip any H1 in the body
  h1: () => null,
  h2: ({ node, children }) => <Heading level={2} node={node}>{children}</Heading>,
  h3: ({ node, children }) => <Heading level={3} node={node}>{children}</Heading>,
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
  // Wrapped so wide comparison tables scroll horizontally on narrow screens
  // instead of breaking the page layout.
  table: ({ children }) => <div className="bpost-table-wrap"><table>{children}</table></div>,
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

// Titles like "Book Metadata 101: The Small Details That Help Readers Find
// Your Book" are already written as label + subtitle — split on the real
// colon instead of showing a separate (and often redundant) excerpt line.
function splitTitle(title) {
  const idx = title.indexOf(':');
  if (idx === -1) return { main: title, sub: null };
  return { main: title.slice(0, idx).trim(), sub: title.slice(idx + 1).trim() };
}

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
  const [toc, setToc]        = useState([]);
  const [activeId, setActiveId] = useState('');

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

  // Real table of contents — pulled straight from the post's own ## headings,
  // not a fabricated section list.
  useEffect(() => {
    if (!post?.body) { setToc([]); return; }
    const headings = [...post.body.matchAll(/^## (.+)$/gm)].map(m => {
      const text = m[1].replace(/[*_`]/g, '').trim();
      return { id: slugify(text), text };
    });
    setToc(headings);
  }, [post]);

  useEffect(() => {
    if (toc.length === 0) return undefined;
    const headingEls = toc.map(t => document.getElementById(t.id)).filter(Boolean);
    if (headingEls.length === 0) return undefined;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-15% 0px -75% 0px' }
    );
    headingEls.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [toc]);

  // Fresh per post, so each article gets its own "already linked" tracking
  // and never carries auto-links over from the previous one.
  const processedBody = useMemo(
    () => autoLinkMarkdown(post?.body, post?.slug),
    [post?.body, post?.slug]
  );

  if (loading) {
    return (
      <div className="bpost-page">
        <div className="bpost-skeleton-hero container" />
        <div className="bpost-skeleton-body container" />
      </div>
    );
  }

  const mins = readingTime(post.body);
  const { main: titleMain, sub: titleSub } = splitTitle(post.title);
  const isGuide = post.pillar === 'Getting Started';
  const more = (isGuide ? others.filter(p => p.pillar === 'Getting Started') : others).slice(0, 2);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  function copyLink() {
    navigator.clipboard.writeText(pageUrl).catch(() => {});
  }

  const seo = (
    <SEO
      title={`${post.title} | IndieConverters`}
      description={post.excerpt || `${post.title} — an article from the IndieConverters blog.`}
      path={`/blog/${slug}`}
      image={post.hero_image_url}
    />
  );

  if (isGuide) {
    return (
      <div className="bpost-page">
        {seo}
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
                ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={GUIDE_MD_COMPONENTS}>{processedBody}</ReactMarkdown>
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
      {seo}

      {/* ── Header: centered masthead — title stays pinned as the subtitle
           scrolls up and out from underneath it. ── */}
      <header className="bpost-header">
        <div className="container bpost-header-inner">
          <Link to="/blog" className="bpost-back">← Blog</Link>
        </div>

        <div className="bpost-sticky-title-bar">
          <div className="container">
            <h1 className="bpost-title">{titleMain}</h1>
          </div>
        </div>

        {titleSub && (
          <div className="container bpost-header-inner">
            <p className="bpost-subtitle">{titleSub}</p>
          </div>
        )}

        <div className="container bpost-header-bar">
          <span className="bpost-date">
            {formatDate(post.published_at)}
            {mins && <> · {mins} min read</>}
          </span>

          <div className="bpost-share">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="bpost-share-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              Share
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(post.title)}`}
              target="_blank" rel="noopener noreferrer"
              className="bpost-share-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Post
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="bpost-share-btn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
              Share
            </a>
            <button className="bpost-share-btn" onClick={copyLink}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Copy
            </button>
          </div>
        </div>

        {/* Kept inside the header so the sticky title has a long enough
            runway to stay pinned through the whole hero image, releasing
            right as the article body begins instead of leaving a blank
            gap once the (short) header content runs out. */}
        {post.hero_image_url && (
          <div className="container bpost-hero-banner-wrap">
            <img src={post.hero_image_url} alt={post.title} className="bpost-hero-banner" />
          </div>
        )}
      </header>

      {/* ── Body: sticky table of contents + article ── */}
      <main className="bpost-main">
        <div className="container bpost-layout">
          {toc.length > 0 && (
            <aside className="bpost-toc">
              <span className="bpost-toc-label">On this page</span>
              <nav className="bpost-toc-nav">
                {toc.map(t => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className={`bpost-toc-link${activeId === t.id ? ' active' : ''}`}
                  >
                    {t.text}
                  </a>
                ))}
              </nav>
            </aside>
          )}
          <article className="bpost-body">
            {post.body
              ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>{processedBody}</ReactMarkdown>
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
