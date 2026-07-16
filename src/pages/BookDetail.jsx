import { useState, useEffect } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BookCover from '../components/BookCover';
import BookDiscoveryBar from '../components/BookDiscoveryBar';
import SEO from '../components/SEO';
import { fetchBook, fetchRelatedBooks, toggleSave, checkSaved, addToCart } from '../lib/api';
import { convertToDisplayCurrency, formatDisplayMoney, isConvertedCurrency } from '../lib/currency';
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

function retailerDisplayName(link, book) {
  if (link.slug === 'publisher-site' && book.publisher) return book.publisher;
  if (/publisher/i.test(link.label) && book.publisher) return book.publisher;
  return link.label;
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
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [copied,      setCopied]     = useState(false);
  const [buyingNow,   setBuyingNow]  = useState(false);
  const [searchValue, setSearchValue] = useState('');

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = searchValue.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse');
  }

  useEffect(() => {
    setLoading(true);
    setBuyModalOpen(false);
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

  async function handleBuyNow() {
    if (!user) { navigate('/login', { state: { from: `/book/${book.id}` } }); return; }
    if (buyingNow) return;
    setBuyingNow(true);
    try {
      await addToCart(user.id, book, 1);
      navigate('/checkout');
    } catch (err) {
      console.error('[handleBuyNow] failed:', err?.message ?? err);
    } finally {
      setBuyingNow(false);
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

  const searchBar = (
    <form onSubmit={handleSearchSubmit}>
      <BookDiscoveryBar
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Search for another book…"
        className="bd-search-bar"
      />
    </form>
  );

  if (loading) return (
    <div className="bd-page">
      {searchBar}
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

  const primaryGenreLabel = book.genres?.[0]
    ? book.genres[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : null;

  const buyLinks = book.buyLinks?.length > 0
    ? book.buyLinks
    : book.buyLink ? [{ label: 'Get book', url: book.buyLink }] : [];
  const pricedBuyLinks = buyLinks
    .map(link => ({
      link,
      displayPrice: link.price != null ? convertToDisplayCurrency(link.price, link.currency) : null,
    }))
    .filter(item => item.displayPrice != null);
  const bestDisplayPrice = pricedBuyLinks.length
    ? Math.min(...pricedBuyLinks.map(item => item.displayPrice))
    : null;

  return (
    <div className="bd-page">
      <SEO
        title={`${book.title} by ${book.author} | IndieConverters`}
        description={book.blurb ? book.blurb.slice(0, 155) : `${book.title} by ${book.author} — an independently published book on IndieConverters.`}
        path={`/book/${id}`}
      />

      {searchBar}

      {/* ═══════════════ HERO — mirrors the "Weekly pick" feature card ═══════════════ */}
      <section className="bd-hero">
        <div className="container">
          <article className="bd-feature">
            <div className="bd-cover-stage">
              <div className="bd-cover-mockup">
                <BookCover title={book.title} author={book.author} colorClass={book.coverColor} coverUrl={book.coverUrl} size="lg" />
              </div>
              <span className="bd-cover-glow" aria-hidden="true" />
            </div>

            <div className="bd-content">
              <div className="bd-label-row">
                {genreLabel && (
                  <Link to={`/browse?genre=${book.genre}`} className="bd-label-chip">{genreLabel}</Link>
                )}
                <span className="bd-label-chip bd-label-chip--muted">Book</span>
              </div>

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

              {metaPills.length > 0 && <p className="bd-meta-line">{metaPills.join(' · ')}</p>}

              {book.blurb && (
                <div className="bd-blurb">
                  {book.blurb.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )}

              <div className="bd-feature-footer">
                {book.isDirectSale ? (
                  <div className="bd-price-block">
                    <span>Direct from the author</span>
                    <strong>{formatDisplayMoney(book.directSalePrice, 'USD')}</strong>
                  </div>
                ) : bestDisplayPrice != null && (
                  <div className="bd-price-block">
                    <span>Available from retailers</span>
                    <strong>{formatDisplayMoney(bestDisplayPrice, 'EUR')}</strong>
                  </div>
                )}

                <div className="bd-feature-actions">
                  {book.isDirectSale ? (
                    <button
                      className="bd-buy-btn bd-buy-btn--primary"
                      onClick={handleBuyNow}
                      disabled={buyingNow}
                    >
                      {buyingNow ? 'Adding…' : 'Get now'} <span aria-hidden="true">→</span>
                    </button>
                  ) : buyLinks.length > 0 && (
                    <button className="bd-buy-btn bd-buy-btn--primary" onClick={() => setBuyModalOpen(true)}>
                      Get it <span aria-hidden="true">→</span>
                    </button>
                  )}

                  <button
                    className={`bd-icon-btn${saved ? ' bd-icon-btn--saved' : ''}`}
                    onClick={handleSave}
                    disabled={savePending}
                  >
                    <svg viewBox="0 0 20 20" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                      <path d="M10 17s-7-4.35-7-9a5 5 0 0 1 7-4.58A5 5 0 0 1 17 8c0 4.65-7 9-7 9z"/>
                    </svg>
                    <span>{saved ? 'Saved' : 'Save'}</span>
                  </button>

                  <button className="bd-icon-btn" onClick={handleShare}>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
                      <path d="M10 3v10M6 7l4-4 4 4"/><path d="M4 13v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3"/>
                    </svg>
                    <span>{copied ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bd-more">
          <div className="container">
            <div className="bd-more-head">
              <h2 className="bd-section-title bd-more-title">
                {primaryGenreLabel ? `More in ${primaryGenreLabel}` : 'Similar titles'}
              </h2>
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

      {buyModalOpen && (
        <div className="bd-retailer-modal-backdrop" role="presentation" onClick={() => setBuyModalOpen(false)}>
          <section
            className="bd-retailer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bd-retailer-title"
            onClick={event => event.stopPropagation()}
          >
            <button type="button" className="bd-retailer-close" onClick={() => setBuyModalOpen(false)} aria-label="Close retailer options">×</button>
            <div className="bd-retailer-head">
              <div>
                <span className="bd-retailer-eyebrow">Retailer options</span>
                <h2 id="bd-retailer-title">Select store</h2>
              </div>
            </div>

            <div className="bd-retailer-list">
              {buyLinks.map(link => (
                <a
                  key={`${link.slug ?? link.label}-${link.url}`}
                  href={link.url}
                  className="bd-retailer-option"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setBuyModalOpen(false)}
                >
                  <span className="bd-retailer-label">
                    <strong>{retailerDisplayName(link, book)}</strong>
                    <span>
                      {link.price != null && bestDisplayPrice != null && convertToDisplayCurrency(link.price, link.currency) === bestDisplayPrice && (
                        <em className="bd-buy-best-badge">Best price</em>
                      )}
                      {link.verified && (
                        <em className="bd-buy-verified-badge" title="Automatically cross-checked against Google Books">Verified</em>
                      )}
                    </span>
                  </span>
                  <span className="bd-retailer-right">
                    {link.price != null ? <b>{formatDisplayMoney(link.price, link.currency)}</b> : <small>No price listed</small>}
                  </span>
                </a>
              ))}
            </div>

            <p className="bd-retailer-disclaimer">
              Prices are shown in EUR{buyLinks.some(link => link.price != null && isConvertedCurrency(link.currency)) ? ' as converted estimates' : ''}. Final prices, taxes, delivery, and availability are confirmed on the retailer site.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
