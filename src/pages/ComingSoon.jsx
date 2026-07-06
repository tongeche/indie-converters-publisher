import { Link, useLocation } from 'react-router-dom';
import './ComingSoon.css';

const LABELS = {};

export default function ComingSoon() {
  const { pathname } = useLocation();
  const meta = LABELS[pathname] ?? { eyebrow: 'Indie Converters', title: 'Coming Soon', back: '/' };

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-hero">
        <div className="container">
          <span className="eyebrow">{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
          <p>This page is on its way. We're building it out — check back soon.</p>
        </div>
      </div>
      <div className="container coming-soon-body">
        <div className="coming-soon-notice">
          <span className="notice-dot">···</span>
          <span>We're working on this section of the platform. <Link to={meta.back} style={{ color: 'var(--clay)', fontWeight: 600 }}>Go back</Link> while we finish up.</span>
        </div>
      </div>
    </div>
  );
}
