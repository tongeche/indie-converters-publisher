import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCover from '../components/BookCover';
import { fetchSavedBooks, toggleSave } from '../lib/api';
import SEO from '../components/SEO';
import './SavedBooks.css';

export default function SavedBooks() {
  const { user } = useAuth();
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchSavedBooks(user.id).then(b => { setBooks(b); setLoading(false); });
  }, [user?.id]);

  async function handleUnsave(book) {
    if (removing) return;
    setRemoving(book.dbId);
    try {
      await toggleSave(book.dbId, user.id);
      setBooks(prev => prev.filter(b => b.dbId !== book.dbId));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="saved-page">
      <SEO title="Saved Books | IndieConverters" description="Books you've saved to read later." path="/saved" />
      <div className="container">

        <header className="saved-header">
          <div className="saved-header-left">
            <span className="eyebrow">Your Library</span>
            <h1>Saved Books</h1>
            {!loading && (
              <p className="saved-count">
                {books.length === 0
                  ? 'No saved books yet'
                  : `${books.length} title${books.length === 1 ? '' : 's'}`
                }
              </p>
            )}
          </div>
          <Link to="/browse" className="btn btn-secondary saved-browse-btn">
            Browse more books →
          </Link>
        </header>

        {loading ? (
          <div className="saved-loading">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="saved-skeleton" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="saved-empty">
            <div className="saved-empty-icon">♡</div>
            <h2>Your reading list is empty</h2>
            <p>Tap the ♡ heart on any book page to save titles you want to read later.</p>
            <Link to="/browse" className="btn btn-primary">Browse the catalogue</Link>
          </div>
        ) : (
          <div className="saved-grid">
            {books.map(book => (
              <div key={book.dbId} className="saved-card">
                <Link to={`/book/${book.slug}`} className="saved-card-inner">
                  <BookCover
                    title={book.title}
                    author={book.author}
                    colorClass={book.coverColor}
                    coverUrl={book.coverUrl}
                  />
                  <div className="saved-card-meta">
                    {book.genres?.[0] && (
                      <span className="card-genre">
                        {book.genres[0].replace(/-/g, ' ')}
                      </span>
                    )}
                    <span className="card-title">{book.title}</span>
                    <span className="card-author">{book.author}</span>
                    {book.rating && <span className="card-price">★ {book.rating}</span>}
                  </div>
                </Link>
                <button
                  className={`saved-unsave-btn${removing === book.dbId ? ' removing' : ''}`}
                  onClick={() => handleUnsave(book)}
                  title="Remove from saved"
                  disabled={removing === book.dbId}
                >
                  ♥
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
