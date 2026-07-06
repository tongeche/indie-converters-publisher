import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchBooks } from '../lib/api';
import SEO from '../components/SEO';
import imgAche   from '../assets/moods/Ache.webp';
import imgDrift  from '../assets/moods/Drift.webp';
import imgHaunt  from '../assets/moods/haunt.webp';
import imgGasp   from '../assets/moods/Gasp.webp';
import imgBurn   from '../assets/moods/Burn.webp';
import imgWonder from '../assets/moods/Wonder.webp';
import imgEscape from '../assets/moods/Escape.webp';
import './Moods.css';

const MOODS = [
  {
    verb: 'Ache',
    label: 'Dark family tension',
    desc: 'Books that pull at the fraying edges of the people closest to us.',
    accent: '#C084FC',
    accentDark: '#7C3AED',
    genre: 'literary-fiction',
    img: imgAche,
  },
  {
    verb: 'Drift',
    label: 'Quiet strange worlds',
    desc: 'Stories where the uncanny sits just below the surface of the ordinary.',
    accent: '#67E8F9',
    accentDark: '#0891B2',
    genre: 'science-fiction',
    img: imgDrift,
  },
  {
    verb: 'Haunt',
    label: 'Gothic but readable',
    desc: 'All the atmosphere, none of the impenetrable Victorian prose.',
    accent: '#FDA4AF',
    accentDark: '#BE123C',
    genre: 'horror',
    img: imgHaunt,
  },
  {
    verb: 'Gasp',
    label: 'Psychological thrillers',
    desc: 'Untrustworthy narrators, bad decisions, and endings you didn\'t see coming.',
    accent: '#93C5FD',
    accentDark: '#1D4ED8',
    genre: 'thriller',
    img: imgGasp,
  },
  {
    verb: 'Burn',
    label: 'Women under pressure',
    desc: 'Characters holding too much together for too long — until they can\'t.',
    accent: '#FCA5A5',
    accentDark: '#B91C1C',
    genre: 'literary-fiction',
    img: imgBurn,
  },
  {
    verb: 'Wonder',
    label: 'Mind-bending nonfiction',
    desc: 'Science, psychology, and human behaviour explained through story.',
    accent: '#86EFAC',
    accentDark: '#15803D',
    genre: 'nonfiction',
    img: imgWonder,
  },
  {
    verb: 'Escape',
    label: 'Adventure & discovery',
    desc: 'Books that pull you out of your life and drop you somewhere better.',
    accent: '#FCD34D',
    accentDark: '#B45309',
    genre: 'fiction',
    img: imgEscape,
  },
  {
    verb: 'Grieve',
    label: 'Quiet loss & resilience',
    desc: 'Stories that sit with grief honestly, without rushing toward resolution.',
    accent: '#94A3B8',
    accentDark: '#334155',
    genre: 'literary-fiction',
  },
];

