import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import BookCover from '../components/BookCover';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './UploadWizard.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { label: 'Book Info',        group: 'Details'   },
  { label: 'Author & Credits', group: 'Details'   },
  { label: 'Description',      group: 'Details'   },
  { label: 'Discovery',        group: 'Details'   },
  { label: 'Publication',      group: 'Details'   },
  { label: 'ISBN',             group: 'Details'   },
  { label: 'Manuscript',       group: 'Files'     },
  { label: 'Preview',          group: 'Files'     },
  { label: 'Cover',            group: 'Publish'   },
  { label: 'Pricing',          group: 'Publish'   },
  { label: 'Front Matter',     group: 'Structure' },
  { label: 'Back Matter',      group: 'Structure' },
  { label: 'Review',           group: 'Publish'   },
];

const FM_ITEMS = [
  { key: 'copyright',
    label: 'Copyright Page',
    tip: 'States your legal ownership of the work. Required for full protection.',
    required: true,
    template: (fd, author, year) =>
      `Copyright © ${year} ${author}\n\nAll rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher, except for brief quotations in critical reviews.\n\nPublished by ${fd.publisher || 'Self-published'}\nFirst published ${year}${fd.isbn ? `\n\nISBN: ${fd.isbn}` : ''}`,
  },
  { key: 'dedication',
    label: 'Dedication',
    tip: 'A short personal note — to a person, a cause, or an idea.',
    required: false,
    template: () => 'For [name],\n\n[optional line or two]',
  },
  { key: 'epigraph',
    label: 'Epigraph',
    tip: 'An opening quotation that sets the tone of the book.',
    required: false,
    template: () => '"[Quote text]"\n— [Author Name], [Work Title]',
  },
  { key: 'preface',
    label: 'Preface / Foreword',
    tip: 'Your story of how and why you wrote this book.',
    required: false,
    template: () => '[Write your preface or foreword here…]',
  },
  { key: 'authorsNote',
    label: "Author's Note",
    tip: 'A brief note about real people, places, or events the book references.',
    required: false,
    template: () => "[Write your author's note here…]",
  },
];

const BM_ITEMS = [
  { key: 'aboutAuthor',
    label: 'About the Author',
    tip: 'A brief bio for new readers discovering you through this book.',
    required: true,
    template: (_, author) =>
      `${author} is a writer based in [location].\n\n[Brief bio paragraph — your background, interests, and what drives your writing.]\n\nConnect: [website or social link]`,
  },
  { key: 'acknowledgements',
    label: 'Acknowledgements',
    tip: 'Thank the people who helped bring this book to life.',
    required: false,
    template: () => 'Writing this book would not have been possible without…\n\n[Continue with your acknowledgements]',
  },
  { key: 'alsoBy',
    label: 'Also by the Author',
    tip: 'A list of your other published books — helps readers discover more.',
    required: false,
    template: () => '[Book Title] (Year)\n[Book Title] (Year)',
  },
  { key: 'bibliography',
    label: 'Bibliography / References',
    tip: 'Source list for non-fiction works citing research.',
    required: false,
    template: () => '[Author Last, First. Title. City: Publisher, Year.]\n[Author Last, First. "Article." Journal Vol. (Year): Pages.]',
  },
  { key: 'glossary',
    label: 'Glossary',
    tip: 'Define specialised terms used in your book.',
    required: false,
    template: () => '[Term]: [Definition]\n[Term]: [Definition]',
  },
  { key: 'readingGroup',
    label: 'Reading Group Questions',
    tip: 'Discussion prompts — great for book clubs and classroom use.',
    required: false,
    template: () => '1. [Question about theme or character]\n2. [Question about the author\'s choices]\n3. [Question about how the book relates to readers\' own lives]',
  },
];

const LANGUAGES        = ['English','Spanish','French','German','Portuguese','Italian','Dutch','Arabic','Japanese','Swahili','Other'];
const CONTRIBUTOR_ROLES = ['Co-author','Editor','Illustrator','Translator','Narrator','Foreword by','Introduction by'];
const AUDIENCES = [
  { value: 'adult',       label: 'Adult',        sub: '18+'   },
  { value: 'young-adult', label: 'Young Adult',  sub: '12–18' },
  { value: 'middle-grade',label: 'Middle Grade', sub: '8–12'  },
  { value: 'children',    label: 'Children',     sub: 'Under 8' },
];
const FORMATS = ['eBook','Paperback','Hardcover','Audiobook'];

const GENRE_KEYWORDS = {
  fiction:          ['coming-of-age', 'family saga', 'identity', 'loss', 'redemption', 'diaspora', 'debut novel', 'contemporary', 'character-driven'],
  nonfiction:       ['essay collection', 'personal narrative', 'social commentary', 'cultural criticism', 'investigative', 'research-based', 'memoir-adjacent'],
  romance:          ['enemies to lovers', 'second chance', 'forced proximity', 'slow burn', 'steamy', 'sweet romance', 'multicultural', 'small town', 'HEA'],
  fantasy:          ['epic fantasy', 'magic system', 'world-building', 'dark fantasy', 'urban fantasy', 'mythic', 'dragons', 'fae', 'portal fantasy', 'quest'],
  mystery:          ['whodunit', 'cozy mystery', 'amateur sleuth', 'police procedural', 'locked room', 'psychological', 'true crime inspired', 'detective'],
  thriller:         ['psychological thriller', 'conspiracy', 'espionage', 'unreliable narrator', 'heist', 'page-turner', 'dark', 'suspense', 'fast-paced'],
  'sci-fi':         ['space opera', 'dystopian', 'near future', 'AI', 'climate fiction', 'cyberpunk', 'first contact', 'hard sci-fi', 'biopunk'],
  'science-fiction':['space opera', 'dystopian', 'near future', 'AI', 'climate fiction', 'cyberpunk', 'first contact', 'hard sci-fi'],
  literary:         ['lyrical prose', 'unreliable narrator', 'experimental', 'stream of consciousness', 'metafiction', 'polyphonic', 'quiet book'],
  historical:       ['Victorian era', 'WWII', 'colonialism', 'women\'s history', 'political intrigue', 'oral history', 'epistolary', 'social history'],
  memoir:           ['grief', 'immigration', 'identity', 'healing', 'trauma', 'queer identity', 'addiction', 'disability', 'motherhood', 'family'],
  biography:        ['political figure', 'cultural icon', 'sports', 'music', 'arts', 'science', 'historical figure', 'women\'s history', 'portrait'],
  'self-help':      ['productivity', 'mindset', 'habits', 'relationships', 'mental health', 'anxiety', 'leadership', 'creativity', 'goal setting', 'wellness'],
  business:         ['entrepreneurship', 'startup', 'leadership', 'marketing', 'finance', 'strategy', 'innovation', 'management', 'case studies'],
  poetry:           ['free verse', 'sonnet', 'lyric poetry', 'confessional', 'spoken word', 'nature', 'love', 'political', 'diaspora', 'identity'],
  horror:           ['supernatural', 'gothic', 'body horror', 'cosmic horror', 'haunted house', 'psychological horror', 'slow burn', 'creature feature'],
  'young-adult':    ['coming-of-age', 'first love', 'identity', 'friendship', 'mental health', 'diverse voices', 'high school', 'dystopian'],
  children:         ['picture book', 'adventure', 'animals', 'friendship', 'diversity', 'imagination', 'humor', 'school life'],
};
const PREVIEW_THEMES = [
  { id: 'light', name: 'Light', bg: '#ffffff',  text: '#1B1330', hdr: '#f6f6f2', border: '#e5e5df' },
  { id: 'sepia', name: 'Sepia', bg: '#f8f1e3',  text: '#3d2b1f', hdr: '#ede3cc', border: '#d8c9a8' },
  { id: 'dark',  name: 'Dark',  bg: '#1e1b2e',  text: '#ddd5f8', hdr: '#2a2640', border: '#3a3555' },
  { id: 'night', name: 'Night', bg: '#0f0f0f',  text: '#9a9a9a', hdr: '#181818', border: '#252525' },
];
const PREVIEW_FONTS = [
  { id: 'fraunces', name: 'Serif',      css: "'Fraunces', Georgia, serif"         },
  { id: 'georgia',  name: 'Classic',    css: "Georgia, 'Times New Roman', serif"  },
  { id: 'inter',    name: 'Modern',     css: "'Inter', system-ui, sans-serif"     },
  { id: 'mono',     name: 'Typewriter', css: "'Courier New', Courier, monospace"  },
];
const PREVIEW_SIZES = [
  { id: 'sm', label: 'Aa', size: '0.88rem', lh: '1.72' },
  { id: 'md', label: 'Aa', size: '1.05rem', lh: '1.88' },
  { id: 'lg', label: 'Aa', size: '1.22rem', lh: '2.05' },
];
const PREVIEW_SPACING = [
  { id: 'compact', label: 'Compact', pad: '28px 44px' },
  { id: 'normal',  label: 'Normal',  pad: '44px 64px' },
  { id: 'relaxed', label: 'Relaxed', pad: '60px 80px' },
];

