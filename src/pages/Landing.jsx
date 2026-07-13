import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import SEO from '../components/SEO';
import DashboardPreviewCta from '../components/DashboardPreviewCta';
import PublishingProcessShowcase from '../components/PublishingProcessShowcase';
import HowItWorksShowcase from '../components/HowItWorksShowcase';
import { trackEvent } from '../lib/analytics';
import { fetchBooks, fetchLandingQuotes } from '../lib/api';
import mainHeroImg    from '../assets/main-hero.webp';
import indieWriterImg from '../assets/indie-writer.png';
import indieReaderImg from '../assets/indie-author-readothers.png';
import lightsFutureCoverImg from '../assets/dammie-covers/dammie01.png';
import loveSunsetCoverImg   from '../assets/dammie-covers/dammie-02.png';
import wishHorseCoverImg    from '../assets/dammie-covers/dammie-03.png';
import imgAche   from '../assets/moods/Ache.webp';
import imgDrift  from '../assets/moods/Drift.webp';
import imgHaunt  from '../assets/moods/haunt.webp';
import imgGasp   from '../assets/moods/Gasp.webp';
import imgBurn   from '../assets/moods/Burn.webp';
import imgWonder from '../assets/moods/Wonder.webp';
import imgEscape from '../assets/moods/Escape.webp';
import './Landing.css';

const HERO_DOTS = Array.from({ length: 56 }, (_, index) => index);

const DISTRIBUTION_CHANNELS = [
  { id: 'apple', label: 'Apple Books' },
  { id: 'kobo', label: 'Rakuten Kobo' },
  { id: 'google', label: 'Google Play' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'bn', label: 'Barnes & Noble' },
  { id: 'scribd', label: 'Scribd' },
  { id: 'overdrive', label: 'OverDrive' },
  { id: 'hoopla', label: 'Hoopla' },
  { id: 'baker', label: 'Baker & Taylor' },
  { id: 'tolino', label: 'Tolino' },
  { id: 'vivlio', label: 'Vivlio' },
  { id: 'smashwords', label: 'Smashwords' },
  { id: 'fable', label: 'Fable' },
  { id: 'kobo-plus', label: 'Kobo Plus' },
  { id: 'cloudlibrary', label: 'cloudLibrary' },
  { id: 'odilo', label: 'Odilo' },
  { id: 'borrowbox', label: 'BorrowBox' },
  { id: 'fnac', label: 'Fnac' },
  { id: 'wook', label: 'Wook' },
  { id: 'thalia', label: 'Thalia' },
  { id: 'gardner', label: 'Gardner' },
];

const DISTRIBUTION_ROWS = [DISTRIBUTION_CHANNELS];

function DistributionLogo({ channel }) {
  if (channel.id === 'apple') {
    return (
      <span className="dl-logo dl-logo--apple" aria-label={channel.label}>
        <svg viewBox="0 0 42 42" aria-hidden="true">
          <rect x="6" y="7" width="30" height="28" rx="7" />
          <path d="M14 16.5c2.9-1.5 5.3-.9 7 1.2 1.7-2.1 4.1-2.7 7-1.2v12.8c-3-1.5-5.4-.9-7 1.1-1.6-2-4-2.6-7-1.1Z" />
          <path d="M21 18.1v12.2" />
        </svg>
        <strong>Apple Books</strong>
      </span>
    );
  }

  if (channel.id === 'google') {
    return (
      <span className="dl-logo dl-logo--google" aria-label={channel.label}>
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="M10 7.5 31 20 10 32.5Z" />
          <path d="m10 7.5 12.7 12.6L10 32.5Z" />
        </svg>
        <strong>Google Play</strong>
      </span>
    );
  }

  if (channel.id === 'amazon') {
    return (
      <span className="dl-logo dl-logo--amazon" aria-label={channel.label}>
        <strong>amazon</strong>
        <svg viewBox="0 0 96 16" aria-hidden="true">
          <path d="M12 7.5c15.5 8.7 45.4 8.7 65.7.2" />
          <path d="M71.5 5.2 79 7.3l-4.4 5.9" />
        </svg>
      </span>
    );
  }

  if (channel.id === 'bn') {
    return (
      <span className="dl-logo dl-logo--bn" aria-label={channel.label}>
        <strong>B&amp;N</strong>
        <span>Barnes &amp; Noble</span>
      </span>
    );
  }

  return (
    <span className={`dl-logo dl-logo--${channel.id}`} aria-label={channel.label}>
      <strong>{channel.label}</strong>
    </span>
  );
}

