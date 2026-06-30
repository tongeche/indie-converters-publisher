import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { fetchBook, fetchAuthorBooks } from '../lib/api';
import './BookDetail.css';

function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="meta-row">
      <span className="meta-label">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  );
}

function Stars({ rating }) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="star-row" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(empty)}
      <span className="star-num">{rating}</span>
    </span>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook]         = useState(null);
  const [related, setRelated]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saved, setSaved]       = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchBook(id).then(b => {
      setBook(b);
      if (b?.authorId) {
        fetchAuthorBooks(b.authorId).then(books =>
          setRelated(books.filter(r => r.slug !== id).slice(0, 4))
        );
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="book-detail">
      <div className="detail-hero" />
      <div className="container" style={{ padding: '80px 24px', color: 'var(--ink-soft)' }}>Loading…</div>
    </div>
  );
  if (!book) return <Navigate to="/browse" replace />;

  const genreLabels = book.genres.join(', ');
  const formatList  = book.formats.join(' · ');

  return (
    <div className="book-detail">
      {/* Breadcrumb strip */}
      <div className="detail-hero">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span>·</span>
            <Link to="/browse">Browse</Link>
            <span>·</span>
            <span>{book.title}</span>
          </nav>
        </div>
      </div>

      {/* Main layout */}
      <div className="container detail-layout">

        {/* ── Left: cover + actions ── */}
        <aside className="detail-cover-col">
          <div className="detail-cover-wrap">
            <BookCover
              title={book.title}
              author={book.author}
              colorClass={book.coverColor}
              coverUrl={book.coverUrl}
              size="lg"
            />
          </div>

          {/* Buy links */}
          {book.buyLinks && book.buyLinks.length > 0 ? (
            <div className="detail-buy-links">
              {book.buyLinks.map(link => (
                <a
                  key={link.slug}
                  href={link.url}
                  className="btn btn-primary detail-buy-btn"
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          ) : (
            <a href={book.buyLink} className="btn btn-primary detail-buy-btn" target="_blank" rel="noreferrer">
              Where to buy →
            </a>
          )}

          <button
            className={`btn ${saved ? 'btn-primary' : 'btn-outline'} save-btn`}
            onClick={() => setSaved(s => !s)}
          >
            {saved ? '♥ Saved' : '♡ Save for later'}
          </button>

          <p className="detail-disclaimer">
            Indie Converters doesn't sell books directly. Links above go to where you can find this title.
          </p>
        </aside>

        {/* ── Right: info ── */}
        <div className="detail-info-col">
          {/* Genre + title */}
          <div className="detail-genre eyebrow">{genreLabels || book.genre}</div>
          <h1 className="detail-title">{book.title}</h1>
          {book.subtitle && <p className="detail-subtitle">{book.subtitle}</p>}

          {/* Author(s) */}
          <div className="detail-authors">
            {book.authors.length > 0 ? book.authors.map((a, i) => (
              <span key={a.slug}>
                {i > 0 && <span className="author-sep"> &amp; </span>}
                <Link to={`/author/${a.slug}`} className="detail-author-link">
                  {a.display_name}
                </Link>
              </span>
            )) : (
              <span className="detail-author-link">{book.author}</span>
            )}
          </div>

          {/* Rating */}
          {book.rating && (
            <div className="detail-rating">
              <Stars rating={book.rating} />
              <span className="rating-source">Goodreads</span>
            </div>
          )}

          {/* Description */}
          <div className="detail-description">
            {(book.blurb || '').split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Sample */}
          {book.sample && (
            <div className="sample-panel">
              <button className="sample-toggle" onClick={() => setSampleOpen(o => !o)}>
                <span className="sample-dot">··</span>
                {sampleOpen ? 'Close sample' : 'Read the first pages'}
                <span className="sample-arrow">{sampleOpen ? '↑' : '↓'}</span>
              </button>
              {sampleOpen && (
                <div className="sample-content">
                  {book.sample.map((para, i) => <p key={i}>{para}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Subjects / keywords */}
          {book.keywords.length > 0 && (
            <div className="detail-subjects">
              <div className="eyebrow" style={{ marginBottom: 10 }}>Subjects</div>
              <div className="subject-tags">
                {book.keywords.map(k => (
                  <Link key={k} to={`/browse?q=${encodeURIComponent(k)}`} className="subject-tag">
                    {k.replace(/-/g, ' ')}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Metadata panel */}
          <div className="detail-meta-panel">
            <div className="eyebrow" style={{ marginBottom: 12 }}>·· Book details</div>
            <div className="meta-grid">
              <MetaRow label="Published"  value={book.pubYear}                         />
              <MetaRow label="Publisher"  value={book.publisher}                       />
              <MetaRow label="Pages"      value={book.pageCount ? `${book.pageCount} pages` : null} />
              <MetaRow label="Language"   value={book.language}                        />
              <MetaRow label="Formats"    value={formatList || null}                   />
              <MetaRow label="ISBN"       value={book.isbn}                            />
            </div>
          </div>
        </div>
      </div>

      {/* Related books */}
      {related.length > 0 && (
        <section className="more-from-author">
          <div className="container">
            <div className="eyebrow">Same author</div>
            <h2>More from {book.author}</h2>
            <div className="related-grid">
              {related.map(b => (
                <Link to={`/book/${b.slug}`} key={b.slug} className="book-card">
                  <BookCover title={b.title} author={b.author} colorClass={b.coverColor} coverUrl={b.coverUrl} size="sm" />
                  <div className="book-card-meta">
                    <span className="card-genre">{b.genre}</span>
                    <span className="card-title">{b.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
