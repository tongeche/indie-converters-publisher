import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { fetchBook, fetchAuthorBooks } from '../lib/api';
import './BookDetail.css';

export default function BookDetail() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchBook(id).then(b => {
      setBook(b);
      if (b?.authorId) {
        fetchAuthorBooks(b.authorId).then(books =>
          setRelated(books.filter(r => r.slug !== id))
        );
      }
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="book-detail"><div className="detail-hero" /><div className="container" style={{padding:'80px 24px',color:'var(--ink-soft)'}}>Loading…</div></div>;
  if (!book) return <Navigate to="/browse" replace />;

  return (
    <div className="book-detail">
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

      <div className="container detail-layout">
        <div className="detail-cover-col">
          <div className="detail-cover-wrap">
            <BookCover title={book.title} author={book.author} colorClass={book.coverColor} size="lg" />
          </div>
          <div className="detail-cover-actions">
            <button
              className={`btn ${saved ? 'btn-primary' : 'btn-outline'} save-btn`}
              onClick={() => setSaved(s => !s)}
            >
              {saved ? '♥ Saved' : '♡ Save for later'}
            </button>
          </div>
        </div>

        <div className="detail-info-col">
          <div className="detail-genre eyebrow">{book.genre}</div>
          <h1 className="detail-title">{book.title}</h1>
          <Link to={`/author/${book.authorId}`} className="detail-author-link">
            by {book.author}
          </Link>
          {book.rating && (
            <div style={{ marginBottom: 16, color: 'var(--ochre)', fontWeight: 600 }}>
              ★ {book.rating} on Goodreads
            </div>
          )}

          <p className="detail-blurb">{book.blurb}</p>

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

          <a href={book.buyLink} className="btn btn-primary detail-buy-btn" target="_blank" rel="noreferrer">
            Where to buy →
          </a>
          <p className="detail-disclaimer">
            Indie Converters does not sell books directly. The button above links to wherever this author sells their work.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="more-from-author">
          <div className="container">
            <div className="eyebrow">Same author</div>
            <h2>More from {book.author}</h2>
            <div className="related-grid">
              {related.map(b => (
                <Link to={`/book/${b.slug}`} key={b.slug} className="book-card">
                  <BookCover title={b.title} author={b.author} colorClass={b.coverColor} size="sm" />
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
