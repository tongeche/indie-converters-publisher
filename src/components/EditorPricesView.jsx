import { useState, useEffect, useRef } from 'react';
import RetailerLinksEditor from './RetailerLinksEditor';
import { searchBooksForPriceCuration, fetchBookRetailerLinksForCuration, replaceRetailerLinks } from '../lib/api';
import './EditorPricesView.css';

export default function EditorPricesView() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchBooksForPriceCuration(query).then(setResults);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function selectBook(book) {
    setSelectedBook(book);
    setSaved(false);
    setLoadingLinks(true);
    const existing = await fetchBookRetailerLinksForCuration(book.id);
    const mapped = existing.map(l => ({
      retailer: l.retailers?.slug || 'own',
      url: l.url || '',
      price: l.price != null ? String(l.price) : '',
    }));
    setLinks(mapped.length ? mapped : [{ retailer: 'own', url: '', price: '' }]);
    setLoadingLinks(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await replaceRetailerLinks(selectedBook.id, links, 'editor');
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Catalogue Prices</h1>
          <p className="dash-subtitle">
            Curate retailer links and prices for any published book — including the discovery-catalogue
            titles that have no author account of their own to enter a price.
          </p>
        </div>
      </header>

      <div className="epv-layout">
        <div className="epv-search">
          <input
            type="text"
            className="epv-search-input"
            placeholder="Search books by title…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="epv-results">
            {results.map(b => (
              <button
                key={b.id}
                type="button"
                className={`epv-result${selectedBook?.id === b.id ? ' epv-result--active' : ''}`}
                onClick={() => selectBook(b)}
              >
                {b.cover_url
                  ? <img src={b.cover_url} alt="" className="epv-result-cover" />
                  : <span className="epv-result-cover epv-result-cover--ph">··</span>}
                <span className="epv-result-title">{b.title}</span>
                {!b.author_user_id && <span className="epv-result-tag">catalogue</span>}
              </button>
            ))}
            {results.length === 0 && <p className="epv-empty">No books found.</p>}
          </div>
        </div>

        <div className="epv-editor">
          {!selectedBook ? (
            <p className="epv-placeholder">Select a book on the left to curate its retailer links and prices.</p>
          ) : loadingLinks ? (
            <p className="epv-placeholder">Loading…</p>
          ) : (
            <>
              <h3 className="epv-editor-title">{selectedBook.title}</h3>
              <RetailerLinksEditor
                links={links}
                onChange={setLinks}
                label={null}
                hint="These prices appear on the book's public page. They're tagged as editor-curated internally, separate from author-entered or Google-Books-verified prices."
              />
              <button type="button" className="btn btn-primary epv-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save prices'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
