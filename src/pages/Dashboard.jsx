import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
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

/* ── icons ───────────────────────────────────────────────────── */
function IconBooks()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function IconCoin()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.17 9.17A4 4 0 0 1 16 12a4 4 0 0 1-6.83 2.83"/></svg>; }
function IconChart()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6"  y1="20" x2="6"  y2="14"/></svg>; }
function IconUpload()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconUser()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconSignOut()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function IconX()         { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconDownload()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }

/* ── main component ──────────────────────────────────────────── */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView]         = useState('books');
  const [books, setBooks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview]   = useState({ loading: false, text: null, url: null });
  const [saveCounts, setSaveCounts] = useState({}); // bookId → count

  const name     = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Author';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    supabase
      .from('books')
      .select('id, title, slug, cover_url, pub_year, manuscript_path, price, is_published, view_count, created_at, book_retailer_links(url, retailers(slug, label))')
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
  }

  return (
    <div className="dashboard">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="dash-sidebar">
        <Link to="/" className="dash-logo">
          <span className="dash-logo-dot">··</span>
          <span>indieconverters</span>
        </Link>

        <nav className="dash-nav">
          <span className="dash-nav-label">Author</span>

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
            className={`dash-nav-link ${view === 'reports' ? 'dash-nav-link--active' : ''}`}
            onClick={() => switchView('reports')}
          >
            <IconChart /> Reports
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
          {view === 'books'    && <BooksView    books={books} loading={loading} selected={selected} openBook={openBook} saveCounts={saveCounts} />}
          {view === 'buylinks' && <BuyLinksView books={books} />}
          {view === 'reports'  && <ReportsView  books={books} saveCounts={saveCounts} />}
          {view === 'profile'  && <ProfileView  user={user} />}
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

/* ── Books view ──────────────────────────────────────────────── */
function BooksView({ books, loading, selected, openBook, saveCounts }) {
  const published  = books.filter(b => b.is_published).length;
  const totalViews = books.reduce((s, b) => s + (b.view_count || 0), 0);
  const totalSaves = Object.values(saveCounts).reduce((s, c) => s + c, 0);
  return (
    <>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">My Books</h1>
          <p className="dash-subtitle">Manage your listings on Indie Converters.</p>
        </div>
        <Link to="/upload" className="btn dash-publish-btn">+ Publish a book</Link>
      </header>

      <div className="dash-stats-row">
        <StatCard value={books.length} label="Total books" />
        <StatCard value={published}    label="Published" />
        <StatCard value={totalViews}   label="Page views" />
        <StatCard value={totalSaves}   label="Saves" highlight />
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
        <div className="dash-book-list">
          <div className="dash-book-list-head">
            <span style={{ flex: 1 }}>Title</span>
            <span className="dash-col-status">Status</span>
            <span className="dash-col-price">Price</span>
            <span className="dash-col-earn">Earned</span>
          </div>
          {books.map(book => (
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
                {book.pub_year && <span className="dash-row-year">{book.pub_year}</span>}
                {book.manuscript_path && (
                  <span className="dash-row-ms-badge">manuscript</span>
                )}
              </div>
              <span className={`dash-col-status dash-status ${book.is_published ? 'dash-status--pub' : 'dash-status--draft'}`}>
                {book.is_published ? 'Published' : 'Draft'}
              </span>
              <span className="dash-col-price dash-row-price">
                {book.price != null ? `$${Number(book.price).toFixed(2)}` : 'Free'}
              </span>
              <span className="dash-col-earn dash-row-earn">$0.00</span>
              <span className="dash-row-arrow">›</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Buy Links view ──────────────────────────────────────────── */
function BuyLinksView({ books }) {
  const withLinks    = books.filter(b => b.book_retailer_links?.length);
  const withoutLinks = books.filter(b => !b.book_retailer_links?.length);
  return (
    <>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Buy Links</h1>
          <p className="dash-subtitle">Where readers go to buy your books. Edit a listing to add or update a link.</p>
        </div>
      </header>

      {books.length === 0 && (
        <div className="dash-empty">
          <div className="dash-empty-icon">··</div>
          <h2>No books published yet.</h2>
          <p>Once you publish a book, add your buy link so readers know where to get it.</p>
          <Link to="/upload" className="btn btn-primary">Publish your first book</Link>
        </div>
      )}

      {withLinks.length > 0 && (
        <>
          <div className="dash-section-title">Books with buy links</div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead><tr><th>Book</th><th>Platform</th><th>URL</th><th /></tr></thead>
              <tbody>
                {withLinks.map(b => {
                  const link = b.book_retailer_links[0];
                  return (
                    <tr key={b.id}>
                      <td className="dash-table-book">{b.title}</td>
                      <td>{link.retailers?.label || '—'}</td>
                      <td className="dash-table-url">
                        <a href={link.url} target="_blank" rel="noreferrer">{link.url}</a>
                      </td>
                      <td>
                        <Link to={`/dashboard/edit/${b.slug}`} className="dash-table-edit-link">Edit →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {withoutLinks.length > 0 && (
        <>
          <div className="dash-section-title" style={{ marginTop: withLinks.length ? 32 : 0 }}>
            Missing a buy link
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead><tr><th>Book</th><th>Status</th><th /></tr></thead>
              <tbody>
                {withoutLinks.map(b => (
                  <tr key={b.id}>
                    <td className="dash-table-book">{b.title}</td>
                    <td className="dash-table-missing">No buy link set</td>
                    <td>
                      <Link to={`/dashboard/edit/${b.slug}`} className="dash-table-edit-link">Add link →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

/* ── Reports view ────────────────────────────────────────────── */
function ReportsView({ books, saveCounts }) {
  const totalViews = books.reduce((s, b) => s + (b.view_count || 0), 0);
  const totalSaves = Object.values(saveCounts).reduce((s, c) => s + c, 0);
  return (
    <>
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Reports</h1>
          <p className="dash-subtitle">How readers are discovering and saving your books.</p>
        </div>
      </header>

      <div className="dash-stats-row">
        <StatCard value={totalViews} label="Page views" highlight />
        <StatCard value={totalSaves} label="Saves" />
        <StatCard value="—"          label="Buy clicks" />
        <StatCard value="—"          label="Manuscript previews" />
      </div>

      <div className="dash-section-title">Per-book breakdown</div>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Views</th>
              <th>Saves</th>
              <th>Buy clicks</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0
              ? <tr><td colSpan={4} className="dash-table-empty">No books published yet.</td></tr>
              : books.map(b => (
                  <tr key={b.id}>
                    <td className="dash-table-book">{b.title}</td>
                    <td>{b.view_count || 0}</td>
                    <td>{saveCounts[b.id] || 0}</td>
                    <td>—</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ── Book drawer ─────────────────────────────────────────────── */
function BookDrawer({ book, preview, saves, onClose, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ext = book.manuscript_path?.split('.').pop().toLowerCase();

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
        <span className={`dash-status ${book.is_published ? 'dash-status--pub' : 'dash-status--draft'}`}>
          {book.is_published ? 'Published' : 'Draft'}
        </span>
        <h2 className="dash-drawer-title">{book.title}</h2>
        {book.pub_year && <p className="dash-drawer-year">{book.pub_year}</p>}
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
