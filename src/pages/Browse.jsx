import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { BOOKS, GENRES } from '../lib/data';
import './Browse.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'author', label: 'Author A–Z' },
];

export default function Browse() {
  const [searchParams] = useSearchParams();
  const initialGenre = searchParams.get('genre') || '';
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState(initialGenre ? [initialGenre] : []);
  const [sort, setSort] = useState('newest');

  function toggleGenre(g) {
    setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  const results = useMemo(() => {
    let list = [...BOOKS];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    if (genres.length) list = list.filter(b => genres.includes(b.genre));
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'author') list.sort((a, b) => a.author.localeCompare(b.author));
    else list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return list;
  }, [query, genres, sort]);

  return (
    <div className="browse">
      <div className="browse-hero">
        <div className="container">
          <div className="eyebrow">Catalog</div>
          <h1>Browse all books</h1>
          <p>{BOOKS.length} titles from independent authors — no exclusivity, no subscription.</p>
        </div>
      </div>

      <div className="container browse-layout">
        <aside className="browse-sidebar">
          <div className="sidebar-section">
            <h3>Genre</h3>
            {GENRES.map(g => (
              <label key={g} className="sidebar-check">
                <input
                  type="checkbox"
                  checked={genres.includes(g)}
                  onChange={() => toggleGenre(g)}
                />
                <span>{g.charAt(0).toUpperCase() + g.slice(1)}</span>
              </label>
            ))}
          </div>
          {(genres.length > 0 || query) && (
            <button className="clear-btn" onClick={() => { setGenres([]); setQuery(''); }}>
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
            {results.length} {results.length === 1 ? 'book' : 'books'}
            {(genres.length > 0 || query) && <span> · filtered</span>}
          </div>

          {results.length === 0 ? (
            <div className="no-results">
              <p>No books match your search. <button className="link-btn" onClick={() => { setGenres([]); setQuery(''); }}>Clear filters</button></p>
            </div>
          ) : (
            <div className="book-grid">
              {results.map(book => (
                <Link to={`/book/${book.id}`} key={book.id} className="book-card">
                  <BookCover title={book.title} author={book.author} colorClass={book.coverColor} />
                  <div className="book-card-meta">
                    <span className="card-genre">{book.genre}</span>
                    <span className="card-title">{book.title}</span>
                    <span className="card-author">{book.author}</span>
                    <span className="card-price">${book.price.toFixed(2)}</span>
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
