import { useState, useEffect } from 'react';
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import BookCover from '../components/BookCover';
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

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book,        setBook]       = useState(null);
  const [related,     setRelated]    = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [saved,       setSaved]      = useState(false);
  const [savePending, setSavePending] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchBook(id).then(b => {
      setBook(b);
      if (b) {
        supabase.rpc('increment_book_view', { book_slug: id });
        if (b.genres?.length) {
          fetchRelatedBooks(id, b.genres, b.pubYear).then(setRelated);
        }
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!book?.dbId || !user) { setSaved(false); return; }
    checkSaved(book.dbId, user.id).then(setSaved);
  }, [book?.dbId, user?.id]);

  async function handleSave() {
    if (!user) { navigate('/login'); return; }
    if (savePending) return;
    setSavePending(true);
    try {
      const newState = await toggleSave(book.dbId, user.id);
      setSaved(newState);
    } finally {
      setSavePending(false);
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

  return (
    <div className="bd-page">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="bd-hero">
        <div className="container bd-hero-inner">

          {/* Cover — 3-D mockup */}
          <div className="bd-cover-wrap">
            <div className="bd-cover-mockup">
              {book.coverUrl
                ? <img src={book.coverUrl} alt={book.title} className="bd-cover-img" />
                : <BookCover title={book.title} author={book.author} colorClass={book.coverColor} size="lg" />
              }
              {/* spine edge */}
              <div className="bd-cover-spine" />
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

            {book.rating && (
              <div className="bd-rating-row">
                <Stars rating={book.rating} />
                <span className="bd-rating-source">Goodreads</span>
              </div>
            )}

            {/* Buy card — Apple Books style */}
            <div className="bd-buy-card">
              <div className="bd-buy-card-left">
                <span className="bd-buy-type">Book</span>
                {metaPills.length > 0 && (
                  <span className="bd-buy-meta">{metaPills.join(' · ')}</span>
                )}
              </div>
              <div className="bd-buy-card-right">
                {book.buyLinks && book.buyLinks.length > 0 ? (
                  book.buyLinks.slice(0, 2).map(link => (
                    <a
                      key={link.slug}
                      href={link.url}
                      className="bd-buy-btn"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {book.price ? `$${book.price}` : link.label}
                    </a>
                  ))
                ) : (
                  <a href={book.buyLink} className="bd-buy-btn" target="_blank" rel="noreferrer">
                    {book.price ? `$${book.price}` : 'Get book'}
                  </a>
                )}
                <button
                  className={`bd-save-btn ${saved ? 'saved' : ''}`}
                  onClick={handleSave}
                  disabled={savePending}
                >
                  {saved ? '♥ Saved' : '♡ Save'}
                </button>
              </div>
            </div>

            <p className="bd-disclaimer">
              Indie Converters doesn't sell books directly. Links go to where you can buy this title.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTENT ═══════════════ */}
      <div className="bd-content">
        <div className="container bd-content-inner">

          {/* From the Publisher */}
          {book.blurb && (
            <section className="bd-publisher">
              <h2 className="bd-section-title">From the Publisher</h2>
              <div className="bd-description">
                {book.blurb.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </section>
          )}

          {/* Metadata strip */}
          {metaPills.length > 0 && (
            <div className="bd-meta-strip">
              {[
                book.language    && { label: 'Language',  value: book.language  },
                book.pubYear     && { label: 'Published', value: book.pubYear   },
                book.pageCount   && { label: 'Pages',     value: book.pageCount.toLocaleString() },
                book.publisher   && { label: 'Publisher', value: book.publisher },
                book.isbn        && { label: 'ISBN-13',   value: book.isbn      },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} className="bd-meta-cell">
                  <span className="bd-meta-label">{label}</span>
                  <span className="bd-meta-value">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Subject tags */}
          {book.keywords?.length > 0 && (
            <section className="bd-subjects">
              <h2 className="bd-section-title">Subjects</h2>
              <div className="bd-subject-tags">
                {book.keywords.map(k => (
                  <Link key={k} to={`/browse?q=${encodeURIComponent(k)}`} className="bd-subject-tag">
                    {k.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Related books — genre + year similarity */}
        {related.length > 0 && (
          <section className="bd-more">
            <div className="container">
              <div className="bd-more-head">
                <h2 className="bd-section-title bd-more-title">You might also like</h2>
                {book.genres?.length > 0 && (
                  <div className="bd-more-genre-tags">
                    {book.genres.slice(0, 3).map(g => (
                      <Link
                        key={g}
                        to={`/browse?genre=${g}`}
                        className="bd-more-genre-chip"
                      >
                        {g.replace(/-/g, ' ')}
                      </Link>
                    ))}
                  </div>
                )}
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
                    {b.price && <span className="bd-related-price">${b.price}</span>}
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
