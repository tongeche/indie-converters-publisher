import { Link } from 'react-router-dom';
import './ComingSoon.css';

const SERIES = [
  {
    tag: 'Every Monday',
    title: 'Indie Author World Roundup',
    desc: 'New releases, small press announcements, award longlists, and what\'s worth paying attention to in independent publishing this week.',
  },
  {
    tag: 'Every Friday',
    title: 'Weekend Book Radar',
    desc: 'Timely books, author interviews, film and TV adaptations, and the reads we\'re personally tracking before Monday comes back around.',
  },
  {
    tag: 'Author Spotlight',
    title: 'Author Corner',
    desc: 'A deep-dive profile carousel — one author, eight slides, the career moments that shaped their work.',
  },
  {
    tag: 'Seasonal',
    title: 'Awards & Lists',
    desc: 'Longlist coverage, shortlist reactions, and the prizes that actually surface books worth reading beyond the bestseller charts.',
  },
];

export default function News() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-hero">
        <div className="container">
          <div className="eyebrow">Book News</div>
          <h1>What's happening<br /><em>in independent publishing.</em></h1>
          <p>Weekly roundups, author spotlights, award coverage, and the books worth your attention right now — not the ones with the biggest marketing budget.</p>
        </div>
      </div>

      <div className="container coming-soon-body">
        <div className="coming-soon-notice">
          <span className="notice-dot">··</span>
          <strong>First editions coming soon.</strong> Subscribe to be notified when the Roundup launches.
        </div>

        <div className="series-grid">
          {SERIES.map(s => (
            <div key={s.title} className="series-card">
              <span className="series-tag">{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/browse" className="btn btn-primary">Browse books while you wait</Link>
        </div>
      </div>
    </div>
  );
}
