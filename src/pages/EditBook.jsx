import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchBookForEdit, updateBook, updateBookGenres, replaceRetailerLinks } from '../lib/api';
import SEO from '../components/SEO';
import RetailerLinksEditor from '../components/RetailerLinksEditor';
import './EditBook.css';

const FORMATS   = ['eBook', 'Paperback', 'Hardcover', 'Audiobook'];
const TRIM_SIZES = [
  { id: '5x8', label: '5 x 8 in' },
  { id: '5_5x8_5', label: '5.5 x 8.5 in' },
  { id: '6x9', label: '6 x 9 in' },
  { id: '7x10', label: '7 x 10 in' },
  { id: '8_5x11', label: '8.5 x 11 in' },
];

const SECTIONS = [
  { id: 'core',    label: 'Core info' },
  { id: 'desc',    label: 'Description' },
  { id: 'disc',    label: 'Discovery' },
  { id: 'pub',     label: 'Publishing' },
  { id: 'cover',   label: 'Cover' },
  { id: 'formats', label: 'Formats & price' },
  { id: 'buy',     label: 'Prices & retailers' },
  { id: 'matter',  label: 'Front / back matter' },
];

export default function EditBook() {
  const { slug }   = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [book,    setBook]    = useState(null);
  const [genres,  setGenres]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  // form state
  const [fd, setFd] = useState(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetchBookForEdit(slug, user.id),
      supabase.from('genres').select('slug, label').order('label'),
    ]).then(([bk, { data: gList }]) => {
      if (!bk) { navigate('/dashboard'); return; }
      setBook(bk);
      setGenres(gList || []);

      const genreSlugs = bk.books_genres?.map(bg => bg.genres?.slug).filter(Boolean) || [];
      const retailerLinks = (bk.book_retailer_links || []).map(l => ({
        retailer: l.retailers?.slug || 'own',
        url: l.url || '',
        price: l.price != null ? String(l.price) : '',
      }));

      setFd({
        title:         bk.title || '',
        subtitle:      bk.subtitle || '',
        language:      bk.language || 'English',
        description:   bk.description || '',
        genre:         genreSlugs[0] || '',
        genreSecondary: genreSlugs[1] || '',
        keywords:      bk.keywords || [],
        pubYear:       bk.pub_year ? String(bk.pub_year) : '',
        pageCount:     bk.page_count ? String(bk.page_count) : '',
        trimSize:      bk.trim_size || '5x8',
        publisherName: bk.publisher_name || '',
        isbn13:        bk.isbn_13 || '',
        formats:       bk.formats || ['eBook'],
        price:         bk.price != null ? String(bk.price) : '',
        isFree:        bk.price === 0,
        retailerLinks: retailerLinks.length ? retailerLinks : [{ retailer: 'own', url: '', price: '' }],
        coverFile:     null,
        coverPreview:  bk.cover_url || '',
        frontMatter:   bk.front_matter || {},
        backMatter:    bk.back_matter  || {},
        newKeyword:    '',
      });
      setLoading(false);
    });
  }, [slug, user.id, navigate]);

  function set(key, val) {
    setFd(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  function toggleFormat(fmt) {
    set('formats', fd.formats.includes(fmt)
      ? fd.formats.filter(f => f !== fmt)
      : [...fd.formats, fmt]);
  }

  function addKeyword(kw) {
    const k = kw.trim();
    if (!k || fd.keywords.includes(k) || fd.keywords.length >= 7) return;
    set('keywords', [...fd.keywords, k]);
    set('newKeyword', '');
  }

  function onCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    set('coverFile', file);
    set('coverPreview', URL.createObjectURL(file));
  }

  function toggleFrontMatter(key) {
    set('frontMatter', {
      ...fd.frontMatter,
      [key]: { ...fd.frontMatter[key], enabled: !fd.frontMatter[key]?.enabled },
    });
  }
  function setFrontMatterContent(key, content) {
    set('frontMatter', { ...fd.frontMatter, [key]: { ...fd.frontMatter[key], content } });
  }
  function toggleBackMatter(key) {
    set('backMatter', {
      ...fd.backMatter,
      [key]: { ...fd.backMatter[key], enabled: !fd.backMatter[key]?.enabled },
    });
  }
  function setBackMatterContent(key, content) {
    set('backMatter', { ...fd.backMatter, [key]: { ...fd.backMatter[key], content } });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!fd.title.trim()) { setError('Title is required.'); return; }
    if (!fd.genre)        { setError('Primary genre is required.'); return; }
    setError('');
    setSaving(true);

    try {
      // 1. Cover upload if a new file was chosen
      let coverUrl = book.cover_url;
      if (fd.coverFile) {
        const ext  = fd.coverFile.name.split('.').pop();
        const path = `${user.id}/${slug}-cover.${ext}`;
        await supabase.storage.from('covers').upload(path, fd.coverFile, { upsert: true });
        coverUrl = supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
      }

      // 2. Update core book row
      const bookData = {
        title:          fd.title.trim(),
        subtitle:       fd.subtitle.trim() || null,
        language:       fd.language,
        description:    fd.description.trim(),
        keywords:       fd.keywords,
        formats:        fd.formats,
        pub_year:       fd.pubYear   ? parseInt(fd.pubYear,   10) : null,
        page_count:     fd.pageCount ? parseInt(fd.pageCount, 10) : null,
        trim_size:      fd.trimSize || null,
        publisher_name: fd.publisherName.trim() || null,
        isbn_13:        fd.isbn13.replace(/[^0-9]/g, '') || null,
        price:          fd.isFree ? 0 : (fd.price ? parseFloat(fd.price) : null),
        cover_url:      coverUrl,
        front_matter:   fd.frontMatter,
        back_matter:    fd.backMatter,
      };
      await updateBook(slug, user.id, bookData);

      // 3. Update genres
      await updateBookGenres(book.id, [fd.genre, fd.genreSecondary]);

      // 4. Replace retailer links (and their prices)
      await replaceRetailerLinks(book.id, fd.retailerLinks);

      setSaved(true);
    } catch (err) {
      setError(err.message || 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="eb-loading">Loading…</div>;
  if (!fd)     return null;

  return (
    <div className="eb-page">
      <SEO title="Edit Book | IndieConverters" description="Edit your book listing." path="/dashboard/edit" />
      {/* ── Top bar ── */}
      <header className="eb-topbar">
        <Link to="/dashboard" className="eb-back">← Dashboard</Link>
        <div className="eb-topbar-title">
          <span className="eb-topbar-label">Editing</span>
          <span className="eb-topbar-book">{fd.title || 'Untitled'}</span>
        </div>
        <div className="eb-topbar-actions">
          {saved && <span className="eb-saved-badge">Saved ✓</span>}
          <Link to={`/book/${slug}`} className="eb-view-link" target="_blank" rel="noreferrer">
            View live →
          </Link>
          <button
            className="btn btn-primary eb-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </header>

      <div className="eb-layout">
        {/* ── Sticky nav ── */}
        <nav className="eb-sidenav">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#eb-${s.id}`} className="eb-sidenav-link">{s.label}</a>
          ))}
        </nav>

        {/* ── Form ── */}
        <form className="eb-form" onSubmit={handleSave}>
          {error && <div className="eb-error">{error}</div>}

          {/* Core */}
          <section className="eb-section" id="eb-core">
            <h2 className="eb-section-title">Core info</h2>
            <div className="eb-field">
              <label>Title <span className="eb-req">*</span></label>
              <input value={fd.title} onChange={e => set('title', e.target.value)} maxLength={200} />
            </div>
            <div className="eb-field">
              <label>Subtitle <span className="eb-opt">optional</span></label>
              <input value={fd.subtitle} onChange={e => set('subtitle', e.target.value)} maxLength={200} />
            </div>
            <div className="eb-field eb-field--sm">
              <label>Language</label>
              <input value={fd.language} onChange={e => set('language', e.target.value)} />
            </div>
          </section>

          {/* Description */}
          <section className="eb-section" id="eb-desc">
            <h2 className="eb-section-title">Description</h2>
            <div className="eb-field">
              <label>Blurb / description <span className="eb-req">*</span></label>
              <textarea
                value={fd.description}
                onChange={e => set('description', e.target.value)}
                rows={8}
                maxLength={4000}
              />
              <span className="eb-char-count">{fd.description.length} / 4000</span>
            </div>
          </section>

          {/* Discovery */}
          <section className="eb-section" id="eb-disc">
            <h2 className="eb-section-title">Discovery</h2>
            <div className="eb-row">
              <div className="eb-field">
                <label>Primary genre <span className="eb-req">*</span></label>
                <select value={fd.genre} onChange={e => set('genre', e.target.value)}>
                  <option value="">Select…</option>
                  {genres.map(g => <option key={g.slug} value={g.slug}>{g.label}</option>)}
                </select>
              </div>
              <div className="eb-field">
                <label>Secondary genre <span className="eb-opt">optional</span></label>
                <select value={fd.genreSecondary} onChange={e => set('genreSecondary', e.target.value)}>
                  <option value="">None</option>
                  {genres.filter(g => g.slug !== fd.genre).map(g => (
                    <option key={g.slug} value={g.slug}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="eb-field">
              <label>Keywords <span className="eb-opt">{fd.keywords.length} / 7</span></label>
              <div className="eb-keywords">
                {fd.keywords.map(k => (
                  <span key={k} className="eb-keyword">
                    {k}
                    <button type="button" onClick={() => set('keywords', fd.keywords.filter(x => x !== k))}>×</button>
                  </span>
                ))}
                {fd.keywords.length < 7 && (
                  <input
                    className="eb-keyword-input"
                    placeholder="Add keyword…"
                    value={fd.newKeyword}
                    onChange={e => set('newKeyword', e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addKeyword(fd.newKeyword);
                      }
                    }}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Publishing */}
          <section className="eb-section" id="eb-pub">
            <h2 className="eb-section-title">Publishing details</h2>
            <div className="eb-row">
              <div className="eb-field eb-field--sm">
                <label>Publication year</label>
                <input type="number" value={fd.pubYear} onChange={e => set('pubYear', e.target.value)} min={1000} max={2099} />
              </div>
              <div className="eb-field eb-field--sm">
                <label>Page count</label>
                <input type="number" value={fd.pageCount} onChange={e => set('pageCount', e.target.value)} min={1} />
              </div>
            </div>
            <div className="eb-row">
              <div className="eb-field">
                <label>Publisher name</label>
                <input value={fd.publisherName} onChange={e => set('publisherName', e.target.value)} />
              </div>
              <div className="eb-field eb-field--sm">
                <label>ISBN-13 <span className="eb-opt">optional</span></label>
                <input value={fd.isbn13} onChange={e => set('isbn13', e.target.value)} maxLength={17} placeholder="978-…" />
              </div>
            </div>
            <div className="eb-row">
              <div className="eb-field eb-field--sm">
                <label>Trim size</label>
                <select value={fd.trimSize} onChange={e => set('trimSize', e.target.value)}>
                  {TRIM_SIZES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Cover */}
          <section className="eb-section" id="eb-cover">
            <h2 className="eb-section-title">Cover</h2>
            <div className="eb-cover-wrap">
              {fd.coverPreview ? (
                <img src={fd.coverPreview} alt="Cover preview" className="eb-cover-preview" />
              ) : (
                <div className="eb-cover-placeholder">No cover</div>
              )}
              <div className="eb-cover-actions">
                <button type="button" className="btn eb-upload-btn" onClick={() => coverInputRef.current?.click()}>
                  {fd.coverPreview ? 'Replace cover' : 'Upload cover'}
                </button>
                <p className="eb-cover-hint">JPG or PNG, min 600 × 900 px recommended.</p>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={onCoverChange}
                />
              </div>
            </div>
          </section>

          {/* Formats & price */}
          <section className="eb-section" id="eb-formats">
            <h2 className="eb-section-title">Formats &amp; price</h2>
            <div className="eb-field">
              <label>Available formats</label>
              <div className="eb-checkboxes">
                {FORMATS.map(fmt => (
                  <label key={fmt} className="eb-checkbox">
                    <input
                      type="checkbox"
                      checked={fd.formats.includes(fmt)}
                      onChange={() => toggleFormat(fmt)}
                    />
                    {fmt}
                  </label>
                ))}
              </div>
            </div>
            <div className="eb-field">
              <label>
                <input type="checkbox" checked={fd.isFree} onChange={e => set('isFree', e.target.checked)} />
                {' '}Free / pay what you want
              </label>
            </div>
            {!fd.isFree && (
              <div className="eb-field eb-field--sm">
                <label>List price (USD)</label>
                <input
                  type="number"
                  value={fd.price}
                  onChange={e => set('price', e.target.value)}
                  min={0}
                  step={0.01}
                  placeholder="e.g. 9.99"
                />
              </div>
            )}
          </section>

          {/* Prices & retailers */}
          <section className="eb-section" id="eb-buy">
            <h2 className="eb-section-title">Prices &amp; retailers</h2>
            <RetailerLinksEditor
              links={fd.retailerLinks}
              onChange={links => set('retailerLinks', links)}
              label={null}
              hint="Add every place readers can buy your book, with a price if you have one. IndieConverters shows readers which is cheapest — we never sell directly."
            />
          </section>

          {/* Front / back matter */}
          <section className="eb-section" id="eb-matter">
            <h2 className="eb-section-title">Front matter</h2>
            {[
              { key: 'copyright',   label: 'Copyright' },
              { key: 'dedication',  label: 'Dedication' },
              { key: 'epigraph',    label: 'Epigraph' },
              { key: 'preface',     label: 'Preface' },
              { key: 'authorsNote', label: "Author's note" },
            ].map(({ key, label }) => (
              <div key={key} className="eb-matter-item">
                <label className="eb-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(fd.frontMatter[key]?.enabled)}
                    onChange={() => toggleFrontMatter(key)}
                  />
                  {label}
                </label>
                {fd.frontMatter[key]?.enabled && (
                  <textarea
                    className="eb-matter-textarea"
                    value={fd.frontMatter[key]?.content || ''}
                    onChange={e => setFrontMatterContent(key, e.target.value)}
                    rows={4}
                    placeholder={`${label} text…`}
                  />
                )}
              </div>
            ))}

            <h2 className="eb-section-title" style={{ marginTop: '32px' }}>Back matter</h2>
            {[
              { key: 'aboutAuthor',      label: 'About the author' },
              { key: 'acknowledgements', label: 'Acknowledgements' },
              { key: 'alsoBy',           label: 'Also by this author' },
              { key: 'bibliography',     label: 'Bibliography' },
              { key: 'glossary',         label: 'Glossary' },
              { key: 'readingGroup',     label: 'Reading group guide' },
            ].map(({ key, label }) => (
              <div key={key} className="eb-matter-item">
                <label className="eb-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(fd.backMatter[key]?.enabled)}
                    onChange={() => toggleBackMatter(key)}
                  />
                  {label}
                </label>
                {fd.backMatter[key]?.enabled && (
                  <textarea
                    className="eb-matter-textarea"
                    value={fd.backMatter[key]?.content || ''}
                    onChange={e => setBackMatterContent(key, e.target.value)}
                    rows={4}
                    placeholder={`${label} text…`}
                  />
                )}
              </div>
            ))}
          </section>

          <div className="eb-bottom-actions">
            {error && <div className="eb-error">{error}</div>}
            <Link to="/dashboard" className="eb-cancel">Cancel</Link>
            <button type="submit" className="btn btn-primary eb-save-btn" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
