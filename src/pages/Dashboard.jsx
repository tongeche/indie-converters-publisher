import { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchMyBriefs, markBriefFilled, fetchFreelancers, checkIsEditor } from '../lib/api';
import SEO from '../components/SEO';
import EditorPricesView from '../components/EditorPricesView';
import './Dashboard.css';

/* ── currencies ─────────────────────────────────────────────── */
const CURRENCIES = [
  { code: 'USD', symbol: '$',   name: 'US Dollar' },
  { code: 'GBP', symbol: '£',   name: 'British Pound' },
  { code: 'EUR', symbol: '€',   name: 'Euro' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar' },
  { code: 'NGN', symbol: '₦',   name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'ZAR', symbol: 'R',   name: 'South African Rand' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$',  name: 'Brazilian Real' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen' },
];

function formatDashboardDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function bookStatus(book) {
  if (book.is_published) return { label: 'Published', className: 'dash-status--pub' };
  if (book.pub_date) return { label: 'Scheduled', className: 'dash-status--scheduled' };
  return { label: 'Draft', className: 'dash-status--draft' };
}

/* ── icons ───────────────────────────────────────────────────── */
function IconHome()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>; }
function IconBooks()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function IconCoin()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.17 9.17A4 4 0 0 1 16 12a4 4 0 0 1-6.83 2.83"/></svg>; }
function IconChart()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6"  y1="20" x2="6"  y2="14"/></svg>; }
function IconReceipt()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>; }
function IconBriefcase() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function IconUpload()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconUser()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconSignOut()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function IconMenu()      { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>; }
function IconX()         { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconDownload()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconCheckCircle({ done }) {
  return done
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 2.5 2.5L16 9"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;
}
function IconEye()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>; }
function IconBookmark()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>; }
function IconTemplate()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>; }
function IconRuler()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6 8v3M10 8v3M14 8v4M18 8v3"/></svg>; }
function IconCalc()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="2.5" width="15" height="19" rx="2"/><path d="M8 7h8"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16v3"/></svg>; }
function IconShield()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/></svg>; }
function IconUsers()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3"/><path d="M2.5 20v-1.5A4.5 4.5 0 0 1 7 14h4a4.5 4.5 0 0 1 4.5 4.5V20"/><circle cx="17" cy="8" r="2.5"/><path d="M16 14.5c2.4.4 4 1.9 4 4.1V20"/></svg>; }
function IconHelpCircle(){ return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 2.5-3 4.5"/><circle cx="12" cy="17.5" r="0.5" fill="currentColor"/></svg>; }
function IconCart()      { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none"/><path d="M2.5 3h2l2.2 11.4a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.6L21 7H6"/></svg>; }
function IconWallet()    { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v2"/><path d="M3 7.5v9A2.5 2.5 0 0 0 5.5 19H19a1 1 0 0 0 1-1v-3"/><rect x="14" y="11" width="7" height="5" rx="1"/><circle cx="17" cy="13.5" r="0.6" fill="currentColor" stroke="none"/></svg>; }
function IconTrendUp()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 10 10 14 14 21 6"/><polyline points="15 6 21 6 21 12"/></svg>; }
function IconAlertTriangle() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.6 3.5 2 19h20L13.4 3.5a1.6 1.6 0 0 0-2.8 0Z"/><path d="M12 9.5v4M12 17h.01"/></svg>; }
function IconLink()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 6.5 12.5 5A3.5 3.5 0 1 1 17.5 10L16 11.5"/><path d="M13 17.5 11.5 19A3.5 3.5 0 1 1 6.5 14l1.5-1.5"/></svg>; }
function IconSearch()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.2" y2="16.2"/></svg>; }

/* ── main component ──────────────────────────────────────────── */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView]         = useState('workstation');
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview]   = useState({ loading: false, text: null, url: null });
  const [saveCounts, setSaveCounts] = useState({}); // bookId → count
  const [isEditor, setIsEditor] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const name     = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Author';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    supabase
      .from('books')
      .select('id, title, slug, cover_url, pub_date, pub_year, manuscript_path, price, is_published, view_count, created_at, book_retailer_links(url, retailers(slug, label))')
      .eq('author_user_id', user.id)
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const bks = data ?? [];
        setBooks(bks);
        setLoading(false);
        if (bks.length) {
          const ids = bks.map(b => b.id);
          const { data: saves } = await supabase
            .from('reader_saves').select('book_id').in('book_id', ids);
          const counts = {};
          for (const s of saves ?? []) {
            counts[s.book_id] = (counts[s.book_id] || 0) + 1;
          }
          setSaveCounts(counts);
        }
      });
  }, [user.id]);

  useEffect(() => {
    checkIsEditor(user.id).then(setIsEditor);
  }, [user.id]);

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  async function handleDelete(book) {
    // Clean up junction tables first, then the book, then storage
    await supabase.from('books_authors').delete().eq('book_id', book.id);
    await supabase.from('books_genres').delete().eq('book_id', book.id);
    await supabase.from('book_retailer_links').delete().eq('book_id', book.id);
    await supabase.from('books').delete().eq('id', book.id).eq('author_user_id', user.id);
    if (book.manuscript_path) {
      await supabase.storage.from('manuscripts').remove([book.manuscript_path]);
    }
    setSelected(null);
    setBooks(prev => prev.filter(b => b.id !== book.id));
  }

  async function openBook(book) {
    setSelected(book);
    if (!book.manuscript_path) {
      setPreview({ loading: false, text: null, url: null });
      return;
    }
    setPreview({ loading: true, text: null, url: null });
    const { data } = await supabase.storage
      .from('manuscripts')
      .createSignedUrl(book.manuscript_path, 3600);
    const url = data?.signedUrl;
    if (!url) { setPreview({ loading: false, text: null, url: null }); return; }

    const ext = book.manuscript_path.split('.').pop().toLowerCase();
    if (['txt', 'rtf'].includes(ext)) {
      try {
        const r = await fetch(url);
        const text = await r.text();
        setPreview({ loading: false, text: text.slice(0, 4000), url });
      } catch {
        setPreview({ loading: false, text: null, url });
      }
    } else {
      setPreview({ loading: false, text: null, url });
    }
  }

  function switchView(v) {
    setView(v);
    setSelected(null);
    setMobileNavOpen(false);
  }

  return (
    <div className="dashboard">
      <SEO title="Dashboard | IndieConverters" description="Manage your books, briefs, and author profile." path="/dashboard" />
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`dash-sidebar ${mobileNavOpen ? 'dash-sidebar--open' : ''}`}>
        <div className="dash-sidebar-topbar">
          <Link to="/" className="dash-logo">
            <span className="dash-logo-dot">··</span>
            <span>indieconverters</span>
          </Link>
          <button
            type="button"
            className="dash-mobile-nav-toggle"
            onClick={() => setMobileNavOpen(o => !o)}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>

        <nav className="dash-nav">
          <span className="dash-nav-label">Author</span>

          <button
            className={`dash-nav-link ${view === 'workstation' ? 'dash-nav-link--active' : ''}`}
            onClick={() => switchView('workstation')}
          >
            <IconHome /> Workstation
          </button>
          <button
            className={`dash-nav-link ${view === 'books' ? 'dash-nav-link--active' : ''}`}
            onClick={() => switchView('books')}
          >
            <IconBooks /> My Books
          </button>
          <button
            className={`dash-nav-link ${view === 'buylinks' ? 'dash-nav-link--active' : ''}`}
            onClick={() => switchView('buylinks')}
          >
            <IconCoin /> Buy Links
          </button>
          <button
            className={`dash-nav-link ${view === 'sales' ? 'dash-nav-link--active' : ''}`}
            onClick={() => switchView('sales')}
          >
            <IconReceipt /> Sales
          </button>
          <button
            className={`dash-nav-link ${view === 'reports' ? 'dash-nav-link--active' : ''}`}
            onClick={() => switchView('reports')}
          >
            <IconChart /> Reports
          </button>
          <button
            className={`dash-nav-link ${view === 'briefs' ? 'dash-nav-link--active' : ''}`}
            onClick={() => switchView('briefs')}
          >
            <IconBriefcase /> My Briefs
          </button>

          <span className="dash-nav-divider" />
          <Link to="/upload" className="dash-nav-link">
            <IconUpload /> Publish New
          </Link>
          <button
            className={`dash-nav-link ${view === 'profile' ? 'dash-nav-link--active' : ''}`}
            onClick={() => switchView('profile')}
          >
            <IconUser /> Profile
          </button>

          {isEditor && (
            <>
              <span className="dash-nav-divider" />
              <span className="dash-nav-label">Editor</span>
              <button
                className={`dash-nav-link ${view === 'editorPrices' ? 'dash-nav-link--active' : ''}`}
                onClick={() => switchView('editorPrices')}
              >
                <IconCoin /> Catalogue Prices
              </button>
            </>
          )}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-avatar">{initials}</div>
          <div className="dash-user-info">
            <span className="dash-user-name">{name}</span>
            <span className="dash-user-email">{user.email}</span>
          </div>
          <button className="dash-signout" onClick={handleSignOut} title="Sign out">
            <IconSignOut />
          </button>
        </div>
      </aside>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="dash-body">
        <div className="dash-content">
          {view === 'workstation' && <WorkstationView name={name} books={books} loading={loading} saveCounts={saveCounts} />}
          {view === 'books'    && <BooksView    books={books} loading={loading} selected={selected} openBook={openBook} saveCounts={saveCounts} />}
          {view === 'buylinks' && <BuyLinksView books={books} />}
          {view === 'sales'    && <SalesView user={user} />}
          {view === 'reports'  && <ReportsView  user={user} books={books} saveCounts={saveCounts} />}
          {view === 'briefs'   && <BriefsView   user={user} />}
          {view === 'profile'  && <ProfileView  user={user} />}
          {view === 'editorPrices' && isEditor && <EditorPricesView />}
        </div>

        {selected && (
          <BookDrawer
            book={selected}
            preview={preview}
            saves={saveCounts[selected.id] || 0}
            onClose={() => setSelected(null)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

/* ── Workstation view ────────────────────────────────────────── */
const WORKSTATION_TOOLS = [
  { icon: IconTemplate,   label: 'Manuscript Templates',   to: '/publish/templates' },
  { icon: IconRuler,      label: 'Print Cover Calculator',  to: '/tools/print-cover-calculator' },
  { icon: IconCalc,       label: 'Revenue Calculator',      to: '/tools/revenue-calculator' },
  { icon: IconShield,     label: 'Check & Verify',          to: '/check' },
  { icon: IconUsers,      label: 'Hire a Freelancer',       to: '/hire/browse' },
  { icon: IconHelpCircle, label: 'Help Center',             to: '/help' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function manuscriptDisplayName(path) {
  if (!path) return '';
  return path.split('/').pop().replace(/^(\d+-)+/, '');
}

function bookSteps(book) {
  if (!book) return [];
  return [
    { label: 'Book details', done: true },
    { label: 'Manuscript', done: !!book.manuscript_path },
    { label: 'Cover', done: !!book.cover_url },
    { label: 'Publish & distribute', done: !!book.is_published },
  ];
}

function WorkstationView({ name, books, loading, saveCounts }) {
  const firstName = name.split(' ')[0];
  const currentProject = books.find(b => !b.is_published) || books[0] || null;
  const steps = bookSteps(currentProject);
  const doneCount = steps.filter(s => s.done).length;
  const percent = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const status = currentProject ? bookStatus(currentProject) : null;
  const manuscriptName = manuscriptDisplayName(currentProject?.manuscript_path);

  const totalViews = books.reduce((s, b) => s + (b.view_count || 0), 0);
  const totalSaves = Object.values(saveCounts).reduce((s, c) => s + c, 0);
  const published  = books.filter(b => b.is_published).length;

  const topByViews = [...books].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5);
  const maxViews = Math.max(1, ...topByViews.map(b => b.view_count || 0));

  const recent = [...books]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  return (
    <div className="workstation-view">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">{greeting()}, {firstName}</h1>
          <p className="dash-subtitle">Welcome to your publishing workstation</p>
        </div>
        <Link to="/upload" className="btn dash-publish-btn">+ New Book</Link>
      </header>

      {loading && <p className="dash-loading-msg">Loading…</p>}

      {!loading && !currentProject && (
        <div className="dash-empty">
          <div className="dash-empty-icon">··</div>
          <h2>No books yet.</h2>
          <p>Upload your manuscript and this workstation will track your progress from draft to published.</p>
          <Link to="/upload" className="btn btn-primary">Start your first book</Link>
        </div>
      )}

      {!loading && currentProject && (
        <>
          <div className="ws-top-grid">
            {/* Current project */}
            <section className="ws-card ws-project-card">
              <div className="ws-card-head"><h2 className="ws-card-title">Current Project</h2></div>
              <div className="ws-project-body">
                <div className="ws-project-cover">
                  {currentProject.cover_url
                    ? <img src={currentProject.cover_url} alt={currentProject.title} />
                    : <span className="ws-project-cover-ph">··</span>}
                </div>
                <div className="ws-project-info">
                  <div className="ws-project-title-row">
                    <span className="ws-project-title">{currentProject.title}</span>
                    <span className={`dash-status ${status.className}`}>{status.label}</span>
                  </div>
                  <ul className="ws-checklist">
                    {steps.map(s => (
                      <li key={s.label} className={s.done ? 'is-done' : ''}>
                        <IconCheckCircle done={s.done} /> {s.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="ws-project-progress">
                  <ProgressRing percent={percent} />
                  {percent === 100 ? (
                    <Link to={`/book/${currentProject.slug}`} className="btn dash-publish-btn ws-continue-btn">
                      View Book
                    </Link>
                  ) : (
                    <Link to={`/dashboard/edit/${currentProject.slug}`} className="btn dash-publish-btn ws-continue-btn">
                      Continue Setup
                    </Link>
                  )}
                </div>
              </div>
            </section>

            {/* Publishing progress */}
            <section className="ws-card">
              <div className="ws-card-head"><h2 className="ws-card-title">Publishing Progress</h2></div>
              <div className="ws-stat-tiles">
                <div className="ws-stat-tile"><span className="dash-stat-icon"><IconEye /></span><strong>{totalViews}</strong><span>Page views</span></div>
                <div className="ws-stat-tile"><span className="dash-stat-icon"><IconBookmark /></span><strong>{totalSaves}</strong><span>Saves</span></div>
                <div className="ws-stat-tile"><span className="dash-stat-icon"><IconBooks /></span><strong>{books.length}</strong><span>Total books</span></div>
                <div className="ws-stat-tile"><span className="dash-stat-icon"><IconCheckCircle done /></span><strong>{published}</strong><span>Published</span></div>
              </div>
              {topByViews.length > 0 && (
                <div className="ws-bar-list">
                  <span className="ws-bar-list-label">Views by book</span>
                  {topByViews.map(b => (
                    <div className="ws-bar-row" key={b.id}>
                      <span className="ws-bar-row-title">{b.title}</span>
                      <div className="ws-bar-track">
                        <div className="ws-bar-fill" style={{ width: `${((b.view_count || 0) / maxViews) * 100}%` }} />
                      </div>
                      <span className="ws-bar-row-val">{b.view_count || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="ws-mid-grid">
            <section className="ws-card">
              <div className="ws-card-head"><h2 className="ws-card-title">Publishing Steps</h2></div>
              <ol className="ws-steps-list">
                {steps.map((s, i) => (
                  <li key={s.label}>
                    <span className="ws-step-num">{i + 1}</span>
                    <span className="ws-step-label">{s.label}</span>
                    <span className={`ws-step-status ${s.done ? 'is-done' : 'is-pending'}`}>
                      {s.done ? 'Done' : 'Pending'}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="ws-card">
              <div className="ws-card-head"><h2 className="ws-card-title">Manuscript Status</h2></div>
              {manuscriptName ? (
                <div className="ws-manuscript">
                  <div className="ws-manuscript-file">
                    <div>
                      <span className="ws-manuscript-name">{manuscriptName}</span>
                      <span className="ws-manuscript-meta">Uploaded</span>
                    </div>
                    <span className="dash-status dash-status--pub">Uploaded</span>
                  </div>
                  <Link to={`/dashboard/edit/${currentProject.slug}`} className="dash-table-edit-link ws-manuscript-edit">
                    Edit manuscript →
                  </Link>
                </div>
              ) : (
                <p className="dash-drawer-dim">No manuscript uploaded yet.</p>
              )}
            </section>

            <section className="ws-card">
              <div className="ws-card-head"><h2 className="ws-card-title">Recently added</h2></div>
              {recent.length === 0 ? (
                <p className="dash-drawer-dim">Nothing here yet.</p>
              ) : (
                <ul className="ws-recent-list">
                  {recent.map(b => (
                    <li key={b.id}>
                      <span className="ws-recent-title">{b.title}</span>
                      <span className="ws-recent-date">{formatDashboardDate(b.created_at?.slice(0, 10))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      <section className="ws-tools-section">
        <div className="ws-card-head"><h2 className="ws-card-title">Tools & Resources</h2></div>
        <div className="ws-tools-grid">
          {WORKSTATION_TOOLS.map(t => (
            <Link to={t.to} className="ws-tool" key={t.label}>
              <span className="ws-tool-icon"><t.icon /></span>
              {t.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgressRing({ percent }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="ws-ring">
      <svg width="84" height="84" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="8" />
        <circle
          cx="42" cy="42" r={r} fill="none" stroke="var(--clay)" strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 42 42)"
        />
      </svg>
      <div className="ws-ring-label">
        <strong>{percent}%</strong>
        <span>Complete</span>
      </div>
    </div>
  );
}

/* ── Books view ──────────────────────────────────────────────── */
function BooksView({ books, loading, selected, openBook, saveCounts }) {
  const [search, setSearch] = useState('');

  const published  = books.filter(b => b.is_published).length;
  const totalViews = books.reduce((s, b) => s + (b.view_count || 0), 0);
  const totalSaves = Object.values(saveCounts).reduce((s, c) => s + c, 0);

  const visibleBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? books.filter(b => b.title.toLowerCase().includes(q)) : books;
  }, [books, search]);

  return (
    <div className="books-view">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">My Books</h1>
          <p className="dash-subtitle">Manage your listings on Indie Converters.</p>
        </div>
        <Link to="/upload" className="btn dash-publish-btn">+ Publish a book</Link>
      </header>

      <div className="dash-stats-row dash-stats-row--sales">
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconBooks /></span>
          <span className="dash-stat-val">{books.length}</span>
          <span className="dash-stat-lbl">Total books</span>
        </div>
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconCheckCircle done /></span>
          <span className="dash-stat-val">{published}</span>
          <span className="dash-stat-lbl">Published</span>
        </div>
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconEye /></span>
          <span className="dash-stat-val">{totalViews}</span>
          <span className="dash-stat-lbl">Page views</span>
        </div>
        <div className="dash-stat-card dash-stat-card--icon dash-stat-card--selected">
          <span className="dash-stat-icon"><IconBookmark /></span>
          <span className="dash-stat-val">{totalSaves}</span>
          <span className="dash-stat-lbl">Saves</span>
        </div>
      </div>

      {loading && <p className="dash-loading-msg">Loading…</p>}

      {!loading && books.length === 0 && (
        <div className="dash-empty">
          <div className="dash-empty-icon">··</div>
          <h2>No books yet.</h2>
          <p>Upload your manuscript and it'll appear here once published.</p>
          <Link to="/upload" className="btn btn-primary">Publish your first book</Link>
        </div>
      )}

      {!loading && books.length > 0 && (
        <section className="dash-card dash-books-table-card">
          <div className="dash-console-table-head">
            <h2 className="dash-section-title">All books</h2>
            <label className="dash-console-search">
              <IconSearch />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search books…"
              />
            </label>
          </div>

          <div className="dash-book-list">
            <div className="dash-book-list-head">
              <span style={{ flex: 1 }}>Title</span>
              <span className="dash-col-status">Status</span>
              <span className="dash-col-price">Price</span>
              <span className="dash-col-earn">Earned</span>
            </div>
            {visibleBooks.length === 0
              ? <p className="dash-table-empty">No books match "{search}".</p>
              : visibleBooks.map(book => {
                  const status = bookStatus(book);
                  return (
                    <button
                      key={book.id}
                      className={`dash-book-row ${selected?.id === book.id ? 'dash-book-row--active' : ''}`}
                      onClick={() => openBook(book)}
                    >
                      <div className="dash-row-cover">
                        {book.cover_url
                          ? <img src={book.cover_url} alt={book.title} />
                          : <span className="dash-row-cover-ph">··</span>
                        }
                      </div>
                      <div className="dash-row-info">
                        <span className="dash-row-title">{book.title}</span>
                        {book.pub_date
                          ? <span className="dash-row-year">Release {formatDashboardDate(book.pub_date)}</span>
                          : book.pub_year && <span className="dash-row-year">{book.pub_year}</span>}
                        {book.manuscript_path && (
                          <span className="dash-row-ms-badge">manuscript</span>
                        )}
                        <span className="dash-row-mobile-meta">
                          <span className={`dash-status ${status.className}`}>{status.label}</span>
                          <span>{book.price != null ? `$${Number(book.price).toFixed(2)}` : 'Free'}</span>
                        </span>
                      </div>
                      <span className={`dash-col-status dash-status ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="dash-col-price dash-row-price">
                        {book.price != null ? `$${Number(book.price).toFixed(2)}` : 'Free'}
                      </span>
                      <span className="dash-col-earn dash-row-earn">$0.00</span>
                      <span className="dash-row-arrow">›</span>
                    </button>
                  );
                })}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Buy Links view ──────────────────────────────────────────── */
function BuyLinksView({ books }) {
  const [search, setSearch] = useState('');

  const withCount    = books.filter(b => b.book_retailer_links?.length).length;
  const withoutCount = books.length - withCount;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? books.filter(b => b.title.toLowerCase().includes(q)) : books;
    // Missing-link books surface first — that's the actionable queue, same
    // as an admin console leading with items that need attention.
    return [...filtered].sort((a, b) => {
      const aMissing = !a.book_retailer_links?.length;
      const bMissing = !b.book_retailer_links?.length;
      if (aMissing !== bMissing) return aMissing ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
  }, [books, search]);

  return (
    <div className="buylinks-view">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Buy Links</h1>
          <p className="dash-subtitle">Where readers go to buy your books. Edit a listing to add or update a link.</p>
        </div>
      </header>

      {books.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-icon">··</div>
          <h2>No books published yet.</h2>
          <p>Once you publish a book, add your buy link so readers know where to get it.</p>
          <Link to="/upload" className="btn btn-primary">Publish your first book</Link>
        </div>
      ) : (
        <>
          <div className="dash-stats-row dash-stats-row--sales">
            <div className="dash-stat-card dash-stat-card--icon">
              <span className="dash-stat-icon"><IconBooks /></span>
              <span className="dash-stat-val">{books.length}</span>
              <span className="dash-stat-lbl">Total books</span>
            </div>
            <div className="dash-stat-card dash-stat-card--icon dash-stat-card--selected">
              <span className="dash-stat-icon"><IconLink /></span>
              <span className="dash-stat-val">{withCount}</span>
              <span className="dash-stat-lbl">With buy links</span>
            </div>
            <div className="dash-stat-card dash-stat-card--icon">
              <span className="dash-stat-icon"><IconAlertTriangle /></span>
              <span className="dash-stat-val">{withoutCount}</span>
              <span className="dash-stat-lbl">Missing a link</span>
            </div>
          </div>

          <section className="dash-card dash-buylinks-table-card">
            <div className="dash-console-table-head">
              <h2 className="dash-section-title">All books</h2>
              <label className="dash-console-search">
                <IconSearch />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search books…"
                />
              </label>
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Retailers</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0
                    ? <tr><td colSpan={4} className="dash-table-empty">No books match "{search}".</td></tr>
                    : rows.map(b => {
                        const links = b.book_retailer_links || [];
                        const isLive = links.length > 0;
                        return (
                          <tr key={b.id}>
                            <td className="dash-table-book">
                              <span className="dash-sales-book-cell">
                                <span className="dash-sales-book-thumb">
                                  {b.cover_url ? <img src={b.cover_url} alt="" /> : null}
                                </span>
                                {b.title}
                              </span>
                            </td>
                            <td>
                              {isLive ? (
                                <span className="dash-buylinks-badges">
                                  {links.map((link, i) => (
                                    <DistributorBadge key={i} name={link.retailers?.label} />
                                  ))}
                                </span>
                              ) : (
                                <span className="dash-table-missing">No retailer linked</span>
                              )}
                            </td>
                            <td>
                              <span className={`dash-status ${isLive ? 'dash-status--pub' : 'dash-status--missing'}`}>
                                {isLive ? 'Live' : 'Missing'}
                              </span>
                            </td>
                            <td>
                              <Link to={`/dashboard/edit/${b.slug}`} className="dash-table-edit-link">
                                {isLive ? 'Edit' : 'Add link'} →
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

/* ── Reports view ────────────────────────────────────────────── */
function exportReportsCsv(rows) {
  const header = ['Book', 'Views', 'Saves', 'Save rate'];
  const escape = v => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map(r => [
    r.title,
    r.views,
    r.saves,
    r.views ? `${((r.saves / r.views) * 100).toFixed(1)}%` : '—',
  ].map(escape).join(','));
  const csv = [header.map(escape).join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsView({ user, books, saveCounts }) {
  const [saves, setSaves]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [rangeKey, setRangeKey] = useState('30d');
  const [granularity, setGranularity] = useState('weekly');
  const [showAllBooks, setShowAllBooks] = useState(false);

  const range = SALES_RANGES.find(r => r.key === rangeKey);
  const bookIds = useMemo(() => books.map(b => b.id), [books]);

  // Views only ever come through as one running total per book (no per-day
  // rows exist to re-bucket), so the range selector and trend chart apply to
  // saves only — the one reader-activity table that actually has timestamps.
  useEffect(() => {
    if (!bookIds.length) { setSaves([]); setLoading(false); return; }
    setLoading(true);
    supabase.from('reader_saves')
      .select('id, book_id, created_at, books(title, slug, cover_url)')
      .in('book_id', bookIds)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setSaves(data ?? []); setLoading(false); });
  }, [bookIds]);

  const { currentSaves, previousSaves, periodStart, prevStart, totalDays } = useMemo(() => {
    if (!range.days) {
      const earliest = saves.length ? new Date(saves[0].created_at) : new Date();
      const days = Math.max(1, Math.ceil((Date.now() - earliest) / 86400000));
      return { currentSaves: saves, previousSaves: [], periodStart: earliest, prevStart: null, totalDays: days };
    }
    const now = Date.now();
    const start = new Date(now - range.days * 86400000);
    const prev  = new Date(start.getTime() - range.days * 86400000);
    return {
      currentSaves:  saves.filter(s => new Date(s.created_at) >= start),
      previousSaves: saves.filter(s => new Date(s.created_at) >= prev && new Date(s.created_at) < start),
      periodStart: start,
      prevStart: prev,
      totalDays: range.days,
    };
  }, [saves, rangeKey]);

  const totalViews  = useMemo(() => books.reduce((s, b) => s + (b.view_count || 0), 0), [books]);
  const totalSavesAllTime = useMemo(() => Object.values(saveCounts).reduce((s, c) => s + c, 0), [saveCounts]);
  const saveRate = totalViews ? (totalSavesAllTime / totalViews) * 100 : 0;

  const baseBucketDays = SALES_GRANULARITIES.find(g => g.key === granularity).bucketDays;
  const bucketDays = Math.max(baseBucketDays, Math.ceil(totalDays / 60));
  const bucketCount = Math.max(1, Math.ceil(totalDays / bucketDays));
  const currentBuckets  = useMemo(() => bucketByDate(currentSaves, periodStart, bucketCount, bucketDays, 'created_at'), [currentSaves, periodStart, bucketCount, bucketDays]);
  const previousBuckets = useMemo(() => prevStart ? bucketByDate(previousSaves, prevStart, bucketCount, bucketDays, 'created_at') : null, [previousSaves, prevStart, bucketCount, bucketDays]);
  const bucketLabels = useMemo(() => Array.from({ length: bucketCount }, (_, i) =>
    new Date(periodStart.getTime() + i * bucketDays * 86400000)
      .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  ), [periodStart, bucketCount, bucketDays]);

  const mostViewed = useMemo(() =>
    [...books].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5),
  [books]);

  const perBookRows = useMemo(() =>
    books.map(b => ({ id: b.id, title: b.title, cover: b.cover_url, views: b.view_count || 0, saves: saveCounts[b.id] || 0 }))
      .sort((a, b) => b.views - a.views),
  [books, saveCounts]);
  const visibleBookRows = showAllBooks ? perBookRows : perBookRows.slice(0, 8);

  return (
    <div className="reports-view">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Reports</h1>
          <p className="dash-subtitle">How readers are discovering and saving your books.</p>
        </div>
        <div className="dash-sales-header-actions">
          <select className="dash-sales-range-select" value={rangeKey} onChange={e => setRangeKey(e.target.value)}>
            {SALES_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <button type="button" className="btn dash-publish-btn" onClick={() => exportReportsCsv(perBookRows)} disabled={!perBookRows.length}>
            <IconDownload /> Export report
          </button>
        </div>
      </header>

      <div className="dash-stats-row dash-stats-row--sales">
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconEye /></span>
          <span className="dash-stat-val">{totalViews}</span>
          <span className="dash-stat-lbl">Page views (all-time)</span>
        </div>
        <div className="dash-stat-card dash-stat-card--icon dash-stat-card--selected">
          <span className="dash-stat-icon"><IconBookmark /></span>
          <span className="dash-stat-val">{currentSaves.length}</span>
          <span className="dash-stat-lbl">Saves ({range.label.toLowerCase()})</span>
          <DeltaBadge value={pctDelta(currentSaves.length, previousSaves.length)} />
        </div>
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconTrendUp /></span>
          <span className="dash-stat-val">{saveRate.toFixed(1)}%</span>
          <span className="dash-stat-lbl">Save rate (all-time)</span>
        </div>
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconBooks /></span>
          <span className="dash-stat-val">{books.length}</span>
          <span className="dash-stat-lbl">Books published</span>
        </div>
      </div>

      <div className="dash-sales-grid">
        <div className="dash-sales-main">
          <section className="dash-card">
            <div className="dash-sales-chart-head">
              <h2 className="dash-section-title">Saves trend</h2>
              <div className="dash-sales-granularity">
                {SALES_GRANULARITIES.map(g => (
                  <button
                    key={g.key}
                    type="button"
                    className={granularity === g.key ? 'is-active' : ''}
                    onClick={() => setGranularity(g.key)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dash-sales-chart-legend">
              <span><i className="dash-sales-legend-swatch dash-sales-legend-swatch--current" />Saves</span>
              {previousBuckets && <span><i className="dash-sales-legend-swatch dash-sales-legend-swatch--prev" />Previous period</span>}
            </div>
            {loading
              ? <p className="dash-loading-msg">Loading…</p>
              : <SalesTrendChart current={currentBuckets} previous={previousBuckets} labels={bucketLabels} />
            }
          </section>
        </div>

        <div className="dash-sales-side">
          <section className="dash-card">
            <h2 className="dash-section-title">Most viewed books</h2>
            {mostViewed.length === 0 ? (
              <p className="dash-drawer-dim">No books published yet.</p>
            ) : (
              <ul className="dash-sales-top-books">
                {mostViewed.map(b => (
                  <li key={b.id}>
                    <span className="dash-sales-book-thumb dash-sales-book-thumb--sm">
                      {b.cover_url ? <img src={b.cover_url} alt="" /> : null}
                    </span>
                    <span className="dash-sales-top-book-info">
                      <span className="dash-sales-top-book-title">{b.title}</span>
                      <span className="dash-sales-top-book-net">{b.view_count || 0} views</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <section className="dash-card dash-sales-recent-full">
        <h2 className="dash-section-title">Per-book breakdown</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Views</th>
                <th>Saves</th>
                <th>Save rate</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookRows.length === 0
                ? <tr><td colSpan={4} className="dash-table-empty">No books published yet.</td></tr>
                : visibleBookRows.map(b => (
                    <tr key={b.id}>
                      <td className="dash-table-book">
                        <span className="dash-sales-book-cell">
                          <span className="dash-sales-book-thumb">
                            {b.cover ? <img src={b.cover} alt="" /> : null}
                          </span>
                          {b.title}
                        </span>
                      </td>
                      <td>{b.views}</td>
                      <td>{b.saves}</td>
                      <td>{b.views ? `${((b.saves / b.views) * 100).toFixed(1)}%` : '—'}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
        {!showAllBooks && perBookRows.length > 8 && (
          <button type="button" className="dash-sales-view-all" onClick={() => setShowAllBooks(true)}>
            View all books →
          </button>
        )}
      </section>
    </div>
  );
}

/* ── Sales view ──────────────────────────────────────────────── */
function formatMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount) || 0);
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const SALES_RANGES = [
  { key: '30d',  label: 'Last 30 days',   days: 30 },
  { key: '90d',  label: 'Last 90 days',   days: 90 },
  { key: '365d', label: 'Last 12 months', days: 365 },
  { key: 'all',  label: 'All time',       days: null },
];

const SALES_GRANULARITIES = [
  { key: 'daily',   label: 'Daily',   bucketDays: 1 },
  { key: 'weekly',  label: 'Weekly',  bucketDays: 7 },
  { key: 'monthly', label: 'Monthly', bucketDays: 30 },
];

function sumBy(list, key) {
  return list.reduce((s, r) => s + (Number(r[key]) || 0), 0);
}

function pctDelta(curr, prev) {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

function niceCeil(v) {
  if (v <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / pow;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return niceNorm * pow;
}

function bucketSales(list, start, bucketCount, bucketDays) {
  const sums = Array(bucketCount).fill(0);
  list.forEach(s => {
    const offsetDays = (new Date(s.sale_date) - start) / 86400000;
    const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(offsetDays / bucketDays)));
    sums[idx] += Number(s.net_amount_to_author) || 0;
  });
  return sums;
}

function bucketByDate(list, start, bucketCount, bucketDays, dateKey) {
  const counts = Array(bucketCount).fill(0);
  list.forEach(row => {
    const offsetDays = (new Date(row[dateKey]) - start) / 86400000;
    const idx = Math.min(bucketCount - 1, Math.max(0, Math.floor(offsetDays / bucketDays)));
    counts[idx] += 1;
  });
  return counts;
}

const DISTRIBUTOR_COLORS = ['#f59e0b', '#34c759', '#4f8cff', '#a855f7', '#ef4444', '#14b8a6'];
function distributorColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return DISTRIBUTOR_COLORS[h % DISTRIBUTOR_COLORS.length];
}

function DeltaBadge({ value }) {
  if (value == null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span className={`dash-sales-delta ${up ? 'is-up' : 'is-down'}`}>
      {up ? '↑' : '↓'} {Math.abs(Math.round(value))}%
    </span>
  );
}

function DistributorBadge({ name }) {
  const label = name || 'Unknown';
  return (
    <span className="dash-sales-channel">
      <span className="dash-sales-channel-badge" style={{ background: distributorColor(label) }}>
        {label.charAt(0).toUpperCase()}
      </span>
      {label}
    </span>
  );
}

function SalesTrendChart({ current, previous, labels }) {
  const width = 640, height = 220, padL = 46, padR = 12, padT = 10, padB = 26;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = current.length;
  const max = niceCeil(Math.max(1, ...current, ...(previous || [])));
  const x = i => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = v => padT + innerH - (v / max) * innerH;

  const currentPoints  = current.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const previousPoints = previous && previous.length === n
    ? previous.map((v, i) => `${x(i)},${y(v)}`).join(' ')
    : null;
  const areaPath = n > 0
    ? `M${x(0)},${y(current[0])} ${current.map((v, i) => `L${x(i)},${y(v)}`).join(' ')} L${x(n - 1)},${padT + innerH} L${x(0)},${padT + innerH} Z`
    : '';

  const ticks = 4;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => Math.round(max * (i / ticks)));
  const labelStride = Math.max(1, Math.ceil(n / 6));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="dash-sales-chart-svg" preserveAspectRatio="none">
      {gridVals.map(v => (
        <g key={v}>
          <line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} className="dash-sales-chart-grid" />
          <text x={padL - 8} y={y(v) + 3} className="dash-sales-chart-ytick" textAnchor="end">${v}</text>
        </g>
      ))}
      {n > 0 && <path d={areaPath} className="dash-sales-chart-area" />}
      {previousPoints && <polyline points={previousPoints} className="dash-sales-chart-line dash-sales-chart-line--prev" />}
      {n > 0 && <polyline points={currentPoints} className="dash-sales-chart-line dash-sales-chart-line--current" />}
      {labels.map((l, i) => (i % labelStride === 0) && (
        <text key={i} x={x(i)} y={height - 6} className="dash-sales-chart-xtick" textAnchor="middle">{l}</text>
      ))}
    </svg>
  );
}

function PayoutSummaryCard({ authorId }) {
  const [state, setState] = useState({ loading: true, lastPayout: null, nextPayout: null, methodName: null });

  useEffect(() => {
    if (!authorId) { setState(s => ({ ...s, loading: false })); return; }
    Promise.all([
      supabase.from('payouts')
        .select('total_amount, net_amount_sent, status, payout_date, created_at')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false }),
      supabase.from('author_payment_methods')
        .select('is_default, payment_methods(name)')
        .eq('author_id', authorId)
        .eq('is_default', true)
        .maybeSingle(),
    ]).then(([{ data: payouts }, { data: method }]) => {
      const list = payouts ?? [];
      setState({
        loading: false,
        lastPayout: list.find(p => p.status === 'completed') || null,
        nextPayout: list.find(p => p.status === 'pending') || null,
        methodName: method?.payment_methods?.name || null,
      });
    });
  }, [authorId]);

  const { loading, lastPayout, nextPayout, methodName } = state;

  return (
    <section className="dash-card dash-sales-payout">
      <h2 className="dash-section-title">Payout summary</h2>
      {loading ? <p className="dash-loading-msg">Loading…</p> : (
        <>
          <div className="dash-sales-payout-row">
            <span>Next payout</span>
            <strong>{nextPayout ? formatMoney(nextPayout.total_amount) : '—'}</strong>
          </div>
          {nextPayout && <p className="dash-sales-payout-date">{formatShortDate(nextPayout.payout_date || nextPayout.created_at)}</p>}

          <div className="dash-sales-payout-row">
            <span>Last payout</span>
            <strong>{lastPayout ? formatMoney(lastPayout.net_amount_sent) : '—'}</strong>
          </div>
          {lastPayout && <p className="dash-sales-payout-date">{formatShortDate(lastPayout.payout_date || lastPayout.created_at)}</p>}

          <div className="dash-sales-payout-method">
            <span>Payout method</span>
            <strong>{methodName || 'Not set'}</strong>
          </div>

          {!lastPayout && !nextPayout && (
            <p className="dash-drawer-dim">No payouts yet. Payouts appear here once processed.</p>
          )}
        </>
      )}
    </section>
  );
}

function exportSalesCsv(rows) {
  const header = ['Book', 'Distributor', 'Sale amount', 'Net to author', 'Date'];
  const escape = v => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map(s => [
    s.books?.title || '',
    s.distributors?.name || '',
    s.sale_amount,
    s.net_amount_to_author,
    new Date(s.sale_date).toISOString().slice(0, 10),
  ].map(escape).join(','));
  const csv = [header.map(escape).join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SalesView({ user }) {
  const [sales, setSales]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [authorId, setAuthorId]   = useState(null);
  const [rangeKey, setRangeKey]   = useState('30d');
  const [granularity, setGranularity] = useState('weekly');
  const [showAllSales, setShowAllSales] = useState(false);
  const [showAllBooks, setShowAllBooks] = useState(false);

  const range = SALES_RANGES.find(r => r.key === rangeKey);

  useEffect(() => {
    supabase.from('authors').select('id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setAuthorId(data?.id ?? null));
  }, [user.id]);

  useEffect(() => {
    setLoading(true);
    const fetchFrom = range.days ? new Date(Date.now() - range.days * 2 * 86400000) : null;
    let query = supabase
      .from('sales')
      .select('id, book_id, sale_amount, distributor_cut_percentage, net_amount_to_author, sale_date, books(title, slug, cover_url), distributors(name)')
      .order('sale_date', { ascending: true });
    if (fetchFrom) query = query.gte('sale_date', fetchFrom.toISOString());
    query.then(({ data }) => {
      setSales(data ?? []);
      setLoading(false);
    });
  }, [rangeKey]);

  const { currentSales, previousSales, periodStart, prevStart, totalDays } = useMemo(() => {
    if (!range.days) {
      const earliest = sales.length ? new Date(sales[0].sale_date) : new Date();
      const days = Math.max(1, Math.ceil((Date.now() - earliest) / 86400000));
      return { currentSales: sales, previousSales: [], periodStart: earliest, prevStart: null, totalDays: days };
    }
    const now = Date.now();
    const start = new Date(now - range.days * 86400000);
    const prev  = new Date(start.getTime() - range.days * 86400000);
    return {
      currentSales:  sales.filter(s => new Date(s.sale_date) >= start),
      previousSales: sales.filter(s => new Date(s.sale_date) >= prev && new Date(s.sale_date) < start),
      periodStart: start,
      prevStart: prev,
      totalDays: range.days,
    };
  }, [sales, rangeKey]);

  const totalSales    = currentSales.length;
  const grossRevenue   = sumBy(currentSales, 'sale_amount');
  const netToYou       = sumBy(currentSales, 'net_amount_to_author');
  const avgOrderValue  = totalSales ? grossRevenue / totalSales : 0;

  const prevGross = sumBy(previousSales, 'sale_amount');
  const prevNet   = sumBy(previousSales, 'net_amount_to_author');
  const prevAvg   = previousSales.length ? prevGross / previousSales.length : 0;

  // Widen the bucket beyond the chosen granularity if the range would otherwise
  // need more than 60 buckets — keeps every sale represented instead of letting
  // bucketSales() silently pile overflow days into the last bar.
  const baseBucketDays = SALES_GRANULARITIES.find(g => g.key === granularity).bucketDays;
  const bucketDays = Math.max(baseBucketDays, Math.ceil(totalDays / 60));
  const bucketCount = Math.max(1, Math.ceil(totalDays / bucketDays));
  const currentBuckets  = useMemo(() => bucketSales(currentSales, periodStart, bucketCount, bucketDays), [currentSales, periodStart, bucketCount, bucketDays]);
  const previousBuckets = useMemo(() => prevStart ? bucketSales(previousSales, prevStart, bucketCount, bucketDays) : null, [previousSales, prevStart, bucketCount, bucketDays]);
  const bucketLabels = useMemo(() => Array.from({ length: bucketCount }, (_, i) =>
    new Date(periodStart.getTime() + i * bucketDays * 86400000)
      .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  ), [periodStart, bucketCount, bucketDays]);

  const topBooks = useMemo(() => {
    const byBook = new Map();
    currentSales.forEach(s => {
      const key = s.book_id;
      if (!byBook.has(key)) byBook.set(key, { key, title: s.books?.title || 'Untitled', slug: s.books?.slug, cover: s.books?.cover_url, net: 0 });
      byBook.get(key).net += Number(s.net_amount_to_author) || 0;
    });
    const prevByBook = new Map();
    previousSales.forEach(s => {
      prevByBook.set(s.book_id, (prevByBook.get(s.book_id) || 0) + (Number(s.net_amount_to_author) || 0));
    });
    return [...byBook.values()]
      .map(b => ({ ...b, delta: pctDelta(b.net, prevByBook.get(b.key) || 0) }))
      .sort((a, b) => b.net - a.net);
  }, [currentSales, previousSales]);

  const recentSales = [...currentSales].sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
  const visibleSales = showAllSales ? recentSales : recentSales.slice(0, 8);
  const visibleBooks = showAllBooks ? topBooks : topBooks.slice(0, 5);

  return (
    <div className="sales-view">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Sales</h1>
          <p className="dash-subtitle">Track your book sales, revenue, and performance.</p>
        </div>
        <div className="dash-sales-header-actions">
          <select className="dash-sales-range-select" value={rangeKey} onChange={e => setRangeKey(e.target.value)}>
            {SALES_RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <button type="button" className="btn dash-publish-btn" onClick={() => exportSalesCsv(recentSales)} disabled={!recentSales.length}>
            <IconDownload /> Export report
          </button>
        </div>
      </header>

      <div className="dash-stats-row dash-stats-row--sales">
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconCart /></span>
          <span className="dash-stat-val">{totalSales}</span>
          <span className="dash-stat-lbl">Total sales</span>
          <DeltaBadge value={pctDelta(totalSales, previousSales.length)} />
        </div>
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconCoin /></span>
          <span className="dash-stat-val">{formatMoney(grossRevenue)}</span>
          <span className="dash-stat-lbl">Gross revenue</span>
          <DeltaBadge value={pctDelta(grossRevenue, prevGross)} />
        </div>
        <div className="dash-stat-card dash-stat-card--icon dash-stat-card--selected">
          <span className="dash-stat-icon"><IconWallet /></span>
          <span className="dash-stat-val">{formatMoney(netToYou)}</span>
          <span className="dash-stat-lbl">Net to you</span>
          <DeltaBadge value={pctDelta(netToYou, prevNet)} />
        </div>
        <div className="dash-stat-card dash-stat-card--icon">
          <span className="dash-stat-icon"><IconTrendUp /></span>
          <span className="dash-stat-val">{formatMoney(avgOrderValue)}</span>
          <span className="dash-stat-lbl">Avg. order value</span>
          <DeltaBadge value={pctDelta(avgOrderValue, prevAvg)} />
        </div>
      </div>

      <div className="dash-sales-grid">
        <div className="dash-sales-main">
          <section className="dash-card">
            <div className="dash-sales-chart-head">
              <h2 className="dash-section-title">Sales trend</h2>
              <div className="dash-sales-granularity">
                {SALES_GRANULARITIES.map(g => (
                  <button
                    key={g.key}
                    type="button"
                    className={granularity === g.key ? 'is-active' : ''}
                    onClick={() => setGranularity(g.key)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dash-sales-chart-legend">
              <span><i className="dash-sales-legend-swatch dash-sales-legend-swatch--current" />Net to you</span>
              {previousBuckets && <span><i className="dash-sales-legend-swatch dash-sales-legend-swatch--prev" />Previous period</span>}
            </div>
            {loading
              ? <p className="dash-loading-msg">Loading…</p>
              : <SalesTrendChart current={currentBuckets} previous={previousBuckets} labels={bucketLabels} />
            }
          </section>
        </div>

        <div className="dash-sales-side">
          <section className="dash-card">
            <h2 className="dash-section-title">Top performing books</h2>
            {loading ? <p className="dash-loading-msg">Loading…</p> : topBooks.length === 0 ? (
              <p className="dash-drawer-dim">No sales in this period yet.</p>
            ) : (
              <ul className="dash-sales-top-books">
                {visibleBooks.map(b => (
                  <li key={b.key}>
                    <span className="dash-sales-book-thumb dash-sales-book-thumb--sm">
                      {b.cover ? <img src={b.cover} alt="" /> : null}
                    </span>
                    <span className="dash-sales-top-book-info">
                      <span className="dash-sales-top-book-title">{b.title}</span>
                      <span className="dash-sales-top-book-net">{formatMoney(b.net)}</span>
                    </span>
                    <DeltaBadge value={b.delta} />
                  </li>
                ))}
              </ul>
            )}
            {!showAllBooks && topBooks.length > 5 && (
              <button type="button" className="dash-sales-view-all" onClick={() => setShowAllBooks(true)}>
                View all →
              </button>
            )}
          </section>

          <PayoutSummaryCard authorId={authorId} />
        </div>
      </div>

      <section className="dash-card dash-sales-recent-full">
        <h2 className="dash-section-title">Recent sales</h2>
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Channel</th>
                <th>Sale amount</th>
                <th>Net to author</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={6} className="dash-table-empty">Loading…</td></tr>
                : visibleSales.length === 0
                  ? <tr><td colSpan={6} className="dash-table-empty">No sales yet. Sales appear here once a book set to sell directly through Indie Converters starts selling.</td></tr>
                  : visibleSales.map(s => (
                      <tr key={s.id}>
                        <td className="dash-table-book">
                          <span className="dash-sales-book-cell">
                            <span className="dash-sales-book-thumb">
                              {s.books?.cover_url ? <img src={s.books.cover_url} alt="" /> : null}
                            </span>
                            {s.books?.title || '—'}
                          </span>
                        </td>
                        <td><DistributorBadge name={s.distributors?.name} /></td>
                        <td>{formatMoney(s.sale_amount)}</td>
                        <td>{formatMoney(s.net_amount_to_author)}</td>
                        <td>{formatShortDate(s.sale_date)}</td>
                        <td><span className="dash-status dash-status--pub">Completed</span></td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
        {!showAllSales && recentSales.length > 8 && (
          <button type="button" className="dash-sales-view-all" onClick={() => setShowAllSales(true)}>
            View all sales →
          </button>
        )}
      </section>
    </div>
  );
}

/* ── Briefs view ─────────────────────────────────────────────── */
const BRIEF_SERVICE_LABELS = {
  ghostwriting: 'Ghostwriting',
  editing: 'Editing',
  'cover-design': 'Cover Design',
  formatting: 'Formatting',
  other: 'Other',
};

function BriefsView({ user }) {
  const [briefs,      setBriefs]      = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [pickingId,   setPickingId]   = useState(null);
  const [pickValue,   setPickValue]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    Promise.all([
      fetchMyBriefs(user.id, user.email),
      fetchFreelancers(),
    ]).then(([b, f]) => {
      setBriefs(b);
      setFreelancers(f);
      setLoading(false);
    });
  }, [user.id, user.email]);

  function startPicking(briefId) {
    setError('');
    setPickValue('');
    setPickingId(briefId);
  }

  async function confirmFilled(briefId) {
    setSaving(true);
    setError('');
    try {
      await markBriefFilled(briefId, pickValue || null);
      const refreshed = await fetchMyBriefs(user.id, user.email);
      setBriefs(refreshed);
      setPickingId(null);
    } catch (e) {
      setError(e.message || 'Could not update this brief.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">My Briefs</h1>
          <p className="dash-subtitle">Projects you've posted at /hire/post. Mark one filled once you've hired someone.</p>
        </div>
      </header>

      {loading ? (
        <p className="dash-table-empty">Loading…</p>
      ) : briefs.length === 0 ? (
        <div className="dash-empty">
          <div className="dash-empty-icon">··</div>
          <h2>You haven't posted any briefs yet.</h2>
          <p>Describe a project and get matched with freelancers who can help.</p>
          <Link to="/hire/post" className="btn btn-primary">Post a brief</Link>
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Service</th>
                <th>Status</th>
                <th>Hired</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {briefs.map(b => (
                <tr key={b.id}>
                  <td className="dash-table-book">{b.title}</td>
                  <td>{BRIEF_SERVICE_LABELS[b.service_type] || b.service_type}</td>
                  <td>
                    <span className={`dash-status ${b.status === 'filled' ? 'dash-status--pub' : 'dash-status--draft'}`}>
                      {b.status === 'filled' ? 'Filled' : 'Open'}
                    </span>
                  </td>
                  <td>{b.freelancers?.display_name || '—'}</td>
                  <td>
                    {b.status === 'open' && pickingId !== b.id && (
                      <button type="button" className="dash-table-edit-link" onClick={() => startPicking(b.id)}>
                        Mark as filled →
                      </button>
                    )}
                    {b.status === 'open' && pickingId === b.id && (
                      <div className="dash-brief-picker">
                        <select value={pickValue} onChange={e => setPickValue(e.target.value)}>
                          <option value="">Close without crediting</option>
                          {freelancers.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.display_name} — {BRIEF_SERVICE_LABELS[f.service_type] || f.service_type}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={saving}
                          onClick={() => confirmFilled(b.id)}
                        >
                          {saving ? 'Saving…' : 'Confirm'}
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setPickingId(null)}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {error && <p className="dash-brief-error">{error}</p>}
        </div>
      )}
    </>
  );
}

/* ── Book drawer ─────────────────────────────────────────────── */
function BookDrawer({ book, preview, saves, onClose, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ext = book.manuscript_path?.split('.').pop().toLowerCase();
  const status = bookStatus(book);

  async function doDelete() {
    setDeleting(true);
    await onDelete(book);
    setDeleting(false);
  }

  return (
    <aside className="dash-drawer">
      <div className="dash-drawer-top">
        <button className="dash-drawer-close" onClick={onClose} aria-label="Close">
          <IconX />
        </button>
      </div>

      {/* Cover */}
      <div className="dash-drawer-cover">
        {book.cover_url
          ? <img src={book.cover_url} alt={book.title} />
          : <div className="dash-drawer-cover-ph">··</div>
        }
      </div>

      {/* Title / status */}
      <div className="dash-drawer-info">
        <span className={`dash-status ${status.className}`}>
          {status.label}
        </span>
        <h2 className="dash-drawer-title">{book.title}</h2>
        {book.pub_date
          ? <p className="dash-drawer-year">Release {formatDashboardDate(book.pub_date)}</p>
          : book.pub_year && <p className="dash-drawer-year">{book.pub_year}</p>}
      </div>

      {/* Quick stats */}
      <div className="dash-drawer-stats">
        <div className="dash-drawer-stat">
          <span className="dash-dstat-val">{book.view_count || 0}</span>
          <span className="dash-dstat-lbl">Page views</span>
        </div>
        <div className="dash-drawer-stat">
          <span className="dash-dstat-val">{saves}</span>
          <span className="dash-dstat-lbl">Saves</span>
        </div>
        <div className="dash-drawer-stat">
          <span className="dash-dstat-val">
            {book.price != null ? `$${Number(book.price).toFixed(2)}` : 'Free'}
          </span>
          <span className="dash-dstat-lbl">List price</span>
        </div>
      </div>

      {/* Manuscript preview */}
      <div className="dash-drawer-section">
        <h3 className="dash-drawer-section-title">Manuscript preview</h3>

        {!book.manuscript_path && (
          <p className="dash-drawer-dim">No manuscript uploaded.</p>
        )}

        {book.manuscript_path && preview.loading && (
          <p className="dash-drawer-dim">Loading…</p>
        )}

        {book.manuscript_path && !preview.loading && preview.text && (
          <div className="dash-preview-reader">
            <div className="dash-preview-label">First 4,000 characters</div>
            <div className="dash-preview-text">{preview.text}</div>
          </div>
        )}

        {book.manuscript_path && !preview.loading && !preview.text && preview.url && (
          <div className="dash-preview-unavailable">
            <p className="dash-drawer-dim">
              Inline preview not available for <strong>.{ext}</strong> files.
            </p>
            <a href={preview.url} download className="dash-download-btn">
              <IconDownload /> Download manuscript
            </a>
          </div>
        )}

        {book.manuscript_path && !preview.loading && !preview.url && (
          <p className="dash-drawer-dim">Could not load manuscript.</p>
        )}
      </div>

      {/* Actions */}
      <div className="dash-drawer-actions">
        <Link to={`/book/${book.slug}`} className="dash-drawer-action-btn">
          View public listing →
        </Link>
        <Link to={`/dashboard/edit/${book.slug}`} className="dash-drawer-action-btn dash-drawer-action-btn--primary">
          Edit listing →
        </Link>

        {!confirmDelete ? (
          <button className="dash-drawer-delete-btn" onClick={() => setConfirmDelete(true)}>
            Delete book
          </button>
        ) : (
          <div className="dash-delete-confirm">
            <p>Permanently delete <strong>{book.title}</strong> and its manuscript?</p>
            <div className="dash-delete-confirm-btns">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
              <button className="danger" onClick={doDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── Profile view ────────────────────────────────────────────── */
function ProfileView({ user }) {
  const [authorId,     setAuthorId]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState('');
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const photoRef = useRef(null);

  const [fd, setFd] = useState({
    display_name:  '',
    short_bio:     '',
    long_bio:      '',
    website_url:   '',
    twitter_url:   '',
    instagram_url: '',
    goodreads_url: '',
    location:      '',
    currency:      'USD',
    photo_url:     '',
  });

  useEffect(() => {
    supabase.from('authors').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setAuthorId(data.id);
        setFd({
          display_name:  data.display_name  || '',
          short_bio:     data.short_bio     || '',
          long_bio:      data.long_bio      || '',
          website_url:   data.website_url   || '',
          twitter_url:   data.twitter_url   || '',
          instagram_url: data.instagram_url || '',
          goodreads_url: data.goodreads_url || '',
          location:      data.location      || '',
          currency:      data.currency      || 'USD',
          photo_url:     data.photo_url     || '',
        });
        setPhotoPreview(data.photo_url || '');
      });
  }, [user.id]);

  function up(k, v) { setFd(p => ({ ...p, [k]: v })); }

  function handlePhoto(file) {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!fd.display_name.trim()) { setError('Display name is required.'); return; }
    setSaving(true); setError(''); setSaved(false);
    try {
      let photoUrl = fd.photo_url;
      if (photoFile) {
        const path = `${user.id}/avatar-${Date.now()}-${photoFile.name}`;
        const { error: ue } = await supabase.storage
          .from('covers').upload(path, photoFile);
        if (!ue) {
          photoUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
          up('photo_url', photoUrl);
        }
      }

      const payload = {
        display_name:  fd.display_name.trim(),
        short_bio:     fd.short_bio     || null,
        long_bio:      fd.long_bio      || null,
        website_url:   fd.website_url   || null,
        twitter_url:   fd.twitter_url   || null,
        instagram_url: fd.instagram_url || null,
        goodreads_url: fd.goodreads_url || null,
        location:      fd.location      || null,
        currency:      fd.currency,
        photo_url:     photoUrl         || null,
      };

      if (authorId) {
        const { error: ue } = await supabase.from('authors')
          .update(payload).eq('user_id', user.id);
        if (ue) throw ue;
      } else {
        const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Author';
        const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const { data: a, error: ie } = await supabase.from('authors')
          .insert({ ...payload, user_id: user.id, slug })
          .select('id').single();
        if (ie) throw ie;
        if (a) setAuthorId(a.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  const initials = (fd.display_name || user?.user_metadata?.full_name || user?.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Profile</h1>
          <p className="dash-subtitle">Your author identity and preferences.</p>
        </div>
        <div className="dash-header-actions">
          {saved && <span className="dash-saved-badge">Saved ✓</span>}
          <button className="btn dash-publish-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      {error && <div className="dash-profile-error">{error}</div>}

      <div className="dash-profile-form">

        {/* ── Photo ── */}
        <section className="dash-profile-section">
          <h2 className="dash-profile-section-title">Photo</h2>
          <div className="dash-photo-row">
            <div className="dash-photo-avatar">
              {photoPreview
                ? <img src={photoPreview} alt="Profile" />
                : <span>{initials}</span>
              }
            </div>
            <div className="dash-photo-actions">
              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handlePhoto(e.target.files[0]); }}
              />
              <button
                type="button"
                className="btn btn-outline dash-photo-upload-btn"
                onClick={() => photoRef.current?.click()}
              >
                Upload photo
              </button>
              <p className="dash-photo-hint">
                JPG, PNG or WebP. Appears on your public author page and book listings.
              </p>
            </div>
          </div>
        </section>

        {/* ── Identity ── */}
        <section className="dash-profile-section">
          <h2 className="dash-profile-section-title">Author identity</h2>
          <div className="dash-prow">
            <div className="dash-pfield">
              <label>Display name <span className="dash-req">*</span></label>
              <input
                type="text"
                value={fd.display_name}
                onChange={e => up('display_name', e.target.value)}
                placeholder="Your pen name or full name"
              />
            </div>
            <div className="dash-pfield">
              <label>Location <span className="dash-opt">optional</span></label>
              <input
                type="text"
                value={fd.location}
                onChange={e => up('location', e.target.value)}
                placeholder="e.g. Lagos, Nigeria"
              />
            </div>
          </div>
        </section>

        {/* ── Bio ── */}
        <section className="dash-profile-section">
          <h2 className="dash-profile-section-title">Bio</h2>
          <div className="dash-pfield">
            <label>
              Short bio
              <span className="dash-opt">shown on book pages · max 200 chars</span>
              <span className="dash-pfield-count">{fd.short_bio.length} / 200</span>
            </label>
            <textarea
              rows={3}
              maxLength={200}
              value={fd.short_bio}
              onChange={e => up('short_bio', e.target.value)}
              placeholder="One or two sentences about who you are."
            />
          </div>
          <div className="dash-pfield">
            <label>Full bio <span className="dash-opt">shown on your author profile page</span></label>
            <textarea
              rows={6}
              value={fd.long_bio}
              onChange={e => up('long_bio', e.target.value)}
              placeholder="A longer bio for readers who want to know more about you and your work."
            />
          </div>
        </section>

        {/* ── Links ── */}
        <section className="dash-profile-section">
          <h2 className="dash-profile-section-title">Links</h2>
          <div className="dash-pfield">
            <label>Website</label>
            <input
              type="url"
              value={fd.website_url}
              onChange={e => up('website_url', e.target.value)}
              placeholder="https://yoursite.com"
            />
          </div>
          <div className="dash-prow">
            <div className="dash-pfield">
              <label>Twitter / X</label>
              <input
                type="url"
                value={fd.twitter_url}
                onChange={e => up('twitter_url', e.target.value)}
                placeholder="https://x.com/yourhandle"
              />
            </div>
            <div className="dash-pfield">
              <label>Instagram</label>
              <input
                type="url"
                value={fd.instagram_url}
                onChange={e => up('instagram_url', e.target.value)}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
          </div>
          <div className="dash-pfield dash-pfield--half">
            <label>Goodreads</label>
            <input
              type="url"
              value={fd.goodreads_url}
              onChange={e => up('goodreads_url', e.target.value)}
              placeholder="https://goodreads.com/author/…"
            />
          </div>
        </section>

        {/* ── Preferences ── */}
        <section className="dash-profile-section">
          <h2 className="dash-profile-section-title">Preferences</h2>
          <div className="dash-pfield dash-pfield--sm">
            <label>Display currency</label>
            <select value={fd.currency} onChange={e => up('currency', e.target.value)}>
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.name} ({c.code})
                </option>
              ))}
            </select>
            <p className="dash-pfield-hint">
              Used when displaying your book prices in the dashboard and on your public listing.
            </p>
          </div>
        </section>

        <div className="dash-profile-actions">
          {saved && <span className="dash-saved-badge">Saved ✓</span>}
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

      </div>
    </>
  );
}

/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ value, label, highlight }) {
  return (
    <div className={`dash-stat-card ${highlight ? 'dash-stat-card--highlight' : ''}`}>
      <span className="dash-stat-val">{value}</span>
      <span className="dash-stat-lbl">{label}</span>
    </div>
  );
}
