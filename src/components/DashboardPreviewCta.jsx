import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import lightsFutureCoverImg from '../assets/dammie-covers/dammie01.png';
import loveSunsetCoverImg   from '../assets/dammie-covers/dammie-02.png';
import wishHorseCoverImg    from '../assets/dammie-covers/dammie-03.png';
import './DashboardPreviewCta.css';

const DEMO_EARNINGS = [
  { title: 'The Lights in the Future',    sales: 142, amount: 348.60, cover: lightsFutureCoverImg },
  { title: 'Love Before Sunset',          sales: 58,  amount: 97.40,  cover: loveSunsetCoverImg },
  { title: 'If I Had a Wish and a Horse', sales: 21,  amount: 40.20,  cover: wishHorseCoverImg },
];

function IconDollar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M17 6.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5S9.24 10 12 10s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>
  );
}
function IconTrend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

const STATS = [
  { icon: IconDollar,   value: '$2,940.18', label: 'All-time earnings', highlight: true },
  { icon: IconCalendar, value: '$486.20',   label: 'This month' },
  { icon: IconLayers,   value: '221',       label: 'Total sales' },
  { icon: IconTrend,    value: '$2.86',     label: 'Avg. per sale' },
  { icon: IconBook,     value: '5',         label: 'Books earning' },
];

export default function DashboardPreviewCta() {
  return (
    <section className="dashboard-cta" aria-labelledby="dashboard-cta-heading">
      <div className="container dashboard-cta-card">
        <div className="dashboard-cta-copy">
          <span className="eyebrow">Author dashboard</span>
          <h2 id="dashboard-cta-heading">See your books making money</h2>
          <p>
            Every sale, on every retailer, rolled up into one place. Track royalties per book,
            watch your earnings trend, and know exactly what your work is bringing in.
          </p>
          <Link
            to="/dashboard"
            className="btn btn-primary dashboard-cta-btn"
            onClick={() => trackEvent('Dashboard Preview Click', { location: 'landing-cta' })}
          >
            Track your royalties →
          </Link>
        </div>

        <div className="dpc-window" aria-hidden="true">
          <div className="dpc-window-bar">
            <span className="dpc-window-dot dpc-window-dot--red" />
            <span className="dpc-window-dot dpc-window-dot--amber" />
            <span className="dpc-window-dot dpc-window-dot--green" />
            <span className="dpc-window-url">indieconverters.com/dashboard/royalties</span>
          </div>

          <div className="dpc-window-body">
            <div className="dpc-stats-row">
              {STATS.map(stat => (
                <div className={`dpc-stat-card${stat.highlight ? ' dpc-stat-card--highlight' : ''}`} key={stat.label}>
                  <span className="dpc-stat-icon"><stat.icon /></span>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="dpc-book-list">
              {DEMO_EARNINGS.map(book => (
                <div className="dpc-book-row" key={book.title}>
                  <img className="dpc-row-cover" src={book.cover} alt="" />
                  <div className="dpc-row-info">
                    <span className="dpc-row-title">{book.title}</span>
                    <span className="dpc-row-sales">{book.sales} sales this month</span>
                  </div>
                  <span className="dpc-row-amount">${book.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
