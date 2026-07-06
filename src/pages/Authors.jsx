import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';
import authorsHeroImg from '../assets/authors-hero.webp';
import './Authors.css';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PALETTE  = ['#441CB2', '#2E1180', '#6E45D6', '#8266E0', '#5231A8', '#7C5AC5'];

function avatarColor(name) {
  return PALETTE[name.charCodeAt(0) % PALETTE.length];
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Authors() {
  const [authors,  setAuthors]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [letter,   setLetter]   = useState('');
  const alphaRef = useRef(null);

  useEffect(() => {
    supabase
      .from('authors')
      .select('slug, display_name, short_bio, photo_url')
      .order('display_name')
      .then(({ data }) => { setAuthors(data || []); setLoading(false); });
  }, []);

  const visible = authors.filter(a => {
    const matchSearch = !search || a.display_name.toLowerCase().includes(search.toLowerCase());
    const matchLetter = !letter || a.display_name.toUpperCase().startsWith(letter);
    return matchSearch && matchLetter;
  });

  function toggleLetter(l) {
    setLetter(prev => prev === l ? '' : l);
    setSearch('');
  }

  /* scroll active alpha chip into view */
  useEffect(() => {
    if (!alphaRef.current || !letter) return;
    const btn = alphaRef.current.querySelector('.alpha-btn.active');
    if (btn) btn.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }, [letter]);

  return (
    <div className="authors-page">
      <SEO
        title="Author Profiles | IndieConverters"
        description="Meet the independent authors publishing on IndieConverters — bios, backlists, and links to their work."
        path="/authors"
      />

      {/* ── Hero ── */}
      <section className="authors-hero">
        <img src={authorsHeroImg} alt="" className="authors-hero-img" />
        <div className="authors-hero-overlay" />

        <div className="container authors-hero-content">
          <h1 className="authors-heading">
            Meet the writers<br />
            <span className="authors-heading-em">behind the books.</span>
          </h1>
          <p className="authors-sub">
            Independent voices publishing on Indie Converters — debut novelists, genre veterans, and everyone working outside the mainstream.
          </p>
        </div>
      </section>

      {/* ── Toolbar: search + alphabet ── */}
      <div className="authors-toolbar">
        <div className="container authors-toolbar-inner">

          {/* Search */}
          <div className="authors-search-wrap">
            <svg className="authors-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="authors-search"
              type="text"
              placeholder="Search authors…"
              value={search}
              onChange={e => { setSearch(e.target.value); setLetter(''); }}
            />
            {search && (
              <button className="authors-search-clear" onClick={() => setSearch('')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Alphabet strip */}
          <div className="authors-alpha" ref={alphaRef}>
            <button
              className={`alpha-btn ${!letter ? 'active' : ''}`}
              onClick={() => { setLetter(''); setSearch(''); }}
            >All</button>
            {LETTERS.map(l => (
              <button
                key={l}
                className={`alpha-btn ${letter === l ? 'active' : ''}`}
                onClick={() => toggleLetter(l)}
              >{l}</button>
            ))}
          </div>

        </div>
      </div>

      {/* ── Grid ── */}
      <div className="container authors-body">

        {/* Result count */}
        {!loading && (
          <div className="authors-count">
            {visible.length} {visible.length === 1 ? 'author' : 'authors'}
            {(search || letter) && <span> · filtered</span>}
          </div>
        )}

        {loading ? (
          <div className="authors-loading">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="author-card-skeleton" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="authors-empty">
            <span className="authors-empty-icon">✦</span>
            <p>No authors match <strong>"{search || letter}"</strong></p>
            <button className="authors-empty-reset" onClick={() => { setSearch(''); setLetter(''); }}>
              Clear filter
            </button>
          </div>
        ) : (
          <div className="authors-grid">
            {visible.map((a, i) => (
              <Link
                to={`/author/${a.slug}`}
                key={a.slug}
                className="author-card"
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
              >
                <div
                  className="author-card-avatar"
                  style={{ background: a.photo_url ? 'var(--sand)' : avatarColor(a.display_name) }}
                >
                  {a.photo_url
                    ? <img src={a.photo_url} alt={a.display_name} />
                    : <span className="author-card-initials">{initials(a.display_name)}</span>
                  }
                </div>

                <div className="author-card-body">
                  <h3 className="author-card-name">{a.display_name}</h3>
                  {a.short_bio && (
                    <p className="author-card-bio">{a.short_bio}</p>
                  )}
                  <span className="author-card-cta">View profile →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
