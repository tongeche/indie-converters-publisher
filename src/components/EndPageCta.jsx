import { useId } from 'react';
import { Link } from 'react-router-dom';
import './EndPageCta.css';

export default function EndPageCta({
  title,
  subtitle,
  actionLabel,
  to,
  onAction,
  className = '',
}) {
  const headingId = useId();

  return (
    <section
      className={`end-page-cta${className ? ` ${className}` : ''}`}
      aria-labelledby={headingId}
    >
      <div className="container end-page-cta-inner">
        <h2 id={headingId}>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        <Link to={to} className="end-page-cta-action" onClick={onAction}>
          <span>{actionLabel}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
