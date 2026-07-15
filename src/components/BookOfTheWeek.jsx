import { Link } from 'react-router-dom';
import BookCover from './BookCover';
import './BookOfTheWeek.css';

function genreLabel(slug = '') {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function BookOfTheWeek({
  book,
  buying = false,
  onBuy,
  onPreview,
  price,
  availabilityLabel,
  headingLevel = 2,
  supportingText = 'A standout independent title, selected for readers this week.',
}) {
  if (!book) return null;

  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const bookUrl = `/book/${book.slug}`;
  const canBuyDirect = book.isDirectSale && onBuy;

  const cover = (
    <>
      <BookCover
        title={book.title}
        author={book.author}
        colorClass={book.coverColor}
        coverUrl={book.coverUrl}
        size="lg"
      />
      <span className="shop-weekly-cover-glow" aria-hidden="true" />
    </>
  );

  return (
    <section className="shop-weekly" aria-labelledby="book-of-week-heading">
      <header className="shop-weekly-heading">
        <div>
          <span>Weekly pick</span>
          <Heading id="book-of-week-heading">Book of the week</Heading>
        </div>
        <p>{supportingText}</p>
      </header>

      <article className="shop-weekly-feature">
        {onPreview ? (
          <button type="button" className="shop-weekly-cover-stage" onClick={() => onPreview(book)} aria-label={`Preview ${book.title}`}>
            {cover}
          </button>
        ) : (
          <Link to={bookUrl} className="shop-weekly-cover-stage" aria-label={`View ${book.title}`}>
            {cover}
          </Link>
        )}

        <div className="shop-weekly-content">
          <div className="shop-weekly-label">
            <span>{book.genres?.[0] ? genreLabel(book.genres[0]) : 'Independent publishing'}</span>
            <span>{book.formats?.[0] || 'Book'}</span>
          </div>
          <h3>{book.title}</h3>
          <p className="shop-weekly-author">{book.author}</p>
          <p className="shop-weekly-blurb">{book.blurb || 'A reader-ready independent title available through Indie Converters.'}</p>

          <div className={`shop-weekly-footer${price ? '' : ' shop-weekly-footer--actions-only'}`}>
            {price && (
              <div className="shop-weekly-price">
                <span>{availabilityLabel || (book.isDirectSale ? 'Direct from the author' : 'Available from retailers')}</span>
                <strong>{price}</strong>
              </div>
            )}
            <div className="shop-weekly-actions">
              {onPreview && <button type="button" className="shop-weekly-secondary" onClick={() => onPreview(book)}>View details</button>}
              {canBuyDirect ? (
                <button type="button" className="shop-weekly-primary" onClick={() => onBuy(book)} disabled={buying}>
                  {buying ? 'Adding…' : 'Add to cart'} <span aria-hidden="true">→</span>
                </button>
              ) : (
                <Link to={bookUrl} className="shop-weekly-primary">View book <span aria-hidden="true">→</span></Link>
              )}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