const BOOK_STYLES = [
  {
    id: 'romance',
    name: 'Romance',
    tagline: 'Warm & intimate',
    icon: '♥',
    cardBg: '#fdf4f0',
    cardBorder: '#e8c4b8',
    cardAccent: '#a84455',
    cardText: '#4a2535',
    cardMuted: '#8a6070',
    sampleFont: "'Fraunces', Georgia, serif",
    theme: 'sepia', font: 'fraunces', size: 'md', spacing: 'normal',
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    tagline: 'Epic & dramatic',
    icon: '✦',
    cardBg: '#12101e',
    cardBorder: '#3d3560',
    cardAccent: '#c9a227',
    cardText: '#e8d5a3',
    cardMuted: '#9080b0',
    sampleFont: "Georgia, 'Times New Roman', serif",
    theme: 'dark', font: 'georgia', size: 'md', spacing: 'relaxed',
  },
  {
    id: 'classic',
    name: 'Classic',
    tagline: 'Clean & timeless',
    icon: '◆',
    cardBg: '#ffffff',
    cardBorder: '#d8d8d4',
    cardAccent: '#1c1c1e',
    cardText: '#1c1c1e',
    cardMuted: '#6b6868',
    sampleFont: "Georgia, 'Times New Roman', serif",
    theme: 'light', font: 'georgia', size: 'sm', spacing: 'compact',
  },
];

