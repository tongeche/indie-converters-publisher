import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logoIndie from '../assets/logo-indie.png';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../lib/analytics';
import './Nav.css';

/* ── Inline SVG icons ── */
const IconBooks    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IconGrid     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>;
const IconPen      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
const IconNews     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/></svg>;
const IconHelp     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>;
const IconBrief    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const IconUserOk   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>;
const IconSearch   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IconLearn    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IconRoute    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 7.2 15.8 16.8"/></svg>;
const IconCoin     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.3c0-1.3-1.4-2-3-2s-3 .8-3 2 1.4 1.7 3 2 3 .7 3 2-1.4 2-3 2-3-.7-3-2"/></svg>;
const IconUpload   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><path d="M12 15.5V4"/><path d="M6.5 9.5 12 4l5.5 5.5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>;
const IconCalc     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><rect x="4.5" y="2.5" width="15" height="19" rx="2"/><path d="M8 7h8"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16v3"/></svg>;
const IconRuler    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6 8v3M10 8v3M14 8v4M18 8v3"/></svg>;
const IconCheck    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.3 2.3 4.7-4.6"/></svg>;
const Chevron      = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" width="11" height="11" className="nav-chevron"><path d="M4 6l4 4 4-4"/></svg>;

/* ── Nav config ── */
const NAV = [
  {
    label: 'Collections',
    dropdown: [
      { to: '/browse?indie=1',      label: 'Indie Books',  desc: 'Hand-picked titles from independent authors', Icon: IconBooks },
      { to: '/browse?genre=fiction',label: 'Fiction',      desc: 'Novels, short stories and literary fiction',  Icon: IconPen   },
      { to: '/browse?genre=nonfiction', label: 'Non-Fiction', desc: 'Guides, essays and narrative nonfiction',  Icon: IconNews  },
      { to: '/browse',              label: 'All Books',    desc: 'Browse the full catalogue',                   Icon: IconGrid  },
    ],
  },
  { to: '/shop', label: 'Shop' },
  {
    label: 'Community',
    dropdown: [
      { to: '/blog',    label: 'Blog',        desc: 'Stories, guides and publishing advice',       Icon: IconPen    },
      { to: '/blog',    label: 'News',        desc: "What's new in indie publishing",              Icon: IconNews   },
      { to: '/help',    label: 'Help Center', desc: 'Quick answers and how-tos',                   Icon: IconHelp   },
    ],
  },
  {
    label: 'Services',
    groups: [
      {
        heading: 'Hire a Freelancer',
        to: '/hire',
        items: [
          { to: '/hire/post',   label: 'Post a Brief',       desc: 'Tell us what you need — we match you with the right talent', Icon: IconBrief  },
          { to: '/hire/browse', label: 'Browse Freelancers', desc: 'Find ghostwriters, editors and cover designers',             Icon: IconSearch },
        ],
      },
      {
        heading: 'Get Hired',
        to: '/get-hired',
        items: [
          { to: '/get-hired/projects', label: 'Browse Projects', desc: 'Find editing, writing and design briefs from authors',   Icon: IconSearch },
          { to: '/get-hired/profile',  label: 'Create Profile',  desc: 'Showcase your work and get discovered by indie authors', Icon: IconUserOk },
        ],
      },
    ],
  },
  {
    to: '/publish',
    label: 'Publish',
    mega: true,
    groups: [
      {
        heading: 'Get started',
        to: '/publish',
        items: [
          { to: '/publish#publish-process',    label: 'How it works',       desc: 'The path from manuscript to listed book',       Icon: IconRoute  },
          { to: '/upload',                     label: 'Start your upload',  desc: 'Begin the guided publishing wizard',            Icon: IconUpload },
          { to: '/publish#publish-essentials', label: 'Costs & royalties', desc: 'What you keep on a direct sale',                Icon: IconCoin   },
          { to: '/publish#publish-faq',        label: 'FAQ',                desc: 'Common questions about publishing here',        Icon: IconHelp   },
        ],
      },
      {
        heading: 'Tools & resources',
        to: '/publish/templates',
        items: [
          { to: '/publish/templates',            label: 'Manuscript templates',   desc: 'Free Word starter files for every format',   Icon: IconPen   },
          { to: '/tools/revenue-calculator',      label: 'Revenue calculator',      desc: 'Estimate royalties across retailers',      Icon: IconCalc   },
          { to: '/tools/print-cover-calculator',  label: 'Print cover calculator',  desc: 'Get exact trim size and spine width',      Icon: IconRuler  },
          { to: '/check',                         label: 'Check & Verify',         desc: 'Validate your manuscript before submitting', Icon: IconCheck },
        ],
      },
    ],
  },
];

