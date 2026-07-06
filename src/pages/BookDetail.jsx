import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BookCover from '../components/BookCover';
import SEO from '../components/SEO';
import { fetchBook, fetchRelatedBooks, toggleSave, checkSaved } from '../lib/api';
import './BookDetail.css';

function Stars({ rating }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="bd-stars" aria-label={`${rating} out of 5`}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
      <span className="bd-star-num">{rating}</span>
    </span>
  );
}

/* Extract dominant color from an <img> element via canvas */
function extractColor(imgEl) {
  try {
    const c = document.createElement('canvas');
    c.width = 12; c.height = 18;
    const ctx = c.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, 12, 18);
    const d = ctx.getImageData(0, 0, 12, 18).data;
    let r = 0, g = 0, b = 0, n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; }
    return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
  } catch {
    return null;
  }
}

function heroGradient(c) {
  if (!c) return { background: 'linear-gradient(175deg,#3a3a3c 0%,#1c1c1e 100%)' };
  const t = `rgb(${Math.round(c.r*.38)},${Math.round(c.g*.38)},${Math.round(c.b*.38)})`;
  const b = `rgb(${Math.round(c.r*.18)},${Math.round(c.g*.18)},${Math.round(c.b*.18)})`;
  return { background: `linear-gradient(175deg, ${t} 0%, ${b} 100%)` };
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book,        setBook]       = useState(null);
  const [related,     setRelated]    = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [saved,       setSaved]      = useState(false);
  const [savePending, setSavePending] = useState(false);
  const [heroColor,   setHeroColor]  = useState(null);
  const [coverCorsBlocked, setCoverCorsBlocked] = useState(false);
  const [buyOpen,     setBuyOpen]    = useState(false);
  const [menuOpen,    setMenuOpen]   = useState(false);
  const [copied,      setCopied]     = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setHeroColor(null);
    setCoverCorsBlocked(false);
    setBuyOpen(false);
    fetchBook(id).then(b => {
      setBook(b);
      if (b) {
        supabase.rpc('increment_book_view', { book_slug: id });
        if (b.genres?.length) fetchRelatedBooks(id, b.genres, b.pubYear).then(setRelated);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!book?.dbId || !user) { setSaved(false); return; }
    checkSaved(book.dbId, user.id).then(setSaved);
  }, [book?.dbId, user?.id]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    if (!buyOpen && !menuOpen) return;
    function handler(e) {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setBuyOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [buyOpen, menuOpen]);

  const handleCoverLoad = useCallback((e) => {
    const color = extractColor(e.currentTarget);
    if (color) setHeroColor(color);
  }, []);

  // Some cover hosts (e.g. Google Books) don't send CORS headers, so the
  // crossOrigin="anonymous" load fails outright — retry once without it so
  // the cover still displays (just without the dominant-color extraction).
  const handleCoverError = useCallback(() => {
    setCoverCorsBlocked(blocked => blocked ? blocked : true);
  }, []);

  function handleTiltMove(e) {
    const el = e.currentTarget;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    const ry =  (x - 0.5) * 24;
    const rx = -(y - 0.5) * 18;
    el.style.transition = 'transform 60ms linear, box-shadow 60ms linear';
    el.style.setProperty('--rx',   `${rx}deg`);
    el.style.setProperty('--ry',   `${ry}deg`);
    el.style.setProperty('--rx-v', rx);
    el.style.setProperty('--ry-v', ry);
    el.style.setProperty('--gx',   `${x * 100}%`);
    el.style.setProperty('--gy',   `${y * 100}%`);
    el.style.setProperty('--g-op', 1);
    el.style.setProperty('--sc',   1.04);
  }

  function handleTiltLeave(e) {
    const el = e.currentTarget;
    el.style.transition = 'transform 550ms cubic-bezier(0.2,0,0.2,1), box-shadow 550ms cubic-bezier(0.2,0,0.2,1)';
    el.style.setProperty('--rx',   '0deg');
    el.style.setProperty('--ry',   '0deg');
    el.style.setProperty('--rx-v', 0);
    el.style.setProperty('--ry-v', 0);
    el.style.setProperty('--g-op', 0);
    el.style.setProperty('--sc',   1);
  }

  async function handleSave() {
    if (!user) { navigate('/login', { state: { from: `/book/${book.id}` } }); return; }
    if (savePending) return;
    setSavePending(true);
    try {
      const newState = await toggleSave(book.dbId, user.id);
      setSaved(newState);
    } catch (err) {
      console.error('[handleSave] failed:', err?.message ?? err);
    } finally {
      setSavePending(false);
    }
  }

  async function handleShare() {
    const shareData = {
      title: book.title,
      text: `${book.title} by ${book.author} — on Indie Converters`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  }

  if (loading) return (
    <div className="bd-page">
      <div className="bd-hero bd-hero--loading" />
    </div>
  );
  if (!book) return <Navigate to="/browse" replace />;

  const metaPills = [
    book.language,
    book.pubYear,
    book.pageCount ? `${book.pageCount.toLocaleString()} pages` : null,
  ].filter(Boolean);

  const genreLabel = book.genres?.map(g =>
    g.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  ).join(' · ') || book.genre;

  const buyLinks = book.buyLinks?.length > 0
    ? book.buyLinks
    : book.buyLink ? [{ label: 'Get book', url: book.buyLink }] : [];

  return (
    <div className="bd-page">
      <SEO
        title={`${book.title} by ${book.author} | IndieConverters`}
        description={book.blurb ? book.blurb.slice(0, 155) : `${book.title} by ${book.author} — an independently published book on IndieConverters.`}
        path={`/book/${id}`}
      />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="bd-hero" style={heroGradient(heroColor)}>

        {/* Mobile-only top-right action buttons: + (save) and ··· (more/share) */}
        <div className="bd-hero-actions">
          {/* + Save */}
          <button
            className={`bd-hero-action-btn${saved ? ' bd-hero-action-btn--saved' : ''}`}
            onClick={handleSave}
            disabled={savePending}
            aria-label={saved ? 'Saved' : 'Save'}
          >
            {saved
              ? <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M10 17s-7-4.35-7-9a5 5 0 0 1 7-4.58A5 5 0 0 1 17 8c0 4.65-7 9-7 9z"/></svg>
              : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" width="20" height="20"><path d="M10 4v12M4 10h12"/></svg>
            }
          </button>

          {/* ··· More (opens share + other options) */}
          <div className="bd-menu-wrap">
            <button
              className={`bd-hero-action-btn${menuOpen ? ' bd-hero-action-btn--active' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="More options"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
              </svg>
            </button>
            {menuOpen && (
              <div className="bd-menu-dropdown">
                <button className="bd-menu-item" onClick={() => { handleShare(); setMenuOpen(false); }}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                    <path d="M10 3v10M6 7l4-4 4 4"/><path d="M4 13v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3"/>
                  </svg>
                  <span>{copied ? 'Link copied!' : 'Share'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="container bd-hero-inner">

          {/* Cover */}
          <div className="bd-cover-wrap">
            <div
              className="bd-cover-mockup"
              onMouseMove={handleTiltMove}
              onMouseLeave={handleTiltLeave}
            >
              {book.coverUrl
                ? <img
                    key={`${book.coverUrl}-${coverCorsBlocked}`}
                    src={book.coverUrl}
                    alt={book.title}
                    className="bd-cover-img"
                    crossOrigin={coverCorsBlocked ? undefined : 'anonymous'}
                    onLoad={handleCoverLoad}
                    onError={coverCorsBlocked ? undefined : handleCoverError}
                  />
                : <BookCover title={book.title} author={book.author} colorClass={book.coverColor} size="lg" />
              }
              <div className="bd-cover-spine" />
              <div className="bd-cover-glare" />
            </div>
          </div>

          {/* Info column */}
          <div className="bd-info">
            {genreLabel && (
              <Link to={`/browse?genre=${book.genre}`} className="bd-genre-tag">
                {genreLabel}
              </Link>
            )}

            <h1 className="bd-title">{book.title}</h1>
            {book.subtitle && <p className="bd-subtitle">{book.subtitle}</p>}

            <div className="bd-authors">
              {book.authors.length > 0
                ? book.authors.map((a, i) => (
                    <span key={a.slug}>
                      {i > 0 && <span className="bd-author-sep"> &amp; </span>}
                      <Link to={`/author/${a.slug}`} className="bd-author-link">
                        {a.display_name} <span className="bd-author-arrow">›</span>
                      </Link>
                    </span>
                  ))
                : <span className="bd-author-link">{book.author}</span>
              }
            </div>

            {book.rating > 0 && (
              <div className="bd-rating-row">
                <Stars rating={book.rating} />
                <span className="bd-rating-source">Goodreads</span>
              </div>
            )}

            {/* Buy card */}
            <div className="bd-buy-card">
              <div className="bd-buy-card-left">
                <span className="bd-buy-type">Book</span>
                {metaPills.length > 0 && (
                  <span className="bd-buy-meta">{metaPills.join(' · ')}</span>
                )}
              </div>

              {/* Actions row */}
              <div className="bd-actions" ref={actionsRef}>
                <div className="bd-actions-row">
                  {/* Get it button */}
                  {buyLinks.length > 0 && (
                    <div className="bd-buy-wrap">
                      <button
                        className={`bd-buy-btn${buyOpen ? ' active' : ''}`}
                        onClick={() => { setBuyOpen(o => !o); setMenuOpen(false); }}
                      >
                        {book.price ? `Get it · $${book.price}` : 'Get it'}
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" width="12" height="12" className={`bd-chevron${buyOpen ? ' open' : ''}`}><path d="M4 6l4 4 4-4"/></svg>
                      </button>

                      {buyOpen && (
                        <div className="bd-buy-dropdown">
                          {buyLinks.map(link => (
                            <a
                              key={link.slug ?? link.label}
                              href={link.url}
                              className="bd-buy-option"
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setBuyOpen(false)}
                            >
                              <span className="bd-buy-option-label">{link.label}</span>
                              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ··· more menu: Save + Share — desktop only, hidden on mobile */}
                  <div className="bd-menu-wrap bd-menu-wrap--desktop">
                    <button
                      className={`bd-menu-btn${menuOpen ? ' active' : ''}`}
                      onClick={() => { setMenuOpen(o => !o); setBuyOpen(false); }}
                      aria-label="More options"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
                        <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
                      </svg>
                    </button>

                    {menuOpen && (
                      <div className="bd-menu-dropdown">
                        <button
                          className={`bd-menu-item${saved ? ' bd-menu-item--saved' : ''}`}
                          onClick={() => { handleSave(); setMenuOpen(false); }}
                          disabled={savePending}
                        >
                          <svg viewBox="0 0 20 20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                            <path d="M10 17s-7-4.35-7-9a5 5 0 0 1 7-4.58A5 5 0 0 1 17 8c0 4.65-7 9-7 9z"/>
                          </svg>
                          <span>{saved ? 'Saved' : 'Save'}</span>
                        </button>

                        <button className="bd-menu-item" onClick={() => { handleShare(); setMenuOpen(false); }}>
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                            <path d="M10 3v10M6 7l4-4 4 4"/><path d="M4 13v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3"/>
                          </svg>
                          <span>{copied ? 'Link copied!' : 'Share'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {book.blurb && (
              <div className="bd-hero-excerpt">
                <span className="bd-hero-excerpt-label">Excerpt</span>
                {book.blurb.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div className="bd-content">
        <div className="container bd-content-inner">

        </div>

        {related.length > 0 && (
          <section className="bd-more">
            <div className="container">
              <div className="bd-more-head">
                <h2 className="bd-section-title bd-more-title">We think you might like</h2>
              </div>
            </div>
            <div className="bd-more-scroll-wrap">
              <div className="bd-more-scroll">
                {related.filter(b => b.coverUrl).map(b => (
                  <Link to={`/book/${b.slug}`} key={b.slug} className="bd-related-card">
                    <div className="bd-related-cover">
                      {b.coverUrl
                        ? <img src={b.coverUrl} alt={b.title} />
                        : <BookCover title={b.title} author={b.author} colorClass={b.coverColor} size="sm" />
                      }
                    </div>
                    <span className="bd-related-title">{b.title}</span>
                    {b.price > 0 && <span className="bd-related-price">${b.price}</span>}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
