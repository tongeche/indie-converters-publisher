import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import BookCover from '../components/BookCover';
import BookDiscoveryBar from '../components/BookDiscoveryBar';
import BookOfTheWeek from '../components/BookOfTheWeek';
import SEO from '../components/SEO';
import { FilterPill } from '../components/FilterPillBar';
import { useAuth } from '../context/AuthContext';
import { fetchBooks, fetchGenres, fetchSavedBooks, fetchRelatedBooks, fetchBooksGroupedByGenre } from '../lib/api';
import { pickBookOfTheWeek } from '../lib/bookOfTheWeek';
import allBooksHero from '../assets/all-books-hero.webp';
import './Browse.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'title',  label: 'Title A–Z' },
];

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
  const indieOnly     = searchParams.get('indie')  === '1';

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
  const [rows,        setRows]        = useState([]);
  const [rowsLoading, setRowsLoading] = useState(true);
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

  // Genre rows for the default (unfiltered) browse view
  useEffect(() => {
    setRowsLoading(true);
    fetchBooksGroupedByGenre().then(setRows).finally(() => setRowsLoading(false));
  }, []);

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
    fetchBooks({ genres: activeGenres, query, sort, formats: activeFormats, language, indieOnly, limit: LIMIT, offset: 0 })
      .then(({ books: b, total: t }) => { setBooks(b); setTotal(t); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeGenres.join(','), activeFormats.join(','), language, sort, indieOnly]);

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
  }, [user]);

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

  function clearBrowseFilters() {
    const p = new URLSearchParams(searchParams);
    p.delete('genre');
    p.delete('format');
    p.delete('lang');
    p.delete('indie');
    setSearchParams(p, { replace: true });
  }

  async function loadMore() {
    setLoadingMore(true);
    const next = offset + LIMIT;
    const { books: more } = await fetchBooks({
      genres: activeGenres, query, sort, formats: activeFormats, language, indieOnly,
      limit: LIMIT, offset: next,
    });
    setBooks(prev => [...prev, ...more]);
    setOffset(next);
    setLoadingMore(false);
  }

  const hasFilters = activeGenres.length > 0 || activeFormats.length > 0 || language || query || indieOnly;
  const activeFilterCount = activeGenres.length + activeFormats.length + Number(Boolean(language)) + Number(indieOnly);
  const collectionBookOfTheWeek = pickBookOfTheWeek(recommended, { preferDirectSale: false });

  return (
    <div className="browse">
      <SEO
        title="Browse Indie Books | IndieConverters"
        description="Browse independently published books by genre, mood, format, and language — no exclusivity, no subscription required."
        path="/browse"
      />

      {/* ── Hero ── */}
      <div className="browse-hero" style={{ backgroundImage: `url(${allBooksHero})` }}>
        <div className="container">
          <div className="eyebrow">Catalog</div>
          <h1>{indieOnly ? 'Indie books' : 'Browse all books'}</h1>
          <p>
            {indieOnly
              ? 'Hand-picked titles from independent and self-published authors.'
              : 'Independent authors — no exclusivity, no subscription.'}
          </p>
        </div>
      </div>

      {/* ── Persistent discovery bar ── */}
      <BookDiscoveryBar
        value={inputValue}
        onChange={setInputValue}
        resultLabel={loading ? 'Searching…' : `${total} ${total === 1 ? 'book' : 'books'}`}
        applyLabel={loading ? 'results' : `${total} ${total === 1 ? 'book' : 'books'}`}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearBrowseFilters}
      >
        <FilterPill
          label="Format"
          multi
          options={FORMATS.map(format => ({ value: format, label: format }))}
          value={activeFormats}
          onToggleValue={format => toggleMulti('format', format)}
        />

        <FilterPill
          label="Language"
          options={[{ value: '', label: 'Language' }, ...LANGUAGES.map(item => ({ value: item, label: item }))]}
          value={language}
          onChange={value => setParam('lang', value)}
        />

        <FilterPill
          label="Genre"
          options={[{ value: '', label: 'All genres' }, ...genres.map(item => ({ value: item.slug, label: item.label }))]}
          value={activeGenres[0] || ''}
          onChange={value => setParam('genre', value)}
        />

        <FilterPill
          label="Sort"
          options={SORT_OPTIONS}
          value={sort}
          onChange={value => setParam('sort', value)}
        />
      </BookDiscoveryBar>

      {/* ── Personalised weekly recommendation ── */}
      {collectionBookOfTheWeek && (
        <div className="browse-weekly-feature">
          <BookOfTheWeek
            book={collectionBookOfTheWeek}
            supportingText="A weekly recommendation inspired by the books you've saved."
          />
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="container browse-layout">
        <main className="browse-main">
          {hasFilters ? (
            <>
              {/* Active filter pills */}
              {(activeGenres.length > 0 || activeFormats.length > 0 || language || indieOnly) && (
                <div className="browse-active-filters">
                  {indieOnly && (
                    <span className="browse-filter-pill">
                      Indie only
                      <button onClick={() => setParam('indie', '')} aria-label="Remove indie filter">×</button>
                    </span>
                  )}
                  {activeGenres.map(g => (
                    <span key={g} className="browse-filter-pill">
                      {genres.find(x => x.slug === g)?.label || g}
                      <button onClick={() => setParam('genre', '')} aria-label={`Remove ${g}`}>×</button>
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
                  <button className="clear-btn browse-clear-inline" onClick={clearAll}>Clear all</button>
                </div>
              )}

              {/* Result count */}
              <div className="results-meta">
                {loading
                  ? <span className="results-meta-loading">Searching…</span>
                  : <>{total.toLocaleString()} {total === 1 ? 'book' : 'books'} · filtered</>
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
                          <Link to={`/book/${book.slug}`} key={book.slug} className="book-card" aria-label={`${book.title} by ${book.author}`}>
                            <BookCover
                              title={book.title}
                              author={book.author}
                              colorClass={book.coverColor}
                              coverUrl={book.coverUrl}
                            />
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
            </>
          ) : (
            /* ── Genre rows (default browse view) ── */
            <div className="genre-rows">
              {rowsLoading
                ? Array(3).fill(null).map((_, i) => (
                    <div className="genre-row" key={i}>
                      <div className="genre-row-scroll">
                        {Array(6).fill(null).map((_, j) => <div key={j} className="book-card-skeleton genre-row-skeleton" />)}
                      </div>
                    </div>
                  ))
                : rows.map(row => (
                    <div className="genre-row" key={row.genre.slug}>
                      <Link to={`/browse?genre=${row.genre.slug}`} className="genre-row-heading">
                        {row.genre.label} <span aria-hidden="true">→</span>
                      </Link>
                      <div className="genre-row-scroll">
                        {row.books.map(book => (
                          <Link
                            to={`/book/${book.slug}`}
                            key={book.slug}
                            className="book-card genre-row-card"
                            aria-label={`${book.title} by ${book.author}`}
                          >
                            <BookCover
                              title={book.title}
                              author={book.author}
                              colorClass={book.coverColor}
                              coverUrl={book.coverUrl}
                            />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))
              }
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
