import { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import SEO from '../components/SEO';
import { fetchAuthor, fetchAuthorBooks } from '../lib/api';
import authorHeroImg from '../assets/author-hero.webp';
import './AuthorProfile.css';

const CURATED_AUTHOR_GUIDES = {
  'tsitsi-dangarembga': {
    startSlug: 'nervous-conditions',
    nextSlug: 'the-book-of-not',
    intro: 'A strong entry point into her work is the novel that introduces Tambu and the pressures around family, education, identity, and survival.',
    themes: [
      'African literary fiction',
      'family pressure',
      'colonial education',
      'identity',
      'psychological survival',
    ],
  },
};

const INDIE_STATUS_LABELS = {
  self_published: 'Self-published',
  small_press: 'Small press',
  likely_indie: 'Likely indie',
  likely_traditional: 'Traditional press',
  uncertain: 'Needs review',
};

const GENRE_LABELS = {
  african: 'African literature',
  fantasy: 'Fantasy',
  fiction: 'Fiction',
  historical: 'Historical fiction',
  literary: 'Literary fiction',
  memoir: 'Memoir',
  nonfiction: 'Nonfiction',
  romance: 'Romance',
};

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function prettyLabel(value) {
  if (!value) return '';
  return GENRE_LABELS[value] || value.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function excerpt(text, max = 150) {
  if (!text || text.length <= max) return text || '';
  return `${text.slice(0, max).trim()}...`;
}

function sortByYearThenTitle(a, b) {
  const ay = Number(a.pubYear) || 9999;
  const by = Number(b.pubYear) || 9999;
  if (ay !== by) return ay - by;
  return a.title.localeCompare(b.title);
}

function bookMeta(book) {
  return [book.pubYear, book.publisher].filter(Boolean).join(' · ');
}

function buildReadingGuide(authorSlug, books) {
  if (!books.length) return null;

  const curated = CURATED_AUTHOR_GUIDES[authorSlug];
  const sorted = [...books].sort(sortByYearThenTitle);
  const start = books.find(book => book.slug === curated?.startSlug) || sorted[0];
  const next = books.find(book => book.slug === curated?.nextSlug)
    || sorted.find(book => book.slug !== start.slug)
    || null;

  const discoveredThemes = unique([
    ...books.flatMap(book => book.genres || []).map(prettyLabel),
    ...books.flatMap(book => book.keywords || []).map(prettyLabel),
  ]).slice(0, 5);

  return {
    start,
    next,
    intro: curated?.intro || `Begin with ${start.title} for a clear sense of ${start.author}'s voice, themes, and reader promise.`,
    themes: curated?.themes || discoveredThemes,
  };
}

export default function AuthorProfile() {
  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAuthor(id), fetchAuthorBooks(id)])
      .then(([a, b]) => { setAuthor(a); setBooks(b); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="author-profile"><div className="author-hero" /><div className="container" style={{padding:'80px 24px',color:'var(--ink-soft)'}}>Loading…</div></div>;
  if (!author) return <Navigate to="/browse" replace />;

  const bio = author.long_bio || author.short_bio;
  const bioLimit = 190;
  const hasLongBio = bio && bio.length > bioLimit;
  const heroBio = hasLongBio && !bioExpanded ? `${bio.slice(0, bioLimit).trim()}...` : bio;
  const authorLinks = [
    author.website_url && { href: author.website_url, label: 'Website' },
    author.goodreads_url && { href: author.goodreads_url, label: 'Goodreads' },
  ].filter(Boolean);
  const readingGuide = buildReadingGuide(id, books);
  const orderedBooks = [...books].sort((a, b) => {
    if (readingGuide?.start?.slug) {
      if (a.slug === readingGuide.start.slug) return -1;
      if (b.slug === readingGuide.start.slug) return 1;
    }
    return sortByYearThenTitle(a, b);
  });
  const genreSignals = unique(books.flatMap(book => book.genres || []).map(prettyLabel)).slice(0, 3);
  const publisherSignals = unique(books.map(book => book.publisher)).slice(0, 2);
  const statusSignals = unique(books.map(book => INDIE_STATUS_LABELS[book.indieStatus] || prettyLabel(book.indieStatus))).slice(0, 2);
  const authorSignals = [
    { label: 'Books here', value: books.length ? String(books.length) : 'New catalogue' },
    { label: 'Reader lane', value: genreSignals.join(', ') || 'Independent books' },
    { label: 'Publishing route', value: statusSignals.join(', ') || publisherSignals.join(', ') || 'Curated indie catalogue' },
  ];

  return (
    <div className="author-profile">
      <SEO
        title={`${author.display_name} | IndieConverters`}
        description={bio ? bio.slice(0, 155) : `${author.display_name}'s author profile on IndieConverters.`}
        path={`/author/${id}`}
      />
      <div className="author-hero">
        <img src={authorHeroImg} alt="" className="author-hero-img" />
        <div className="author-hero-overlay" />
        <div className="container author-hero-inner">
          {author.photo_url ? (
            <img src={author.photo_url} alt={author.display_name} className="author-avatar" />
          ) : (
            <div className="author-avatar author-avatar--fallback">{initials(author.display_name)}</div>
          )}
          <div className="author-meta">
            <h1>{author.display_name}</h1>
            {heroBio && (
              <p className="author-hero-bio">
                {heroBio}
                {hasLongBio && (
                  <button type="button" className="author-bio-toggle" onClick={() => setBioExpanded(open => !open)}>
                    {bioExpanded ? 'Less' : 'More'}
                  </button>
                )}
              </p>
            )}
            {authorLinks.length > 0 && (
              <div className="author-social author-social--hero">
                {authorLinks.map(link => (
                  <a key={link.href} href={link.href} className="social-link" target="_blank" rel="noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container author-body">
        <div className="author-main-col">
          {readingGuide && (
            <section className="author-guide" aria-labelledby="author-guide-title">
              <div className="author-guide-copy">
                <span className="author-section-label">Reading guide</span>
                <h2 id="author-guide-title">Where to start</h2>
                <p>{readingGuide.intro}</p>

                <div className="author-guide-links">
                  <Link to={`/book/${readingGuide.start.slug}`} className="author-guide-link">
                    <span>Start here</span>
                    <strong>{readingGuide.start.title}</strong>
                    {readingGuide.start.blurb && <em>{excerpt(readingGuide.start.blurb)}</em>}
                  </Link>

                  {readingGuide.next && (
                    <Link to={`/book/${readingGuide.next.slug}`} className="author-guide-link author-guide-link--secondary">
                      <span>Continue with</span>
                      <strong>{readingGuide.next.title}</strong>
                    </Link>
                  )}
                </div>
              </div>

              <div className="author-signal-panel">
                <span className="author-section-label">Author signals</span>
                <dl className="author-signal-list">
                  {authorSignals.map(signal => (
                    <div key={signal.label} className="author-signal">
                      <dt>{signal.label}</dt>
                      <dd>{signal.value}</dd>
                    </div>
                  ))}
                </dl>

              </div>
            </section>
          )}

          <div className="author-books-col">
            <div className="author-books-heading">
              <div>
                <span className="author-section-label">Catalogue</span>
                <h2>{author.display_name}'s work</h2>
              </div>
              <p>Select a book for details, buying links, and reader metadata.</p>
            </div>

            {orderedBooks.length > 0 ? (
              <div className="author-book-grid">
                {orderedBooks.map(book => (
                  <Link to={`/book/${book.slug}`} key={book.slug} className="author-book-card">
                    <div className="author-book-cover-wrap">
                      <BookCover title={book.title} author={book.author} colorClass={book.coverColor} coverUrl={book.coverUrl} />
                    </div>
                    <div className="author-book-info">
                      <span className="card-genre">{prettyLabel(book.genre)}</span>
                      <h3>{book.title}</h3>
                      {bookMeta(book) && <p className="author-book-meta">{bookMeta(book)}</p>}
                      <span className="author-book-action">View book</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="author-empty">No books are listed for this author yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
