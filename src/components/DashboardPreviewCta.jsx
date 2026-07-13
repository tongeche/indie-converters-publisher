import { Link } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import lightsFutureCoverImg from '../assets/dammie-covers/dammie01.png';
import loveSunsetCoverImg   from '../assets/dammie-covers/dammie-02.png';
import wishHorseCoverImg    from '../assets/dammie-covers/dammie-03.png';
import './DashboardPreviewCta.css';

function IconDollar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M17 6.5c0-1.93-2.24-3.5-5-3.5s-5 1.57-5 3.5S9.24 10 12 10s5 1.57 5 3.5-2.24 3.5-5 3.5-5-1.57-5-3.5" />
    </svg>
  );
}

const CHART_BARS = [18, 24, 31, 42, 54, 70, 47, 38, 51, 34, 29, 63, 56, 74, 91, 68, 100, 58, 45, 33, 39, 36, 43, 67, 78, 86, 72, 52, 40, 48];

const DEMO_BOOKS = [
  { title: 'The Lights in the Future',    detail: '142 reader visits', amount: '$348.60', cover: lightsFutureCoverImg },
  { title: 'Love Before Sunset',          detail: '58 retailer clicks', amount: '$97.40',  cover: loveSunsetCoverImg },
  { title: 'If I Had a Wish and a Horse', detail: '21 catalogue saves', amount: '$40.20',  cover: wishHorseCoverImg },
];

function IconExpand() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M3 16v5h5" />
      <path d="M21 16v5h-5" />
    </svg>
  );
}

export default function DashboardPreviewCta() {
  return (
    <section className="dashboard-cta" aria-labelledby="dashboard-cta-heading">
      <div className="container dashboard-cta-card">
        <div className="dashboard-cta-copy">
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

        <div className="dpc-showcase" aria-hidden="true">
          <article className="dpc-product-card dpc-product-card--checkout">
            <button className="dpc-expand-btn" type="button" tabIndex="-1" aria-label="Expand">
              <IconExpand />
            </button>
            <h3>Watch each book find its readers</h3>

            <div className="dpc-checkout-scene">
              <div className="dpc-checkout-panel">
                <div className="dpc-mini-browser">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="dpc-checkout-grid">
                  <div>
                    <label>Book activity</label>
                    <div className="dpc-input">The Lights in the Future</div>
                    <div className="dpc-pay-buttons">
                      <span>Catalogue</span>
                      <span>Retailers</span>
                    </div>
                    <div className="dpc-distributor-logos" aria-label="Distributor links">
                      <span className="dpc-logo dpc-logo--amazon">amazon</span>
                      <span className="dpc-logo dpc-logo--kobo">Kobo</span>
                      <span className="dpc-logo dpc-logo--overdrive">OverDrive</span>
                    </div>
                  </div>
                  <div className="dpc-order-summary">
                    <strong>Books gaining traction</strong>
                    <div className="dpc-book-stack">
                      {DEMO_BOOKS.map(book => (
                        <div className="dpc-book-item" key={book.title}>
                          <img src={book.cover} alt="" />
                          <div>
                            <p>{book.title}</p>
                            <span>{book.detail}</span>
                          </div>
                          <b>{book.amount}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="dpc-product-card dpc-product-card--billing">
            <button className="dpc-expand-btn dpc-expand-btn--solid" type="button" tabIndex="-1" aria-label="Expand">
              <IconExpand />
            </button>
            <h3>Understand your catalogue earnings</h3>

            <div className="dpc-billing-stage">
              <div className="dpc-plan-card">
                <div className="dpc-plan-head">
                  <span className="dpc-plan-icon"><IconDollar /></span>
                  <div>
                    <strong>Author dashboard</strong>
                    <span>Updated from your reports</span>
                  </div>
                </div>
                <p>Royalty snapshot</p>
                <b>Sales, saves, and retailer clicks in one calm view</b>
                <div className="dpc-meter">
                  <span />
                </div>
              </div>

              <div className="dpc-chart-card">
                <span>Reader interest in the last 30 days</span>
                <strong>$1,939.64</strong>
                <div className="dpc-bars">
                  {CHART_BARS.map((height, index) => (
                    <i key={index} style={{ '--bar-height': `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
