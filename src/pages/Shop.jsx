import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCover from '../components/BookCover';
import BookDiscoveryBar from '../components/BookDiscoveryBar';
import BookOfTheWeek from '../components/BookOfTheWeek';
import SEO from '../components/SEO';
import { FilterPill } from '../components/FilterPillBar';
import { fetchShopBooks, addToCart } from '../lib/api';
import { pickBookOfTheWeek } from '../lib/bookOfTheWeek';
import { convertToDisplayCurrency, formatDisplayMoney, isConvertedCurrency } from '../lib/currency';
import './Shop.css';

const PRICE_OPTIONS = [
  { value: 'all',    label: 'Any price' },
  { value: 'u10',     label: 'Under €10' },
  { value: 'u20',     label: 'Under €20' },
  { value: 'u30',     label: 'Under €30' },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest' },
  { value: 'title',      label: 'Title A–Z' },
  { value: 'price-low',  label: 'Price low' },
  { value: 'price-high', label: 'Price high' },
];

function formatBookPrice(book) {
  if (book?.isDirectSale) return formatDisplayMoney(book.directSalePrice, 'USD');
  if (book?.lowestPrice != null) {
    return `from ${formatDisplayMoney(book.lowestPrice, book.lowestCurrency)}`;
  }
  return 'Retailer link';
}

function sortablePrice(book, fallback) {
  const amount = book?.isDirectSale ? book.directSalePrice : book?.lowestPrice;
  const currency = book?.isDirectSale ? 'USD' : book?.lowestCurrency;
  return convertToDisplayCurrency(amount, currency) ?? fallback;
}