const TICKER_WORDS = ['publishing.', 'finding.', 'reading.'];

function HeroTicker() {
  const [cur, setCur]        = useState(0);
  const [animating, setAnim] = useState(false);
  const nxt = (cur + 1) % TICKER_WORDS.length;

  useEffect(() => {
    const id = setInterval(() => setAnim(a => a ? a : true), 3500);
    return () => clearInterval(id);
  }, []);

  function onDone() {
    setCur(nxt);
    setAnim(false);
  }

  return (
    <span className="hero-ticker">
      <span className={`hero-tw${animating ? ' tw-exit' : ''}`} onAnimationEnd={onDone}>
        {TICKER_WORDS[cur]}
      </span>
      {animating && (
        <span className="hero-tw tw-enter" aria-hidden="true">
          {TICKER_WORDS[nxt]}
        </span>
      )}
    </span>
  );
}

const FALLBACK_QUOTES = [
  {
    quote: 'Every book deserves a clean file, a real cover, and a chance to be found.',
    author: 'Indie Converters',
    role: 'Publishing principle',
  },
  {
    quote: "Self-publishing isn't a compromise. It is a different kind of craft.",
    author: 'Indie Converters',
    role: 'For authors',
  },
  {
    quote: 'The best publishing tools get out of the way and let the writing lead.',
    author: 'Indie Converters',
    role: 'Product note',
  },
  {
    quote: 'An indie author with the right files can reach any reader, anywhere.',
    author: 'Indie Converters',
    role: 'Distribution belief',
  },
];