export default function Moods() {
  const navigate = useNavigate();
  const [active, setActive]           = useState(null);
  const [displayed, setDisplayed]     = useState(null);
  const [headingFade, setHeadingFade] = useState(false);
  const [picks, setPicks]             = useState([]);
  const [picksLoading, setPicksLoading] = useState(false);
  const timerRef = useRef(null);

  /* Fade heading out → swap → fade in */
  useEffect(() => {
    clearTimeout(timerRef.current);
    setHeadingFade(true);
    timerRef.current = setTimeout(() => {
      setDisplayed(active);
      setHeadingFade(false);
    }, 180);
    return () => clearTimeout(timerRef.current);
  }, [active]);

  /* Fetch picks whenever the displayed mood settles */
  useEffect(() => {
    if (!displayed) { setPicks([]); return; }
    let cancelled = false;
    setPicksLoading(true);
    fetchBooks({ genres: [displayed.genre], limit: 12 })
      .then(({ books }) => {
        if (cancelled) return;
        setPicks(books.filter(b => b.coverUrl).slice(0, 4));
        setPicksLoading(false);
      })
      .catch(() => { if (!cancelled) setPicksLoading(false); });
    return () => { cancelled = true; };
  }, [displayed]);

  function handleRandom() {
    const m = MOODS[Math.floor(Math.random() * MOODS.length)];
    navigate(`/browse?genre=${m.genre}`);
  }

  return (
    <div className="moods-page">
      <SEO
        title="Book Moods | IndieConverters"
        description="Pick a feeling, find a book. Mood-based discovery for indie fiction and nonfiction."
        path="/moods"
      />

      {/* ── Hero ── */}
      <section className="moods-hero">
        <div className="container">
          <p className="moods-eyebrow">Book Moods</p>
          <h1 className={`moods-heading ${headingFade ? 'moods-heading--fade' : ''}`}>
            {displayed ? (
              <>
                Books that make you{' '}
                <em style={{ color: displayed.accent }}>{displayed.verb.toLowerCase()}.</em>
              </>
            ) : (
              <>What do you want<br />to <em>feel?</em></>
            )}
          </h1>
          <p className="moods-sub">Pick a feeling. We'll point you to the right shelf.</p>
        </div>
      </section>

      {/* ── Mood grid ── */}
      <div className="container moods-grid-wrap">
        <div className="moods-grid">
          {MOODS.map((m) => {
            const isActive = active?.verb === m.verb;
            const hasImg   = Boolean(m.img);
            return (
              <div
                key={m.verb}
                role="button"
                tabIndex={0}
                className={`mood-tile ${isActive ? 'mood-tile--active' : ''} ${hasImg ? 'mood-tile--has-img' : ''}`}
                style={{
                  '--accent':      m.accent,
                  '--accent-dark': m.accentDark,
                  ...(hasImg ? { backgroundImage: `url(${m.img})` } : {}),
                }}
                onMouseEnter={() => setActive(m)}
                onClick={() => setActive(m)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(m); }
                }}
              >
                <div className="mood-tile-bg" />
                {hasImg && <div className="mood-tile-photo-overlay" />}
                <div className="mood-tile-inner">
                  <div className="mood-tile-top">
                    <span className="mood-tile-tag">Mood</span>
                    <span className="mood-tile-verb">{m.verb}</span>
                    <span className="mood-tile-label">{m.label}</span>
                  </div>
                  <div className="mood-tile-reveal">
                    <p className="mood-tile-desc">{m.desc}</p>
                    <Link
                      to={`/browse?genre=${m.genre}`}
                      className="mood-tile-cta"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Browse books →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="moods-hint">Hover or tap a feeling to see picks below</p>
      </div>

      {/* ── Featured picks ── */}
      <section className="moods-picks">
        <div className="container">
          <div className={`moods-picks-header ${headingFade ? 'moods-picks--fade' : ''}`}>
            {displayed ? (
              <>
                <p className="moods-picks-kicker">Right now in</p>
                <h2 className="moods-picks-title" style={{ color: displayed.accent }}>
                  {displayed.verb}
                </h2>
              </>
            ) : (
              <>
                <p className="moods-picks-kicker">Featured picks</p>
                <h2 className="moods-picks-title">Hover a mood above</h2>
              </>
            )}
          </div>

          <div className={`moods-picks-row ${headingFade ? 'moods-picks--fade' : ''}`}>
            {picksLoading ? (
              [0, 1, 2, 3].map(i => <div key={i} className="picks-skeleton" />)
            ) : picks.length > 0 ? (
              picks.map(book => (
                <Link key={book.slug} to={`/books/${book.slug}`} className="picks-book">
                  <div className="picks-cover">
                    <img src={book.coverUrl} alt={book.title} />
                  </div>
                  <p className="picks-title">{book.title}</p>
                  <p className="picks-author">{book.author}</p>
                </Link>
              ))
            ) : displayed ? (
              <p className="picks-empty">No books tagged yet in this mood — check back soon.</p>
            ) : (
              [0, 1, 2, 3].map(i => (
                <div key={i} className="picks-placeholder" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Randomiser ── */}
      <section className="moods-random">
        <div className="container moods-random-inner">
          <div>
            <h2 className="moods-random-heading">Can't decide?</h2>
            <p className="moods-random-sub">Let us pick a shelf for you.</p>
          </div>
          <button className="btn moods-random-btn" onClick={handleRandom}>
            Surprise me →
          </button>
        </div>
      </section>

    </div>
  );
}
