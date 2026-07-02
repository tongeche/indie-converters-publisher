import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { fetchBooks, fetchBlogs } from '../lib/api';
import mainHeroImg    from '../assets/main-hero.png';
import browseHeroImg  from '../assets/browse-hero.png';
import hireFreelancerImg  from '../assets/hire-freelancer.png';
import imgAche   from '../assets/moods/Ache.png';
import imgDrift  from '../assets/moods/Drift.png';
import imgHaunt  from '../assets/moods/haunt.png';
import imgGasp   from '../assets/moods/Gasp.png';
import imgBurn   from '../assets/moods/Burn.png';
import imgWonder from '../assets/moods/Wonder.png';
import imgEscape from '../assets/moods/Escape.png';
import './Landing.css';

const HERO_DOTS = Array.from({ length: 56 }, (_, index) => index);

const FEATURE_FALLBACK_BG = 'linear-gradient(145deg, #1B1330 0%, #2E1180 55%, #441CB2 100%)';

function pillarLabel(pillar) {
  if (!pillar) return 'Blog';
  return pillar.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n).trimEnd() + '…' : str;
}

function TiltCard({ children, className, style }) {
  const ref = useRef(null);
  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left)  / r.width  - 0.5;
    const y = (e.clientY - r.top)   / r.height - 0.5;
    ref.current.style.transition = 'transform 80ms linear';
    ref.current.style.transform  = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg) translateZ(6px)`;
  }
  function onLeave() {
    ref.current.style.transition = 'transform 550ms cubic-bezier(0.2,0,0.2,1)';
    ref.current.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  }
  return (
    <div ref={ref} className={className} style={style} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </div>
  );
}
const TICKER_WORDS = ['finding.', 'publishing.', 'reading.'];

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

export default function Landing() {
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState([]);
  const [moodActive,      setMoodActive]      = useState(null);
  const [moodDisplayed,   setMoodDisplayed]   = useState(null);
  const [moodHeadingFade, setMoodHeadingFade] = useState(false);
  const [blogs,           setBlogs]           = useState([]);
  const heroRef = useRef(null);
  const jtRef   = useRef(null);
  const moodTimerRef = useRef(null);

  useEffect(() => {
    fetchBooks({ limit: 48 }).then(({ books }) => setAllBooks(books));
    fetchBlogs({ limit: 5 }).then(results => {
      const feature = results.find(b => b.content_id === 'BN-001');
      const rest    = results.filter(b => b.content_id !== 'BN-001').slice(0, 3);
      setBlogs(feature ? [feature, ...rest] : results.slice(0, 4));
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



  useEffect(() => {
    if (!jtRef.current) return;
    const cards = jtRef.current.querySelectorAll('.jcard');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('jcard--visible'); }),
      { threshold: 0.12, rootMargin: '-20px 0px' }
    );
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, [blogs]);

  const withCovers = allBooks.filter(b => b.coverUrl);
  const featured = withCovers.slice(0, 5);

  return (
    <div className="landing">

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
            We help readers find good books and give authors a simple way to bring their work online.
          </p>

          <div className="hero-ctas">
            <Link to="/browse" className="btn hero-btn-primary">Browse Books</Link>
            <Link to="/upload" className="hero-text-link">Start Publishing →</Link>
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

      {/* ── Browse CTA (browse-hero.png) ── */}
      <section className="browse-cta" style={{ backgroundImage: `url(${browseHeroImg})` }}>
        <div className="browse-cta-overlay" />
        <div className="container browse-cta-content">
          <div className="eyebrow" style={{ color: 'var(--ochre)' }}>Explore the library</div>
          <h2>Discover your next great read</h2>
          <p>Browse curated indie titles across every genre — from debut novels to underground classics.</p>
          <Link to="/browse" className="btn browse-cta-btn">Browse all books →</Link>
        </div>
      </section>

      {/* ── Value props ── */}
      <section className="section value-props">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">Why Indie Converters</div>
            <h2>Built for writers &amp; readers with the mood</h2>
          </div>
          <div className="props-grid">
            {[
              { title: 'You own your book', icon: 'unlock', body: 'Sell anywhere, keep control, and let readers discover your work here.' },
              { title: 'Sell your way', icon: 'link', body: 'Use your own sales channels, keep your margins, and build direct relationships with your readers.' },
              { title: 'Tools for every stage', icon: 'convert', body: 'Write, edit, convert, and export your book in formats ready for readers.' },
              { title: 'Explore and support', icon: 'read', body: 'Discover indie books, read free samples, and support authors whose work moves you.' },
            ].map(p => (
              <div key={p.title} className="prop-card">
                <span className="prop-icon">
                  <ValuePropIcon type={p.icon} />
                </span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <div className="mood-shelf-grid">
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
        </div>
      </section>

      {/* ── Hire a Freelancer ── */}
      <section className="hire-section">
        <div className="hire-card">

          <div className="hire-content">
            <span className="eyebrow hire-eyebrow">Hire a Freelancer</span>
            <h2 className="hire-heading">Need help with your book?</h2>
            <p className="hire-sub">From cover design to ghostwriting — find skilled professionals who understand indie publishing.</p>
            <ul className="hire-services">
              {['Ghostwriting', 'Developmental Editing', 'Cover Design', 'EPUB Formatting'].map(s => (
                <li key={s}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 8l3 3 7-7"/></svg>
                  {s}
                </li>
              ))}
            </ul>
            <Link to="/hire" className="btn hire-btn">Find a Freelancer →</Link>
          </div>

          <div className="hire-image-panel" style={{ backgroundImage: `url(${hireFreelancerImg})` }} />

        </div>
      </section>

      {/* ── Journal teaser ── */}
      {blogs.length > 0 && (
        <section className="section journal-teaser">
          <div className="container">
            <div className="jt-header">
              <div>
                <div className="eyebrow">From the Blog</div>
                <h2 className="jt-heading">Stories about stories.</h2>
              </div>
              <Link to="/blog" className="jt-see-all">Read the blog →</Link>
            </div>
            <div className="jt-grid" ref={jtRef}>

              {/* Feature card — latest post */}
              {blogs[0] && (
                <Link to={`/blog/${blogs[0].slug}`} className="jcard-link">
                  <TiltCard className="jcard jcard--feature">
                    <div
                      className="jcard-bg"
                      style={
                        blogs[0].hero_image_url
                          ? { backgroundImage: `url(${blogs[0].hero_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center top' }
                          : { background: FEATURE_FALLBACK_BG }
                      }
                    />
                    <div className="jcard-overlay" />
                    <div className="jcard-body">
                      <span className="jcard-tag">{pillarLabel(blogs[0].pillar)}</span>
                      <h3 className="jcard-title">{blogs[0].title}</h3>
                      <p className="jcard-excerpt">{truncate(blogs[0].excerpt, 130)}</p>
                      <div className="jcard-meta">
                        <span>IC Journal</span>
                        <span className="jcard-dot">·</span>
                        <span>{fmtDate(blogs[0].published_at)}</span>
                      </div>
                    </div>
                  </TiltCard>
                </Link>
              )}

              {/* Quote card — second post excerpt as pull quote */}
              {blogs[1] && (
                <Link to={`/blog/${blogs[1].slug}`} className="jcard-link">
                  <TiltCard className="jcard jcard--quote">
                    <span className="jcard-quotemark">"</span>
                    <blockquote className="jcard-quote-text">{truncate(blogs[1].excerpt, 150)}</blockquote>
                    <cite className="jcard-quote-attr">— {blogs[1].title}</cite>
                  </TiltCard>
                </Link>
              )}

              {/* Standard cards — remaining posts */}
              {blogs.slice(2).map(b => (
                <Link to={`/blog/${b.slug}`} key={b.slug} className="jcard-link">
                  <TiltCard className="jcard jcard--std">
                    <span className="jcard-tag jcard-tag--ink">{pillarLabel(b.pillar)}</span>
                    <h3 className="jcard-title jcard-title--ink">{b.title}</h3>
                    <p className="jcard-excerpt jcard-excerpt--ink">{truncate(b.excerpt, 110)}</p>
                    <span className="jcard-time">{fmtDate(b.published_at)}</span>
                  </TiltCard>
                </Link>
              ))}

            </div>
          </div>
        </section>
      )}
    </div>
  );
}