function genreLabel(slug = '') {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function detailLine(label, value) {
  if (!value) return null;
  return (
    <div className="shop-detail-line" key={label}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ShopIcon({ type }) {
  if (type === 'cart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5h2l1.2 9.2a2 2 0 0 0 2 1.8h6.9a2 2 0 0 0 1.9-1.4L21 8H8" />
        <path d="M10 20h.01M18 20h.01" />
      </svg>
    );
  }

  if (type === 'book') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.5 4.5h9A3.5 3.5 0 0 1 18 8v11.5H8.5A3.5 3.5 0 0 0 5 23V4.5Z" />
        <path d="M18 8a3.5 3.5 0 0 1 3.5-3.5v18A3.5 3.5 0 0 0 18 19.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 7.5h15" />
      <path d="M7.5 12h9" />
      <path d="M10 16.5h4" />
    </svg>
  );
}

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [books,     setBooks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [buyingId,  setBuyingId]  = useState(null);
  const [query,       setQuery]       = useState('');
  const [genre,       setGenre]       = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sort,        setSort]        = useState('newest');
  const [modalBook,   setModalBook]   = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchShopBooks({ limit: 48 }).then(({ books: b }) => { setBooks(b); setLoading(false); });
  }, []);

  const genres = useMemo(() => {
    const set = new Set();
    books.forEach(book => book.genres?.forEach(g => set.add(g)));
    return Array.from(set).sort();
  }, [books]);

  const genreOptions = useMemo(() => (
    [{ value: 'all', label: 'All genres' }, ...genres.slice(0, 12).map(g => ({ value: g, label: genreLabel(g) }))]
  ), [genres]);

  const priceCeiling = priceFilter === 'u10' ? 10 : priceFilter === 'u20' ? 20 : priceFilter === 'u30' ? 30 : null;

  const filteredBooks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = books.filter(book => {
      const searchableText = [
        book.title,
        book.author,
        book.blurb,
        ...(book.genres || []),
        ...(book.formats || []),
        book.language,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !needle || searchableText.includes(needle);
      const matchesGenre = genre === 'all' || book.genres?.includes(genre);
      const matchesPrice = priceCeiling == null || sortablePrice(book, Infinity) < priceCeiling;
      return matchesQuery && matchesGenre && matchesPrice;
    });

    return [...result].sort((a, b) => {
      if (sort === 'price-low') return sortablePrice(a, 9999) - sortablePrice(b, 9999);
      if (sort === 'price-high') return sortablePrice(b, 0) - sortablePrice(a, 0);
      if (sort === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [books, priceCeiling, genre, query, sort]);

  const bookOfTheWeek = useMemo(() => pickBookOfTheWeek(books), [books]);
  const activeFilterCount = Number(genre !== 'all') + Number(priceFilter !== 'all');

  function clearShopFilters() {
    setGenre('all');
    setPriceFilter('all');
  }

  async function handleGetNow(book) {
    if (!user) { navigate('/login', { state: { from: '/shop' } }); return; }
    if (buyingId) return;
    setBuyingId(book.dbId);
    try {
      await addToCart(user.id, book, 1);
      navigate('/cart');
    } catch (err) {
      console.error('[handleGetNow] failed:', err?.message ?? err);
    } finally {
      setBuyingId(null);
    }
  }

  return (
    <div className="shop-page">
      <SEO
        title="Shop | IndieConverters"
        description="Buy books directly from indie authors through Indie Converters."
        path="/shop"
      />
      <div className="shop-shell">
        <BookDiscoveryBar
          value={query}
          onChange={setQuery}
          resultLabel={loading ? 'Loading books…' : `${filteredBooks.length} ${filteredBooks.length === 1 ? 'title' : 'titles'}`}
          applyLabel={loading ? 'results' : `${filteredBooks.length} ${filteredBooks.length === 1 ? 'title' : 'titles'}`}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearShopFilters}
        >
          <FilterPill
            label="All genres"
            options={genreOptions}
            value={genre}
            onChange={setGenre}
          />
          <FilterPill label="Mood" onClick={() => navigate('/moods')} />
          <FilterPill
            label="Any price"
            options={PRICE_OPTIONS}
            value={priceFilter}
            onChange={setPriceFilter}
          />
          <FilterPill
            label="Newest"
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
          />
        </BookDiscoveryBar>

        <main className="shop-catalog">
          {loading ? (
            <div className="shop-weekly-skeleton" aria-label="Loading book of the week" />
          ) : (
            <BookOfTheWeek
              book={bookOfTheWeek}
              buying={buyingId === bookOfTheWeek?.dbId}
              onBuy={handleGetNow}
              onPreview={setModalBook}
              price={bookOfTheWeek ? formatBookPrice(bookOfTheWeek) : null}
              headingLevel={1}
            />
          )}

          {loading ? (
            <div className="shop-grid">
              {[...Array(8)].map((_, i) => <div key={i} className="shop-skeleton" />)}
            </div>
          ) : books.length === 0 ? (
            <div className="shop-empty">
              <h2>No books here yet</h2>
              <p>Independently published and direct-sale books will show up here.</p>
              <Link to="/browse" className="btn btn-primary">Browse the catalogue</Link>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="shop-empty">
              <h2>No matching books</h2>
              <p>Try clearing a filter or searching by author name.</p>
              <button type="button" className="btn btn-primary" onClick={() => { setQuery(''); setGenre('all'); setPriceFilter('all'); }}>Clear filters</button>
            </div>
          ) : (
            <div className="shop-grid">
              {filteredBooks.map(book => (
                <article
                  key={book.dbId}
                  className="shop-card"
                >
                  <button type="button" className="shop-card-cover" onClick={() => setModalBook(book)}>
                    <BookCover
                      title={book.title}
                      author={book.author}
                      colorClass={book.coverColor}
                      coverUrl={book.coverUrl}
                    />
                  </button>
                  <div className="shop-card-meta">
                    <button type="button" className="shop-card-title" onClick={() => setModalBook(book)}>{book.title}</button>
                    <span className="shop-card-author">{book.author}</span>
                  </div>
                  <div className="shop-card-facts">
                    <span>{book.genres?.[0] ? genreLabel(book.genres[0]) : 'Indie title'}</span>
                    <span>{book.formats?.[0] || 'Book'}</span>
                  </div>
                  <div className="shop-card-footer">
                    <span className="shop-card-price">{formatBookPrice(book)}</span>
                    {book.isDirectSale ? (
                      <button
                        type="button"
                        className="shop-card-btn"
                        onClick={() => handleGetNow(book)}
                        disabled={buyingId === book.dbId}
                      >
                        <ShopIcon type="cart" />
                      </button>
                    ) : (
                      <button type="button" className="shop-card-btn" onClick={() => setModalBook(book)} aria-label={`Preview ${book.title}`}>
                        <ShopIcon type="book" />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {modalBook && (
        <div className="shop-modal-backdrop" role="presentation" onClick={() => setModalBook(null)}>
          <section
            className="shop-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-detail-modal-title"
            onClick={event => event.stopPropagation()}
          >
            <button type="button" className="shop-modal-close" onClick={() => setModalBook(null)} aria-label="Close book details">×</button>
            <div className="shop-detail-cover">
              <BookCover
                title={modalBook.title}
                author={modalBook.author}
                colorClass={modalBook.coverColor}
                coverUrl={modalBook.coverUrl}
                size="lg"
              />
            </div>
            <div className="shop-detail-content">
              <div className="shop-detail-heading">
                <span>Detail Book</span>
                <p>{modalBook.isDirectSale ? 'Direct from author' : 'Retailer options'}</p>
              </div>
              <div className="shop-detail-meta">
                <h2 id="shop-detail-modal-title">{modalBook.title}</h2>
                <p>by {modalBook.author}</p>
              </div>
              <div className="shop-detail-tags">
                {(modalBook.genres || []).slice(0, 2).map(g => <span key={g}>{genreLabel(g)}</span>)}
                {(modalBook.formats || []).slice(0, 2).map(f => <span key={f}>{f}</span>)}
              </div>
              <div className="shop-detail-price">
                <span>Price</span>
                <strong>{formatBookPrice(modalBook)}</strong>
              </div>
              {!modalBook.isDirectSale && modalBook.lowestPrice != null && isConvertedCurrency(modalBook.lowestCurrency) && (
                <p className="shop-detail-currency-note">Converted estimate. Final price is set by the retailer.</p>
              )}
              <p className="shop-detail-blurb">{modalBook.blurb || 'A reader-ready indie title available through Indie Converters.'}</p>
              <div className="shop-detail-actions">
                {modalBook.isDirectSale ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleGetNow(modalBook)}
                    disabled={buyingId === modalBook.dbId}
                  >
                    {buyingId === modalBook.dbId ? 'Adding…' : 'Add to cart'}
                  </button>
                ) : (
                  <Link to={`/book/${modalBook.slug}`} className="btn btn-primary">Choose retailer</Link>
                )}
                <Link to={`/book/${modalBook.slug}`} className="btn btn-outline">View details</Link>
              </div>
              <div className="shop-detail-accordions">
                <details open>
                  <summary>About this book</summary>
                  <div className="shop-detail-lines">
                    {[
                      detailLine('Pages', modalBook.pageCount ? `${modalBook.pageCount.toLocaleString()} pages` : null),
                      detailLine('Published', modalBook.pubYear),
                      detailLine('Language', modalBook.language),
                      detailLine('Publisher', modalBook.publisher),
                      detailLine('ISBN', modalBook.isbn),
                      detailLine('Formats', modalBook.formats?.length ? modalBook.formats.join(', ') : null),
                    ]}
                  </div>
                </details>
                <details>
                  <summary>Availability</summary>
                  {modalBook.isDirectSale ? (
                    <div className="shop-availability-card">
                      <strong>Available direct from Indie Converters</strong>
                      <span>Checkout is handled here and this title can be added to cart.</span>
                    </div>
                  ) : modalBook.buyLinks?.length ? (
                    <div className="shop-availability-list">
                      {modalBook.buyLinks.map(link => (
                        <a href={link.url} target="_blank" rel="noreferrer" key={`${link.slug}-${link.url}`}>
                          <span>
                            <strong>{link.label}</strong>
                            {link.verified && <small>Verified retailer price</small>}
                          </span>
                          {link.price != null && <b>{formatDisplayMoney(link.price, link.currency)}</b>}
                        </a>
                      ))}
                      <p>Retailer prices are shown in EUR as converted estimates. Final price is confirmed on the retailer site.</p>
                    </div>
                  ) : (
                    <p>No active retailer or direct checkout option is listed for this book yet.</p>
                  )}
                </details>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
