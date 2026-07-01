import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import mammoth from 'mammoth/mammoth.browser';
import BookCover from '../components/BookCover';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import './UploadWizard.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { label: 'Your Book',       group: 'Details'   },
  { label: 'About',           group: 'Details'   },
  { label: 'Publication',     group: 'Details'   },
  { label: 'Manuscript',      group: 'Files'     },
  { label: 'Reading Style',   group: 'Files'     },
  { label: 'Cover & Pricing', group: 'Publish'   },
  { label: 'Distribution',    group: 'Publish'   },
  { label: 'Book Structure',  group: 'Structure' },
  { label: 'Review',          group: 'Publish'   },
];

const FM_ITEMS = [
  { key: 'copyright',
    label: 'Copyright Page',
    tip: 'States your legal ownership of the work. Required for full protection.',
    required: true,
    template: (fd, author, year) =>
      `Copyright © ${year} ${author}\n\nAll rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher, except for brief quotations in critical reviews.\n\nPublished by ${fd.publisher || 'Self-published'}\nFirst published ${year}${fd.isbn ? `\n\nISBN: ${fd.isbn}` : ''}`,
  },
  { key: 'toc',
    label: 'Table of Contents',
    tip: 'Auto-generated from your manuscript chapter headings. Editable before publishing — rename entries or exclude sub-sections.',
    required: false,
    isToc: true,
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
    id: 'romance', name: 'Romance', tagline: 'Warm & intimate', icon: '♥',
    cardBg: '#fdf4f0', cardBorder: '#e8c4b8', cardAccent: '#a84455', cardText: '#4a2535', cardMuted: '#8a6070',
    sampleFont: "'Fraunces', Georgia, serif",
    theme: 'sepia', font: 'fraunces', size: 'md', spacing: 'normal',
  },
  {
    id: 'fantasy', name: 'Fantasy', tagline: 'Epic & dramatic', icon: '✦',
    cardBg: '#12101e', cardBorder: '#3d3560', cardAccent: '#c9a227', cardText: '#e8d5a3', cardMuted: '#9080b0',
    sampleFont: "Georgia, 'Times New Roman', serif",
    theme: 'dark', font: 'georgia', size: 'md', spacing: 'relaxed',
  },
  {
    id: 'classic', name: 'Classic', tagline: 'Clean & timeless', icon: '◆',
    cardBg: '#ffffff', cardBorder: '#d8d8d4', cardAccent: '#1c1c1e', cardText: '#1c1c1e', cardMuted: '#6b6868',
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

const DISTRIBUTION_CHANNELS = [
  {
    group: 'Major Retailers',
    channels: [
      { id: 'amazon',      label: 'Amazon Kindle',       note: 'Largest eBook market — incompatible with Kindle Unlimited (KDP Select) if distributing wide' },
      { id: 'apple',       label: 'Apple Books',         note: 'Available in 50+ countries, strong in English-speaking markets' },
      { id: 'bn',          label: 'Barnes & Noble NOOK', note: 'Largest US digital bookstore after Amazon' },
      { id: 'kobo',        label: 'Kobo',                note: 'Dominant in Canada, UK, Australia and Europe' },
      { id: 'google-play', label: 'Google Play Books',   note: 'Android ecosystem, 2+ billion users globally' },
      { id: 'scribd',      label: 'Scribd',              note: 'Subscription reading platform, 1M+ subscribers' },
    ],
  },
  {
    group: 'Libraries & Institutions',
    channels: [
      { id: 'overdrive',    label: 'OverDrive / Libby',  note: 'Powers 90% of library digital collections worldwide' },
      { id: 'hoopla',       label: 'Hoopla',             note: 'No waitlists — instant lending from public libraries' },
      { id: 'baker-taylor', label: 'Baker & Taylor',     note: 'Axis360 — major US library distribution network' },
    ],
  },
  {
    group: 'International',
    channels: [
      { id: 'tolino', label: 'Tolino', note: 'Leading eBook platform in Germany, Austria and Switzerland' },
      { id: 'vivlio', label: 'Vivlio', note: 'Leading eBook platform in France and Belgium' },
    ],
  },
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

function formatTimeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  return `${Math.round(hrs / 24)} day${Math.round(hrs / 24) > 1 ? 's' : ''} ago`;
}

function buildTocEntries(headings, fmPageOffset = 2) {
  let cumulativeWords = 0;
  return headings
    .filter(h => h.level <= 2)
    .map((h, i) => {
      const pg = Math.max(1, Math.round(cumulativeWords / 250)) + fmPageOffset + 1;
      cumulativeWords += (h.words || 0);
      return { id: `toc-${i}`, level: h.level, label: h.text, estimatedPage: pg, include: true };
    });
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
  const [step,         setStep]         = useState(0);
  const [genres,       setGenres]       = useState([]);
  const [stepError,    setStepError]    = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [publishing,   setPublishing]   = useState(false);
  const [savingDraft,  setSavingDraft]  = useState(false);
  const [draftSaved,   setDraftSaved]   = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishedSlug,setPublishedSlug]= useState('');
  const [savedAsDraft, setSavedAsDraft] = useState(false);
  const [draftId,      setDraftId]      = useState(() => localStorage.getItem('ic_draft_id') || null);
  const [msText,       setMsText]       = useState(null);
  const [msHtml,       setMsHtml]       = useState(null);
  const [msStructure,  setMsStructure]  = useState(null);
  const [msPage,       setMsPage]       = useState(0);
  const [msSpread,     setMsSpread]     = useState(false);
  const [msLoading,    setMsLoading]    = useState(false);
  const fileRef  = useRef(null);
  const coverRef = useRef(null);

  // Restore saved progress from localStorage on first load
  const [savedProgress, setSavedProgress] = useState(() => {
    try {
      const raw = localStorage.getItem('ic_wizard_progress');
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (Date.now() - p.savedAt > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('ic_wizard_progress');
        return null;
      }
      return p;
    } catch { return null; }
  });

  const authorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Author';
  const initials   = authorName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const [fd, setFd] = useState({
    title: '', subtitle: '', language: 'English', edition: '', series: '', seriesVolume: '',
    contributors: [],
    description: '', audience: 'adult',
    genre: '', genreSecondary: '', keywords: [], tags: [],
    pubYear: String(new Date().getFullYear()), publisher: 'Self-published', pageCount: '',
    isbnOption: 'skip', isbn: '',
    manuscriptFile: null, manuscriptPath: '', formats: ['eBook'],
    pTheme: 'light', pFont: 'fraunces', pSize: 'md', pSpacing: 'normal',
    coverFile: null, coverPreview: '', coverColor: 'cover-clay',
    price: '', isFree: false, buyUrl: '', buyPlatform: 'own',
    bookStyle: 'romance',
    distributionChannels: ['amazon', 'apple', 'bn', 'kobo', 'google-play', 'scribd'],
    frontMatter: {
      copyright:   { enabled: true,  content: '' },
      toc:         { enabled: false, entries: [] },
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

  // ── Layout analysis ───────────────────────────────────────────
  function validateManuscript({ headings, wordCount, paragraphCount, maxBlankRun, fileSize }) {
    const issues = [];
    const est = Math.max(1, Math.round(wordCount / 250));

    if (fileSize > 50 * 1024 * 1024) {
      issues.push({ type: 'file-too-large', severity: 'error',
        message: `File is ${(fileSize / 1024 / 1024).toFixed(0)} MB — publishers cap manuscripts at 50 MB. Remove embedded images or reduce their resolution in Word before re-uploading.` });
    }
    if (wordCount > 0 && wordCount < 300) {
      issues.push({ type: 'critically-short', severity: 'error',
        message: `Only ${wordCount.toLocaleString()} words detected — far too short for any publishing platform. Verify you uploaded the correct file. Most platforms require a minimum of 2,500 words.` });
    } else if (wordCount >= 300 && wordCount < 1000) {
      issues.push({ type: 'very-short', severity: 'warning',
        message: `${wordCount.toLocaleString()} words (~${est} pages). Amazon KDP has removed titles under 2,500 words. This may be fine for poetry or micro-essays, but expect restrictions on most retailers.` });
    } else if (wordCount >= 1000 && wordCount < 2500) {
      issues.push({ type: 'short-content', severity: 'info',
        message: `${wordCount.toLocaleString()} words (~${est} pages). Under 2,500 words is "short content" on KDP and Draft2Digital — valid for novellas and short stories, but distribution to some retailers may be limited.` });
    }
    if (wordCount > 200000) {
      issues.push({ type: 'very-long', severity: 'info',
        message: `${wordCount.toLocaleString()} words (~${est} pages). KDP's print limit is 828 pages for a 5×8" book. Consider splitting into volumes if your page count approaches that limit.` });
    }
    if (headings.length === 0) {
      issues.push({ type: 'no-headings', severity: 'error',
        message: 'No chapter headings found — your EPUB will have no Table of Contents, which fails EPUBCheck and is rejected by KDP, Draft2Digital, Apple Books, and Kobo. Fix: In Word → select each chapter title → Home → Styles → "Heading 1". In Google Docs → Format → Paragraph styles → "Heading 1".' });
    } else if (headings.length === 1) {
      issues.push({ type: 'single-heading', severity: 'warning',
        message: 'Only one heading found — readers cannot jump between chapters and your TOC will have a single entry. Apply "Heading 1" to each chapter title in your word processor.' });
    }
    if (headings.length > 0 && headings[0].level > 1) {
      issues.push({ type: 'wrong-heading-start', severity: 'warning',
        message: `Document starts with a Heading ${headings[0].level} — most EPUB converters expect the top level to be Heading 1. Change your chapter title style to "Heading 1" in Word or Google Docs.` });
    }
    if (headings.length > 0) {
      const allCaps = headings.filter(h => h.text.length > 3 && h.text === h.text.toUpperCase() && /[A-Z]/.test(h.text));
      if (allCaps.length >= Math.round(headings.length * 0.75)) {
        issues.push({ type: 'all-caps-headings', severity: 'info',
          message: 'Most headings are in ALL CAPS — EPUB converters render these literally, so your TOC will appear shouting. Use normal casing and apply an uppercase text transform via character styles in your word processor.' });
      }
    }
    const emptyChapters = headings.filter(h => h.words === 0);
    if (emptyChapters.length > 0) {
      const names = emptyChapters.slice(0, 3).map(h => `"${h.text}"`).join(', ');
      const more  = emptyChapters.length > 3 ? ` +${emptyChapters.length - 3} more` : '';
      issues.push({ type: 'empty-chapters', severity: 'warning',
        message: `${emptyChapters.length} heading${emptyChapters.length > 1 ? 's' : ''} with no body text: ${names}${more}. EPUBCheck flags empty sections as validation errors — add content or remove the heading.` });
    }
    if (headings.length > 2) {
      const short = headings.filter(h => h.words > 0 && h.words < 100);
      if (short.length > 0) {
        const names = short.slice(0, 3).map(h => `"${h.text}" (${h.words}w)`).join(', ');
        const more  = short.length > 3 ? ` +${short.length - 3} more` : '';
        issues.push({ type: 'short-chapters', severity: 'info',
          message: `${short.length} chapter${short.length > 1 ? 's' : ''} under 100 words: ${names}${more}. Very short chapters are fine for prologues and epilogues — verify this is intentional.` });
      }
    }
    if (maxBlankRun >= 5) {
      issues.push({ type: 'excessive-blanks', severity: 'warning',
        message: `${maxBlankRun} consecutive blank lines detected. EPUB readers collapse them into a single line break, and EPUBCheck may flag them. Use a scene break marker (*** or —) instead of stacking blank lines.` });
    }
    const order = { error: 0, warning: 1, info: 2 };
    return issues.sort((a, b) => order[a.severity] - order[b.severity]);
  }

  function analyseHtml(html, fileSize) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = [];
    let headingIdx = -1, maxBlankRun = 0, blankRun = 0;
    for (const el of [...doc.body.children]) {
      const tag = el.tagName;
      if (/^H[1-4]$/.test(tag)) {
        headings.push({ level: parseInt(tag[1]), text: el.textContent.trim(), index: headings.length, words: 0 });
        headingIdx = headings.length - 1; blankRun = 0;
      } else if (tag === 'P' && !el.textContent.trim()) {
        blankRun++; if (blankRun > maxBlankRun) maxBlankRun = blankRun;
      } else {
        blankRun = 0;
        if (headingIdx >= 0) {
          const t = el.textContent.trim();
          if (t) headings[headingIdx].words += t.split(/\s+/).filter(Boolean).length;
        }
      }
    }
    const wordCount      = doc.body.textContent.trim().split(/\s+/).filter(Boolean).length;
    const paragraphCount = doc.querySelectorAll('p').length;
    const estimatedPages = Math.max(1, Math.round(wordCount / 250));
    return { headings, wordCount, paragraphCount, estimatedPages, issues: validateManuscript({ headings, wordCount, paragraphCount, maxBlankRun, fileSize }) };
  }

  function analyseTxt(text, fileSize) {
    const lines = text.split('\n');
    const headings = [];
    let headingIdx = -1, maxBlankRun = 0, blankRun = 0;
    lines.forEach((line, i) => {
      const t = line.trim();
      if (!t) { blankRun++; if (blankRun > maxBlankRun) maxBlankRun = blankRun; return; }
      blankRun = 0;
      if (t.length <= 80) {
        const prevEmpty = i === 0 || !lines[i - 1]?.trim();
        const nextEmpty = i >= lines.length - 1 || !lines[i + 1]?.trim();
        if (prevEmpty && nextEmpty && t.length > 2) {
          const isAllCaps = t === t.toUpperCase() && /[A-Z]/.test(t);
          headings.push({ level: isAllCaps ? 1 : 2, text: t, index: headings.length, words: 0 });
          headingIdx = headings.length - 1; return;
        }
      }
      if (headingIdx >= 0) headings[headingIdx].words += t.split(/\s+/).filter(Boolean).length;
    });
    const wordCount      = text.trim().split(/\s+/).filter(Boolean).length;
    const paragraphCount = text.split(/\n{2,}/).filter(Boolean).length;
    const estimatedPages = Math.max(1, Math.round(wordCount / 250));
    return { headings, wordCount, paragraphCount, estimatedPages, issues: validateManuscript({ headings, wordCount, paragraphCount, maxBlankRun, fileSize }) };
  }

  function applyStyle(style) {
    setFd(p => ({ ...p, bookStyle: style.id, pTheme: style.theme, pFont: style.font, pSize: style.size, pSpacing: style.spacing }));
    setMsPage(0); setMsSpread(false);
  }

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

  // Auto-fill matter + fetch manuscript text for Reading Style preview
  useEffect(() => {
    if (step === 7 && !fd.frontMatter.copyright.content) {
      upMatter('frontMatter', 'copyright', 'content',
        FM_ITEMS[0].template(fd, authorName, fd.pubYear || String(new Date().getFullYear())));
    }
    if (step === 7 && !fd.backMatter.aboutAuthor.content) {
      upMatter('backMatter', 'aboutAuthor', 'content', BM_ITEMS[0].template(fd, authorName));
    }
    if (step === 4 && fd.manuscriptPath && !msText && !msLoading) {
      const ext = fd.manuscriptPath.split('.').pop().toLowerCase();
      if (['txt', 'rtf'].includes(ext)) {
        setMsLoading(true);
        supabase.storage.from('manuscripts').createSignedUrl(fd.manuscriptPath, 3600)
          .then(({ data }) => { if (!data?.signedUrl) { setMsLoading(false); return; } return fetch(data.signedUrl); })
          .then(r => r?.text())
          .then(text => { if (text) setMsText(text); })
          .catch(() => {})
          .finally(() => setMsLoading(false));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Auto-save progress to localStorage on step change
  useEffect(() => {
    if (step === 9) return;
    if (!fd.title && !fd.manuscriptPath) return;
    try {
      localStorage.setItem('ic_wizard_progress', JSON.stringify({
        fd: { ...fd, coverFile: null, manuscriptFile: null, coverPreview: '' },
        step,
        savedAt: Date.now(),
      }));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Validation ────────────────────────────────────────────────
  function validate(s) {
    if (s === 0 && !fd.title.trim())       return 'Book title is required.';
    if (s === 1 && !fd.description.trim()) return 'Description is required.';
    if (s === 1 && !fd.genre)              return 'Please select a primary genre.';
    if (s === 2 && !fd.pubYear)            return 'Publication year is required.';
    if (s === 2 && fd.isbnOption === 'own') {
      if (!fd.isbn.trim())                 return 'Enter your ISBN-13.';
      if (!isValidISBN13(fd.isbn))         return 'Invalid ISBN-13 — check the number and try again.';
    }
    if (s === 3 && !fd.manuscriptPath)     return 'Upload your manuscript before continuing.';
    return null;
  }

  function goNext() {
    const err = validate(step);
    if (err) { setStepError(err); return; }
    setStepError(''); setStep(s => s + 1); window.scrollTo(0, 0);
  }
  function goTo(s) { if (s <= step) { setStepError(''); setStep(s); window.scrollTo(0, 0); } }
  function goBack() { setStepError(''); setStep(s => s - 1); window.scrollTo(0, 0); }

  // ── File handlers ─────────────────────────────────────────────
  async function handleManuscript(file) {
    if (file.size > 50 * 1024 * 1024) {
      setStepError(`File is ${(file.size / 1024 / 1024).toFixed(0)} MB — manuscripts must be under 50 MB. Remove embedded images or compress the file, then try again.`);
      return;
    }
    up('manuscriptFile', file);
    setUploading(true);
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'docx') {
        const { value: html }    = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
        const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setMsHtml(html); setMsStructure(analyseHtml(html, file.size)); setMsText(rawText);
      } else if (ext === 'txt' || ext === 'rtf') {
        const text = await file.text();
        setMsText(text); setMsStructure(analyseTxt(text, file.size));
        const safeHtml = text.split(/\n{2,}/).map(p =>
          `<p>${p.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`
        ).join('\n');
        setMsHtml(safeHtml);
      } else {
        setMsStructure({ headings: [], wordCount: 0, paragraphCount: 0, estimatedPages: 0,
          issues: [{ type: 'unsupported', severity: 'info',
            message: `Layout preview isn't available for .${ext} files. Your manuscript will still be stored correctly.` }] });
      }
    } catch (e) { console.warn('[layout] parse failed:', e); }
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('manuscripts').upload(path, file);
    setUploading(false);
    if (error) { setStepError(error.message); return; }
    up('manuscriptPath', path);
  }

  function handleCover(file) { up('coverFile', file); up('coverPreview', URL.createObjectURL(file)); }

  function buildMatter(items, state) {
    return items
      .filter(i => {
        const d = state[i.key];
        if (!d?.enabled) return false;
        if (i.isToc) return (d.entries?.length || 0) > 0;
        return !!d.content;
      })
      .map(i => {
        const d = state[i.key];
        if (i.isToc) return { key: i.key, label: i.label, entries: d.entries.filter(e => e.include) };
        return { key: i.key, label: i.label, content: d.content };
      });
  }

  // ── Save as Draft ─────────────────────────────────────────────
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
        title: fd.title, subtitle: fd.subtitle || null, description: fd.description || null,
        cover_url: coverUrl, formats: fd.formats, keywords: fd.keywords,
        is_published: false, author_user_id: user.id, manuscript_path: fd.manuscriptPath || null,
        pub_year: fd.pubYear ? parseInt(fd.pubYear) : null, page_count: fd.pageCount ? parseInt(fd.pageCount) : null,
        isbn_13: fd.isbnOption === 'own' && fd.isbn ? fd.isbn.replace(/[-\s]/g, '') : null,
        language: fd.language, publisher_name: fd.publisher || null,
        price: fd.isFree ? 0 : (fd.price ? parseFloat(fd.price) : null),
        front_matter: buildMatter(FM_ITEMS, fd.frontMatter), back_matter: buildMatter(BM_ITEMS, fd.backMatter),
        distribution_channels: fd.distributionChannels, draft_step: step,
      };
      if (draftId) {
        await supabase.from('books').update(bookData).eq('id', draftId).eq('author_user_id', user.id);
      } else {
        const bookSlug = `draft-${slugify(fd.title)}-${Date.now()}`;
        const { data: book, error: be } = await supabase.from('books').insert({ slug: bookSlug, ...bookData }).select('id').single();
        if (be) throw new Error(be.message);
        setDraftId(book.id);
        localStorage.setItem('ic_draft_id', book.id);
      }
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch (err) { setStepError(err.message); } finally { setSavingDraft(false); }
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
        slug: bookSlug, title: fd.title, subtitle: fd.subtitle || null,
        description: fd.description, cover_url: coverUrl, formats: fd.formats,
        keywords: fd.keywords, is_published: publishNow, author_user_id: user.id,
        manuscript_path: fd.manuscriptPath,
        pub_year: fd.pubYear ? parseInt(fd.pubYear) : null,
        page_count: fd.pageCount ? parseInt(fd.pageCount) : null,
        isbn_13: fd.isbnOption === 'own' && fd.isbn ? fd.isbn.replace(/[-\s]/g, '') : null,
        language: fd.language, publisher_name: fd.publisher,
        price: fd.isFree ? 0 : (fd.price ? parseFloat(fd.price) : null),
        front_matter: buildMatter(FM_ITEMS, fd.frontMatter), back_matter: buildMatter(BM_ITEMS, fd.backMatter),
        distribution_channels: fd.distributionChannels,
      }).select('id').single();
      if (be) throw new Error(`Book: ${be.message}`);

      await supabase.from('books_authors').insert({ book_id: book.id, author_id: author.id, position: 1 });

      const genres2 = [fd.genre, fd.genreSecondary !== fd.genre ? fd.genreSecondary : ''].filter(Boolean);
      for (const gs of genres2) {
        const { data: gr } = await supabase.from('genres').select('id').eq('slug', gs).maybeSingle();
        if (gr) await supabase.from('books_genres').insert({ book_id: book.id, genre_id: gr.id });
      }
      if (fd.buyUrl) {
        const { data: retailer } = await supabase.from('retailers').select('id').eq('slug', fd.buyPlatform).maybeSingle();
        if (retailer) await supabase.from('book_retailer_links').insert({ book_id: book.id, retailer_id: retailer.id, url: fd.buyUrl });
      }

      localStorage.removeItem('ic_draft_id');
      localStorage.removeItem('ic_wizard_progress');
      setPublishedSlug(bookSlug);
      setSavedAsDraft(!publishNow);
      setStep(9);
    } catch (err) { setPublishError(err.message); } finally { setPublishing(false); }
  }

  // ── Preview theme/font lookups ────────────────────────────────
  const theme   = PREVIEW_THEMES.find(t => t.id === fd.pTheme) || PREVIEW_THEMES[0];
  const fontCss = PREVIEW_FONTS.find(f => f.id === fd.pFont)?.css || PREVIEW_FONTS[0].css;
  const sizeObj = PREVIEW_SIZES.find(s => s.id === fd.pSize) || PREVIEW_SIZES[1];
  const padObj  = PREVIEW_SPACING.find(s => s.id === fd.pSpacing) || PREVIEW_SPACING[1];

  // ── Live format-vs-structure checks ──────────────────────────
  const formatIssues = (() => {
    if (!msStructure?.estimatedPages) return [];
    const pg        = msStructure.estimatedPages;
    const printFmts = fd.formats.filter(f => ['Paperback', 'Hardcover'].includes(f));
    const out       = [];
    if (printFmts.length > 0 && pg < 24) {
      out.push({ type: 'print-min-pages', severity: 'error',
        message: `~${pg} estimated pages is below the 24-page minimum required for ${printFmts.join(' / ')} on Amazon KDP and IngramSpark. Add more content to reach at least 24 pages (~6,000 words), or remove print formats.` });
    }
    if (fd.formats.includes('Paperback') && pg >= 24 && pg < 48) {
      out.push({ type: 'no-spine-text', severity: 'info',
        message: `At ~${pg} pages your paperback spine will be too narrow for lettering — KDP and IngramSpark require 48+ pages for spine text. Notify your cover designer to leave the spine blank.` });
    }
    if (printFmts.length > 0 && pg > 828) {
      out.push({ type: 'print-max-pages', severity: 'warning',
        message: `~${pg} pages exceeds Amazon KDP's 828-page limit for a standard 5×8" paperback. Consider splitting into two volumes before publishing in print.` });
    }
    return out;
  })();

  const _severityOrder = { error: 0, warning: 1, info: 2 };
  const layoutIssues = [...formatIssues, ...(msStructure?.issues || [])]
    .sort((a, b) => _severityOrder[a.severity] - _severityOrder[b.severity]);

  const groups = [...new Set(WIZARD_STEPS.map(s => s.group))];
  const pct    = Math.round((step / (WIZARD_STEPS.length - 1)) * 100);

  // ─────────────────── SUCCESS / DRAFT SCREEN ──────────────────
  if (step === 9) {
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
                <p className="wz-done-desc">Your book is live on Indie Converters. Distribution to your selected platforms will begin within 24–72 hours.</p>
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
                <button key={i} className={`wz-step-item ${i === step ? 'current' : ''} ${i < step ? 'done' : ''}`}
                  onClick={() => goTo(i)} disabled={i > step}>
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
              <button type="button" className={`wz-save-btn ${draftSaved ? 'saved' : ''}`} onClick={handleSaveDraft} disabled={savingDraft}>
                {draftSaved ? '✓ Saved' : savingDraft ? 'Saving…' : 'Save draft'}
              </button>
            )}
            <span className="wz-topbar-group">{WIZARD_STEPS[step].group}</span>
          </div>
        </div>

        <div className="wz-body">
          {stepError && <div className="wz-error">{stepError}</div>}

          {/* ── Resume banner ── */}
          {savedProgress && step === 0 && !fd.title && (
            <div className="wz-resume-banner">
              <div className="wz-resume-info">
                <strong>Continue your draft?</strong>
                <span>"{savedProgress.fd?.title || 'Untitled'}" — saved {formatTimeAgo(savedProgress.savedAt)}</span>
              </div>
              <div className="wz-resume-actions">
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setFd(prev => ({ ...prev, ...savedProgress.fd }));
                  setStep(savedProgress.step || 0);
                  setSavedProgress(null);
                }}>Continue →</button>
                <button className="wz-text-link" onClick={() => {
                  localStorage.removeItem('ic_wizard_progress');
                  setSavedProgress(null);
                }}>Start fresh</button>
              </div>
            </div>
          )}

          {/* ════════ STEP 0: Your Book ════════ */}
          {step === 0 && (
            <div className="wz-step">
              <h2>Your Book</h2>
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

              <div className="wz-section-divider"><span>Author & Credits</span></div>

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
                        <input type="text" value={c.name} placeholder="Full name"
                          onChange={e => { const u = [...fd.contributors]; u[i] = { ...c, name: e.target.value }; up('contributors', u); }} />
                        <select value={c.role}
                          onChange={e => { const u = [...fd.contributors]; u[i] = { ...c, role: e.target.value }; up('contributors', u); }}>
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

          {/* ════════ STEP 1: About ════════ */}
          {step === 1 && (
            <div className="wz-step">
              <h2>About Your Book</h2>
              <p className="wz-sub">Your back-cover copy and discoverability settings.</p>
              <div className="wz-fields">
                <div className="wz-field wz-field--lg">
                  <label>
                    Description <span className="req">*</span>
                    <span className="wz-char">{fd.description.length.toLocaleString()} / 4,000</span>
                  </label>
                  <textarea rows={10} value={fd.description}
                    onChange={e => { if (e.target.value.length <= 4000) up('description', e.target.value); }}
                    placeholder="Write your back-cover description here. Use line breaks to separate paragraphs." />
                </div>
                <div className="wz-field">
                  <label>Target audience</label>
                  <div className="wz-audience-grid">
                    {AUDIENCES.map(a => (
                      <button key={a.value} type="button" className={`wz-audience-btn ${fd.audience === a.value ? 'selected' : ''}`} onClick={() => up('audience', a.value)}>
                        <strong>{a.label}</strong><span>{a.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="wz-section-divider"><span>Discoverability</span></div>

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
                  <label>Keywords <span className="opt">up to 7 — press Enter or comma after each one</span></label>
                  <KeywordInput keywords={fd.keywords} onChange={val => up('keywords', val)} />
                  <p className="wz-hint">Think about what a reader would type to find your book. Avoid repeating your title or genre names.</p>
                  {fd.genre && (() => {
                    const suggestions = (GENRE_KEYWORDS[fd.genre] || []).filter(kw => !fd.keywords.includes(kw));
                    if (!suggestions.length) return null;
                    return (
                      <div className="wz-kw-suggestions">
                        <span className="wz-kw-suggestions-label">Suggested for {genres.find(g => g.slug === fd.genre)?.label || fd.genre}:</span>
                        <div className="wz-kw-pills">
                          {suggestions.map(kw => (
                            <button key={kw} type="button" className="wz-kw-pill"
                              onClick={() => { if (fd.keywords.length < 7) up('keywords', [...fd.keywords, kw]); }}
                              disabled={fd.keywords.length >= 7}>+ {kw}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 2: Publication ════════ */}
          {step === 2 && (
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

              <div className="wz-section-divider"><span>ISBN</span></div>

              <div className="wz-fields">
                <div className="wz-isbn-options">
                  {[
                    { id: 'own',  title: 'I have my own ISBN-13', sub: 'Enter a 13-digit ISBN you already own or purchased from a registry.' },
                    { id: 'skip', title: 'Skip for now',           sub: 'Your book can still be listed and found without one. You can add it later from your dashboard.' },
                  ].map(opt => (
                    <label key={opt.id} className={`wz-isbn-opt ${fd.isbnOption === opt.id ? 'selected' : ''}`}>
                      <input type="radio" name="isbnopt" value={opt.id} checked={fd.isbnOption === opt.id} onChange={() => up('isbnOption', opt.id)} />
                      <div><strong>{opt.title}</strong><span>{opt.sub}</span></div>
                    </label>
                  ))}
                </div>
                <div className="wz-isbn-resources">
                  <span className="wz-isbn-resources-title">Where to get an ISBN</span>
                  <div className="wz-isbn-resource-grid">
                    <div className="wz-isbn-resource"><strong>Bowker (USA)</strong><span>Official US ISBN agency. Single ISBNs from $125.</span></div>
                    <div className="wz-isbn-resource"><strong>Nielsen (UK)</strong><span>UK national ISBN agency. Prices vary by package.</span></div>
                    <div className="wz-isbn-resource"><strong>ISBN Canada</strong><span>Free for Canadian publishers. Apply through Library and Archives Canada.</span></div>
                    <div className="wz-isbn-resource"><strong>IngramSpark / KDP</strong><span>Both offer a free ISBN when you publish through their platforms (platform-owned).</span></div>
                  </div>
                  <p className="wz-isbn-resources-note">A platform-assigned ISBN ties you to that platform. Owning your own ISBN gives you full control.</p>
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

          {/* ════════ STEP 3: Manuscript + inline Layout Check ════════ */}
          {step === 3 && (
            <div className="wz-step wz-step--manuscript">
              <h2>Manuscript</h2>
              <p className="wz-sub">Upload your manuscript. We accept .docx, .odt, .rtf, and .txt — max 50 MB.</p>
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
                  <div className="wz-uploading"><div className="wz-spinner" /><span>Uploading and analysing…</span></div>
                )}
                {fd.manuscriptPath && !uploading && (
                  <div className="wz-file-chip">
                    <span className="wz-file-ok">✓</span>
                    <span className="wz-file-name">{fd.manuscriptFile?.name}</span>
                    <span className="wz-file-size">{fd.manuscriptFile ? `${(fd.manuscriptFile.size / 1024).toFixed(0)} KB` : ''}</span>
                    <button type="button" className="wz-rm-btn" onClick={() => { up('manuscriptFile', null); up('manuscriptPath', ''); setMsStructure(null); setMsHtml(null); setMsText(null); }}>Replace</button>
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
                      <p>We don't host audio files. Distribute through <b>ACX / Audible</b>, <b>Libro.fm</b>, or your own site — then add the buy link in Cover & Pricing. Readers will be sent directly there.</p>
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
                    </div>
                  </div>
                )}
              </div>

              {/* ── Inline Layout Check ── */}
              {msStructure && (
                <div className="wz-layout-inline">
                  <div className="wz-section-divider"><span>Layout Analysis</span></div>

                  {layoutIssues.length > 0 && (
                    <div className="wz-layout-issues">
                      {layoutIssues.map(iss => (
                        <div key={iss.type} className={`wz-issue wz-issue--${iss.severity}`}>
                          <span className="wz-issue-icon">{iss.severity === 'error' ? '⚠' : iss.severity === 'warning' ? '⚡' : 'ℹ'}</span>
                          <p>{iss.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {layoutIssues.length === 0 && (
                    <div className="wz-layout-ok">
                      <span className="wz-issue-icon">✓</span>
                      <p>Structure looks good — no issues found.</p>
                    </div>
                  )}

                  <div className="wz-layout-panels">
                    <div className="wz-layout-toc">
                      <div className="wz-layout-panel-head">
                        <h3>Chapter Structure</h3>
                        <div className="wz-layout-stats">
                          {msStructure.wordCount > 0 && <span>{msStructure.wordCount.toLocaleString()} words</span>}
                          {msStructure.estimatedPages > 0 && <span>~{msStructure.estimatedPages} pages</span>}
                          {msStructure.paragraphCount > 0 && <span>{msStructure.paragraphCount} paragraphs</span>}
                          <span>{msStructure.headings.length} heading{msStructure.headings.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      {msStructure.headings.length === 0 ? (
                        <div className="wz-layout-no-toc">
                          <p>No headings found.</p>
                          <p className="wz-layout-hint">
                            In <strong>Microsoft Word</strong>: select each chapter title → Home → Styles → <em>Heading 1</em>.<br />
                            In <strong>Google Docs</strong>: Format → Paragraph styles → <em>Heading 1</em>.
                          </p>
                        </div>
                      ) : (
                        <ol className="wz-toc-list">
                          {msStructure.headings.map((h, i) => (
                            <li key={i} className={`wz-toc-item wz-toc-h${h.level}`}>
                              <span className="wz-toc-num">{i + 1}</span>
                              <span className="wz-toc-text">{h.text}</span>
                              {h.words === 0
                                ? <span className="wz-toc-words wz-toc-words--empty">empty</span>
                                : h.words !== undefined && <span className="wz-toc-words">{h.words.toLocaleString()}w</span>
                              }
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                    <div className="wz-layout-preview">
                      <div className="wz-layout-panel-head">
                        <h3>Content Preview</h3>
                        <span className="wz-layout-preview-note">First ~5,000 characters</span>
                      </div>
                      <div className="wz-layout-content"
                        dangerouslySetInnerHTML={{ __html: msHtml ? msHtml.slice(0, 8000) : '<p><em>No preview available.</em></p>' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════ STEP 4: Reading Style ════════ */}
          {step === 4 && (() => {
            const currentPage = msPages[msPage] || null;
            const showMs = !!currentPage;
            const isLastPage = msPage >= msPages.length - 1;
            return (
              <div className="wz-step wz-step--preview">
                <h2>Reading Style</h2>
                <p className="wz-sub">Choose the style that best matches your book's tone. Readers can customise it — this sets the default.</p>
                <div className="wz-style-grid">
                  {BOOK_STYLES.map(style => (
                    <button key={style.id} type="button"
                      className={`wz-style-card ${fd.bookStyle === style.id ? 'selected' : ''}`}
                      style={{ background: style.cardBg, borderColor: fd.bookStyle === style.id ? style.cardAccent : style.cardBorder, boxShadow: fd.bookStyle === style.id ? `0 0 0 2px ${style.cardAccent}` : 'none' }}
                      onClick={() => applyStyle(style)}>
                      <span className="wz-style-icon" style={{ color: style.cardAccent }}>{style.icon}</span>
                      <span className="wz-style-name" style={{ color: style.cardText, fontFamily: style.sampleFont }}>{style.name}</span>
                      <span className="wz-style-tagline" style={{ color: style.cardMuted }}>{style.tagline}</span>
                      <p className="wz-style-sample" style={{ fontFamily: style.sampleFont, color: style.cardText }}>
                        "The light fell in slats through wooden blinds, where the smell of old paper had long since become something closer to memory."
                      </p>
                    </button>
                  ))}
                </div>
                <details className="wz-finetune">
                  <summary className="wz-finetune-summary">Fine-tune</summary>
                  <div className="wz-preview-bar">
                    <div className="wz-ctrl-group">
                      <span className="wz-ctrl-label">Theme</span>
                      <div className="wz-ctrl-row">
                        {PREVIEW_THEMES.map(t => (
                          <button key={t.id} type="button" className={`wz-theme-pill ${fd.pTheme === t.id ? 'active' : ''}`}
                            style={{ background: t.bg, color: t.text, outlineColor: fd.pTheme === t.id ? t.text : 'transparent' }}
                            onClick={() => up('pTheme', t.id)}>{t.name}</button>
                        ))}
                      </div>
                    </div>
                    <div className="wz-ctrl-group">
                      <span className="wz-ctrl-label">Typeface</span>
                      <div className="wz-ctrl-row">
                        {PREVIEW_FONTS.map(f => (
                          <button key={f.id} type="button" className={`wz-font-pill ${fd.pFont === f.id ? 'active' : ''}`}
                            style={{ fontFamily: f.css }} onClick={() => up('pFont', f.id)}>{f.name}</button>
                        ))}
                      </div>
                    </div>
                    <div className="wz-ctrl-group">
                      <span className="wz-ctrl-label">Size</span>
                      <div className="wz-ctrl-row">
                        {PREVIEW_SIZES.map((s, i) => (
                          <button key={s.id} type="button" className={`wz-size-pill ${fd.pSize === s.id ? 'active' : ''}`}
                            style={{ fontSize: `${0.78 + i * 0.15}rem` }} onClick={() => up('pSize', s.id)}>Aa</button>
                        ))}
                      </div>
                    </div>
                    <div className="wz-ctrl-group">
                      <span className="wz-ctrl-label">Spacing</span>
                      <div className="wz-ctrl-row">
                        {PREVIEW_SPACING.map(s => (
                          <button key={s.id} type="button" className={`wz-spacing-pill ${fd.pSpacing === s.id ? 'active' : ''}`}
                            onClick={() => up('pSpacing', s.id)}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
                <div className="wz-book-reader">
                  <button className="wz-book-arrow" onClick={() => setMsPage(p => Math.max(0, p - 1))} disabled={msPage === 0} aria-label="Previous page">‹</button>
                  <div className="wz-book-page" style={{ background: theme.bg, borderColor: theme.border }} tabIndex={0}
                    onKeyDown={e => {
                      if (['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)) { e.preventDefault(); if (!isLastPage) setMsPage(p => p + 1); }
                      if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); if (msPage > 0) setMsPage(p => p - 1); }
                    }}>
                    <div className="wz-book-page-hdr" style={{ borderColor: `${theme.text}15` }}>
                      <span className="wz-book-running" style={{ fontFamily: fontCss, color: theme.text }}>{msPage % 2 === 0 ? (fd.title || 'Your Book Title') : ''}</span>
                      <span className="wz-book-running" style={{ fontFamily: fontCss, color: theme.text, textAlign: 'right' }}>{msPage % 2 !== 0 ? authorName : ''}</span>
                    </div>
                    <div className="wz-book-page-body" style={{ fontFamily: fontCss, fontSize: sizeObj.size, lineHeight: sizeObj.lh, color: theme.text }}>
                      {msLoading ? (
                        <div className="wz-reader-loading" style={{ color: theme.text }}>
                          <div className="wz-spinner" style={{ borderColor: `${theme.text}22`, borderTopColor: theme.text }} />
                          Loading your manuscript…
                        </div>
                      ) : showMs ? (
                        currentPage.map((para, i) => <p key={i} className="wz-reader-para">{para}</p>)
                      ) : (
                        SAMPLE_TEXT.map((block, i) =>
                          block.type === 'chapter'
                            ? <div key={i} className="wz-reader-chapter" style={{ fontFamily: fontCss, color: theme.text }}>{block.text}</div>
                            : <p key={i} className="wz-reader-para">{block.text}</p>
                        )
                      )}
                    </div>
                    <div className="wz-book-page-ftr" style={{ borderColor: `${theme.text}15`, color: theme.text }}>
                      {showMs && <span style={{ opacity: 0.3, fontSize: '0.72rem', fontFamily: fontCss }}>{msPage + 1}</span>}
                      {!showMs && !msLoading && (
                        <span style={{ opacity: 0.28, fontSize: '0.65rem' }}>
                          {fd.manuscriptPath ? '.txt files only · sample text shown' : 'Sample text · upload a .txt manuscript to preview'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="wz-book-arrow" onClick={() => setMsPage(p => Math.min(msPages.length - 1, p + 1))} disabled={isLastPage || !showMs} aria-label="Next page">›</button>
                </div>
              </div>
            );
          })()}

          {/* ════════ STEP 5: Cover & Pricing ════════ */}
          {step === 5 && (
            <div className="wz-step">
              <h2>Cover & Pricing</h2>
              <p className="wz-sub">Upload a cover image and set your price. We send readers directly to wherever you sell.</p>

              <div className="wz-cover-layout">
                <div className="wz-cover-left">
                  {!fd.coverPreview ? (
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
                  )}
                  {!fd.coverPreview && (
                    <div className="wz-field" style={{ marginTop: 24 }}>
                      <label>Fallback colour palette <span className="opt">used if no image provided</span></label>
                      <div className="wz-swatches">
                        {[
                          { cls: 'cover-clay', bg: 'var(--clay)' }, { cls: 'cover-clay-dark', bg: 'var(--clay-dark)' },
                          { cls: 'cover-ochre', bg: 'var(--ochre)' }, { cls: 'cover-ink', bg: 'var(--ink)' },
                          { cls: 'cover-sand', bg: 'var(--sand)', border: true },
                        ].map(c => (
                          <button key={c.cls} type="button" className={`wz-swatch ${fd.coverColor === c.cls ? 'selected' : ''}`}
                            style={{ background: c.bg }} onClick={() => up('coverColor', c.cls)} />
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

              <div className="wz-section-divider"><span>Pricing & Buy Link</span></div>

              <div className="wz-fields">
                <label className={`wz-toggle-card ${fd.isFree ? 'on' : ''}`}>
                  <div><strong>This book is free</strong><span>Readers can download or access it without paying.</span></div>
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

          {/* ════════ STEP 6: Distribution ════════ */}
          {step === 6 && (
            <div className="wz-step">
              <h2>Distribution</h2>
              <p className="wz-sub">
                Choose where readers can find your book. We publish on your behalf through our platform accounts — no separate sign-ups needed.
                Distribution takes 24–72 hours after publishing.
              </p>

              {/* Presets */}
              <div className="wz-dist-presets">
                <button type="button"
                  className={`wz-dist-preset ${fd.distributionChannels.length >= 6 && fd.distributionChannels.includes('overdrive') ? 'selected' : ''}`}
                  onClick={() => up('distributionChannels', ['amazon','apple','bn','kobo','google-play','scribd','overdrive','hoopla','baker-taylor','tolino','vivlio'])}>
                  ✦ Go Wide — All Platforms
                </button>
                <button type="button"
                  className={`wz-dist-preset ${fd.distributionChannels.length >= 6 && !fd.distributionChannels.includes('overdrive') && !fd.distributionChannels.includes('tolino') ? 'selected' : ''}`}
                  onClick={() => up('distributionChannels', ['amazon','apple','bn','kobo','google-play','scribd'])}>
                  Major Retailers Only
                </button>
                <button type="button"
                  className={`wz-dist-preset ${fd.distributionChannels.length === 1 && fd.distributionChannels[0] === 'amazon' ? 'selected' : ''}`}
                  onClick={() => up('distributionChannels', ['amazon'])}>
                  Amazon Only
                </button>
              </div>

              {/* KDP Select note */}
              {fd.distributionChannels.includes('amazon') && fd.distributionChannels.length > 1 && (
                <div className="wz-dist-kdp-note">
                  <strong>Note on Kindle Unlimited (KDP Select)</strong>
                  <p>If you plan to enrol in <b>KDP Select</b>, Amazon requires your eBook to be exclusive to Kindle for 90-day periods — wide distribution is incompatible. You can always adjust distribution from your dashboard before enrolling.</p>
                </div>
              )}

              {/* Channel groups */}
              <div className="wz-dist-groups">
                {DISTRIBUTION_CHANNELS.map(group => (
                  <div key={group.group} className="wz-dist-group">
                    <span className="wz-dist-group-label">{group.group}</span>
                    <div className="wz-dist-channels">
                      {group.channels.map(ch => {
                        const checked = fd.distributionChannels.includes(ch.id);
                        return (
                          <label key={ch.id} className={`wz-dist-channel ${checked ? 'on' : ''}`}>
                            <input type="checkbox" checked={checked}
                              onChange={e => up('distributionChannels',
                                e.target.checked
                                  ? [...fd.distributionChannels, ch.id]
                                  : fd.distributionChannels.filter(c => c !== ch.id)
                              )} />
                            <div className="wz-dist-channel-text">
                              <span className="wz-dist-channel-name">{ch.label}</span>
                              <span className="wz-dist-channel-note">{ch.note}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <p className="wz-dist-footer">
                {fd.distributionChannels.length === 0
                  ? 'No channels selected — your book will only be visible on Indie Converters.'
                  : `${fd.distributionChannels.length} channel${fd.distributionChannels.length > 1 ? 's' : ''} selected. You can add or remove channels from your dashboard at any time.`
                }
              </p>
            </div>
          )}

          {/* ════════ STEP 7: Book Structure ════════ */}
          {step === 7 && (
            <div className="wz-step">
              <h2>Book Structure</h2>
              <p className="wz-sub">Optional pages that surround your main content. Templates are pre-filled — toggle on to customise.</p>

              <div className="wz-section-divider"><span>Front Matter</span></div>
              <p className="wz-sub" style={{ marginTop: 0, marginBottom: 20 }}>Pages that appear before Chapter 1.</p>
              <div className="wz-matter-list">
                {FM_ITEMS.map(item => {
                  const data = fd.frontMatter[item.key];

                  function handleTocToggle() {
                    const newEnabled = !data.enabled;
                    if (newEnabled && data.entries.length === 0 && msStructure?.headings?.length > 0) {
                      const fmOffset = Object.values(fd.frontMatter).filter(v => v.enabled).length + 1;
                      setFd(p => ({ ...p, frontMatter: { ...p.frontMatter, toc: { enabled: true, entries: buildTocEntries(msStructure.headings, fmOffset) } } }));
                    } else {
                      setFd(p => ({ ...p, frontMatter: { ...p.frontMatter, toc: { ...p.frontMatter.toc, enabled: newEnabled } } }));
                    }
                  }

                  function updateTocEntry(idx, field, val) {
                    setFd(p => {
                      const entries = [...p.frontMatter.toc.entries];
                      entries[idx] = { ...entries[idx], [field]: val };
                      return { ...p, frontMatter: { ...p.frontMatter, toc: { ...p.frontMatter.toc, entries } } };
                    });
                  }

                  function resetToc() {
                    const fmOffset = Object.values(fd.frontMatter).filter(v => v.enabled).length + 1;
                    setFd(p => ({ ...p, frontMatter: { ...p.frontMatter, toc: { enabled: true, entries: buildTocEntries(msStructure.headings, fmOffset) } } }));
                  }

                  return (
                    <div key={item.key} className={`wz-matter-section ${data.enabled ? 'expanded' : ''}`}>
                      <div className="wz-matter-header">
                        <div className="wz-matter-title-wrap">
                          <span className="wz-matter-label">{item.label}</span>
                          {item.required && <span className="wz-matter-rec">Recommended</span>}
                          <span className="wz-matter-tip">{item.tip}</span>
                        </div>
                        <div className={`wz-toggle ${data.enabled ? 'on' : ''}`} role="switch" aria-checked={data.enabled}
                          onClick={() => item.isToc ? handleTocToggle() : toggleMatter('frontMatter', FM_ITEMS, item.key)} />
                      </div>

                      {/* ── TOC special body ── */}
                      {data.enabled && item.isToc && (
                        <div className="wz-matter-body wz-toc-body">
                          {!msStructure?.headings?.length ? (
                            <div className="wz-toc-no-ms">
                              <p>Upload your manuscript in the Manuscript step to auto-generate the Table of Contents from your chapter headings.</p>
                              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setStep(3); window.scrollTo(0, 0); }}>Go to Manuscript →</button>
                            </div>
                          ) : (
                            <div className="wz-toc-editor">
                              <div className="wz-toc-editor-panels">

                                {/* Left: editable entry list */}
                                <div className="wz-toc-editor-list">
                                  <div className="wz-toc-editor-head">
                                    <span className="wz-toc-entry-count">
                                      {data.entries.filter(e => e.include).length} of {data.entries.length} entries included
                                    </span>
                                    <button type="button" className="wz-text-link" onClick={resetToc}>
                                      ↻ Reset from manuscript
                                    </button>
                                  </div>
                                  <div className="wz-toc-entries">
                                    {data.entries.length === 0 ? (
                                      <p className="wz-toc-empty">No headings detected in your manuscript.</p>
                                    ) : data.entries.map((entry, idx) => (
                                      <div key={entry.id} className={`wz-toc-entry wz-toc-entry--h${entry.level} ${!entry.include ? 'excluded' : ''}`}>
                                        <input type="checkbox" className="wz-toc-entry-check" checked={entry.include}
                                          title={entry.include ? 'Exclude from TOC' : 'Include in TOC'}
                                          onChange={e => updateTocEntry(idx, 'include', e.target.checked)} />
                                        <input type="text" className="wz-toc-entry-label" value={entry.label}
                                          onChange={e => updateTocEntry(idx, 'label', e.target.value)}
                                          disabled={!entry.include} />
                                        <span className="wz-toc-entry-pg">{entry.estimatedPage}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <p className="wz-toc-hint">
                                    Rename any entry by editing the label. Uncheck entries you want to hide (e.g. internal sub-sections). Page numbers are estimates based on word count.
                                  </p>
                                </div>

                                {/* Right: print-style preview */}
                                <div className="wz-toc-print-preview" style={{ background: theme.bg, color: theme.text }}>
                                  <div className="wz-toc-preview-title" style={{ fontFamily: fontCss, color: theme.text }}>
                                    Table of Contents
                                  </div>
                                  <div className="wz-toc-preview-entries">
                                    {data.entries.filter(e => e.include).map((entry, idx) => (
                                      <div key={idx} className={`wz-toc-preview-row wz-toc-preview-h${entry.level}`}
                                        style={{ fontFamily: fontCss, color: entry.level === 2 ? `${theme.text}99` : theme.text }}>
                                        <span className="wz-toc-preview-label">{entry.label}</span>
                                        <span className="wz-toc-preview-leader" style={{ borderColor: `${theme.text}30` }} />
                                        <span className="wz-toc-preview-page">{entry.estimatedPage}</span>
                                      </div>
                                    ))}
                                    {data.entries.filter(e => e.include).length === 0 && (
                                      <p style={{ opacity: 0.4, fontSize: '0.8rem', fontStyle: 'italic', fontFamily: fontCss }}>Enable entries to see the preview</p>
                                    )}
                                  </div>
                                  <div className="wz-toc-preview-note" style={{ color: `${theme.text}60` }}>
                                    <span className="wz-toc-epub-badge">EPUB</span> TOC is auto-linked — readers tap to jump.{' '}
                                    <span className="wz-toc-print-badge">Print</span> typeset as shown.
                                  </div>
                                </div>

                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Regular matter textarea ── */}
                      {data.enabled && !item.isToc && (
                        <div className="wz-matter-body">
                          <textarea rows={8} value={data.content}
                            onChange={e => upMatter('frontMatter', item.key, 'content', e.target.value)}
                            placeholder="Write or edit this section…" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="wz-section-divider" style={{ marginTop: 40 }}><span>Back Matter</span></div>
              <p className="wz-sub" style={{ marginTop: 0, marginBottom: 20 }}>Pages that appear after the main content.</p>
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
                        <div className={`wz-toggle ${data.enabled ? 'on' : ''}`} role="switch" aria-checked={data.enabled}
                          onClick={() => toggleMatter('backMatter', BM_ITEMS, item.key)} />
                      </div>
                      {data.enabled && (
                        <div className="wz-matter-body">
                          <textarea rows={8} value={data.content}
                            onChange={e => upMatter('backMatter', item.key, 'content', e.target.value)}
                            placeholder="Write or edit this section…" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════ STEP 8: Review & Publish ════════ */}
          {step === 8 && (
            <div className="wz-step">
              <h2>Review & Publish</h2>
              <p className="wz-sub">Check everything before going live. Click Edit to make changes.</p>

              {publishError && <div className="wz-error">{publishError}</div>}

              <div className="wz-review">
                {[
                  { title: 'Your Book', to: 0, rows: [
                    ['Title',    fd.title || '—'],
                    ['Subtitle', fd.subtitle || '—'],
                    ['Language', fd.language],
                    ['Series',   fd.series ? `${fd.series}${fd.seriesVolume ? ` Vol. ${fd.seriesVolume}` : ''}` : '—'],
                    ['Contributors', fd.contributors.length ? fd.contributors.map(c => `${c.name} (${c.role})`).join(', ') : '—'],
                  ]},
                  { title: 'About', to: 1, rows: [
                    ['Audience',         AUDIENCES.find(a => a.value === fd.audience)?.label || '—'],
                    ['Description',      fd.description ? fd.description.slice(0, 100) + (fd.description.length > 100 ? '…' : '') : '—'],
                    ['Primary genre',    genres.find(g => g.slug === fd.genre)?.label || '—'],
                    ['Secondary genre',  genres.find(g => g.slug === fd.genreSecondary)?.label || '—'],
                    ['Keywords',         fd.keywords.length ? fd.keywords.join(', ') : '—'],
                  ]},
                  { title: 'Publication', to: 2, rows: [
                    ['Year',      fd.pubYear || '—'],
                    ['Publisher', fd.publisher || '—'],
                    ['Pages',     fd.pageCount || '—'],
                    ['ISBN-13',   fd.isbnOption === 'own' ? fd.isbn : 'Not provided'],
                  ]},
                  { title: 'Manuscript', to: 3, rows: [
                    ['File',    fd.manuscriptFile?.name || '—'],
                    ['Formats', fd.formats.join(', ') || '—'],
                  ]},
                  { title: 'Cover & Pricing', to: 5, rows: [
                    ['Cover',     fd.coverFile?.name || 'None — colour palette used'],
                    ['Price',     fd.isFree ? 'Free' : (fd.price ? `$${fd.price}` : '—')],
                    ['Buy link',  fd.buyUrl || '—'],
                    ['Platform',  fd.buyPlatform !== 'own' ? fd.buyPlatform : 'Own website'],
                  ]},
                  { title: 'Distribution', to: 6, rows: [
                    ['Channels', fd.distributionChannels.length
                      ? fd.distributionChannels.map(id => DISTRIBUTION_CHANNELS.flatMap(g => g.channels).find(c => c.id === id)?.label || id).join(', ')
                      : 'None selected — Indie Converters only'],
                  ]},
                  { title: 'Book Structure', to: 7, rows: [
                    ['Front Matter', FM_ITEMS.filter(i => fd.frontMatter[i.key]?.enabled).map(i => i.label).join(', ') || 'None'],
                    ['Back Matter',  BM_ITEMS.filter(i => fd.backMatter[i.key]?.enabled).map(i => i.label).join(', ') || 'None'],
                  ]},
                ].map(s => (
                  <div key={s.title} className="wz-review-block">
                    <div className="wz-review-block-head">
                      <h3>{s.title}</h3>
                      <button type="button" className="wz-edit-link" onClick={() => goTo(s.to)}>Edit</button>
                    </div>
                    <dl className="wz-review-dl">
                      {s.rows.map(([k, v]) => (
                        <div key={k} className="wz-review-row"><dt>{k}</dt><dd>{v}</dd></div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>

              {layoutIssues.some(i => i.severity === 'error') && (
                <div className="wz-review-errors">
                  <strong>⚠ Fix these errors before publishing</strong>
                  <ul>
                    {layoutIssues.filter(i => i.severity === 'error').map(i => <li key={i.type}>{i.message}</li>)}
                  </ul>
                  <button type="button" className="wz-text-link" onClick={() => goTo(3)}>Go to Manuscript →</button>
                </div>
              )}

              <div className="wz-publish-cta">
                <div className="wz-publish-choice">
                  <button type="button" className="btn btn-outline wz-draft-btn" onClick={() => handlePublish(false)} disabled={publishing}>
                    Save as Draft
                  </button>
                  <button type="button" className="btn btn-primary wz-publish-btn" onClick={() => handlePublish(true)}
                    disabled={publishing || layoutIssues.some(i => i.severity === 'error')}
                    title={layoutIssues.some(i => i.severity === 'error') ? 'Fix errors in the Manuscript step before publishing' : undefined}>
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
            {step < 8 && <button type="button" className="btn btn-primary" onClick={goNext}>Continue →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
