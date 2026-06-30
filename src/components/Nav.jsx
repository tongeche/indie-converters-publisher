import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoIndie from '../assets/logo-indie.png';
import { useAuth } from '../context/AuthContext';
import './Nav.css';

const NAV_ITEMS = [
  { to: '/browse',  label: 'Books'   },
  { to: '/authors', label: 'Authors' },
  { to: '/news',    label: 'Journal' },
  { to: '/publish', label: 'Publish' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location  = useLocation();
  const { user, signOut } = useAuth();
  const isHome    = location.pathname === '/';

  const name     = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

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
          <img src={logoIndie} alt="Indie Converters" className="nav-logo-img" />
          <span className="nav-logo-text">indie<strong>converters</strong></span>
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
          {user ? (
            <div className="nav-user-group">
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <div className="nav-avatar" title={name}>{initials}</div>
              <button className="nav-signout" onClick={() => signOut()}>Sign out</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link nav-signin">Sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm nav-cta">
                Start Publishing
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
