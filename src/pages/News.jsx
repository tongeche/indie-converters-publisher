import { useState } from 'react';
import { Link } from 'react-router-dom';
import './News.css';

const SERIES = [
  {
    num: '01',
    freq: 'Every Monday',
    title: 'Indie Author World Roundup',
    desc: 'New releases, small press announcements, award longlists, and what\'s worth paying attention to in independent publishing this week.',
    accent: '#8266E0',
  },
  {
    num: '02',
    freq: 'Every Friday',
    title: 'Weekend Book Radar',
    desc: 'Timely books, author interviews, film and TV adaptations, and the reads we\'re personally tracking before Monday comes back around.',
    accent: '#5BA8C4',
  },
  {
    num: '03',
    freq: 'Author Spotlight',
    title: 'Author Corner',
    desc: 'A deep-dive profile — one author, their career moments, what shaped their work, and what they\'re making next.',
    accent: '#C4846A',
  },
  {
    num: '04',
    freq: 'Seasonal',
    title: 'Awards & Lists',
    desc: 'Longlist coverage, shortlist reactions, and the prizes that actually surface books worth reading beyond the bestseller charts.',
    accent: '#6FC496',
  },
];

export default function News() {
  const [email, setEmail]     = useState('');
  const [subState, setSubState] = useState('idle'); // idle | sent

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email) return;
    setSubState('sent');
  }

  return (
    <div className="journal-page">

      {/* ── Hero ── */}
      <section className="journal-hero">
        <div className="container journal-hero-inner">
          <div className="journal-hero-left">
            <p className="journal-kicker">The Indie Converters</p>
            <h1 className="journal-heading">Journal</h1>
            <p className="journal-sub">
              Weekly roundups, author spotlights, award coverage, and the books worth your attention — not the ones with the biggest marketing budget.
            </p>
            <Link to="/browse" className="btn journal-hero-btn">Browse books →</Link>
          </div>

          <div className="journal-hero-right">
            <div className="journal-issue-badge">
              <span className="journal-issue-label">First issue</span>
              <span className="journal-issue-value">Coming soon</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Series ── */}
      <section className="journal-series">
        <div className="container">
          <p className="journal-section-label">What's inside</p>

          <div className="journal-series-list">
            {SERIES.map((s, i) => (
              <div key={s.num} className="journal-series-row" style={{ '--accent': s.accent }}>
                <div className="journal-series-num">{s.num}</div>

                <div className="journal-series-meta">
                  <span className="journal-series-freq">{s.freq}</span>
                  <h2 className="journal-series-title">{s.title}</h2>
                </div>

                <p className="journal-series-desc">{s.desc}</p>

                <div className="journal-series-dot" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Subscribe ── */}
      <section className="journal-subscribe">
        <div className="container journal-subscribe-inner">
          <div className="journal-subscribe-text">
            <h2>Get it in your inbox.</h2>
            <p>
              Join our newsletter for a short, carefully written note about books worth reading.
            </p>
          </div>

          {subState === 'sent' ? (
            <div className="journal-subscribe-done">
              <span className="journal-check">··</span>
              You're on the list. We'll write when we're ready.
            </div>
          ) : (
            <form className="journal-subscribe-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="journal-email-input"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary journal-subscribe-btn">
                Notify me
              </button>
            </form>
          )}
        </div>
      </section>

    </div>
  );
}
