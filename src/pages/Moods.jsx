import { Link } from 'react-router-dom';
import './ComingSoon.css';

const MOODS = [
  { emoji: '🌑', label: 'Dark family tension',       desc: 'Books that pull at the fraying edges of the people closest to us.' },
  { emoji: '🌫️', label: 'Quiet strange worlds',      desc: 'Stories where the uncanny sits just below the surface of the ordinary.' },
  { emoji: '🩸', label: 'Gothic but readable',        desc: 'All the atmosphere, none of the impenetrable Victorian prose.' },
  { emoji: '⚡', label: 'Sharp psychological thrillers', desc: 'Untrustworthy narrators, bad decisions, and endings you didn\'t see coming.' },
  { emoji: '🌊', label: 'Women under pressure',       desc: 'Characters holding too much together for too long — until they can\'t.' },
  { emoji: '🧠', label: 'Mind-bending nonfiction',    desc: 'Science, psychology, and human behaviour explained through story.' },
];

export default function Moods() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-hero">
        <div className="container">
          <div className="eyebrow">Book Moods</div>
          <h1>Find your next read<br /><em>by how you want to feel.</em></h1>
          <p>Curated groupings of 3–5 books around a single reading mood. Built for the moments when you know what you want to feel, just not which book will get you there.</p>
        </div>
      </div>

      <div className="container coming-soon-body">
        <div className="coming-soon-notice">
          <span className="notice-dot">··</span>
          <strong>Coming soon</strong> — mood lists are being curated now. In the meantime, browse the full catalogue.
        </div>

        <div className="mood-preview-grid">
          {MOODS.map(m => (
            <div key={m.label} className="mood-card mood-card--preview">
              <span className="mood-emoji">{m.emoji}</span>
              <h3>{m.label}</h3>
              <p>{m.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/browse" className="btn btn-primary">Browse all books</Link>
        </div>
      </div>
    </div>
  );
}
