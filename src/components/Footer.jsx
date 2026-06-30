import { Link } from 'react-router-dom';
import logoIndie from '../assets/logo-indie.png';
import './Footer.css';

const COLUMNS = [
  {
    heading: 'Discover',
    links: [
      { to: '/browse',          label: 'Browse Books'      },
      { to: '/moods',           label: 'Book Moods'        },
      { to: '/browse?sort=top', label: 'Top Rankings'      },
      { to: '/browse?sort=newest', label: 'New Releases'   },
    ],
  },
  {
    heading: 'Authors',
    links: [
      { to: '/authors',         label: 'Author Profiles'   },
      { to: '/authors#corner',  label: 'Author Corner'     },
      { to: '/news?tab=authors',label: 'Author News'       },
    ],
  },
  {
    heading: 'News & Radar',
    links: [
      { to: '/news',             label: 'Book Radar'       },
      { to: '/news?tab=roundup', label: 'Indie Roundup'   },
      { to: '/news?tab=awards',  label: 'Awards & Lists'  },
    ],
  },
  {
    heading: 'Publish',
    links: [
      { to: '/publish',          label: 'For Authors'      },
      { to: '/upload',           label: 'Upload Manuscript' },
      { to: '/publish#how',      label: 'How It Works'     },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">

        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <span className="footer-logo">
              <img src={logoIndie} alt="Indie Converters" className="footer-logo-img" />
              indie<strong>converters</strong>
            </span>
            <p>
              Book discovery, editorial curation, and a proper publishing tool — for readers who love indie voices and authors who deserve better tools.
            </p>
            <div className="footer-tagline">
              <span>No exclusivity.</span>
              <span className="footer-sep">··</span>
              <span>No cart.</span>
              <span className="footer-sep">··</span>
              <span>Just your work, properly made.</span>
            </div>
          </div>

          {/* Link columns */}
          <div className="footer-columns">
            {COLUMNS.map(col => (
              <div key={col.heading} className="footer-col">
                <h4>{col.heading}</h4>
                {col.links.map(l => (
                  <Link key={l.to} to={l.to}>{l.label}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Indie Converters</span>
          <div className="footer-bottom-links">
            <Link to="/publish">Start Publishing</Link>
            <span>·</span>
            <a href="mailto:hello@indieconverters.com">Contact</a>
          </div>
          <span className="footer-dot-mark">··</span>
        </div>
      </div>
    </footer>
  );
}
