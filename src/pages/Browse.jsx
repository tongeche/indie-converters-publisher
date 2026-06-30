import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { fetchBooks, fetchGenres } from '../lib/api';
import './Browse.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'title', label: 'Title A–Z' },
];

export default function Browse() {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') || '';

  const [query, setQuery] = useState('');
  const [activeGenres, setActiveGenres] = useState(initialGenre ? [initialGenre] : []);
  const [sort, setSort] = useState('newest');
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres().then(setGenres);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBooks({ genre: activeGenres[0], query, sort })
      .then(data => {
        // client-side author filter if multiple genres selected
        let list = data;
        if (activeGenres.length > 1) {
          list = data.filter(b => activeGenres.every(g => b.genres.includes(g)));
        }
        // client-side author sort
        if (sort === 'author') list = [...list].sort((a, z) => a.author.localeCompare(z.author));
        setBooks(list);
      })
      .finally(() => setLoading(false));
  }, [query, activeGenres, sort]);

  function toggleGenre(g) {
    setActiveGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  return (
    <div className="browse">
      <div className="browse-hero">
        <div className="container">
          <div className="eyebrow">Catalog</div>
          <h1>Browse all books</h1>
          <p>Independent authors — no exclusivity, no subscription.</p>
        </div>
      </div>

      <div className="container browse-layout">
        <aside className="browse-sidebar">
          <div className="sidebar-section">
            <h3>Genre</h3>
            {genres.map(g => (
              <label key={g.slug} className="sidebar-check">
                <input
                  type="checkbox"
                  checked={activeGenres.includes(g.slug)}
                  onChange={() => toggleGenre(g.slug)}
                />
                <span>{g.label}</span>
              </label>
            ))}
          </div>
          {(activeGenres.length > 0 || query) && (
            <button className="clear-btn" onClick={() => { setActiveGenres([]); setQuery(''); }}>
              Clear filters
            </button>
          )}
        </aside>

        <main className="browse-main">
          <div className="browse-controls">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                placeholder="Search by title or author…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="results-meta">
            {loading ? 'Loading…' : `${books.length} ${books.length === 1 ? 'book' : 'books'}`}
            {(activeGenres.length > 0 || query) && !loading && <span> · filtered</span>}
          </div>

          {!loading && books.length === 0 ? (
            <div className="no-results">
              <p>No books match. <button className="link-btn" onClick={() => { setActiveGenres([]); setQuery(''); }}>Clear filters</button></p>
            </div>
          ) : (
            <div className="book-grid">
              {books.map(book => (
                <Link to={`/book/${book.slug}`} key={book.slug} className="book-card">
                  <BookCover title={book.title} author={book.author} colorClass={book.coverColor} />
                  <div className="book-card-meta">
                    <span className="card-genre">{book.genre}</span>
                    <span className="card-title">{book.title}</span>
                    <span className="card-author">{book.author}</span>
                    {book.rating && <span className="card-price">★ {book.rating}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
