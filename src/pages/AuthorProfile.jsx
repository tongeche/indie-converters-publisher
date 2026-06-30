import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { fetchAuthor, fetchAuthorBooks } from '../lib/api';
import './AuthorProfile.css';

export default function AuthorProfile() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAuthor(id), fetchAuthorBooks(id)])
      .then(([a, b]) => { setAuthor(a); setBooks(b); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="author-profile"><div className="author-hero" /><div className="container" style={{padding:'80px 24px',color:'var(--ink-soft)'}}>Loading…</div></div>;
  if (!author) return <Navigate to="/browse" replace />;

  const initials = author.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="author-profile">
      <div className="author-hero">
        <div className="container author-hero-inner">
          <div className="author-avatar">
            {author.photo_url
              ? <img src={author.photo_url} alt={author.display_name} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
              : <span>{initials}</span>
            }
          </div>
          <div className="author-meta">
            <div className="eyebrow" style={{ color: 'var(--ochre)' }}>Author</div>
            <h1>{author.display_name}</h1>
            <div className="author-stats">
              <span><strong>{books.length}</strong> {books.length === 1 ? 'book' : 'books'}</span>
            </div>
            <button
              className={`btn ${following ? 'btn-primary' : 'btn-ghost'} follow-btn`}
              onClick={() => setFollowing(f => !f)}
            >
              {following ? '✓ Following' : '+ Follow'}
            </button>
          </div>
        </div>
      </div>

      <div className="container author-body">
        <div className="author-bio-col">
          <div className="eyebrow">About</div>
          <p className="author-bio">{author.short_bio || author.long_bio}</p>
          {author.website_url && (
            <div className="author-social">
              <a href={author.website_url} className="social-link" target="_blank" rel="noreferrer">Website</a>
            </div>
          )}
        </div>

        <div className="author-books-col">
          <div className="eyebrow">Books</div>
          <h2>{author.display_name}'s work</h2>
          <div className="author-book-grid">
            {books.map(book => (
              <Link to={`/book/${book.slug}`} key={book.slug} className="author-book-card">
                <div className="author-book-cover-wrap">
                  <BookCover title={book.title} author={book.author} colorClass={book.coverColor} />
                </div>
                <div className="author-book-info">
                  <span className="card-genre">{book.genre}</span>
                  <h3>{book.title}</h3>
                  {book.blurb && <p className="author-book-blurb">{book.blurb}</p>}
                  {book.rating && <span className="card-price">★ {book.rating}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
