import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { useAuth } from '../context/AuthContext';
import { fetchBooks, fetchGenres, fetchSavedBooks, fetchRelatedBooks } from '../lib/api';
import allBooksHero from '../assets/all-books-hero.webp';
import './Browse.css';

const FORMATS   = ['eBook', 'Paperback', 'Hardcover', 'Audiobook'];
const LANGUAGES = ['English','Spanish','French','German','Portuguese','Italian','Dutch','Arabic','Japanese','Swahili'];
const LIMIT     = 24;

export default function Browse() {
  const { user }                        = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filter state from URL
  const query         = searchParams.get('q')      || '';
  const activeGenres  = searchParams.getAll('genre');
  const activeFormats = searchParams.getAll('format');
  const language      = searchParams.get('lang')   || '';
  const sort          = searchParams.get('sort')   || 'newest';

  // Local input value — debounced into URL
  const [inputValue, setInputValue] = useState(query);

  // Data
  const [books,       setBooks]       = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset,      setOffset]      = useState(0);
  const [genres,      setGenres]      = useState([]);
  const [recommended, setRecommended] = useState([]);
  const hasMore = books.length < total;

  // Keep inputValue in sync when URL changes externally (back/forward)
  const prevQuery = useRef(query);
  useEffect(() => {
    if (query !== prevQuery.current) {
      setInputValue(query);
      prevQuery.current = query;
    }
  }, [query]);

  useEffect(() => { fetchGenres().then(setGenres); }, []);

  // Debounce search input → URL
  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParams);
      if (inputValue.trim()) p.set('q', inputValue.trim());
      else p.delete('q');
      setSearchParams(p, { replace: true });
    }, 320);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  // Main fetch — fires on any filter/sort change
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    fetchBooks({ genres: activeGenres, query, sort, formats: activeFormats, language, limit: LIMIT, offset: 0 })
      .then(({ books: b, total: t }) => { setBooks(b); setTotal(t); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeGenres.join(','), activeFormats.join(','), language, sort]);

  // Personalised recommendations for logged-in users
  useEffect(() => {
    if (!user) return;
    fetchSavedBooks(user.id).then(saved => {
      if (!saved.length) return;
      const savedSlugs  = new Set(saved.map(b => b.slug));
      const savedGenres = [...new Set(saved.slice(0, 4).flatMap(b => b.genres))];
      if (!savedGenres.length) return;
      fetchRelatedBooks('__none__', savedGenres).then(recs => {
        setRecommended(recs.filter(b => !savedSlugs.has(b.slug)).slice(0, 8));
      });
    });
  }, [user?.id]);

  // ── Filter helpers ─────────────────────────────────────────────
  function setParam(key, value) {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p, { replace: true });
  }

  function toggleMulti(key, value) {
    const p    = new URLSearchParams(searchParams);
    const cur  = p.getAll(key);
    p.delete(key);
    if (cur.includes(value)) cur.filter(x => x !== value).forEach(x => p.append(key, x));
    else [...cur, value].forEach(x => p.append(key, x));
    setSearchParams(p, { replace: true });
  }

  function clearAll() {
    setSearchParams({}, { replace: true });
    setInputValue('');
  }

  async function loadMore() {
    setLoadingMore(true);
    const next = offset + LIMIT;
    const { books: more } = await fetchBooks({
      genres: activeGenres, query, sort, formats: activeFormats, language,
      limit: LIMIT, offset: next,
    });
    setBooks(prev => [...prev, ...more]);
    setOffset(next);
    setLoadingMore(false);
  }

  const hasFilters = activeGenres.length > 0 || activeFormats.length > 0 || language || query;

  return (
    <div className="browse">

      {/* ── Hero ── */}
      <div className="browse-hero" style={{ backgroundImage: `url(${allBooksHero})` }}>
        <div className="container">
          <div className="eyebrow">Catalog</div>
          <h1>Browse all books</h1>
          <p>Independent authors — no exclusivity, no subscription.</p>
        </div>
      </div>

      {/* ── Personalised recommendations ── */}
      {recommended.length > 0 && (
        <section className="browse-reco">
          <div className="container">
            <h2 className="browse-reco-title">Because you've saved books like these</h2>
          </div>
          <div className="browse-reco-scroll-wrap">
            <div className="browse-reco-scroll">
              {recommended.map(b => (
                <Link to={`/book/${b.slug}`} key={b.slug} className="browse-reco-card">
                  <div className="browse-reco-cover">
                    <BookCover title={b.title} author={b.author} colorClass={b.coverColor} coverUrl={b.coverUrl} size="sm" />
                  </div>
                  <span className="browse-reco-label">{b.title}</span>
                  <span className="browse-reco-author">{b.author}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Main layout ── */}
      <div className="container browse-layout">

        {/* ── Sidebar ── */}
        <aside className="browse-sidebar">

          {/* Genre */}
          <div className="sidebar-section">
            <h3>Genre</h3>
            {genres.map(g => (
              <label key={g.slug} className="sidebar-check">
                <input type="checkbox" checked={activeGenres.includes(g.slug)}
                  onChange={() => toggleMulti('genre', g.slug)} />
                <span>{g.label}</span>
              </label>
            ))}
          </div>

          {/* Format */}
          <div className="sidebar-section">
            <h3>Format</h3>
            <div className="sidebar-format-chips">
              {FORMATS.map(f => (
                <button key={f} type="button"
                  className={`sidebar-format-chip ${activeFormats.includes(f) ? 'on' : ''}`}
                  onClick={() => toggleMulti('format', f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="sidebar-section">
            <h3>Language</h3>
            <select className="sidebar-lang-select" value={language}
              onChange={e => setParam('lang', e.target.value)}>
              <option value="">All languages</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button className="clear-btn" onClick={clearAll}>Clear all filters</button>
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="browse-main">

          {/* Search + sort bar */}
          <div className="browse-controls">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                className="search-input"
                placeholder="Search by title, author, or keyword…"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
              />
              {inputValue && (
                <button className="search-clear" onClick={() => setInputValue('')} aria-label="Clear search">×</button>
              )}
            </div>
            <select className="sort-select" value={sort}
              onChange={e => setParam('sort', e.target.value)}>
              <option value="newest">Newest</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>

          {/* Active filter pills */}
          {(activeGenres.length > 0 || activeFormats.length > 0 || language) && (
            <div className="browse-active-filters">
              {activeGenres.map(g => (
                <span key={g} className="browse-filter-pill">
                  {genres.find(x => x.slug === g)?.label || g}
                  <button onClick={() => toggleMulti('genre', g)} aria-label={`Remove ${g}`}>×</button>
                </span>
              ))}
              {activeFormats.map(f => (
                <span key={f} className="browse-filter-pill">
                  {f}
                  <button onClick={() => toggleMulti('format', f)} aria-label={`Remove ${f}`}>×</button>
                </span>
              ))}
              {language && (
                <span className="browse-filter-pill">
                  {language}
                  <button onClick={() => setParam('lang', '')} aria-label="Remove language filter">×</button>
                </span>
              )}
            </div>
          )}

          {/* Result count */}
          <div className="results-meta">
            {loading
              ? <span className="results-meta-loading">Searching…</span>
              : <>{total.toLocaleString()} {total === 1 ? 'book' : 'books'}{hasFilters ? ' · filtered' : ''}</>
            }
          </div>

          {/* Grid */}
          {!loading && books.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">··</div>
              <p>No books match your filters.</p>
              <button className="link-btn" onClick={clearAll}>Clear all filters</button>
            </div>
          ) : (
            <>
              <div className="book-grid">
                {loading
                  ? Array(12).fill(null).map((_, i) => <div key={i} className="book-card-skeleton" />)
                  : books.map(book => (
                      <Link to={`/book/${book.slug}`} key={book.slug} className="book-card">
                        <BookCover
                          title={book.title}
                          author={book.author}
                          colorClass={book.coverColor}
                          coverUrl={book.coverUrl}
                        />
                        <div className="book-card-meta">
                          <span className="card-genre">
                            {(book.genres[0] || book.genre)?.replace(/-/g, ' ')}
                          </span>
                          <span className="card-title">{book.title}</span>
                          <span className="card-author">{book.author}</span>
                          {book.price
                            ? <span className="card-price">${Number(book.price).toFixed(2)}</span>
                            : book.formats?.includes('eBook') && <span className="card-price card-price--free">Free</span>
                          }
                        </div>
                      </Link>
                    ))
                }
              </div>

              {/* Load more */}
              {!loading && hasMore && (
                <div className="browse-load-more">
                  <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore
                      ? 'Loading…'
                      : `Load more · ${(total - books.length).toLocaleString()} remaining`
                    }
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