function QuoteRotator({ quotes = FALLBACK_QUOTES }) {
  const quoteItems = (quotes?.length ? quotes : FALLBACK_QUOTES)
    .map(item => typeof item === 'string'
      ? { quote: item, author: 'Indie Converters', role: '' }
      : {
          quote: item.quote || item.text || '',
          author: item.author || 'Indie Converters',
          role: item.role || '',
        })
    .filter(item => item.quote);

  const [idx, setIdx]       = useState(0);
  const [fading, setFading] = useState(false);
  const nextIdxRef = useRef(0);
  const activeQuote = quoteItems[idx] || quoteItems[0];

  useEffect(() => {
    if (idx >= quoteItems.length) setIdx(0);
  }, [idx, quoteItems.length]);

  useEffect(() => {
    if (quoteItems.length < 2) return undefined;
    const id = setInterval(() => {
      nextIdxRef.current = (idx + 1) % quoteItems.length;
      setFading(true);
    }, 5000);
    return () => clearInterval(id);
  }, [idx, quoteItems.length]);

  function onTransitionEnd(e) {
    if (e.propertyName !== 'opacity' || !fading) return;
    setIdx(nextIdxRef.current);
    setFading(false);
  }

  function goTo(i) {
    if (i === idx || fading) return;
    nextIdxRef.current = i;
    setFading(true);
  }

  if (!activeQuote) return null;

  return (
    <div className="quote-card">
      <span className="quote-mark" aria-hidden="true">
        <span />
        <span />
      </span>
      <blockquote
        className={`quote-text${fading ? ' quote-text--fade' : ''}${activeQuote.quote.length > 92 ? ' quote-text--long' : ''}`}
        onTransitionEnd={onTransitionEnd}
      >
        {activeQuote.quote}
      </blockquote>
      <div className="quote-footer-row">
        <div className="quote-controls" aria-label="Quote navigation">
          {quoteItems.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`quote-dot${i === idx ? ' quote-dot--active' : ''}`}
              aria-label={`Show quote ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <strong className="quote-brand">indieconverters</strong>
      </div>
    </div>
  );
}

const MOODS = [
  { verb: 'Ache',   label: 'Dark family tension',    desc: 'Books that pull at the fraying edges of the people closest to us.',                          accent: '#C084FC', img: imgAche   },
  { verb: 'Drift',  label: 'Quiet strange worlds',   desc: 'Stories where the uncanny sits just below the surface of the ordinary.',                     accent: '#67E8F9', img: imgDrift  },
  { verb: 'Haunt',  label: 'Gothic but readable',    desc: 'All the atmosphere, none of the impenetrable Victorian prose.',                              accent: '#FDA4AF', img: imgHaunt  },
  { verb: 'Gasp',   label: 'Psychological thrillers',desc: 'Untrustworthy narrators, bad decisions, and endings you didn\'t see coming.',                accent: '#93C5FD', img: imgGasp   },
  { verb: 'Burn',   label: 'Women under pressure',   desc: 'Characters holding too much together for too long — until they can\'t.',                     accent: '#FCA5A5', img: imgBurn   },
  { verb: 'Wonder', label: 'Mind-bending nonfiction',desc: 'Science, psychology, and human behaviour explained through story.',                          accent: '#86EFAC', img: imgWonder },
  { verb: 'Escape', label: 'Adventure & discovery',  desc: 'Books that pull you out of your life and drop you somewhere better.',                        accent: '#FCD34D', img: imgEscape },
  { verb: 'Grieve', label: 'Quiet loss & resilience',desc: 'Stories that sit with grief honestly, without rushing toward resolution.',                   accent: '#94A3B8', accentDark: '#334155' },
];

const VALUE_PROPS = [
  {
    title: 'You own', highlight: 'your book', photo: indieWriterImg,
    body: 'No exclusivity clauses, no rights grabs. Publish through Indie Converters and keep full ownership of your manuscript, your cover, and your sales — sell it anywhere, anytime, on your own terms.',
    cta: 'Read the author promise', to: '/publish#publish-faq',
  },
  {
    title: 'Tools for', highlight: 'every stage',
    stack: [
      { src: lightsFutureCoverImg, title: 'The Lights in the Future', author: 'Tom Holink' },
      { src: loveSunsetCoverImg,   title: 'Love Before Sunset',       author: 'Jessica Pane' },
      { src: wishHorseCoverImg,    title: 'If I Had a Wish and a Horse', author: 'Jun Lint' },
    ],
    body: 'From a raw manuscript to a finished, reader-ready file. Our upload wizard formats interiors, builds distribution-ready EPUBs, calculates print covers, and estimates royalties — before you publish a single copy.',
    cta: 'Start your upload', to: '/upload',
  },
  {
    title: 'Explore and', highlight: 'support indie voices', photo: indieReaderImg,
    body: 'Readers browse by mood, genre, and story — not just bestseller lists. Free samples, curated collections, and honest author profiles make it easy to find indie work worth supporting.',
    cta: 'Browse indie books', to: '/browse',
  },
];

const VALUE_SECTION_CTAS = [
  {
    title: 'Ready to publish on your own terms?',
    body: 'Start privately, preview every step, and decide when your book is ready for readers.',
    primary: { label: 'Start an upload', to: '/upload' },
    secondary: { label: 'Read publishing FAQs', to: '/publish#publish-faq' },
    cards: [
      {
        icon: 'tag',
        title: 'Know the cost',
        body: 'Estimate formatting, print specs, and royalties before you commit.',
        label: 'See publisher tools',
        to: '/publish',
      },
      {
        icon: 'code',
        title: 'Prepare every format',
        body: 'Build clean EPUB and print-ready files without losing control of your book.',
        label: 'Open the upload wizard',
        to: '/upload',
      },
    ],
  },
  {
    title: 'Ready to find readers?',
    body: 'Put your book in a place built for browsing, saving, sharing, and independent discovery.',
    primary: { label: 'Browse indie books', to: '/browse' },
    secondary: { label: 'Explore moods', to: '/moods' },
    cards: [
      {
        icon: 'heart',
        title: 'Build reader interest',
        body: 'Use samples, mood shelves, and book pages that help people decide what to read next.',
        label: 'Browse collections',
        to: '/browse',
      },
      {
        icon: 'chart',
        title: 'Track what works',
        body: 'Watch visits, saves, retailer clicks, and royalties come together in your dashboard.',
        label: 'View dashboard',
        to: '/dashboard',
      },
    ],
  },
];

function ValueBridgeIcon({ type }) {
  if (type === 'code') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8.5 7-4.5 5 4.5 5" />
        <path d="m15.5 7 4.5 5-4.5 5" />
        <path d="m13.5 5-3 14" />
      </svg>
    );
  }

  if (type === 'heart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.25s-7.25-4.38-8.75-9.38C2.1 7.02 4.55 4.25 7.8 4.25c1.9 0 3.25 1.03 4.2 2.36.95-1.33 2.3-2.36 4.2-2.36 3.25 0 5.7 2.77 4.55 6.62C19.25 15.87 12 20.25 12 20.25Z" />
      </svg>
    );
  }

  if (type === 'chart') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 19.5h15" />
        <path d="M6.5 16.5v-4" />
        <path d="M11.5 16.5v-8" />
        <path d="M16.5 16.5v-11" />
        <path d="m14.5 5.5 2-2 2 2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m20 12.5-7.5 7.5L4 11.5V4h7.5L20 12.5Z" />
      <path d="M8.5 8.5h.01" />
    </svg>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState([]);
  const [quotes, setQuotes] = useState(FALLBACK_QUOTES);
  const [moodActive,      setMoodActive]      = useState(null);
  const [moodScrollState, setMoodScrollState] = useState({ atStart: true, atEnd: false });
  const heroRef = useRef(null);
  const moodTrackRef = useRef(null);

  useEffect(() => {
    fetchBooks({ limit: 48, indieOnly: true }).then(({ books }) => setAllBooks(books));
    fetchLandingQuotes().then(fetchedQuotes => {
      if (fetchedQuotes.length) setQuotes(fetchedQuotes);
    });
  }, []);

  function updateMoodScrollState() {
    const track = moodTrackRef.current;
    if (!track) return;
    setMoodScrollState({
      atStart: track.scrollLeft <= 2,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 2,
    });
  }

  function scrollMoods(direction) {
    const track = moodTrackRef.current;
    if (!track) return;
    const card = track.querySelector('.mood-lcard');
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 10;
    const step = (card?.getBoundingClientRect().width || track.clientWidth / 3) + gap;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  useEffect(() => {
    updateMoodScrollState();
    window.addEventListener('resize', updateMoodScrollState);
    return () => window.removeEventListener('resize', updateMoodScrollState);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hero || reduceMotion) return undefined;

    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const resetDots = () => {
      hero.querySelectorAll('.hero-dot').forEach(dot => {
        dot.style.removeProperty('--dot-alpha');
        dot.style.removeProperty('--dot-scale');
        dot.style.removeProperty('--dot-shift-x');
        dot.style.removeProperty('--dot-shift-y');
      });
    };

    const updateHeroMotion = () => {
      frame = 0;
      const heroRect = hero.getBoundingClientRect();
      const localX = pointerX - heroRect.left;
      const localY = pointerY - heroRect.top;
      const xProgress = Math.max(0, Math.min(localX / heroRect.width, 1));
      const yProgress = Math.max(0, Math.min(localY / heroRect.height, 1));
      const xOffset = xProgress - 0.5;
      const yOffset = yProgress - 0.5;

      hero.classList.add('hero--interactive');
      hero.style.setProperty('--hero-parallax-x', `${(-xOffset * 18).toFixed(2)}px`);
      hero.style.setProperty('--hero-parallax-y', `${(-yOffset * 12).toFixed(2)}px`);
      hero.style.setProperty('--hero-dots-x', `${(xOffset * 10).toFixed(2)}px`);
      hero.style.setProperty('--hero-dots-y', `${(yOffset * 8).toFixed(2)}px`);
      hero.style.setProperty('--hero-spotlight-x', `${(xProgress * 100).toFixed(2)}%`);
      hero.style.setProperty('--hero-spotlight-y', `${(yProgress * 100).toFixed(2)}%`);
      hero.style.setProperty('--hero-spotlight-opacity', '0.95');

      hero.querySelectorAll('.hero-dot').forEach(dot => {
        const dotRect = dot.getBoundingClientRect();
        const dotX = dotRect.left + dotRect.width / 2;
        const dotY = dotRect.top + dotRect.height / 2;
        const diffX = pointerX - dotX;
        const diffY = pointerY - dotY;
        const distance = Math.hypot(diffX, diffY);
        const force = Math.max(0, 1 - distance / 145);

        if (force <= 0) {
          dot.style.removeProperty('--dot-alpha');
          dot.style.removeProperty('--dot-scale');
          dot.style.removeProperty('--dot-shift-x');
          dot.style.removeProperty('--dot-shift-y');
          return;
        }

        dot.style.setProperty('--dot-alpha', (0.34 + force * 0.56).toFixed(2));
        dot.style.setProperty('--dot-scale', (1 + force * 1.25).toFixed(2));
        dot.style.setProperty('--dot-shift-x', `${((diffX / Math.max(distance, 1)) * force * 5).toFixed(2)}px`);
        dot.style.setProperty('--dot-shift-y', `${((diffY / Math.max(distance, 1)) * force * 5).toFixed(2)}px`);
      });
    };

    const handlePointerMove = event => {
      if (event.pointerType === 'touch') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(updateHeroMotion);
    };

    const handlePointerLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      hero.classList.remove('hero--interactive');
      hero.style.setProperty('--hero-parallax-x', '0px');
      hero.style.setProperty('--hero-parallax-y', '0px');
      hero.style.setProperty('--hero-dots-x', '0px');
      hero.style.setProperty('--hero-dots-y', '0px');
      hero.style.setProperty('--hero-spotlight-x', '64%');
      hero.style.setProperty('--hero-spotlight-y', '34%');
      hero.style.setProperty('--hero-spotlight-opacity', '0.48');
      resetDots();
    };

    hero.addEventListener('pointermove', handlePointerMove);
    hero.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      hero.removeEventListener('pointermove', handlePointerMove);
      hero.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  const withCovers = allBooks.filter(b => b.coverUrl);
  const featured = withCovers.slice(0, 5);

  function scrollToValueProps(e) {
    e.preventDefault();
    const el = document.getElementById('why-indie-converters');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({ top, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  return (
    <div className="landing">
      <SEO
        title="Indie Converters — Books that deserve to be found."
        description="Curated indie books for readers. A proper publishing tool for authors. No exclusivity, no middlemen."
        path="/"
      />

      {/* ── Hero ── */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg" style={{ backgroundImage: `url(${mainHeroImg})` }} />
        <div className="hero-overlay" />
        <div className="hero-spotlight" aria-hidden="true" />

        <div className="hero-dot-field hero-dot-field--right" aria-hidden="true">
          {HERO_DOTS.map(index => (
            <span
              key={`right-${index}`}
              className="hero-dot"
              style={{ '--dot-delay': `${(index % 14) * 0.08}s` }}
            />
          ))}
        </div>

        <div className="hero-dot-field hero-dot-field--lower" aria-hidden="true">
          {HERO_DOTS.map(index => (
            <span
              key={`lower-${index}`}
              className="hero-dot"
              style={{ '--dot-delay': `${((index + 5) % 14) * 0.08}s` }}
            />
          ))}
        </div>

        <div className="hero-left">
          <h1 className="hero-heading">
            Books worth<br />
            <HeroTicker />
          </h1>

          <p className="hero-sub">
            We give authors a simple way to bring their work online, and help readers find good books.
          </p>

          <div className="hero-ctas">
            <Link
              to="/upload"
              className="btn hero-btn-primary"
              onClick={() => trackEvent('Start Publishing Click', { location: 'hero' })}
            >
              Start Publishing
            </Link>
            <Link
              to="/browse"
              className="hero-text-link"
              onClick={() => trackEvent('Browse Books Click', { location: 'hero' })}
            >
              Browse Books →
            </Link>
          </div>
        </div>

        <a
          href="#why-indie-converters"
          className="hero-scroll-cue"
          aria-label="Scroll to why Indie Converters"
          onClick={scrollToValueProps}
        >
          <span className="hero-scroll-cue-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M5 9l7 7 7-7" />
            </svg>
          </span>
        </a>
      </section>

      {/* ── Distribution channels ── */}
      <section className="distribution-strip" aria-labelledby="distribution-heading">
        <div className="container distribution-inner">
          <div className="distribution-copy">
            <h2 id="distribution-heading">Sell your book where readers already are</h2>
            <p>Retailers, libraries, and regional ebookstores authors already trust.</p>
          </div>
          <div className="distribution-marquee" aria-label="Distribution channels">
            {DISTRIBUTION_ROWS.map((channels, rowIndex) => (
              <div
                key={`distribution-row-${rowIndex}`}
                className={`distribution-marquee-row distribution-marquee-row--${rowIndex + 1}`}
              >
                <div className="distribution-marquee-track">
                  {[0, 1].map(copyIndex => (
                    <div
                      key={`distribution-set-${rowIndex}-${copyIndex}`}
                      className="distribution-marquee-set"
                      aria-hidden={copyIndex === 1 ? true : undefined}
                    >
                      {channels.map(channel => (
                        <div key={`${channel.id}-${copyIndex}`} className="distribution-logo-cell">
                          <DistributionLogo channel={channel} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DashboardPreviewCta />

      <PublishingProcessShowcase />

      {/* ── Featured Books ── */}
      <section className="section featured">
        <div className="container">
          <div className="section-header featured-header">
            <div>
              <div className="eyebrow">Featured work</div>
              <h2>Hand-picked indie titles</h2>
            </div>
            <Link to="/browse" className="featured-see-all">
              Browse all books
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>
          <div className="books-shelf">
            {featured.map(book => (
              <Link to={`/book/${book.slug}`} key={book.slug} className="shelf-item">
                <BookCover title={book.title} author={book.author} colorClass={book.coverColor} coverUrl={book.coverUrl} />
                <div className="shelf-meta">
                  <span className="shelf-genre">{book.genre}</span>
                  <span className="shelf-title">{book.title}</span>
                  <span className="shelf-author">{book.author}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value stories ── */}
      <div className="value-stories" id="why-indie-converters">
        {VALUE_PROPS.map((p, i) => {
          const bridge = VALUE_SECTION_CTAS[i];

          return (
            <Fragment key={p.title}>
              <section
                className={`value-story value-story--${i + 1}${p.stack ? ' value-story--stack-card' : ''}${p.photo ? ' value-story--photo-card' : ''}`}
              >
                <div className="value-story-inner">
                  <div className="value-story-card">
                    {p.photo && (
                      <img
                        src={p.photo}
                        alt=""
                        className="value-story-card-img"
                        style={p.fillPosition ? { objectPosition: p.fillPosition } : undefined}
                      />
                    )}
                    {p.stack && (
                      <div className="value-story-stack" aria-hidden="true">
                        {p.stack.map((book, idx) => (
                          <div className={`value-story-stack-item value-story-stack-item--${idx + 1}`} key={book.title}>
                            <BookCover title={book.title} author={book.author} coverUrl={book.src} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="value-story-card-shade" />
                    <div className="value-story-card-copy">
                      <h2>{p.title} <span>{p.highlight}</span></h2>
                      <p>{p.body}</p>
                      <Link to={p.to} className="value-story-card-cta">
                        {p.cta}
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                          <path d="M3 8h10M9 4l4 4-4 4" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {bridge && (
                <section className="value-bridge" aria-label={bridge.title}>
                  <div className="value-bridge-inner">
                    <div className="value-bridge-main">
                      <h2>{bridge.title}</h2>
                      <p>{bridge.body}</p>
                      <div className="value-bridge-actions">
                        <Link to={bridge.primary.to} className="value-bridge-primary">
                          {bridge.primary.label}
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                            <path d="M3 8h10M9 4l4 4-4 4" />
                          </svg>
                        </Link>
                        <Link to={bridge.secondary.to} className="value-bridge-secondary">
                          {bridge.secondary.label}
                        </Link>
                      </div>
                    </div>

                    {bridge.cards.map(card => (
                      <article className="value-bridge-card" key={card.title}>
                        <span className="value-bridge-icon">
                          <ValueBridgeIcon type={card.icon} />
                        </span>
                        <h3>{card.title}</h3>
                        <p>{card.body}</p>
                        <Link to={card.to}>
                          {card.label}
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                            <path d="M3 8h10M9 4l4 4-4 4" />
                          </svg>
                        </Link>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </Fragment>
          );
        })}
      </div>

      {/* ── Mood shelf ── */}
      <section className="section mood-shelf">
        <div className="container">
          <div className="mood-shelf-hero">
            <div className="mood-shelf-hero-left">
              <h2 className="mood-lheading">Find your next read by feeling</h2>
              <button
                className="btn mood-surprise-btn"
                onClick={() => {
                  const GENRES = ['literary-fiction', 'science-fiction', 'horror', 'thriller', 'nonfiction', 'fiction'];
                  navigate(`/browse?genre=${GENRES[Math.floor(Math.random() * GENRES.length)]}`);
                }}
              >
                Surprise me →
              </button>
            </div>
            <div className="mood-shelf-hero-copy">
              <p className="mood-lsub">Pick a feeling. We'll point you to the right shelf.</p>
              <p className="mood-lsub">From books that ache quietly to stories that burn, escape, haunt, or make you wonder, browse indie titles by the mood they leave behind.</p>
            </div>
          </div>
          <div className="mood-carousel">
            <button
              type="button"
              className="mood-carousel-arrow mood-carousel-arrow--prev"
              onClick={() => scrollMoods(-1)}
              disabled={moodScrollState.atStart}
              aria-label="Previous moods"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M15 6l-6 6 6 6"/></svg>
            </button>

            <div className="mood-carousel-track" ref={moodTrackRef} onScroll={updateMoodScrollState}>
              {MOODS.map(m => (
                <Link
                  to="/moods"
                  key={m.verb}
                  className={`mood-lcard${m.img ? ' mood-lcard--img' : ''}${moodActive?.verb === m.verb ? ' mood-lcard--active' : ''}`}
                  style={!m.img ? { background: m.accentDark } : undefined}
                  onMouseEnter={() => setMoodActive(m)}
	                  onMouseLeave={() => setMoodActive(null)}
	                >
	                  {m.img ? (
                      <img src={m.img} className="mood-lcard-photo" alt="" />
                    ) : (
                      <span className="mood-lcard-photo mood-lcard-photo--fallback" style={{ background: m.accentDark }}>
                        <span>{m.verb}</span>
                      </span>
                    )}
	                  <div className="mood-lcard-body">
	                    <div className="mood-lcard-top">
	                      <span className="mood-lcard-verb" style={{ color: m.accent }}>{m.verb}</span>
	                      <span className="mood-lcard-label">{m.label}</span>
	                    </div>
	                    <p className="mood-lcard-desc">{m.desc}</p>
	                  </div>
	                </Link>
              ))}
            </div>

            <button
              type="button"
              className="mood-carousel-arrow mood-carousel-arrow--next"
              onClick={() => scrollMoods(1)}
              disabled={moodScrollState.atEnd}
              aria-label="Next moods"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M9 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </section>

      <HowItWorksShowcase />

      {/* ── Quote ── */}
      <section className="section quote-section">
        <div className="container quote-container">
          <QuoteRotator quotes={quotes} />
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="landing-cta">
        <div className="container landing-cta-inner">
          <span className="landing-cta-kicker">Ready to get started?</span>
          <h2 className="landing-cta-heading">Create your free account</h2>
          <Link
            to="/signup"
            className="btn landing-cta-btn"
            onClick={() => trackEvent('Create Account Click', { location: 'landing-bottom-cta' })}
          >
            Create a free account
          </Link>
        </div>
      </section>
    </div>
  );
}