const SAMPLE_TEXT = [
  { type: 'chapter', text: 'Chapter One' },
  { type: 'para', text: "The first thing that strikes you about the house on Meridian Street is not its size, though it is substantial, nor its age, though it predates the neighbourhood by nearly forty years. What strikes you is the silence it keeps — a particular kind of silence, the kind that has been learned rather than simply left." },
  { type: 'para', text: "Inside, the rooms carry the particular coolness of places that have always held more than furniture. There is a study where the bookshelves reach the ceiling, where late afternoon light falls in slats through wooden blinds, where the smell of old paper is so familiar it no longer registers as a smell but as something closer to memory." },
  { type: 'para', text: "She had not expected to inherit it. No one in her family had expected her to inherit it. Her aunt had been, by all accounts, a private person — a woman who collected first editions and kept a garden and wrote long letters in neat handwriting to people whose names no one else recognised." },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

function isValidISBN13(isbn) {
  const d = isbn.replace(/[-\s]/g, '');
  if (!/^\d{13}$/.test(d)) return false;
  const sum = d.split('').reduce((acc, c, i) => acc + parseInt(c) * (i % 2 === 0 ? 1 : 3), 0);
  return sum % 10 === 0;
}

// ─── Keyword chip input ───────────────────────────────────────────────────────
function KeywordInput({ keywords, onChange }) {
  const [input, setInput] = useState('');
  function commit() {
    const kw = input.trim().replace(/,+$/, '');
    if (!kw || keywords.length >= 7 || keywords.includes(kw)) { setInput(''); return; }
    onChange([...keywords, kw]);
    setInput('');
  }
  return (
    <div className="kw-wrap">
      <div className="kw-field">
        {keywords.map(kw => (
          <span key={kw} className="kw-chip">
            {kw}
            <button type="button" onClick={() => onChange(keywords.filter(k => k !== kw))}>×</button>
          </span>
        ))}
        {keywords.length < 7 && (
          <input
            className="kw-input"
            type="text"
            value={input}
            placeholder={keywords.length === 0 ? 'Type a keyword, press Enter' : '+ keyword'}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); } }}
            onBlur={commit}
          />
        )}
      </div>
      <span className="kw-count">{keywords.length} / 7</span>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function UploadWizard() {
  const { user } = useAuth();
  const [step,          setStep]          = useState(0);
  const [genres,        setGenres]        = useState([]);
  const [stepError,     setStepError]     = useState('');
  const [uploading,     setUploading]     = useState(false);
  const [publishing,    setPublishing]    = useState(false);
  const [savingDraft,   setSavingDraft]   = useState(false);
  const [draftSaved,    setDraftSaved]    = useState(false);
  const [publishError,  setPublishError]  = useState('');
  const [publishedSlug, setPublishedSlug] = useState('');
  const [savedAsDraft,  setSavedAsDraft]  = useState(false);
  const [draftId,       setDraftId]       = useState(() => localStorage.getItem('ic_draft_id') || null);
  const [msText,        setMsText]        = useState(null);
  const [msPage,        setMsPage]        = useState(0);
  const [msSpread,      setMsSpread]      = useState(false);
  const [msLoading,     setMsLoading]     = useState(false);
  const fileRef  = useRef(null);
  const coverRef = useRef(null);

  const authorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Author';
  const initials   = authorName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const [fd, setFd] = useState({
    title: '', subtitle: '', language: 'English', edition: '', series: '', seriesVolume: '',
    contributors: [],
    description: '', audience: 'adult',
    genre: '', genreSecondary: '', keywords: [], tags: [],
    pubYear: String(new Date().getFullYear()), publisher: 'Self-published', pageCount: '',
    isbnOption: 'skip',  isbn: '',
    manuscriptFile: null, manuscriptPath: '', formats: ['eBook'],
    pTheme: 'light', pFont: 'fraunces', pSize: 'md', pSpacing: 'normal',
    coverFile: null, coverPreview: '', coverColor: 'cover-clay',
    price: '', isFree: false, buyUrl: '', buyPlatform: 'own',
    bookStyle: 'romance',
    frontMatter: {
      copyright:   { enabled: true,  content: '' },
      dedication:  { enabled: false, content: '' },
      epigraph:    { enabled: false, content: '' },
      preface:     { enabled: false, content: '' },
      authorsNote: { enabled: false, content: '' },
    },
    backMatter: {
      aboutAuthor:      { enabled: true,  content: '' },
      acknowledgements: { enabled: false, content: '' },
      alsoBy:           { enabled: false, content: '' },
      bibliography:     { enabled: false, content: '' },
      glossary:         { enabled: false, content: '' },
      readingGroup:     { enabled: false, content: '' },
    },
  });

  function up(key, val) { setFd(p => ({ ...p, [key]: val })); setStepError(''); }

  function upMatter(section, key, field, val) {
    setFd(p => ({
      ...p,
      [section]: { ...p[section], [key]: { ...p[section][key], [field]: val } },
    }));
  }

  function toggleMatter(section, items, key) {
    const current = fd[section][key];
    const newEnabled = !current.enabled;
    let content = current.content;
    if (newEnabled && !content) {
      const item = items.find(i => i.key === key);
      content = item?.template(fd, authorName, fd.pubYear || String(new Date().getFullYear())) || '';
    }
    upMatter(section, key, 'enabled', newEnabled);
    if (newEnabled && !current.content) upMatter(section, key, 'content', content);
  }

  function applyStyle(style) {
    setFd(p => ({
      ...p,
      bookStyle: style.id,
      pTheme: style.theme,
      pFont:  style.font,
      pSize:  style.size,
      pSpacing: style.spacing,
    }));
    setMsPage(0);
    setMsSpread(false);
  }

  // Split manuscript text into pages of ~130 words (fits one screen page)
  const msPages = useMemo(() => {
    if (!msText) return [];
    const paras = msText.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    const pages = [];
    let cur = [], wc = 0;
    for (const p of paras) {
      const w = p.split(/\s+/).length;
      if (wc + w > 130 && cur.length > 0) { pages.push(cur); cur = [p]; wc = w; }
      else { cur.push(p); wc += w; }
    }
    if (cur.length > 0) pages.push(cur);
    return pages;
  }, [msText]);

  useEffect(() => {
    supabase.from('genres').select('slug, label').order('label').then(({ data }) => {
      if (data) setGenres(data);
    });
  }, []);

  // Auto-fill required matter sections when entering those steps
  useEffect(() => {
    if (step === 10 && !fd.frontMatter.copyright.content) {
      const item = FM_ITEMS[0];
      upMatter('frontMatter', 'copyright', 'content',
        item.template(fd, authorName, fd.pubYear || String(new Date().getFullYear())));
    }
    if (step === 11 && !fd.backMatter.aboutAuthor.content) {
      const item = BM_ITEMS[0];
      upMatter('backMatter', 'aboutAuthor', 'content', item.template(fd, authorName));
    }
    // Fetch manuscript for in-browser preview on step 7
    if (step === 7 && fd.manuscriptPath && !msText && !msLoading) {
      const ext = fd.manuscriptPath.split('.').pop().toLowerCase();
      if (['txt', 'rtf'].includes(ext)) {
        setMsLoading(true);
        supabase.storage.from('manuscripts').createSignedUrl(fd.manuscriptPath, 3600)
          .then(({ data }) => {
            if (!data?.signedUrl) { setMsLoading(false); return; }
            return fetch(data.signedUrl);
          })
          .then(r => r?.text())
          .then(text => { if (text) setMsText(text); })
          .catch(() => {})
          .finally(() => setMsLoading(false));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Validation ────────────────────────────────────────────────
  function validate(s) {
    if (s === 0 && !fd.title.trim())    return 'Book title is required.';
    if (s === 2 && !fd.description.trim()) return 'Description is required.';
    if (s === 3 && !fd.genre)           return 'Please select a primary genre.';
    if (s === 4 && !fd.pubYear)         return 'Publication year is required.';
    if (s === 5 && fd.isbnOption === 'own') {
      if (!fd.isbn.trim())              return 'Enter your ISBN-13.';
      if (!isValidISBN13(fd.isbn))      return 'Invalid ISBN-13 — check the number and try again.';
    }
    if (s === 6 && !fd.manuscriptPath)  return 'Upload your manuscript before continuing.';
    return null;
  }

  function goNext() {
    const err = validate(step);
    if (err) { setStepError(err); return; }
    setStepError('');
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  }
  function goTo(s) { if (s <= step) { setStepError(''); setStep(s); window.scrollTo(0, 0); } }
  function goBack() { setStepError(''); setStep(s => s - 1); window.scrollTo(0, 0); }

  // ── File handlers ────────────────────────────────────────────
  async function handleManuscript(file) {
    up('manuscriptFile', file); setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('manuscripts').upload(path, file);
    setUploading(false);
    if (error) { setStepError(error.message); return; }
    up('manuscriptPath', path);
  }

  function handleCover(file) {
    up('coverFile', file);
    up('coverPreview', URL.createObjectURL(file));
  }

  // ── Build matter JSON for DB ─────────────────────────────────
  function buildMatter(items, state) {
    return items
      .filter(i => state[i.key]?.enabled && state[i.key]?.content)
      .map(i => ({ key: i.key, label: i.label, content: state[i.key].content }));
  }

  // ── Save as Draft ────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!fd.title.trim()) { setStepError('Add a book title before saving.'); return; }
    setSavingDraft(true);
    try {
      let coverUrl = null;
      if (fd.coverFile) {
        const cp = `${user.id}/${Date.now()}-${fd.coverFile.name}`;
        const { error: ce } = await supabase.storage.from('covers').upload(cp, fd.coverFile);
        if (!ce) coverUrl = supabase.storage.from('covers').getPublicUrl(cp).data.publicUrl;
      }

      const bookData = {
        title:           fd.title,
        subtitle:        fd.subtitle || null,
        description:     fd.description || null,
        cover_url:       coverUrl,
        formats:         fd.formats,
        keywords:        fd.keywords,
        is_published:    false,
        author_user_id:  user.id,
        manuscript_path: fd.manuscriptPath || null,
        pub_year:        fd.pubYear   ? parseInt(fd.pubYear)   : null,
        page_count:      fd.pageCount ? parseInt(fd.pageCount) : null,
        isbn_13:         fd.isbnOption === 'own' && fd.isbn ? fd.isbn.replace(/[-\s]/g, '') : null,
        language:        fd.language,
        publisher_name:  fd.publisher || null,
        price:           fd.isFree ? 0 : (fd.price ? parseFloat(fd.price) : null),
        front_matter:    buildMatter(FM_ITEMS, fd.frontMatter),
        back_matter:     buildMatter(BM_ITEMS, fd.backMatter),
        draft_step:      step,
      };

      if (draftId) {
        await supabase.from('books').update(bookData).eq('id', draftId).eq('author_user_id', user.id);
      } else {
        const bookSlug = `draft-${slugify(fd.title)}-${Date.now()}`;
        const { data: book, error: be } = await supabase.from('books')
          .insert({ slug: bookSlug, ...bookData })
          .select('id').single();
        if (be) throw new Error(be.message);
        setDraftId(book.id);
        localStorage.setItem('ic_draft_id', book.id);
      }

      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch (err) {
      setStepError(err.message);
    } finally {
      setSavingDraft(false);
    }
  }

  // ── Publish ───────────────────────────────────────────────────
  async function handlePublish(publishNow = true) {
    setPublishError(''); setPublishing(true);
    try {
      let coverUrl = null;
      if (fd.coverFile) {
        const cp = `${user.id}/${Date.now()}-${fd.coverFile.name}`;
        const { error: ce } = await supabase.storage.from('covers').upload(cp, fd.coverFile);
        if (ce) throw new Error(`Cover: ${ce.message}`);
        coverUrl = supabase.storage.from('covers').getPublicUrl(cp).data.publicUrl;
      }

      let { data: author } = await supabase.from('authors').select('id,slug').eq('user_id', user.id).maybeSingle();
      if (!author) {
        const { data: a, error: ae } = await supabase.from('authors')
          .insert({ slug: `${slugify(authorName)}-${Date.now()}`, display_name: authorName, user_id: user.id })
          .select('id,slug').single();
        if (ae) throw new Error(`Author: ${ae.message}`);
        author = a;
      }

      const bookSlug = `${slugify(fd.title)}-${Date.now()}`;
      const { data: book, error: be } = await supabase.from('books').insert({
        slug:            bookSlug,
        title:           fd.title,
        subtitle:        fd.subtitle || null,
        description:     fd.description,
        cover_url:       coverUrl,
        formats:         fd.formats,
        keywords:        fd.keywords,
        is_published:    publishNow,
        author_user_id:  user.id,
        manuscript_path: fd.manuscriptPath,
        pub_year:        fd.pubYear  ? parseInt(fd.pubYear)  : null,
        page_count:      fd.pageCount? parseInt(fd.pageCount): null,
        isbn_13:         fd.isbnOption === 'own' && fd.isbn ? fd.isbn.replace(/[-\s]/g, '') : null,
        language:        fd.language,
        publisher_name:  fd.publisher,
        price:           fd.isFree ? 0 : (fd.price ? parseFloat(fd.price) : null),
        front_matter:    buildMatter(FM_ITEMS, fd.frontMatter),
        back_matter:     buildMatter(BM_ITEMS, fd.backMatter),
      }).select('id').single();
      if (be) throw new Error(`Book: ${be.message}`);

      await supabase.from('books_authors').insert({ book_id: book.id, author_id: author.id, position: 1 });

      const genres2 = [fd.genre, fd.genreSecondary !== fd.genre ? fd.genreSecondary : ''].filter(Boolean);
      for (const gs of genres2) {
        const { data: gr } = await supabase.from('genres').select('id').eq('slug', gs).maybeSingle();
        if (gr) await supabase.from('books_genres').insert({ book_id: book.id, genre_id: gr.id });
      }

      // Write buy link if provided
      if (fd.buyUrl) {
        const { data: retailer } = await supabase
          .from('retailers').select('id').eq('slug', fd.buyPlatform).maybeSingle();
        if (retailer) {
          await supabase.from('book_retailer_links').insert({
            book_id: book.id,
            retailer_id: retailer.id,
            url: fd.buyUrl,
          });
        }
      }

      // Clear draft tracking if we had one
      localStorage.removeItem('ic_draft_id');

      setPublishedSlug(bookSlug);
      setSavedAsDraft(!publishNow);
      setStep(13);
    } catch (err) {
      setPublishError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  // ── Preview theme/font lookups ────────────────────────────────
  const theme   = PREVIEW_THEMES.find(t => t.id === fd.pTheme) || PREVIEW_THEMES[0];
  const fontCss = PREVIEW_FONTS.find(f => f.id === fd.pFont)?.css || PREVIEW_FONTS[0].css;
  const sizeObj = PREVIEW_SIZES.find(s => s.id === fd.pSize) || PREVIEW_SIZES[1];
  const padObj  = PREVIEW_SPACING.find(s => s.id === fd.pSpacing) || PREVIEW_SPACING[1];

  const groups = [...new Set(WIZARD_STEPS.map(s => s.group))];
  const pct    = Math.round((step / (WIZARD_STEPS.length - 1)) * 100);

  // ─────────────────── SUCCESS / DRAFT SCREEN ──────────────────
  if (step === 13) {
    return (
      <div className="wizard wizard--done">
        <div className="wz-done">
          <div className="wz-done-cover">
            {fd.coverPreview
              ? <img src={fd.coverPreview} alt={fd.title} />
              : <BookCover title={fd.title} author={authorName} colorClass={fd.coverColor} size="lg" />}
          </div>
          <div className="wz-done-text">
            {savedAsDraft ? (
              <>
                <span className="wz-done-badge wz-done-badge--draft">·· Saved as Draft</span>
                <h1>{fd.title}</h1>
                {fd.subtitle && <p className="wz-done-sub">{fd.subtitle}</p>}
                <p className="wz-done-desc">Your book is saved as a draft. It won't be visible to readers until you publish it from your dashboard.</p>
                <div className="wz-done-actions">
                  <Link to="/dashboard" className="btn btn-primary">Go to dashboard →</Link>
                </div>
              </>
            ) : (
              <>
                <span className="wz-done-badge">·· Published</span>
                <h1>{fd.title}</h1>
                {fd.subtitle && <p className="wz-done-sub">{fd.subtitle}</p>}
                <p className="wz-done-desc">Your book is live on Indie Converters.</p>
                <div className="wz-done-url">indieconverters.com/book/{publishedSlug}</div>
                <div className="wz-done-actions">
                  <Link to={`/book/${publishedSlug}`} className="btn btn-primary">View listing →</Link>
                  <Link to="/dashboard" className="btn btn-outline">Go to dashboard</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────── WIZARD LAYOUT ──────────────────────────
  return (
    <div className="wizard">

      {/* ── Sidebar ── */}
      <aside className="wz-sidebar">
        <div className="wz-sidebar-head">
          <Link to="/" className="wz-sidebar-logo">
            <span className="wz-dot">··</span> indieconverters
          </Link>
          <div className="wz-prog-bar"><div className="wz-prog-fill" style={{ width: `${pct}%` }} /></div>
          <span className="wz-prog-label">{step + 1} of {WIZARD_STEPS.length}</span>
        </div>

        <nav className="wz-step-nav">
          {groups.map(group => (
            <div key={group} className="wz-group">
              <span className="wz-group-label">{group}</span>
              {WIZARD_STEPS.map((s, i) => s.group !== group ? null : (
                <button
                  key={i}
                  className={`wz-step-item ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}
                  onClick={() => goTo(i)}
                  disabled={i > step}
                >
                  <span className="wz-step-num">
                    {i < step ? <span className="wz-check">✓</span> : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="wz-step-name">{s.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="wz-main">
        <div className="wz-topbar">
          <span className="wz-topbar-label">
            <span className="wz-topbar-num">Step {String(step + 1).padStart(2, '0')}</span>
            {WIZARD_STEPS[step].label}
          </span>
          <div className="wz-topbar-right">
            {step > 0 && fd.title && (
              <button
                type="button"
                className={`wz-save-btn ${draftSaved ? 'saved' : ''}`}
                onClick={handleSaveDraft}
                disabled={savingDraft}
              >
                {draftSaved ? '✓ Saved' : savingDraft ? 'Saving…' : 'Save draft'}
              </button>
            )}
            <span className="wz-topbar-group">{WIZARD_STEPS[step].group}</span>
          </div>
        </div>

        <div className="wz-body">
          {stepError && <div className="wz-error">{stepError}</div>}

          {/* ════════ STEP 0: Book Info ════════ */}
          {step === 0 && (
            <div className="wz-step">
              <h2>Book Info</h2>
              <p className="wz-sub">How your book will appear in the catalogue and on its listing page.</p>
              <div className="wz-fields">
                <div className="wz-field wz-field--lg">
                  <label>Title <span className="req">*</span></label>
                  <input type="text" value={fd.title} onChange={e => up('title', e.target.value)} placeholder="The full title of your book" autoFocus />
                </div>
                <div className="wz-field wz-field--lg">
                  <label>Subtitle <span className="opt">optional</span></label>
                  <input type="text" value={fd.subtitle} onChange={e => up('subtitle', e.target.value)} placeholder="A secondary title or tagline" />
                </div>
                <div className="wz-row">
                  <div className="wz-field">
                    <label>Language <span className="req">*</span></label>
                    <select value={fd.language} onChange={e => up('language', e.target.value)}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="wz-field">
                    <label>Edition <span className="opt">optional</span></label>
                    <input type="text" value={fd.edition} onChange={e => up('edition', e.target.value)} placeholder="e.g. First Edition" />
                  </div>
                </div>
                <div className="wz-row">
                  <div className="wz-field">
                    <label>Series name <span className="opt">optional</span></label>
                    <input type="text" value={fd.series} onChange={e => up('series', e.target.value)} placeholder="e.g. The Marsh Chronicles" />
                  </div>
                  <div className="wz-field">
                    <label>Volume / Part <span className="opt">optional</span></label>
                    <input type="number" min="1" value={fd.seriesVolume} onChange={e => up('seriesVolume', e.target.value)} placeholder="1" disabled={!fd.series} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 1: Author & Credits ════════ */}
          {step === 1 && (
            <div className="wz-step">
              <h2>Author & Credits</h2>
              <p className="wz-sub">Your profile is pre-filled from your account. Add co-authors or contributors below.</p>
              <div className="wz-fields">
                <div className="wz-primary-author">
                  <div className="wz-author-avatar">{initials}</div>
                  <div className="wz-author-info">
                    <span className="wz-author-name">{authorName}</span>
                    <span className="wz-author-role">Primary Author · from your account</span>
                  </div>
                  <span className="wz-author-badge">Author</span>
                </div>

                <div className="wz-field">
                  <label>Contributors <span className="opt">optional — editors, illustrators, translators…</span></label>
                  <div className="wz-contributors">
                    {fd.contributors.map((c, i) => (
                      <div key={i} className="wz-contributor-row">
                        <input
                          type="text"
                          value={c.name}
                          placeholder="Full name"
                          onChange={e => {
                            const u = [...fd.contributors]; u[i] = { ...c, name: e.target.value }; up('contributors', u);
                          }}
                        />
                        <select
                          value={c.role}
                          onChange={e => {
                            const u = [...fd.contributors]; u[i] = { ...c, role: e.target.value }; up('contributors', u);
                          }}
                        >
                          {CONTRIBUTOR_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button type="button" className="wz-rm-btn" onClick={() => up('contributors', fd.contributors.filter((_, j) => j !== i))}>✕</button>
                      </div>
                    ))}
                    <button type="button" className="wz-add-btn" onClick={() => up('contributors', [...fd.contributors, { name: '', role: 'Co-author' }])}>
                      + Add contributor
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 2: Description ════════ */}
          {step === 2 && (
            <div className="wz-step">
              <h2>Description</h2>
              <p className="wz-sub">Your back-cover copy — the first thing a reader sees on your book page. Up to 4,000 characters.</p>
              <div className="wz-fields">
                <div className="wz-field wz-field--lg">
                  <label>
                    Description <span className="req">*</span>
                    <span className="wz-char">{fd.description.length.toLocaleString()} / 4,000</span>
                  </label>
                  <textarea
                    rows={12}
                    value={fd.description}
                    onChange={e => { if (e.target.value.length <= 4000) up('description', e.target.value); }}
                    placeholder="Write your back-cover description here. Use line breaks to separate paragraphs."
                  />
                </div>
                <div className="wz-field">
                  <label>Target audience</label>
                  <div className="wz-audience-grid">
                    {AUDIENCES.map(a => (
                      <button key={a.value} type="button"
                        className={`wz-audience-btn ${fd.audience === a.value ? 'selected' : ''}`}
                        onClick={() => up('audience', a.value)}
                      >
                        <strong>{a.label}</strong><span>{a.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 3: Discovery ════════ */}
          {step === 3 && (
            <div className="wz-step">
              <h2>Discovery</h2>
              <p className="wz-sub">Help readers find your book through genre browsing and keyword search.</p>
              <div className="wz-fields">
                <div className="wz-row">
                  <div className="wz-field">
                    <label>Primary genre <span className="req">*</span></label>
                    <select value={fd.genre} onChange={e => up('genre', e.target.value)}>
                      <option value="">Select a genre</option>
                      {genres.map(g => <option key={g.slug} value={g.slug}>{g.label}</option>)}
                    </select>
                  </div>
                  <div className="wz-field">
                    <label>Secondary genre <span className="opt">optional</span></label>
                    <select value={fd.genreSecondary} onChange={e => up('genreSecondary', e.target.value)}>
                      <option value="">None</option>
                      {genres.filter(g => g.slug !== fd.genre).map(g => <option key={g.slug} value={g.slug}>{g.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="wz-field wz-field--lg">
                  <label>
                    Keywords <span className="opt">up to 7 — press Enter or comma after each one</span>
                  </label>
                  <KeywordInput keywords={fd.keywords} onChange={val => up('keywords', val)} />
                  <p className="wz-hint">Think about what a reader would type to find your book. Avoid repeating your title or genre names.</p>
                  {fd.genre && (() => {
                    const suggestions = (GENRE_KEYWORDS[fd.genre] || []).filter(kw => !fd.keywords.includes(kw));
                    if (!suggestions.length) return null;
                    return (
                      <div className="wz-kw-suggestions">
                        <span className="wz-kw-suggestions-label">
                          Suggested for {genres.find(g => g.slug === fd.genre)?.label || fd.genre}:
                        </span>
                        <div className="wz-kw-pills">
                          {suggestions.map(kw => (
                            <button
                              key={kw}
                              type="button"
                              className="wz-kw-pill"
                              onClick={() => { if (fd.keywords.length < 7) up('keywords', [...fd.keywords, kw]); }}
                              disabled={fd.keywords.length >= 7}
                            >
                              + {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 4: Publication ════════ */}
          {step === 4 && (
            <div className="wz-step">
              <h2>Publication Details</h2>
              <p className="wz-sub">Metadata that appears on your listing and helps with library cataloguing.</p>
              <div className="wz-fields">
                <div className="wz-row">
                  <div className="wz-field">
                    <label>Publication year <span className="req">*</span></label>
                    <input type="number" min="1900" max={new Date().getFullYear() + 2} value={fd.pubYear} onChange={e => up('pubYear', e.target.value)} placeholder={String(new Date().getFullYear())} />
                  </div>
                  <div className="wz-field">
                    <label>Page count <span className="opt">optional</span></label>
                    <input type="number" min="1" value={fd.pageCount} onChange={e => up('pageCount', e.target.value)} placeholder="e.g. 280" />
                  </div>
                </div>
                <div className="wz-field">
                  <label>Publisher name <span className="opt">optional — leave blank for Self-published</span></label>
                  <input type="text" value={fd.publisher} onChange={e => up('publisher', e.target.value)} placeholder="Self-published" />
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 5: ISBN ════════ */}
          {step === 5 && (
            <div className="wz-step">
              <h2>ISBN</h2>
              <p className="wz-sub">An ISBN uniquely identifies your book in libraries and retail systems. It's optional to list here.</p>
              <div className="wz-fields">
                <div className="wz-isbn-options">
                  {[
                    { id: 'own',  title: 'I have my own ISBN-13', sub: 'Enter a 13-digit ISBN you already own or purchased from a registry.' },
                    { id: 'skip', title: 'Skip for now',           sub: 'Your book can still be listed and found without one. You can add it later from your dashboard.' },
                  ].map(opt => (
                    <label key={opt.id} className={`wz-isbn-opt ${fd.isbnOption === opt.id ? 'selected' : ''}`}>
                      <input type="radio" name="isbnopt" value={opt.id} checked={fd.isbnOption === opt.id} onChange={() => up('isbnOption', opt.id)} />
                      <div>
                        <strong>{opt.title}</strong>
                        <span>{opt.sub}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="wz-isbn-resources">
                  <span className="wz-isbn-resources-title">Where to get an ISBN</span>
                  <div className="wz-isbn-resource-grid">
                    <div className="wz-isbn-resource">
                      <strong>Bowker (USA)</strong>
                      <span>Official US ISBN agency. Single ISBNs from $125.</span>
                    </div>
                    <div className="wz-isbn-resource">
                      <strong>Nielsen (UK)</strong>
                      <span>UK national ISBN agency. Prices vary by package.</span>
                    </div>
                    <div className="wz-isbn-resource">
                      <strong>ISBN Canada</strong>
                      <span>Free for Canadian publishers. Apply through Library and Archives Canada.</span>
                    </div>
                    <div className="wz-isbn-resource">
                      <strong>IngramSpark / KDP</strong>
                      <span>Both offer a free ISBN when you publish through their platforms (platform-owned).</span>
                    </div>
                  </div>
                  <p className="wz-isbn-resources-note">
                    A platform-assigned ISBN (KDP, IngramSpark) ties you to that platform. Owning your own ISBN gives you full control.
                  </p>
                </div>

                {fd.isbnOption === 'own' && (
                  <div className="wz-field" style={{ marginTop: 20 }}>
                    <label>ISBN-13 <span className="req">*</span></label>
                    <input type="text" value={fd.isbn} onChange={e => up('isbn', e.target.value)} placeholder="978-0-000-00000-0" maxLength={17} />
                    {fd.isbn && (
                      <span className={`wz-isbn-status ${isValidISBN13(fd.isbn) ? 'ok' : 'err'}`}>
                        {isValidISBN13(fd.isbn) ? '✓ Valid ISBN-13' : '✗ Doesn\'t look right — double-check the number'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ STEP 6: Manuscript ════════ */}
          {step === 6 && (
            <div className="wz-step">
              <h2>Manuscript</h2>
              <p className="wz-sub">Upload your manuscript file. We accept .docx, .odt, .rtf, and .txt — max 50 MB.</p>
              <div className="wz-fields">
                {!fd.manuscriptFile && !uploading && (
                  <div className="wz-dropzone" onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleManuscript(f); }}>
                    <input ref={fileRef} type="file" accept=".docx,.odt,.rtf,.txt" style={{ display: 'none' }}
                      onChange={e => { if (e.target.files[0]) handleManuscript(e.target.files[0]); }} />
                    <div className="wz-dropzone-icon">··</div>
                    <p className="wz-dropzone-label">Drag your manuscript here</p>
                    <p className="wz-dropzone-sub">.docx · .odt · .rtf · .txt · max 50 MB</p>
                  </div>
                )}

                {uploading && (
                  <div className="wz-uploading">
                    <div className="wz-spinner" />
                    <span>Uploading to secure storage…</span>
                  </div>
                )}

                {fd.manuscriptPath && !uploading && (
                  <div className="wz-file-chip">
                    <span className="wz-file-ok">✓</span>
                    <span className="wz-file-name">{fd.manuscriptFile?.name}</span>
                    <span className="wz-file-size">{fd.manuscriptFile ? `${(fd.manuscriptFile.size / 1024).toFixed(0)} KB` : ''}</span>
                    <button type="button" className="wz-rm-btn" onClick={() => { up('manuscriptFile', null); up('manuscriptPath', ''); }}>Replace</button>
                  </div>
                )}

                <div className="wz-field" style={{ marginTop: 28 }}>
                  <label>Available in these formats</label>
                  <div className="wz-formats">
                    {FORMATS.map(f => (
                      <label key={f} className={`wz-format-tag ${fd.formats.includes(f) ? 'on' : ''}`}>
                        <input type="checkbox" checked={fd.formats.includes(f)}
                          onChange={e => up('formats', e.target.checked ? [...fd.formats, f] : fd.formats.filter(x => x !== f))} />
                        {f}
                      </label>
                    ))}
                  </div>
                </div>

                {fd.formats.includes('Audiobook') && (
                  <div className="wz-format-card wz-format-card--audio">
                    <div className="wz-format-card-icon">🎧</div>
                    <div>
                      <strong>Audiobook selected</strong>
                      <p>We don't host audio files. Instead, distribute your audiobook through <b>ACX / Audible</b>, <b>Libro.fm</b>, or your own site — then add that buy link in the Pricing step. Readers will be sent directly to where they can listen.</p>
                      <p>You don't need to upload an audio file here.</p>
                    </div>
                  </div>
                )}

                {(fd.formats.includes('Paperback') || fd.formats.includes('Hardcover')) && (
                  <div className="wz-format-card wz-format-card--print">
                    <div className="wz-format-card-icon">📖</div>
                    <div>
                      <strong>Print edition selected</strong>
                      <div className="wz-trim-sizes">
                        <span className="wz-trim-label">Common trim sizes:</span>
                        <div className="wz-trim-grid">
                          {[
                            { size: '5 × 8"',     use: 'Most common for fiction' },
                            { size: '5.5 × 8.5"', use: 'Literary fiction, poetry' },
                            { size: '6 × 9"',     use: 'Nonfiction, business, memoir' },
                            { size: '7 × 10"',    use: 'Technical, workbooks' },
                            { size: '8.5 × 11"',  use: 'Manuals, journals, activity books' },
                          ].map(t => (
                            <div key={t.size} className="wz-trim-row">
                              <span className="wz-trim-size">{t.size}</span>
                              <span className="wz-trim-use">{t.use}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p style={{ marginTop: 12 }}>
                        <b>Cover:</b> The next step collects your <em>front cover only</em>. For a print-ready full cover (front + spine + back), use
                        {' '}<b>KDP Cover Creator</b>, <b>Canva</b>, or <b>IngramSpark's</b> cover template generator.
                        Spine width depends on page count and paper type — your printer's calculator will give you the exact measurement.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ STEP 7: Reading Style ════════ */}
          {step === 7 && (() => {
            const currentPage = msPages[msPage] || null;
            const showMs = !!currentPage;
            const isLastPage = msPage >= msPages.length - 1;
            return (
              <div className="wz-step wz-step--preview">
                <h2>Reading Style</h2>
                <p className="wz-sub">Choose the style that best matches your book's tone. Your readers can customise it — this sets the default.</p>

                {/* ── Style cards ── */}
                <div className="wz-style-grid">
                  {BOOK_STYLES.map(style => (
                    <button
                      key={style.id}
                      type="button"
                      className={`wz-style-card ${fd.bookStyle === style.id ? 'selected' : ''}`}
                      style={{
                        background: style.cardBg,
                        borderColor: fd.bookStyle === style.id ? style.cardAccent : style.cardBorder,
                        boxShadow: fd.bookStyle === style.id ? `0 0 0 2px ${style.cardAccent}` : 'none',
                      }}
                      onClick={() => applyStyle(style)}
                    >
                      <span className="wz-style-icon" style={{ color: style.cardAccent }}>{style.icon}</span>
                      <span className="wz-style-name" style={{ color: style.cardText, fontFamily: style.sampleFont }}>{style.name}</span>
                      <span className="wz-style-tagline" style={{ color: style.cardMuted }}>{style.tagline}</span>
                      <p className="wz-style-sample" style={{ fontFamily: style.sampleFont, color: style.cardText }}>
                        "The light fell in slats through wooden blinds, where the smell of old paper had long since become something closer to memory."
                      </p>
                    </button>
                  ))}
                </div>

                {/* ── Fine-tune (collapsible) ── */}
                <details className="wz-finetune">
                  <summary className="wz-finetune-summary">Fine-tune</summary>
                  <div className="wz-preview-bar">
                    <div className="wz-ctrl-group">
                      <span className="wz-ctrl-label">Theme</span>
                      <div className="wz-ctrl-row">
                        {PREVIEW_THEMES.map(t => (
                          <button key={t.id} type="button"
                            className={`wz-theme-pill ${fd.pTheme === t.id ? 'active' : ''}`}
                            style={{ background: t.bg, color: t.text, outlineColor: fd.pTheme === t.id ? t.text : 'transparent' }}
                            onClick={() => up('pTheme', t.id)}
                          >{t.name}</button>
                        ))}
                      </div>
                    </div>
                    <div className="wz-ctrl-group">
                      <span className="wz-ctrl-label">Typeface</span>
                      <div className="wz-ctrl-row">
                        {PREVIEW_FONTS.map(f => (
                          <button key={f.id} type="button"
                            className={`wz-font-pill ${fd.pFont === f.id ? 'active' : ''}`}
                            style={{ fontFamily: f.css }}
                            onClick={() => up('pFont', f.id)}
                          >{f.name}</button>
                        ))}
                      </div>
                    </div>
                    <div className="wz-ctrl-group">
                      <span className="wz-ctrl-label">Size</span>
                      <div className="wz-ctrl-row">
                        {PREVIEW_SIZES.map((s, i) => (
                          <button key={s.id} type="button"
                            className={`wz-size-pill ${fd.pSize === s.id ? 'active' : ''}`}
                            style={{ fontSize: `${0.78 + i * 0.15}rem` }}
                            onClick={() => up('pSize', s.id)}
                          >Aa</button>
                        ))}
                      </div>
                    </div>
                    <div className="wz-ctrl-group">
                      <span className="wz-ctrl-label">Spacing</span>
                      <div className="wz-ctrl-row">
                        {PREVIEW_SPACING.map(s => (
                          <button key={s.id} type="button"
                            className={`wz-spacing-pill ${fd.pSpacing === s.id ? 'active' : ''}`}
                            onClick={() => up('pSpacing', s.id)}
                          >{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>

                {/* ── Book page reader ── */}
                <div className="wz-book-reader">
                  <button
                    className="wz-book-arrow"
                    onClick={() => setMsPage(p => Math.max(0, p - 1))}
                    disabled={msPage === 0}
                    aria-label="Previous page"
                  >‹</button>

                  <div
                    className="wz-book-page"
                    style={{ background: theme.bg, borderColor: theme.border }}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
                        e.preventDefault();
                        if (!isLastPage) setMsPage(p => p + 1);
                      }
                      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
                        e.preventDefault();
                        if (msPage > 0) setMsPage(p => p - 1);
                      }
                    }}
                  >
                    <div className="wz-book-page-hdr" style={{ borderColor: `${theme.text}15` }}>
                      <span className="wz-book-running" style={{ fontFamily: fontCss, color: theme.text }}>
                        {msPage % 2 === 0 ? (fd.title || 'Your Book Title') : ''}
                      </span>
                      <span className="wz-book-running" style={{ fontFamily: fontCss, color: theme.text, textAlign: 'right' }}>
                        {msPage % 2 !== 0 ? authorName : ''}
                      </span>
                    </div>

                    <div
                      className="wz-book-page-body"
                      style={{
                        fontFamily: fontCss,
                        fontSize: sizeObj.size,
                        lineHeight: sizeObj.lh,
                        color: theme.text,
                      }}
                    >
                      {msLoading ? (
                        <div className="wz-reader-loading" style={{ color: theme.text }}>
                          <div className="wz-spinner" style={{ borderColor: `${theme.text}22`, borderTopColor: theme.text }} />
                          Loading your manuscript…
                        </div>
                      ) : showMs ? (
                        currentPage.map((para, i) => (
                          <p key={i} className="wz-reader-para">{para}</p>
                        ))
                      ) : (
                        SAMPLE_TEXT.map((block, i) =>
                          block.type === 'chapter'
                            ? <div key={i} className="wz-reader-chapter" style={{ fontFamily: fontCss, color: theme.text }}>{block.text}</div>
                            : <p key={i} className="wz-reader-para">{block.text}</p>
                        )
                      )}
                    </div>

                    <div className="wz-book-page-ftr" style={{ borderColor: `${theme.text}15`, color: theme.text }}>
                      {showMs && (
                        <span style={{ opacity: 0.3, fontSize: '0.72rem', fontFamily: fontCss }}>{msPage + 1}</span>
                      )}
                      {!showMs && !msLoading && (
                        <span style={{ opacity: 0.28, fontSize: '0.65rem' }}>
                          {fd.manuscriptPath ? '.txt files only · sample text shown' : 'Sample text · upload a .txt manuscript to preview'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className="wz-book-arrow"
                    onClick={() => setMsPage(p => Math.min(msPages.length - 1, p + 1))}
                    disabled={isLastPage || !showMs}
                    aria-label="Next page"
                  >›</button>
                </div>
              </div>
            );
          })()}

          {/* ════════ STEP 8: Cover ════════ */}
          {step === 8 && (
            <div className="wz-step">
              <h2>Cover</h2>
              <p className="wz-sub">Upload a cover image or choose a colour palette. A real cover image is strongly recommended.</p>
              <div className="wz-cover-layout">
                <div className="wz-cover-left">
                  {!fd.coverPreview
                    ? (
                      <div className="wz-dropzone" onClick={() => coverRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCover(f); }}>
                        <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                          onChange={e => { if (e.target.files[0]) handleCover(e.target.files[0]); }} />
                        <div className="wz-dropzone-icon">+</div>
                        <p className="wz-dropzone-label">Upload cover image</p>
                        <p className="wz-dropzone-sub">JPG, PNG or WebP · max 5 MB</p>
                        <p className="wz-dropzone-hint">Recommended: 1,600 × 2,560 px (portrait 5:8)</p>
                      </div>
                    ) : (
                      <div className="wz-cover-uploaded">
                        <img src={fd.coverPreview} alt="Cover" />
                        <div>
                          <span className="wz-file-name">{fd.coverFile?.name}</span>
                          <button type="button" className="wz-text-link" onClick={() => { up('coverFile', null); up('coverPreview', ''); }}>Remove and choose again</button>
                        </div>
                      </div>
                    )
                  }

                  {!fd.coverPreview && (
                    <div className="wz-field" style={{ marginTop: 24 }}>
                      <label>Fallback colour palette <span className="opt">used if no image provided</span></label>
                      <div className="wz-swatches">
                        {[
                          { cls: 'cover-clay', bg: 'var(--clay)' }, { cls: 'cover-clay-dark', bg: 'var(--clay-dark)' },
                          { cls: 'cover-ochre', bg: 'var(--ochre)' }, { cls: 'cover-ink', bg: 'var(--ink)' },
                          { cls: 'cover-sand', bg: 'var(--sand)', border: true },
                        ].map(c => (
                          <button key={c.cls} type="button"
                            className={`wz-swatch ${fd.coverColor === c.cls ? 'selected' : ''}`}
                            style={{ background: c.bg }}
                            onClick={() => up('coverColor', c.cls)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="wz-cover-right">
                  <span className="wz-preview-label">Preview</span>
                  {fd.coverPreview
                    ? <img src={fd.coverPreview} alt="Cover" className="wz-cover-preview-img" />
                    : <BookCover title={fd.title || 'Your Book Title'} author={authorName} colorClass={fd.coverColor} size="lg" />
                  }
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 9: Pricing ════════ */}
          {step === 9 && (
            <div className="wz-step">
              <h2>Pricing & Links</h2>
              <p className="wz-sub">We don't sell books directly — we send readers to wherever you sell. Set your price and add your buy link.</p>
              <div className="wz-fields">
                <label className={`wz-toggle-card ${fd.isFree ? 'on' : ''}`}>
                  <div>
                    <strong>This book is free</strong>
                    <span>Readers can download or access it without paying.</span>
                  </div>
                  <div className={`wz-toggle ${fd.isFree ? 'on' : ''}`} onClick={() => up('isFree', !fd.isFree)} role="switch" />
                </label>

                {!fd.isFree && (
                  <div className="wz-field">
                    <label>List price (USD) <span className="opt">optional</span></label>
                    <div className="wz-price-row">
                      <span className="wz-price-sym">$</span>
                      <input type="number" min="0" step="0.01" value={fd.price} onChange={e => up('price', e.target.value)} placeholder="9.99" />
                    </div>
                  </div>
                )}

                <div className="wz-row">
                  <div className="wz-field">
                    <label>Where do you sell it? <span className="opt">optional</span></label>
                    <select value={fd.buyPlatform} onChange={e => up('buyPlatform', e.target.value)}>
                      <option value="own">My own website</option>
                      <option value="gumroad">Gumroad</option>
                      <option value="payhip">Payhip</option>
                      <option value="amazon">Amazon KDP</option>
                      <option value="bookshop">Bookshop.org</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="wz-field">
                    <label>Buy link URL <span className="opt">optional</span></label>
                    <input type="url" value={fd.buyUrl} onChange={e => up('buyUrl', e.target.value)} placeholder="https://…" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 10: Front Matter ════════ */}
          {step === 10 && (
            <div className="wz-step">
              <h2>Front Matter</h2>
              <p className="wz-sub">Pages that appear before Chapter 1. Toggle each section on to customise it — templates are pre-filled for you.</p>
              <div className="wz-matter-list">
                {FM_ITEMS.map(item => {
                  const data = fd.frontMatter[item.key];
                  return (
                    <div key={item.key} className={`wz-matter-section ${data.enabled ? 'expanded' : ''}`}>
                      <div className="wz-matter-header">
                        <div className="wz-matter-title-wrap">
                          <span className="wz-matter-label">{item.label}</span>
                          {item.required && <span className="wz-matter-rec">Recommended</span>}
                          <span className="wz-matter-tip">{item.tip}</span>
                        </div>
                        <div
                          className={`wz-toggle ${data.enabled ? 'on' : ''}`}
                          role="switch"
                          aria-checked={data.enabled}
                          onClick={() => toggleMatter('frontMatter', FM_ITEMS, item.key)}
                        />
                      </div>
                      {data.enabled && (
                        <div className="wz-matter-body">
                          <textarea
                            rows={8}
                            value={data.content}
                            onChange={e => upMatter('frontMatter', item.key, 'content', e.target.value)}
                            placeholder="Write or edit this section…"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════ STEP 11: Back Matter ════════ */}
          {step === 11 && (
            <div className="wz-step">
              <h2>Back Matter</h2>
              <p className="wz-sub">Pages that appear after the main content. These help readers connect with you and discover more of your work.</p>
              <div className="wz-matter-list">
                {BM_ITEMS.map(item => {
                  const data = fd.backMatter[item.key];
                  return (
                    <div key={item.key} className={`wz-matter-section ${data.enabled ? 'expanded' : ''}`}>
                      <div className="wz-matter-header">
                        <div className="wz-matter-title-wrap">
                          <span className="wz-matter-label">{item.label}</span>
                          {item.required && <span className="wz-matter-rec">Recommended</span>}
                          <span className="wz-matter-tip">{item.tip}</span>
                        </div>
                        <div
                          className={`wz-toggle ${data.enabled ? 'on' : ''}`}
                          role="switch"
                          aria-checked={data.enabled}
                          onClick={() => toggleMatter('backMatter', BM_ITEMS, item.key)}
                        />
                      </div>
                      {data.enabled && (
                        <div className="wz-matter-body">
                          <textarea
                            rows={8}
                            value={data.content}
                            onChange={e => upMatter('backMatter', item.key, 'content', e.target.value)}
                            placeholder="Write or edit this section…"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 12 && (
            <div className="wz-step">
              <h2>Review & Publish</h2>
              <p className="wz-sub">Check everything before going live. Click Edit to make changes.</p>

              {publishError && <div className="wz-error">{publishError}</div>}

              <div className="wz-review">
                {[
                  { title: 'Book Info', to: 0, rows: [
                    ['Title',    fd.title || '—'],
                    ['Subtitle', fd.subtitle || '—'],
                    ['Language', fd.language],
                    ['Edition',  fd.edition || '—'],
                    ['Series',   fd.series ? `${fd.series}${fd.seriesVolume ? ` Vol. ${fd.seriesVolume}` : ''}` : '—'],
                  ]},
                  { title: 'Author & Credits', to: 1, rows: [
                    ['Author', authorName],
                    ['Contributors', fd.contributors.length ? fd.contributors.map(c => `${c.name} (${c.role})`).join(', ') : '—'],
                  ]},
                  { title: 'Description', to: 2, rows: [
                    ['Audience', AUDIENCES.find(a => a.value === fd.audience)?.label || '—'],
                    ['Description', fd.description ? fd.description.slice(0, 100) + (fd.description.length > 100 ? '…' : '') : '—'],
                  ]},
                  { title: 'Discovery', to: 3, rows: [
                    ['Primary genre',   genres.find(g => g.slug === fd.genre)?.label || '—'],
                    ['Secondary genre', genres.find(g => g.slug === fd.genreSecondary)?.label || '—'],
                    ['Keywords',        fd.keywords.length ? fd.keywords.join(', ') : '—'],
                  ]},
                  { title: 'Publication', to: 4, rows: [
                    ['Year',      fd.pubYear || '—'],
                    ['Publisher', fd.publisher || '—'],
                    ['Pages',     fd.pageCount || '—'],
                  ]},
                  { title: 'ISBN', to: 5, rows: [
                    ['ISBN-13', fd.isbnOption === 'own' ? fd.isbn : fd.isbnOption === 'request' ? 'Requested — pending' : 'Not provided'],
                  ]},
                  { title: 'Manuscript', to: 6, rows: [
                    ['File',    fd.manuscriptFile?.name || '—'],
                    ['Formats', fd.formats.join(', ') || '—'],
                  ]},
                  { title: 'Front Matter', to: 10, rows: [
                    ['Sections', FM_ITEMS.filter(i => fd.frontMatter[i.key]?.enabled).map(i => i.label).join(', ') || 'None selected'],
                  ]},
                  { title: 'Back Matter', to: 11, rows: [
                    ['Sections', BM_ITEMS.filter(i => fd.backMatter[i.key]?.enabled).map(i => i.label).join(', ') || 'None selected'],
                  ]},
                  { title: 'Cover', to: 8, rows: [
                    ['Image', fd.coverFile?.name || 'None — colour palette used'],
                  ]},
                  { title: 'Pricing', to: 9, rows: [
                    ['Price',    fd.isFree ? 'Free' : (fd.price ? `$${fd.price}` : '—')],
                    ['Buy link', fd.buyUrl || '—'],
                    ['Platform', fd.buyPlatform !== 'own' ? fd.buyPlatform : 'Own website'],
                  ]},
                ].map(s => (
                  <div key={s.title} className="wz-review-block">
                    <div className="wz-review-block-head">
                      <h3>{s.title}</h3>
                      <button type="button" className="wz-edit-link" onClick={() => goTo(s.to)}>Edit</button>
                    </div>
                    <dl className="wz-review-dl">
                      {s.rows.map(([k, v]) => (
                        <div key={k} className="wz-review-row">
                          <dt>{k}</dt><dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>

              <div className="wz-publish-cta">
                <div className="wz-publish-choice">
                  <button
                    type="button"
                    className="btn btn-outline wz-draft-btn"
                    onClick={() => handlePublish(false)}
                    disabled={publishing}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary wz-publish-btn"
                    onClick={() => handlePublish(true)}
                    disabled={publishing}
                  >
                    {publishing ? 'Publishing…' : 'Publish Now →'}
                  </button>
                </div>
                <p className="wz-publish-note">
                  <strong>Publish Now</strong> makes your book immediately visible to readers.{' '}
                  <strong>Save as Draft</strong> keeps it private — you can publish from your dashboard anytime.
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="wz-nav">
            {step > 0 && <button type="button" className="btn btn-outline" onClick={goBack}>← Back</button>}
            {step < 12 && <button type="button" className="btn btn-primary" onClick={goNext}>Continue →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
