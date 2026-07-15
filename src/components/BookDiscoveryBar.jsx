import { useEffect, useRef, useState } from 'react';
import './BookDiscoveryBar.css';

export default function BookDiscoveryBar({
  value,
  onChange,
  placeholder = 'Search by title, author, genre, or keyword',
  resultLabel,
  applyLabel = resultLabel,
  activeFilterCount = 0,
  onClearFilters,
  children,
  className = '',
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function focusSearch(event) {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      const shortcut = event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
      if (!shortcut || isTyping) return;
      event.preventDefault();
      searchInputRef.current?.focus();
    }
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = event => { if (event.key === 'Escape') setFiltersOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [filtersOpen]);

  return (
    <>
      <section className={`book-discovery${filtersOpen ? ' is-filtering' : ''}${className ? ` ${className}` : ''}`} aria-label="Search and filter books">
        <div className="container book-discovery-inner">
          <div className="book-discovery-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 4.2 4.2" />
            </svg>
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Search books"
              placeholder={placeholder}
              value={value}
              onChange={event => onChange(event.target.value)}
            />
            <kbd className="book-discovery-shortcut">⌘ K</kbd>
            {value && (
              <button type="button" className="book-discovery-clear" onClick={() => onChange('')} aria-label="Clear search">×</button>
            )}
          </div>

          <button
            type="button"
            className={`book-discovery-mobile-toggle${activeFilterCount ? ' is-active' : ''}`}
            onClick={() => setFiltersOpen(true)}
            aria-expanded={filtersOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M7 12h10M10 17h4" />
            </svg>
            Filters
            {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
          </button>

          <div className={`book-discovery-filters${filtersOpen ? ' is-open' : ''}`}>
            <div className="book-discovery-sheet-heading">
              <div><span>Refine results</span><small>{activeFilterCount ? `${activeFilterCount} active` : 'All books'}</small></div>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">×</button>
            </div>

            {children}

            <div className="book-discovery-sheet-actions">
              {activeFilterCount > 0 && onClearFilters && (
                <button type="button" className="book-discovery-reset" onClick={onClearFilters}>Clear filters</button>
              )}
              <button type="button" className="book-discovery-apply" onClick={() => setFiltersOpen(false)}>Show {applyLabel}</button>
            </div>
          </div>

          <span className="book-discovery-count">{resultLabel}</span>
        </div>
      </section>

      {filtersOpen && <button type="button" className="book-discovery-backdrop" onClick={() => setFiltersOpen(false)} aria-label="Close filters" />}
    </>
  );
}