export default function Nav() {
  const [scrolled,        setScrolled]        = useState(false);
  const [menuOpen,        setMenuOpen]        = useState(false);
  const [mobileExpanded,  setMobileExpanded]  = useState({});
  const [openDropdown,    setOpenDropdown]    = useState(null);
  const closeTimer = useRef(null);

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

  useEffect(() => { setMenuOpen(false); setMobileExpanded({}); setOpenDropdown(null); }, [location]);

  const transparent = isHome && !scrolled;

  /* Keep dropdown open while mouse travels from trigger → panel */
  function openMenu(label) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(label);
  }
  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 180);
  }

  function toggleMobile(label) {
    setMobileExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  }

  function isDropdownActive(item) {
    if (item.to && location.pathname.startsWith(item.to)) return true;
    if (item.dropdown) return item.dropdown.some(sub => location.pathname.startsWith(sub.to));
    if (item.groups) {
      return item.groups.some(group =>
        location.pathname.startsWith(group.to) || group.items.some(sub => location.pathname.startsWith(sub.to))
      );
    }
    return false;
  }

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
          {NAV.map(item => (item.dropdown || item.groups) ? (
            /* ── Dropdown item ── */
            <div
              key={item.label}
              className={`nav-dropdown-group${openDropdown === item.label ? ' is-open' : ''}`}
              onMouseEnter={() => openMenu(item.label)}
              onMouseLeave={scheduleClose}
            >
              {/* Desktop trigger */}
              {item.to ? (
                <Link to={item.to} className={`nav-link nav-dropdown-trigger${isDropdownActive(item) ? ' nav-link--active' : ''}`}>
                  {item.label} <Chevron />
                </Link>
              ) : (
                <button className={`nav-link nav-dropdown-trigger${isDropdownActive(item) ? ' nav-link--active' : ''}`}>
                  {item.label} <Chevron />
                </button>
              )}

              {/* Desktop dropdown panel — stays alive while hovered */}
              <div
                className={`nav-dropdown${item.mega ? ' nav-dropdown--mega' : ''}`}
                onMouseEnter={() => openMenu(item.label)}
                onMouseLeave={scheduleClose}
              >
                {item.groups ? (
                  <div className={item.mega ? 'nav-dropdown-columns' : undefined}>
                    {item.groups.map((group, gi) => (
                      <div className="nav-dropdown-section" key={group.heading}>
                        <Link to={group.to} className="nav-dropdown-section-heading">{group.heading}</Link>
                        {group.items.map(({ to, label, desc, Icon }) => (
                          <Link key={label} to={to} className="nav-dropdown-item">
                            <div className="nav-dropdown-icon"><Icon /></div>
                            <div className="nav-dropdown-text">
                              <span className="nav-dropdown-label">{label}</span>
                              <span className="nav-dropdown-desc">{desc}</span>
                            </div>
                          </Link>
                        ))}
                        {!item.mega && gi < item.groups.length - 1 && <div className="nav-dropdown-sep" />}
                      </div>
                    ))}
                  </div>
                ) : item.dropdown.map(({ to, label, desc, Icon }) => (
                  <Link key={label} to={to} className="nav-dropdown-item">
                    <div className="nav-dropdown-icon"><Icon /></div>
                    <div className="nav-dropdown-text">
                      <span className="nav-dropdown-label">{label}</span>
                      <span className="nav-dropdown-desc">{desc}</span>
                    </div>
                  </Link>
                ))}
                {item.footer && (
                  <>
                    <div className="nav-dropdown-sep" />
                    <Link to={item.footer.to} className="nav-dropdown-footer">
                      <IconLearn /> {item.footer.label}
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile: click-toggled inline list */}
              <button
                className={`nav-link nav-mobile-trigger${isDropdownActive(item) ? ' nav-link--active' : ''}`}
                onClick={() => toggleMobile(item.label)}
              >
                {item.label}
                <Chevron />
              </button>
              {mobileExpanded[item.label] && (
                <div className="nav-mobile-sub">
                  {item.groups ? item.groups.map(group => (
                    <div key={group.heading} className="nav-mobile-group">
                      <Link to={group.to} className="nav-mobile-group-heading">{group.heading}</Link>
                      {group.items.map(({ to, label }) => (
                        <Link key={label} to={to} className="nav-link nav-mobile-sub-link">{label}</Link>
                      ))}
                    </div>
                  )) : item.dropdown.map(({ to, label }) => (
                    <Link key={label} to={to} className="nav-link nav-mobile-sub-link">{label}</Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Direct link ── */
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link${location.pathname.startsWith(item.to) ? ' nav-link--active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          {user ? (
            <div className="nav-user-group">
              <Link to="/dashboard" className="nav-link nav-dashboard-link">
                <div className="nav-avatar" title={name}>{initials}</div>
                Dashboard
              </Link>
              <div className="nav-user-icons">
                <Link
                  to="/saved"
                  className="nav-saved-btn"
                  title="Saved books"
                  aria-label="Saved books"
                >
                  <svg viewBox="0 0 24 24" fill={location.pathname === '/saved' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span className="nav-user-icon-label">Saved books</span>
                </Link>
                <Link
                  to="/cart"
                  className="nav-saved-btn"
                  title="Cart"
                  aria-label="Cart"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  <span className="nav-user-icon-label">Cart</span>
                </Link>
              </div>
              <button className="nav-signout" onClick={() => signOut()}>Sign out</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="nav-link nav-signin">Sign in</Link>
              <Link
                to="/signup"
                className="btn btn-primary btn-sm nav-cta"
                onClick={() => trackEvent('Start Publishing Click', { location: 'nav' })}
              >
                Start Publishing
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
