import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { fetchBooks, fetchGenres } from '../lib/api';
import './Landing.css';

const STATS = [
  { label: 'Manuscripts Converted', end: 2847 },
  { label: 'Authors Publishing', end: 412 },
  { label: 'Genres Covered', end: 18 },
];

function useCountUp(end, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const dur = 1400;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, end]);
  return val;
}

function StatItem({ label, end, active }) {
  const val = useCountUp(end, active);
  return (
    <div className="stat-item">
      <span className="stat-num">{val.toLocaleString()}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

const STEPS = [
  { num: '01', title: 'Upload your manuscript', body: 'Drop a Word doc, RTF, or plain-text file. No special formatting required.' },
  { num: '02', title: 'We convert it', body: 'Pandoc processes your file into a clean, validated EPUB and print-ready PDF.' },
  { num: '03', title: 'Preview and refine', body: 'Read through your formatted book in the browser and adjust details before publishing.' },
  { num: '04', title: 'List it here', body: 'Your book gets its own page on Indie Converters. Readers find it; you link to wherever you sell it.' },
];

export default function Landing() {
  const [activeGenre, setActiveGenre] = useState('all');
  const [statsVisible, setStatsVisible] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const statsRef = useRef(null);
  const stepsRef = useRef(null);

  useEffect(() => {
    fetchBooks().then(setAllBooks);
    fetchGenres().then(setGenres);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!stepsRef.current) return;
    const stepEls = stepsRef.current.querySelectorAll('.step-card');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.3, rootMargin: '-60px 0px' });
    stepEls.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const featured = allBooks.slice(0, 5);
  const filtered = activeGenre === 'all' ? featured : allBooks.filter(b => b.genre === activeGenre).slice(0, 5);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <div className="hero-text">
            <div className="eyebrow" style={{ color: 'var(--ochre)' }}>Independent publishing</div>
            <h1 className="hero-heading">
              Your manuscript,<br />
              <em>properly made.</em>
            </h1>
            <p className="hero-sub">
              Upload a Word doc. Get a beautiful EPUB and print-ready PDF. List your book here — no exclusivity, no cart, just readers.
            </p>
            <div className="hero-ctas">
              <Link to="/upload" className="btn btn-primary">Start Publishing</Link>
              <Link to="/browse" className="btn btn-ghost">Browse Books</Link>
            </div>
          </div>
          <div className="hero-books">
            {allBooks.slice(0, 3).map((b, i) => (
              <div key={b.slug} className={`hero-book hero-book-${i}`}>
                <BookCover title={b.title} author={b.author} colorClass={b.coverColor} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-band" ref={statsRef}>
        <div className="container stats-inner">
          {STATS.map(s => <StatItem key={s.label} {...s} active={statsVisible} />)}
        </div>
      </section>

      {/* Featured Books */}
      <section className="section featured">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">Featured books</div>
            <h2>Recently published</h2>
          </div>
          <div className="genre-chips">
            <button className={`chip ${activeGenre === 'all' ? 'active' : ''}`} onClick={() => setActiveGenre('all')}>All</button>
            {genres.map(g => (
              <button key={g.slug} className={`chip ${activeGenre === g.slug ? 'active' : ''}`} onClick={() => setActiveGenre(g.slug)}>
                {g.label}
              </button>
            ))}
          </div>
          <div className="books-shelf">
            {(filtered.length ? filtered : featured).map(book => (
              <Link to={`/book/${book.slug}`} key={book.slug} className="shelf-item">
                <BookCover title={book.title} author={book.author} colorClass={book.coverColor} />
                <div className="shelf-meta">
                  <span className="shelf-genre">{book.genre}</span>
                  <span className="shelf-title">{book.title}</span>
                  <span className="shelf-author">{book.author}</span>
                </div>
              </Link>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link to="/browse" className="btn btn-outline">Browse all books</Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section how-it-works" ref={stepsRef}>
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">How it works</div>
            <h2>Four steps from draft to listed</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num"><span className="step-dot">··</span>{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Link to="/upload" className="btn btn-primary">Upload your manuscript</Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="section value-props">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">Why Indie Converters</div>
            <h2>Built for writers, not middlemen</h2>
          </div>
          <div className="props-grid">
            {[
              { title: 'No exclusivity', body: 'Your book stays yours. Sell it anywhere you like — we just list it here.' },
              { title: 'No cart on this site', body: "We point readers to wherever you already sell. You keep your margins and your relationship with your audience." },
              { title: 'Real file conversion', body: 'Pandoc-powered conversion produces clean, standards-compliant EPUBs — not a halfway HTML dump.' },
              { title: 'Print-ready PDFs', body: 'Get a PDF formatted for print-on-demand services as part of the same conversion step.' },
            ].map(p => (
              <div key={p.title} className="prop-card">
                <div className="prop-dot">··</div>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials">
        <div className="container">
          <div className="section-header">
            <div className="eyebrow">From our authors</div>
            <h2>What they say</h2>
          </div>
          <div className="testimonials-grid">
            {[
              { quote: "I uploaded a Word doc on a Tuesday afternoon and had a real EPUB by the time I made dinner. I've been trying to get that out of draft2digital for two years.", author: 'Inés Calder', title: 'Author, The Long Marsh' },
              { quote: "The cover-preview step in the wizard is lovely. It's the first time I felt like my book looked like a book before it was published.", author: 'Marcus Obi', title: 'Author, Iron Latitudes' },
              { quote: "No contract to sign. No 90-day exclusive window. I list it here and sell it from my own site. Simple.", author: 'Claire Fenn', title: 'Author, Depth Sounding' },
            ].map(t => (
              <blockquote key={t.author} className="testimonial-card">
                <p>"{t.quote}"</p>
                <footer>
                  <strong>{t.author}</strong>
                  <span>{t.title}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="cta-band">
        <div className="container cta-band-inner">
          <div>
            <div className="eyebrow" style={{ color: 'var(--ochre)' }}>Ready?</div>
            <h2>Your manuscript is waiting to become a book.</h2>
          </div>
          <Link to="/upload" className="btn btn-ghost">Start publishing →</Link>
        </div>
      </section>
    </div>
  );
}
