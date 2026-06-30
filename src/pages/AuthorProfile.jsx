import { useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { getAuthor, getAuthorBooks } from '../lib/data';
import './AuthorProfile.css';

export default function AuthorProfile() {
  const { id } = useParams();
  const author = getAuthor(id);
  const [following, setFollowing] = useState(false);

  if (!author) return <Navigate to="/browse" replace />;

  const books = getAuthorBooks(id);
  const followerCount = author.followers + (following ? 1 : 0);

  return (
    <div className="author-profile">
      <div className="author-hero">
        <div className="container author-hero-inner">
          <div className="author-avatar">
            <span>{author.initials}</span>
          </div>
          <div className="author-meta">
            <div className="eyebrow" style={{ color: 'var(--ochre)' }}>Author</div>
            <h1>{author.name}</h1>
            <div className="author-stats">
              <span><strong>{books.length}</strong> {books.length === 1 ? 'book' : 'books'}</span>
              <span className="stat-sep">·</span>
              <span><strong>{followerCount.toLocaleString()}</strong> followers</span>
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
          <p className="author-bio">{author.bio}</p>
          {author.social && (
            <div className="author-social">
              {author.social.twitter && <a href={author.social.twitter} className="social-link">Twitter / X</a>}
              {author.social.instagram && <a href={author.social.instagram} className="social-link">Instagram</a>}
            </div>
          )}
        </div>

        <div className="author-books-col">
          <div className="eyebrow">Books</div>
          <h2>{author.name}'s work</h2>
          <div className="author-book-grid">
            {books.map(book => (
              <Link to={`/book/${book.id}`} key={book.id} className="author-book-card">
                <div className="author-book-cover-wrap">
                  <BookCover title={book.title} author={book.author} colorClass={book.coverColor} />
                </div>
                <div className="author-book-info">
                  <span className="card-genre">{book.genre}</span>
                  <h3>{book.title}</h3>
                  {book.blurb && <p className="author-book-blurb">{book.blurb}</p>}
                  <span className="card-price">${book.price?.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
