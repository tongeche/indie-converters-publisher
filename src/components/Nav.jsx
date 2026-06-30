import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Nav.css';

const NAV_ITEMS = [
  { to: '/browse',  label: 'Books'   },
  { to: '/moods',   label: 'Moods'   },
  { to: '/authors', label: 'Authors' },
  { to: '/news',    label: 'News'    },
  { to: '/publish', label: 'Publish' },
];

export default function Nav() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const transparent = isHome && !scrolled;

  return (
    <nav className={`nav ${transparent ? 'nav--transparent' : 'nav--solid'}`}>
      <div className="nav-inner container">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-dots">··</span>indie<strong>converters</strong>
        </Link>

        <button
          className="nav-burger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={menuOpen ? 'open' : ''} />
          <span className={menuOpen ? 'open' : ''} />
          <span className={menuOpen ? 'open' : ''} />
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link${location.pathname.startsWith(to) ? ' nav-link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
          <Link to="/upload" className="btn btn-primary btn-sm nav-cta">
            Start Publishing
          </Link>
        </div>
      </div>
    </nav>
  );
}
