import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import SEO from '../components/SEO';
import DashboardPreviewCta from '../components/DashboardPreviewCta';
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

const DISTRIBUTION_ROWS = [
  DISTRIBUTION_CHANNELS.filter((_, index) => index % 2 === 0),
  DISTRIBUTION_CHANNELS.filter((_, index) => index % 2 === 1),
];

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

function ValuePropIcon({ type }) {
  if (type === 'link') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.25 16.75 16.75 7.25" />
        <path d="M9 7.25h7.75V15" />
        <path d="M10.25 5.25H6.5a2.25 2.25 0 0 0-2.25 2.25v10a2.25 2.25 0 0 0 2.25 2.25h10a2.25 2.25 0 0 0 2.25-2.25v-3.75" />
      </svg>
    );
  }

  if (type === 'convert') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3.75h6.25L17 7.5v12.75H7A2 2 0 0 1 5 18.25V5.75a2 2 0 0 1 2-2Z" />
        <path d="M13 3.75V7.5h4" />
        <path d="M8.5 12.25h6" />
        <path d="m12.75 10 2.25 2.25-2.25 2.25" />
        <path d="M15.5 16.75h-6" />
        <path d="m11.75 14.5-2.25 2.25L11.75 19" />
      </svg>
    );
  }

  if (type === 'read') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.75 5.5h5.5A3.75 3.75 0 0 1 14 9.25v10.25H8.5a3.75 3.75 0 0 0-3.75 3.75V5.5Z" />
        <path d="M14 9.25a3.75 3.75 0 0 1 3.75-3.75h1.5v17.75a3.75 3.75 0 0 0-3.75-3.75H14" />
        <path d="M10.25 9.25H7.75" />
        <path d="m18.25 10.75.55 1.12 1.24.18-.9.88.21 1.24-1.1-.58-1.1.58.21-1.24-.9-.88 1.24-.18.55-1.12Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 10.25V8a4.5 4.5 0 0 1 8.6-1.86" />
      <path d="M6.75 10.25h10.5a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2v-5.5a2 2 0 0 1 2-2Z" />
      <path d="M12 14.25v2.25" />
    </svg>
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
    title: 'You own', highlight: 'your book', icon: 'unlock', photo: indieWriterImg, photoFloat: true,
    body: 'No exclusivity clauses, no rights grabs. Publish through Indie Converters and keep full ownership of your manuscript, your cover, and your sales — sell it anywhere, anytime, on your own terms.',
    bg: 'var(--clay)', fg: '#F0EBFF',
  },
  {
    title: 'Tools for', highlight: 'every stage', icon: 'convert',
    stack: [
      { src: lightsFutureCoverImg, title: 'The Lights in the Future', author: 'Tom Holink' },
      { src: loveSunsetCoverImg,   title: 'Love Before Sunset',       author: 'Jessica Pane' },
      { src: wishHorseCoverImg,    title: 'If I Had a Wish and a Horse', author: 'Jun Lint' },
    ],
    body: 'From a raw manuscript to a finished, reader-ready file. Our upload wizard formats interiors, builds distribution-ready EPUBs, calculates print covers, and estimates royalties — before you publish a single copy.',
    bg: 'var(--ochre)', fg: '#1B1330',
  },
  {
    title: 'Explore and', highlight: 'support indie voices', icon: 'read', light: true, photo: indieReaderImg,
    body: 'Readers browse by mood, genre, and story — not just bestseller lists. Free samples, curated collections, and honest author profiles make it easy to find indie work worth supporting.',
    bg: 'var(--parchment)', fg: 'var(--clay)',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState([]);
  const [quotes, setQuotes] = useState(FALLBACK_QUOTES);
  const [moodActive,      setMoodActive]      = useState(null);
  const [moodDisplayed,   setMoodDisplayed]   = useState(null);
  const [moodHeadingFade, setMoodHeadingFade] = useState(false);
  const [moodScrollState, setMoodScrollState] = useState({ atStart: true, atEnd: false });
  const heroRef = useRef(null);
  const moodTimerRef = useRef(null);
  const moodTrackRef = useRef(null);

  useEffect(() => {
    fetchBooks({ limit: 48, indieOnly: true }).then(({ books }) => setAllBooks(books));
    fetchLandingQuotes().then(fetchedQuotes => {
      if (fetchedQuotes.length) setQuotes(fetchedQuotes);
    });
  }, []);

  useEffect(() => {
    clearTimeout(moodTimerRef.current);
    setMoodHeadingFade(true);
    moodTimerRef.current = setTimeout(() => {
      setMoodDisplayed(moodActive);
      setMoodHeadingFade(false);
    }, 180);
    return () => clearTimeout(moodTimerRef.current);
  }, [moodActive]);

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

  function handlePortraitTilt(e) {
    if (e.pointerType === 'touch') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    e.currentTarget.style.setProperty('--vp-rotate-x', `${(-y * 10).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--vp-rotate-y', `${(x * 12).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--vp-lift', '-8px');
  }

  function resetPortraitTilt(e) {
    e.currentTarget.style.removeProperty('--vp-rotate-x');
    e.currentTarget.style.removeProperty('--vp-rotate-y');
    e.currentTarget.style.removeProperty('--vp-lift');
  }

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

      <DashboardPreviewCta />

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
        {VALUE_PROPS.map((p, i) => (
          <section
            key={p.title}
            className={`value-story value-story--${i + 1}${i % 2 === 1 ? ' value-story--reverse' : ''}${p.light ? ' value-story--light' : ''}`}
          >
            <div className="container value-story-inner">
              <div className="value-story-panel">
                <div className="value-story-copy">
                  <h2>{p.title} <span>{p.highlight}</span></h2>
                  <p>{p.body}</p>
                </div>

                <div className="value-story-stage">
                  {p.stack ? (
                    <div className="vp-media vp-media--stack">
                      {p.stack.map((book, idx) => (
                        <div className={`vp-stack-item vp-stack-item--${idx + 1}`} key={book.title}>
                          <BookCover title={book.title} author={book.author} coverUrl={book.src} />
                        </div>
                      ))}
                    </div>
                  ) : p.photo && p.photoFloat ? (
                    <div
                      className="vp-media vp-media--photo"
                      onPointerMove={handlePortraitTilt}
                      onPointerLeave={resetPortraitTilt}
                    >
                      <img src={p.photo} alt="" className="vp-media-photo" />
                    </div>
                  ) : p.photo ? (
                    <div className="vp-media vp-media--fill">
                      <img
                        src={p.photo}
                        alt=""
                        className="vp-media-fill-img"
                        style={p.fillPosition ? { objectPosition: p.fillPosition } : undefined}
                      />
                    </div>
                  ) : (
                    <div className="vp-media" style={{ background: p.bg, color: p.fg }}>
                      <span className="vp-media-dots" aria-hidden="true" />
                      <span className="vp-media-icon"><ValuePropIcon type={p.icon} /></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ── Mood shelf ── */}
      <section className="section mood-shelf">
        <div className="container">
          <div className="mood-shelf-hero">
            <div className="mood-shelf-hero-left">
              <div className="eyebrow" style={{ color: 'var(--ochre)' }}>Book Moods</div>
              <h2 className={`mood-lheading ${moodHeadingFade ? 'mood-lheading--fade' : ''}`}>
                {moodDisplayed ? (
                  <>Books that make you{' '}
                    <em style={{ color: moodDisplayed.accent }}>{moodDisplayed.verb.toLowerCase()}.</em>
                  </>
                ) : (
                  <>Find your next read<br />by <em>feeling.</em></>
                )}
              </h2>
              <p className="mood-lsub">Pick a feeling. We'll point you to the right shelf.</p>
            </div>
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
                  {m.img && <img src={m.img} className="mood-lcard-photo" alt="" />}
                  <div className="mood-lcard-overlay" />
                  <div className="mood-lcard-body">
                    <div className="mood-lcard-top">
                      <span className="mood-lcard-verb" style={{ color: m.accent }}>{m.verb}</span>
                      <span className="mood-lcard-label">{m.label}</span>
                    </div>
                    <div className="mood-lcard-reveal">
                      <p className="mood-lcard-desc">{m.desc}</p>
                      <span className="mood-lcard-cta" style={{ color: m.accent }}>See picks →</span>
                    </div>
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
