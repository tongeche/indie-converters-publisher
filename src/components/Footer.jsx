import { Link } from 'react-router-dom';
import logoIndie from '../assets/logo-indie.png';
import './Footer.css';

const COLUMNS = [
  {
    heading: 'Discover',
    links: [
      { to: '/browse',             label: 'Browse Books'       },
      { to: '/moods',              label: 'Book Moods'         },
      { to: '/browse?sort=newest', label: 'New Releases'       },
      { to: '/authors',            label: 'Author Profiles'    },
    ],
  },
  {
    heading: 'Publish',
    links: [
      { to: '/publish',   label: 'For Authors'       },
      { to: '/upload',    label: 'Upload Manuscript'  },
      { to: '/dashboard', label: 'Author Dashboard'   },
      { to: '/blog',      label: 'Publishing Blog'    },
    ],
  },
  {
    heading: 'Hire & Work',
    links: [
      { to: '/hire',             label: 'Hire a Freelancer'  },
      { to: '/get-hired',        label: 'Get Hired'          },
      { to: '/hire/post',        label: 'Post a Brief'       },
      { to: '/hire/browse',      label: 'Browse Freelancers' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { to: '/help',                    label: 'Help Center'  },
      { to: '/blog',                    label: 'News'         },
      { href: 'mailto:info@indieconverters.uk',     label: 'General Enquiries' },
      { href: 'mailto:authors@indieconverters.uk',  label: 'Author Support'    },
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
              Book discovery, editorial curation, and publishing tools — for readers who love indie voices and authors who deserve better.
            </p>
            <address className="footer-address">
              <span>Rua Frei Heitor Pinto 22</span>
              <span>4400-159 Portugal</span>
            </address>
          </div>

          {/* Link columns */}
          <div className="footer-columns">
            {COLUMNS.map(col => (
              <div key={col.heading} className="footer-col">
                <h4>{col.heading}</h4>
                {col.links.map(l =>
                  l.href
                    ? <a key={l.href} href={l.href}>{l.label}</a>
                    : <Link key={l.to} to={l.to}>{l.label}</Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Indie Converters · Portugal</span>
          <div className="footer-bottom-links">
            <Link to="/publish">Start Publishing</Link>
            <span>·</span>
            <Link to="/hire">Hire a Freelancer</Link>
            <span>·</span>
            <Link to="/help">Help</Link>
            <span>·</span>
            <Link to="/privacy">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms">Terms of Service</Link>
          </div>
          <span className="footer-dot-mark">··</span>
        </div>
      </div>
    </footer>
  );
}
