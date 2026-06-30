import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Nav.css';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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

        <button className="nav-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/browse" className="nav-link">Browse</Link>
          <Link to="/publish" className="nav-link">For Authors</Link>
          <Link to="/upload" className="btn btn-primary btn-sm">Start Publishing</Link>
        </div>
      </div>
    </nav>
  );
}
