import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import mammoth from 'mammoth/mammoth.browser';
import { validateManuscript, analyseHtml, analyseTxt } from '../lib/manuscriptValidator';
import { calculateRoyaltyEstimates, formatRoyaltyMoney } from '../lib/royaltyCalculator';
import { calculatePrintCover, formatInches as formatCoverInches, TRIM_SIZE_OPTIONS } from '../lib/printCoverCalculator';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import RetailerLinksEditor, { RETAILER_OPTIONS } from '../components/RetailerLinksEditor';
import { supabase } from '../lib/supabase';
import './UploadWizard.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { label: 'Your Book',       group: 'Details'   },
  { label: 'About',           group: 'Details'   },
  { label: 'Publication',     group: 'Details'   },
  { label: 'Manuscript',      group: 'Files'     },
  { label: 'Reading Style',   group: 'Files'     },
  { label: 'Cover',           group: 'Publish'   },
  { label: 'Pricing',         group: 'Publish'   },
  { label: 'Distribution',    group: 'Publish'   },
  { label: 'Front & Back Matter', group: 'Structure' },
  { label: 'Book Structure',      group: 'Structure' },
  { label: 'Review',              group: 'Review'    },
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
    required: true,
    isToc: true,
  },
  { key: 'dedication',
    label: 'Dedication',
    tip: 'A short personal note — to a person, a cause, or an idea.',
    required: false,
    template: () => 'For [name],\n\nFor believing in this story before anyone else did.',
  },
  { key: 'epigraph',
    label: 'Epigraph',
    tip: 'An opening quotation that sets the tone of the book.',
    required: false,
    template: () => '"Begin where the question still feels alive."\n— Original line',
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

const DEDICATION_SAMPLES = [
  {
    label: 'Simple',
    text: 'For [name],\n\nFor believing in this story before anyone else did.',
  },
  {
    label: 'Family',
    text: 'For my family,\n\nFor your patience, love, and steady encouragement through every draft.',
  },
  {
    label: 'Mentor',
    text: 'For [name],\n\nThank you for showing me what discipline, courage, and care can make possible.',
  },
  {
    label: 'Readers',
    text: 'For every reader who has ever needed a quiet place to feel understood.',
  },
];

function buildEpigraphSamples(fd, genreLabel) {
  const title = fd.title?.trim();
  const genre = (genreLabel || '').toLowerCase();
  const titleLine = title
    ? `Some books begin as questions. ${title} begins as a door left open.`
    : 'Some stories begin as questions. This one begins as a door left open.';

  let genreLine = 'The first truth is rarely the final one.';
  if (genre.includes('fiction') || genre.includes('novel')) {
    genreLine = 'Every life contains a room no one else can enter.';
  } else if (genre.includes('memoir') || genre.includes('biograph')) {
    genreLine = 'Memory does not return whole. It arrives in fragments, asking to be named.';
  } else if (genre.includes('poetry')) {
    genreLine = 'What cannot be held may still be heard.';
  } else if (genre.includes('romance')) {
    genreLine = 'The heart keeps its own weather.';
  } else if (genre.includes('mystery') || genre.includes('thriller')) {
    genreLine = 'The answer was there before anyone knew how to ask.';
  } else if (genre.includes('business') || genre.includes('self') || genre.includes('guide')) {
    genreLine = 'Change begins as a quiet decision, then asks for practice.';
  } else if (genre.includes('history') || genre.includes('research')) {
    genreLine = 'The past is never silent; it waits for better questions.';
  } else if (genre.includes('fantasy') || genre.includes('science')) {
    genreLine = 'Every impossible world begins with one believable door.';
  }

  return [
    { label: 'From title', text: `"${titleLine}"\n— Original line` },
    { label: 'Genre mood', text: `"${genreLine}"\n— Original line` },
    { label: 'Quiet opening', text: '"Begin where the question still feels alive."\n— Original line' },
    { label: 'Quote template', text: '"[Quote text]"\n— [Author Name], [Work Title]' },
  ];
}

const BM_ITEMS = [
  { key: 'aboutAuthor',
    label: 'About the Author',
    tip: 'A brief bio for new readers discovering you through this book.',
    required: true,
    template: (_, author) =>
      `${author} is an independent author based in [location]. Their work explores [themes or subjects] through stories written for curious, thoughtful readers.\n\nConnect: [website or social link]`,
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
const STORY_TONES = [
  { id: 'clear',    label: 'Clear',    note: 'Simple catalogue copy' },
  { id: 'warm',     label: 'Warm',     note: 'Personal and inviting' },
  { id: 'literary', label: 'Literary', note: 'More atmospheric' },
  { id: 'bold',     label: 'Bold',     note: 'Sharper launch copy' },
];
const FORMATS = ['eBook','Paperback','Hardcover','Audiobook'];
const RELEASE_LEAD_DAYS = 7;
const DEFAULT_RELEASE_LEAD_DAYS = 14;

function dateInputFromNow(days = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateInput(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function titleCaseWords(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => (/^[ivxlcdm]+$/i.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(' ');
}

// Formats text already known to be a chapter heading (from analyseHtml/analyseTxt's
// structured parse — see msPages) into a kicker + title pair for display. Unlike the
// old parseChapterHeading, this never discards a real heading: if it doesn't match the
// "Chapter N — Title" shape (Prologue, a custom section title, etc.), the full text
// still renders, just without a separate kicker line.
function formatChapterHeading(value = '') {
  const text = value.trim().replace(/\s+/g, ' ');
  const numberWords = [
    'one','two','three','four','five','six','seven','eight','nine','ten',
    'eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen',
    'eighteen','nineteen','twenty','twenty one','twenty two','twenty three',
    'twenty four','twenty five','thirty','forty','fifty',
  ].join('|');
  const match = text.match(new RegExp(`^(chapter|part|book)\\s+([ivxlcdm\\d]+|${numberWords})(?:\\s*[-:–—]\\s*(.+))?$`, 'i'));
  if (!match) return { label: '', title: text };
  const [, kind, marker, title] = match;
  return {
    label: `${titleCaseWords(kind)} ${titleCaseWords(marker)}`,
    title: title?.trim() || '',
  };
}

function cleanStoryInput(value = '') {
  return value.trim().replace(/\s+/g, ' ');
}

function ensureSentence(value = '') {
  const text = cleanStoryInput(value);
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function buildStoryDraft(fd, { authorName, genreLabel, audienceLabel } = {}) {
  const title = cleanStoryInput(fd.title) || 'This book';
  const subtitle = cleanStoryInput(fd.subtitle);
  const genre = cleanStoryInput(genreLabel).toLowerCase();
  const workLabel = genre ? `work of ${genre}` : 'indie book';
  const premise = ensureSentence(fd.storyPremise);
  const reader = cleanStoryInput(fd.storyReader);
  const promise = ensureSentence(fd.storyPromise);
  const themes = cleanStoryInput(fd.storyThemes);
  const audience = reader || (audienceLabel ? `${audienceLabel.toLowerCase()} readers` : 'curious readers');
  const author = cleanStoryInput(authorName) || 'the author';

  const fallbackPremise = subtitle
    ? `${title} is a ${workLabel} about ${subtitle.charAt(0).toLowerCase()}${subtitle.slice(1)}.`
    : `${title} is a ${workLabel} for readers looking for a fresh independent voice.`;
  const themeLine = themes ? `It moves through ${themes}.` : '';
  const promiseLine = promise || `It gives readers a clear way into ${genre || 'the story'} and the questions behind it.`;

  if (fd.storyTone === 'warm') {
    return [
      premise || fallbackPremise,
      `Written for ${audience}, ${title} invites readers into a thoughtful reading experience from ${author}. ${themeLine}`.trim(),
      `${promiseLine} Read it if you want a book that feels direct, personal, and made with care.`,
    ].filter(Boolean).join('\n\n');
  }

  if (fd.storyTone === 'literary') {
    return [
      premise || `${title} opens with a question and follows it into a ${workLabel}.`,
      `${themeLine || `It is shaped by voice, atmosphere, and the quiet pressure of change.`} For ${audience}, the book offers room to sit with what lingers after the final page.`,
      promiseLine,
    ].filter(Boolean).join('\n\n');
  }

  if (fd.storyTone === 'bold') {
    return [
      premise || fallbackPremise,
      `${title} is for ${audience} who want ${themes || 'a confident idea, a memorable story, and a reason to keep turning pages'}.`,
      `${promiseLine} Start here if you want an indie book with a clear point of view.`,
    ].filter(Boolean).join('\n\n');
  }

  return [
    premise || fallbackPremise,
    `${title} is written for ${audience}. ${themeLine}`.trim(),
    promiseLine,
  ].filter(Boolean).join('\n\n');
}

const ISBN_REGISTRY_OPTIONS = [
  {
    title: 'Bowker (USA)',
    note: 'Official U.S. ISBN agency for publishers in the United States and its territories.',
    links: [{ label: 'Buy from Bowker', href: 'https://www.myidentifiers.com/identify-protect-your-book/isbn/buy-isbn' }],
  },
  {
    title: 'Nielsen ISBN Store (UK & Ireland)',
    note: 'Official ISBN agency for publishers in the UK and Ireland.',
    links: [{ label: 'Open Nielsen store', href: 'https://www.nielsenisbnstore.com/' }],
  },
  {
    title: 'ISBN Canada',
    note: 'Free ISBNs for eligible Canadian publishers through Library and Archives Canada.',
    links: [{ label: 'Apply with ISBN Canada', href: 'https://www.canada.ca/en/library-archives/services/publishers/isbn/apply.html' }],
  },
  {
    title: 'Free platform ISBNs',
    note: 'KDP and IngramSpark can assign ISBNs during setup, but they are platform-owned.',
    links: [
      { label: 'KDP ISBN help', href: 'https://kdp.amazon.com/help/topic/GTJ8LBXL6Z4WV5QX' },
      { label: 'IngramSpark ISBNs', href: 'https://www.ingramspark.com/free-isbns' },
    ],
  },
];

const AUDIOBOOK_RESOURCES = [
  {
    title: 'ACX / Audible',
    note: 'Create an audiobook edition for Audible, Amazon, and Apple Books through ACX.',
    href: 'https://www.acx.com/mp/how-it-works/authors',
    label: 'Open ACX',
  },
  {
    title: 'Spotify for Authors',
    note: 'Upload and manage audiobooks directly for Spotify listeners.',
    href: 'https://authors.spotify.com/get-started',
    label: 'Open Spotify',
  },
  {
    title: 'KDP audiobook guidance',
    note: 'Amazon KDP routes audiobook production and distribution through ACX.',
    href: 'https://kdp.amazon.com/help/topic/G201014330',
    label: 'Read KDP help',
  },
];

const TRIM_SIZES = [
  { id: '5x8', label: '5 x 8 in', note: 'Fiction and compact paperbacks', wordsPerPage: 250, previewWords: 130, aspect: '5 / 8', previewWidth: '360px', minPages: 24, maxPages: 828 },
  { id: '5_5x8_5', label: '5.5 x 8.5 in', note: 'Literary fiction, poetry, memoir', wordsPerPage: 275, previewWords: 145, aspect: '5.5 / 8.5', previewWidth: '380px', minPages: 24, maxPages: 828 },
  { id: '6x9', label: '6 x 9 in', note: 'Nonfiction, business, memoir', wordsPerPage: 330, previewWords: 170, aspect: '6 / 9', previewWidth: '410px', minPages: 24, maxPages: 828 },
  { id: '7x10', label: '7 x 10 in', note: 'Technical books and workbooks', wordsPerPage: 430, previewWords: 220, aspect: '7 / 10', previewWidth: '450px', minPages: 24, maxPages: 220 },
  { id: '8_5x11', label: '8.5 x 11 in', note: 'Manuals, journals, activity books', wordsPerPage: 620, previewWords: 310, aspect: '8.5 / 11', previewWidth: '500px', minPages: 24, maxPages: 160 },
];

const PRINT_COVER_TRIM_QUERY = {
  '5x8': '5x8',
  '5_5x8_5': '5.5x8.5',
  '6x9': '6x9',
  '7x10': '7x10',
  '8_5x11': '8.5x11',
};

const COVER_PALETTES = [
  { id: 'violet', name: 'Indie Violet', bg: '#4C20C7', bg2: '#8E69E8', ink: '#F9F5FF', muted: '#D9CBFF', accent: '#E6C65A', soft: '#1A0E3F' },
  { id: 'ink', name: 'Literary Ink', bg: '#151121', bg2: '#33284C', ink: '#FFF8EA', muted: '#C9BDD6', accent: '#B88C3D', soft: '#070510' },
  { id: 'sage', name: 'Quiet Sage', bg: '#213D36', bg2: '#CBD8BE', ink: '#FFF9EC', muted: '#DDE5D2', accent: '#E2B866', soft: '#152820' },
  { id: 'press', name: 'Warm Press', bg: '#7A3C32', bg2: '#E5B169', ink: '#FFF8EA', muted: '#F4DABE', accent: '#281815', soft: '#4D251E' },
  { id: 'blue', name: 'Deep Blue', bg: '#0D2D4D', bg2: '#49A6B2', ink: '#F5FBFF', muted: '#CBE7EE', accent: '#E9C25F', soft: '#07192C' },
];

const COVER_TEMPLATES = [
  { id: 'editorial', name: 'Editorial', short: 'Ed', note: 'Serif frame', sample: 'Fiction / Memoir' },
  { id: 'bold', name: 'Bold Type', short: 'Bt', note: 'Big title', sample: 'Nonfiction / Business' },
  { id: 'divider', name: 'Split Field', short: 'Sf', note: 'Two-tone', sample: 'Essays / Guides' },
  { id: 'archive', name: 'Archive', short: 'Ar', note: 'Formal linework', sample: 'History / Research' },
  { id: 'window', name: 'Soft Window', short: 'Sw', note: 'Image-friendly', sample: 'Romance / Poetry' },
];

const COVER_ART_PLACEMENTS = [
  { id: 'window', label: 'Window' },
  { id: 'band', label: 'Band' },
  { id: 'full', label: 'Full bleed' },
];

const COVER_DEVICE_PREVIEWS = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'phone', label: 'Phone' },
];

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

// Advisory-only signal words for the mature-content suggestion in Step 1 —
// this never blocks or auto-sets anything, it just surfaces a dismissible
// suggestion so the author can confirm (or ignore) the mature-content toggle.
const MATURE_CONTENT_SIGNALS = {
  'sexual content':               ['explicit sex', 'graphic sex scene', 'explicit sexual content', 'erotic scene', 'bdsm'],
  'graphic violence':             ['graphic violence', 'brutal torture', 'graphic gore', 'sadistic violence', 'torture scene'],
  'self-harm or substance abuse': ['self-harm', 'suicide attempt', 'drug abuse', 'substance abuse', 'overdose'],
  'strong language':              ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'motherfucker'],
};

function detectMatureContentSignals(text = '') {
  const lower = text.toLowerCase();
  return Object.entries(MATURE_CONTENT_SIGNALS)
    .filter(([, terms]) => terms.some(term => (
      new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)
    )))
    .map(([category]) => category);
}

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
    id: 'indie-romance', legacyId: 'romance', name: 'indie-romance', title: 'Indie Romance', tagline: 'Warm, generous, intimate', icon: 'IR',
    bestFor: 'Romance, memoir, intimate fiction', detail: 'Soft serif rhythm with relaxed spacing for emotionally close prose.',
    cardBg: '#FFF7F4', cardBorder: '#E9C8BC', cardAccent: '#9E4157', cardText: '#3D2330', cardMuted: '#7A5A66',
    sampleFont: "'Fraunces', Georgia, serif",
    theme: 'sepia', font: 'fraunces', size: 'md', spacing: 'normal',
  },
  {
    id: 'indie-fantasy', legacyId: 'fantasy', name: 'indie-fantasy', title: 'Indie Fantasy', tagline: 'Atmospheric, dramatic, deep', icon: 'IF',
    bestFor: 'Fantasy, horror, mythic fiction', detail: 'Dark reading surface with classic type for immersive long reads.',
    cardBg: '#141021', cardBorder: '#3D3560', cardAccent: '#D8B14A', cardText: '#F0DFA7', cardMuted: '#AFA1CA',
    sampleFont: "Georgia, 'Times New Roman', serif",
    theme: 'dark', font: 'georgia', size: 'md', spacing: 'relaxed',
  },
  {
    id: 'indie-classic', legacyId: 'classic', name: 'indie-classic', title: 'Indie Classic', tagline: 'Clean, durable, trade-ready', icon: 'IC',
    bestFor: 'Literary fiction, nonfiction, essays', detail: 'A restrained print-book default with compact margins and crisp contrast.',
    cardBg: '#FFFFFF', cardBorder: '#DAD6E8', cardAccent: '#441CB2', cardText: '#1B1330', cardMuted: '#5C536F',
    sampleFont: "Georgia, 'Times New Roman', serif",
    theme: 'light', font: 'georgia', size: 'sm', spacing: 'compact',
  },
];

// Maps each genre slug (see GENRE_KEYWORDS) to the BOOK_STYLES id whose
// "bestFor" affinity fits it, so Reading Style can default sensibly instead
// of always opening on Indie Romance regardless of the book's genre.
const GENRE_STYLE_MAP = {
  romance: 'indie-romance',
  memoir: 'indie-romance',
  fantasy: 'indie-fantasy',
  horror: 'indie-fantasy',
  'sci-fi': 'indie-fantasy',
  'science-fiction': 'indie-fantasy',
  mystery: 'indie-fantasy',
  thriller: 'indie-fantasy',
  'young-adult': 'indie-fantasy',
  fiction: 'indie-classic',
  nonfiction: 'indie-classic',
  literary: 'indie-classic',
  historical: 'indie-classic',
  biography: 'indie-classic',
  'self-help': 'indie-classic',
  business: 'indie-classic',
  poetry: 'indie-classic',
  children: 'indie-classic',
};

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
      { id: 'amazon',      label: 'Amazon Kindle',       note: 'Largest eBook market — incompatible with Kindle Unlimited (KDP Select) if distributing wide', formats: ['eBook', 'Paperback', 'Hardcover'], timing: '24-72h', payout: 'KDP estimate' },
      { id: 'apple',       label: 'Apple Books',         note: 'Available in 50+ countries, strong in English-speaking markets', formats: ['eBook'], timing: '24-72h', payout: 'Wide retail' },
      { id: 'bn',          label: 'Barnes & Noble NOOK', note: 'Largest US digital bookstore after Amazon', formats: ['eBook'], timing: '24-72h', payout: 'Wide retail' },
      { id: 'kobo',        label: 'Kobo',                note: 'Dominant in Canada, UK, Australia and Europe', formats: ['eBook'], timing: '24-72h', payout: 'Wide retail' },
      { id: 'google-play', label: 'Google Play Books',   note: 'Android ecosystem, 2+ billion users globally', formats: ['eBook'], timing: '24-72h', payout: 'Wide retail' },
      { id: 'scribd',      label: 'Scribd',              note: 'Subscription reading platform, 1M+ subscribers', formats: ['eBook'], timing: '2-5 days', payout: 'Subscription' },
    ],
  },
  {
    group: 'Libraries & Institutions',
    channels: [
      { id: 'overdrive',    label: 'OverDrive / Libby',  note: 'Powers 90% of library digital collections worldwide', formats: ['eBook'], timing: '3-7 days', payout: 'Library terms' },
      { id: 'hoopla',       label: 'Hoopla',             note: 'No waitlists — instant lending from public libraries', formats: ['eBook'], timing: '3-7 days', payout: 'Library terms' },
      { id: 'baker-taylor', label: 'Baker & Taylor',     note: 'Axis360 — major US library distribution network', formats: ['eBook'], timing: '3-7 days', payout: 'Library terms' },
    ],
  },
  {
    group: 'International',
    channels: [
      { id: 'tolino', label: 'Tolino', note: 'Leading eBook platform in Germany, Austria and Switzerland', formats: ['eBook'], timing: '3-7 days', payout: 'Wide retail' },
      { id: 'vivlio', label: 'Vivlio', note: 'Leading eBook platform in France and Belgium', formats: ['eBook'], timing: '3-7 days', payout: 'Wide retail' },
    ],
  },
];

const PRICE_PRESETS = [
  { value: '2.99', label: '$2.99', note: 'entry eBook' },
  { value: '4.99', label: '$4.99', note: 'common indie' },
  { value: '9.99', label: '$9.99', note: 'top KDP 70%' },
  { value: '14.99', label: '$14.99', note: 'print-friendly' },
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

function coverPalette(id) {
  return COVER_PALETTES.find(p => p.id === id) || COVER_PALETTES[0];
}

function coverTemplate(id) {
  return COVER_TEMPLATES.find(t => t.id === id) || COVER_TEMPLATES[0];
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapSvgText(value, maxChars, maxLines) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = '';

  words.forEach(word => {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });

  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const trimmed = lines.slice(0, maxLines);
  trimmed[maxLines - 1] = `${trimmed[maxLines - 1].replace(/\s+\S+$/, '') || trimmed[maxLines - 1]}...`;
  return trimmed;
}

function svgTextBlock(lines, x, y, options = {}) {
  const {
    fill = '#ffffff',
    size = 120,
    weight = 700,
    family = 'Georgia, serif',
    lineHeight = 1.1,
    anchor = 'start',
    letterSpacing = 0,
    transform = '',
  } = options;

  return lines.map((line, i) => (
    `<text x="${x}" y="${y + (i * size * lineHeight)}" fill="${fill}" font-size="${size}" font-weight="${weight}" font-family="${family}" text-anchor="${anchor}" letter-spacing="${letterSpacing}"${transform ? ` transform="${transform}"` : ''}>${escapeXml(line)}</text>`
  )).join('');
}

function svgArtLayer(artDataUrl, placement = 'window', palette) {
  if (!artDataUrl) return '';
  const href = escapeXml(artDataUrl);

  if (placement === 'full') {
    return `
      <image href="${href}" x="0" y="0" width="1600" height="2560" preserveAspectRatio="xMidYMid slice" opacity="0.58" />
      <rect width="1600" height="2560" fill="${palette.bg}" opacity="0.42" />
      <rect width="1600" height="2560" fill="url(#softGlow)" opacity="0.45" />
    `;
  }

  if (placement === 'band') {
    return `
      <image href="${href}" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
      <rect x="0" y="0" width="1600" height="900" fill="${palette.soft}" opacity="0.28" />
      <rect x="0" y="860" width="1600" height="120" fill="${palette.bg}" opacity="0.78" />
    `;
  }

  return `
    <image href="${href}" x="680" y="330" width="760" height="1020" preserveAspectRatio="xMidYMid slice" opacity="0.92" />
    <rect x="680" y="330" width="760" height="1020" fill="${palette.soft}" opacity="0.18" />
    <rect x="680" y="330" width="760" height="1020" fill="none" stroke="${palette.ink}" stroke-width="4" opacity="0.26" />
  `;
}

function buildTemplateCoverSvg({ title, subtitle, author, genreLabel, templateId, paletteId, artDataUrl, artPlacement }) {
  const palette = coverPalette(paletteId);
  const template = coverTemplate(templateId);
  const safeTitle = title?.trim() || 'Your Book Title';
  const safeAuthor = (author?.trim() || 'Author Name').toUpperCase();
  const kicker = (genreLabel || template.sample || 'Indie Book').toUpperCase();
  const titleLines = wrapSvgText(safeTitle, template.id === 'bold' ? 11 : 15, template.id === 'bold' ? 5 : 4);
  const subtitleLines = wrapSvgText(subtitle || '', 26, 2);
  const titleSize = template.id === 'bold' ? 210 : 150;
  const titleY = template.id === 'bold' ? 760 : 1330;
  const titleBlock = svgTextBlock(titleLines, 170, titleY, {
    fill: palette.ink,
    size: titleSize,
    weight: 800,
    family: 'Georgia, serif',
    lineHeight: template.id === 'bold' ? 0.92 : 1.02,
  });
  const subtitleBlock = subtitleLines.length
    ? svgTextBlock(subtitleLines, 170, titleY + (titleLines.length * titleSize * (template.id === 'bold' ? 0.92 : 1.02)) + 96, {
        fill: palette.muted,
        size: 62,
        weight: 400,
        family: 'Arial, sans-serif',
        lineHeight: 1.25,
      })
    : '';
  const authorText = `<text x="170" y="2320" fill="${palette.ink}" font-size="54" font-weight="700" font-family="Arial, sans-serif" letter-spacing="12">${escapeXml(safeAuthor)}</text>`;
  const kickerText = `<text x="170" y="330" fill="${palette.accent}" font-size="42" font-weight="700" font-family="Arial, sans-serif" letter-spacing="10">${escapeXml(kicker)}</text>`;

  const defs = `
    <defs>
      <linearGradient id="coverBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${palette.bg}" />
        <stop offset="100%" stop-color="${palette.bg2}" />
      </linearGradient>
      <radialGradient id="softGlow" cx="72%" cy="32%" r="62%">
        <stop offset="0%" stop-color="${palette.bg2}" stop-opacity="0.95" />
        <stop offset="100%" stop-color="${palette.bg}" stop-opacity="0" />
      </radialGradient>
    </defs>`;

  const common = `
    <rect width="1600" height="2560" fill="url(#coverBg)" />
    <rect x="0" y="0" width="90" height="2560" fill="${palette.soft}" opacity="0.45" />
    <circle cx="1250" cy="520" r="620" fill="url(#softGlow)" opacity="0.55" />
    ${svgArtLayer(artDataUrl, artPlacement, palette)}
  `;

  if (template.id === 'bold') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2560" viewBox="0 0 1600 2560">${defs}
      ${common}
      <path d="M90 380 L1600 120 L1600 0 L90 0 Z" fill="${palette.soft}" opacity="0.42" />
      <rect x="170" y="440" width="1180" height="18" fill="${palette.accent}" />
      ${kickerText}
      ${titleBlock}
      ${subtitleBlock}
      <rect x="170" y="2200" width="900" height="3" fill="${palette.ink}" opacity="0.45" />
      ${authorText}
    </svg>`;
  }

  if (template.id === 'divider') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2560" viewBox="0 0 1600 2560">${defs}
      <rect width="1600" height="1390" fill="${palette.bg}" />
      <rect y="1390" width="1600" height="1170" fill="${palette.bg2}" />
      <rect x="0" y="0" width="90" height="2560" fill="${palette.soft}" opacity="0.45" />
      ${svgArtLayer(artDataUrl, artPlacement, palette)}
      <rect x="170" y="300" width="180" height="8" fill="${palette.accent}" />
      ${kickerText}
      ${titleBlock}
      ${subtitleBlock}
      <rect x="170" y="2200" width="900" height="3" fill="${palette.ink}" opacity="0.45" />
      ${authorText}
    </svg>`;
  }

  if (template.id === 'archive') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2560" viewBox="0 0 1600 2560">${defs}
      ${common}
      <rect x="170" y="250" width="1180" height="2060" rx="8" fill="none" stroke="${palette.ink}" stroke-width="5" opacity="0.42" />
      <rect x="270" y="350" width="980" height="1860" rx="6" fill="none" stroke="${palette.ink}" stroke-width="2" opacity="0.22" />
      <circle cx="760" cy="630" r="110" fill="none" stroke="${palette.accent}" stroke-width="8" opacity="0.78" />
      <text x="760" y="650" fill="${palette.accent}" font-size="58" font-weight="800" font-family="Arial, sans-serif" text-anchor="middle">.in</text>
      <text x="170" y="1030" fill="${palette.accent}" font-size="42" font-weight="700" font-family="Arial, sans-serif" letter-spacing="10">${escapeXml(kicker)}</text>
      ${svgTextBlock(titleLines, 170, 1240, { fill: palette.ink, size: 150, weight: 800, family: 'Georgia, serif', lineHeight: 1.02 })}
      ${subtitleBlock}
      <rect x="170" y="2200" width="900" height="3" fill="${palette.ink}" opacity="0.45" />
      ${authorText}
    </svg>`;
  }

  if (template.id === 'window') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2560" viewBox="0 0 1600 2560">${defs}
      ${common}
      <path d="M575 375 C920 210 1295 430 1390 790 C1525 1305 1085 1570 1290 2160 L375 2160 C210 1640 380 1290 255 920 C160 640 315 500 575 375 Z" fill="${palette.ink}" opacity="0.12" />
      <circle cx="1280" cy="430" r="16" fill="${palette.accent}" opacity="0.9" />
      <circle cx="1350" cy="430" r="16" fill="${palette.accent}" opacity="0.55" />
      <circle cx="1420" cy="430" r="16" fill="${palette.accent}" opacity="0.35" />
      ${kickerText}
      ${titleBlock}
      ${subtitleBlock}
      <rect x="170" y="2200" width="900" height="3" fill="${palette.ink}" opacity="0.45" />
      ${authorText}
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2560" viewBox="0 0 1600 2560">${defs}
    ${common}
    <rect x="170" y="280" width="1180" height="1980" rx="6" fill="none" stroke="${palette.ink}" stroke-width="5" opacity="0.34" />
    <text x="1300" y="340" fill="${palette.accent}" font-size="54" font-weight="800" font-family="Arial, sans-serif" text-anchor="middle">.in</text>
    ${kickerText}
    ${titleBlock}
    ${subtitleBlock}
    <rect x="170" y="2200" width="900" height="3" fill="${palette.ink}" opacity="0.45" />
    ${authorText}
  </svg>`;
}

function CoverTemplatePreview({ title, subtitle, author, genreLabel, templateId, paletteId, artPreview, artPlacement, small = false }) {
  const palette = coverPalette(paletteId);
  const template = coverTemplate(templateId);
  const displayTitle = title?.trim() || 'Your Book Title';
  const displayAuthor = author?.trim() || 'Author Name';

  return (
    <div
      className={`wz-template-cover wz-template-cover--${template.id} ${artPreview ? 'wz-template-cover--has-art' : ''} ${artPreview ? `wz-template-cover--art-${artPlacement || 'window'}` : ''} ${small ? 'wz-template-cover--small' : ''}`}
      style={{
        '--cover-bg': palette.bg,
        '--cover-bg2': palette.bg2,
        '--cover-ink': palette.ink,
        '--cover-muted': palette.muted,
        '--cover-accent': palette.accent,
        '--cover-soft': palette.soft,
      }}
    >
      {artPreview && <span className="wz-template-art" style={{ backgroundImage: `url(${artPreview})` }} />}
      <span className="wz-template-mark">.in</span>
      <span className="wz-template-kicker">{genreLabel || template.sample}</span>
      <h3>{displayTitle}</h3>
      {subtitle?.trim() && <p className="wz-template-subtitle">{subtitle}</p>}
      <span className="wz-template-rule" />
      <span className="wz-template-author">{displayAuthor}</span>
    </div>
  );
}

function CoverPreviewArt({ coverPreview, title, subtitle, author, genreLabel, templateId, paletteId, artPreview, artPlacement }) {
  if (coverPreview) {
    return <img src={coverPreview} alt="Cover" className="wz-cover-preview-img" />;
  }

  return (
    <CoverTemplatePreview
      title={title || 'Your Book Title'}
      subtitle={subtitle}
      author={author}
      genreLabel={genreLabel}
      templateId={templateId}
      paletteId={paletteId}
      artPreview={artPreview}
      artPlacement={artPlacement}
    />
  );
}

function estimatePages(wordCount, wordsPerPage = 250) {
  const words = Number(wordCount) || 0;
  const pageWords = Math.max(1, Number(wordsPerPage) || 250);
  if (words <= 0) return 0;
  return Math.max(1, Math.round(words / pageWords));
}

function trimAvailability(trim, estimatedPages, hasPrintFormat) {
  if (!hasPrintFormat || !estimatedPages) {
    return {
      blocked: false,
      severity: 'neutral',
      label: `~${trim.wordsPerPage} words/page`,
      detail: '',
    };
  }

  if (estimatedPages < trim.minPages) {
    return {
      blocked: true,
      severity: 'error',
      label: `~${estimatedPages} pages`,
      detail: `${trim.label} needs at least ${trim.minPages} print pages.`,
    };
  }

  if (estimatedPages > trim.maxPages) {
    return {
      blocked: true,
      severity: 'error',
      label: `~${estimatedPages} pages`,
      detail: `${trim.label} is best kept under ${trim.maxPages} pages in this workflow.`,
    };
  }

  if (estimatedPages < 48) {
    return {
      blocked: false,
      severity: 'info',
      label: `~${estimatedPages} pages`,
      detail: 'Spine text may not fit below 48 pages.',
    };
  }

  return {
    blocked: false,
    severity: 'ok',
    label: `~${estimatedPages} pages`,
    detail: `Fits the ${trim.minPages}-${trim.maxPages} page range.`,
  };
}

function buildTocEntries(headings, fmPageOffset = 2, wordsPerPage = 250) {
  let cumulativeWords = 0;
  const pageWords = Math.max(1, Number(wordsPerPage) || 250);
  return headings
    .filter(h => h.level <= 2)
    .map((h, i) => {
      const pg = Math.max(1, Math.round(cumulativeWords / pageWords)) + fmPageOffset + 1;
      cumulativeWords += (h.words || 0);
      return { id: `toc-${i}`, level: h.level, label: h.text, estimatedPage: pg, include: true };
    });
}

function mergeTocPageEstimates(entries = [], headings = [], fmPageOffset = 2, wordsPerPage = 250) {
  const fresh = buildTocEntries(headings, fmPageOffset, wordsPerPage);
  return fresh.map((next, i) => {
    const current = entries[i];
    if (!current) return next;
    return {
      ...next,
      id: current.id || next.id,
      label: current.label ?? next.label,
      include: current.include ?? next.include,
    };
  });
}

function sameTocEntries(a = [], b = []) {
  if (a.length !== b.length) return false;
  return a.every((entry, i) => {
    const other = b[i];
    return other
      && entry.id === other.id
      && entry.level === other.level
      && entry.label === other.label
      && entry.estimatedPage === other.estimatedPage
      && entry.include === other.include;
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
  const [publishOutcome, setPublishOutcome] = useState('');
  const [finalReleaseDate, setFinalReleaseDate] = useState('');
  const [draftId,      setDraftId]      = useState(() => localStorage.getItem('ic_draft_id') || null);
  const [msText,       setMsText]       = useState(null);
  const [msHtml,       setMsHtml]       = useState(null);
  const [msStructure,  setMsStructure]  = useState(null);
  const [msPage,       setMsPage]       = useState(0);
  const [msSpread,     setMsSpread]     = useState(false);
  const [pageTurnDir,  setPageTurnDir]  = useState('');
  const [msLoading,    setMsLoading]    = useState(false);
  const [authorProfile,setAuthorProfile]= useState(null);
  const [authorProfileLoading, setAuthorProfileLoading] = useState(() => Boolean(user?.id));
  const [coverPreviewDevice, setCoverPreviewDevice] = useState('desktop');
  const [matureSuggestionDismissed, setMatureSuggestionDismissed] = useState(false);
  const [bsPage,        setBsPage]        = useState(0);
  const [bsPageTurnDir, setBsPageTurnDir] = useState('');
  const [styleOpen,     setStyleOpen]     = useState(false);
  const fileRef  = useRef(null);
  const coverRef = useRef(null);
  const coverArtRef = useRef(null);
  const pageTurnTimerRef = useRef(null);
  const bsPageTurnTimerRef = useRef(null);
  const bsTouchStartXRef = useRef(null);
  const styleTouchedRef = useRef(false);
  const styleDropdownRef = useRef(null);

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
    description: '', audience: 'adult', matureContent: false,
    storyPremise: '', storyReader: '', storyPromise: '', storyThemes: '', storyTone: 'clear',
    genre: '', genreSecondary: '', keywords: [], tags: [],
    pubYear: String(new Date().getFullYear()), publisher: 'Self-published', pageCount: '',
    isbnOption: 'skip', isbn: '',
    manuscriptFile: null, manuscriptPath: '', formats: ['eBook'], trimSize: '5x8',
    pTheme: 'light', pFont: 'fraunces', pSize: 'md', pSpacing: 'normal',
    coverFile: null, coverPreview: '', coverDataUrl: '', coverColor: 'cover-clay',
    coverMode: 'template', coverTemplate: 'editorial', coverPalette: 'violet',
    coverArtFile: null, coverArtPreview: '', coverArtDataUrl: '', coverArtPlacement: 'window',
    price: '', isFree: false, buyUrl: '', buyPlatform: 'own',
    retailerLinks: [],
    releasePlan: 'schedule', releaseDate: dateInputFromNow(DEFAULT_RELEASE_LEAD_DAYS),
    bookStyle: 'indie-romance',
    distributionChannels: [],
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

  const authorProfileBio = (authorProfile?.long_bio || authorProfile?.short_bio || '').trim();
  const authorProfileBioSource = authorProfile?.long_bio?.trim()
    ? 'Full bio from your author profile'
    : authorProfile?.short_bio?.trim()
      ? 'Short bio from your author profile'
      : '';
  const selectedTrim = TRIM_SIZES.find(t => t.id === fd.trimSize) || TRIM_SIZES[0];
  const audienceLabel = AUDIENCES.find(a => a.value === fd.audience)?.label || '';
  const estimatedTrimPages = estimatePages(msStructure?.wordCount, selectedTrim.wordsPerPage);
  const resolvedSelectedPages = Number.parseInt(fd.pageCount, 10) || estimatedTrimPages;
  const pageCountDisplay = fd.pageCount || (estimatedTrimPages ? `~${estimatedTrimPages} estimated` : '');
  const hasPrintFormat = fd.formats.some(f => ['Paperback', 'Hardcover'].includes(f));
  const audiobookOnly = fd.formats.length === 1 && fd.formats.includes('Audiobook');
  const trimChecks = useMemo(() => (
    TRIM_SIZES.map(trim => {
      const estimatedPages = estimatePages(msStructure?.wordCount, trim.wordsPerPage);
      return {
        trim,
        estimatedPages,
        availability: trimAvailability(trim, estimatedPages, hasPrintFormat),
      };
    })
  ), [msStructure?.wordCount, hasPrintFormat]);
  const selectedTrimAvailability = trimAvailability(selectedTrim, resolvedSelectedPages, hasPrintFormat);
  const minReleaseDate = dateInputFromNow(RELEASE_LEAD_DAYS);
  const releasePlan = fd.releasePlan || 'schedule';
  const releaseDate = fd.releaseDate || dateInputFromNow(DEFAULT_RELEASE_LEAD_DAYS);
  const releaseDateInvalid = releasePlan === 'schedule' && (!releaseDate || releaseDate < minReleaseDate);
  const releaseSummary = releasePlan === 'now'
    ? 'Publish today'
    : releasePlan === 'schedule'
      ? `Scheduled for ${formatDateInput(releaseDate)}`
      : 'Private draft';
  const royaltyEstimate = useMemo(() => calculateRoyaltyEstimates({
    price: fd.price,
    isFree: fd.isFree,
    formats: fd.formats,
    pageCount: resolvedSelectedPages,
    trimSize: selectedTrim.id,
    distributionChannels: fd.distributionChannels,
  }), [
    fd.price,
    fd.isFree,
    fd.formats,
    resolvedSelectedPages,
    selectedTrim.id,
    fd.distributionChannels,
  ]);
  const flatDistributionChannels = useMemo(() => DISTRIBUTION_CHANNELS.flatMap(group => group.channels), []);
  const selectedDistributionChannels = useMemo(() => (
    (fd.distributionChannels || [])
      .map(id => flatDistributionChannels.find(ch => ch.id === id))
      .filter(Boolean)
  ), [fd.distributionChannels, flatDistributionChannels]);
  const parsedListPrice = Number.parseFloat(fd.price);
  const priceStatusLabel = fd.isFree
    ? 'Free'
    : Number.isFinite(parsedListPrice) && parsedListPrice > 0
      ? formatRoyaltyMoney(parsedListPrice)
      : 'Not set';
  const formatSummaryLabel = fd.formats.length ? fd.formats.join(', ') : 'None selected';
  const bestRoyaltyLabel = royaltyEstimate.best
    ? `${formatRoyaltyMoney(royaltyEstimate.best.authorEarnings)} via ${royaltyEstimate.best.channel}`
    : fd.isFree
      ? 'Free listing'
      : 'Set a price to estimate';
  const distributionModeLabel = selectedDistributionChannels.length === 0
    ? 'Indie Converters only'
    : selectedDistributionChannels.length === 1 && selectedDistributionChannels[0].id === 'amazon'
      ? 'Amazon only'
      : selectedDistributionChannels.some(ch => ['overdrive', 'hoopla', 'baker-taylor', 'tolino', 'vivlio'].includes(ch.id))
        ? 'Wide plus libraries'
        : 'Major retailers';
  const hasEbookOnlyDistribution = hasPrintFormat && selectedDistributionChannels.some(ch => (
    (ch.formats || []).length === 1 && ch.formats[0] === 'eBook'
  ));
  const printCoverTrimId = PRINT_COVER_TRIM_QUERY[selectedTrim.id] || selectedTrim.id;
  const printCoverTrim = TRIM_SIZE_OPTIONS.find(option => option.id === printCoverTrimId)
    || TRIM_SIZE_OPTIONS.find(option => option.id === '6x9')
    || TRIM_SIZE_OPTIONS[0];
  const printCoverBindingType = fd.formats.includes('Hardcover') && !fd.formats.includes('Paperback') ? 'hardcover' : 'paperback';
  const printCoverEstimate = useMemo(() => (
    hasPrintFormat
      ? calculatePrintCover({
          bindingType: printCoverBindingType,
          trimWidth: printCoverTrim.width,
          trimHeight: printCoverTrim.height,
          interiorType: 'blackWhite',
          paperType: 'white',
          pageCount: resolvedSelectedPages || 0,
        })
      : null
  ), [hasPrintFormat, printCoverBindingType, printCoverTrim.height, printCoverTrim.width, resolvedSelectedPages]);
  const printCoverCalculatorPath = useMemo(() => {
    const params = new URLSearchParams();
    params.set('source', 'upload');
    params.set('trim', printCoverTrimId);
    params.set('binding', printCoverBindingType);
    params.set('interior', 'blackWhite');
    params.set('paper', 'white');
    if (resolvedSelectedPages) params.set('pages', String(resolvedSelectedPages));
    return `/tools/print-cover-calculator?${params.toString()}`;
  }, [printCoverBindingType, printCoverTrimId, resolvedSelectedPages]);
  const manuscriptFileName = fd.manuscriptFile?.name
    || fd.manuscriptPath?.split('/').pop()?.replace(/^\d+-/, '')
    || '';
  const manuscriptIssues = useMemo(() => {
    if (!msStructure) return [];
    if (msStructure.issues?.some(i => i.type === 'unsupported')) return msStructure.issues;
    return validateManuscript({
      headings: msStructure.headings || [],
      wordCount: msStructure.wordCount || 0,
      paragraphCount: msStructure.paragraphCount || 0,
      maxBlankRun: msStructure.maxBlankRun || 0,
      fileSize: msStructure.fileSize || fd.manuscriptFile?.size || 0,
      wordsPerPage: selectedTrim.wordsPerPage,
    });
  }, [msStructure, fd.manuscriptFile?.size, selectedTrim.wordsPerPage]);

  // Advisory mature-content scan — description is cheap and re-scanned live;
  // the manuscript is scanned once per upload, not on every keystroke, since
  // msText can be the whole book.
  const descriptionMatureSignals = useMemo(() => detectMatureContentSignals(fd.description), [fd.description]);
  const manuscriptMatureSignals  = useMemo(() => detectMatureContentSignals(msText || ''), [msText]);
  const matureSignals = useMemo(() => (
    [...new Set([...descriptionMatureSignals, ...manuscriptMatureSignals])]
  ), [descriptionMatureSignals, manuscriptMatureSignals]);

  useEffect(() => {
    if (!hasPrintFormat || !msStructure?.wordCount) return;
    const current = trimChecks.find(check => check.trim.id === fd.trimSize);
    if (!current?.availability.blocked) return;
    const next = trimChecks.find(check => !check.availability.blocked);
    if (next) setFd(p => (p.trimSize === next.trim.id ? p : { ...p, trimSize: next.trim.id }));
  }, [fd.trimSize, hasPrintFormat, msStructure?.wordCount, trimChecks]);

  // Auto-enable the Table of Contents once manuscript headings are detected —
  // it's free to generate, so it should be "pre-filled" like the wizard promises.
  // Only fires the first time (entries.length > 0 means the author already has
  // a TOC state, whether auto-built or manually reset — don't override that).
  useEffect(() => {
    if (!msStructure?.headings?.length) return;
    setFd(p => {
      if (p.frontMatter.toc.entries.length > 0) return p;
      const fmOffset = Object.values(p.frontMatter).filter(v => v.enabled).length + 1;
      return {
        ...p,
        frontMatter: {
          ...p.frontMatter,
          toc: { enabled: true, entries: buildTocEntries(msStructure.headings, fmOffset, selectedTrim.wordsPerPage) },
        },
      };
    });
  }, [msStructure?.headings, selectedTrim.wordsPerPage]);

  // Default Reading Style to whichever template's "bestFor" matches the chosen
  // genre, instead of always opening on Indie Romance. Stops as soon as the
  // author manually picks a style (or a saved draft is restored) — see
  // styleTouchedRef.
  useEffect(() => {
    if (styleTouchedRef.current || !fd.genre) return;
    const matchedId = GENRE_STYLE_MAP[fd.genre];
    const matched = matchedId && BOOK_STYLES.find(s => s.id === matchedId);
    if (!matched || matched.id === fd.bookStyle) return;
    setFd(p => ({ ...p, bookStyle: matched.id, pTheme: matched.theme, pFont: matched.font, pSize: matched.size, pSpacing: matched.spacing }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fd.genre]);

  function up(key, val) { setFd(p => ({ ...p, [key]: val })); setStepError(''); }

  // Toggling mature content on always pins the target audience to Adult (18+) —
  // the two are linked by definition. Turning it off hands audience back to
  // the author rather than guessing, since a book can be Adult without being mature.
  function setMatureContent(value) {
    setFd(p => ({ ...p, matureContent: value, audience: value ? 'adult' : p.audience }));
    setStepError('');
  }

  function useStoryDraft({ append = false } = {}) {
    if (!storyDraft.trim()) return;
    setFd(p => {
      const next = append && p.description.trim()
        ? `${p.description.trim()}\n\n${storyDraft.trim()}`
        : storyDraft.trim();
      return { ...p, description: next.slice(0, 4000) };
    });
    setStepError('');
  }

  function clearStoryBuilder() {
    setFd(p => ({
      ...p,
      storyPremise: '',
      storyReader: '',
      storyPromise: '',
      storyThemes: '',
      storyTone: 'clear',
    }));
    setStepError('');
  }

  function toggleFormat(format, checked) {
    setStepError('');
    setFd(p => {
      if (format === 'Audiobook') {
        return { ...p, formats: checked ? ['Audiobook'] : [] };
      }
      const withoutAudio = p.formats.filter(f => f !== 'Audiobook');
      const next = checked
        ? Array.from(new Set([...withoutAudio, format]))
        : withoutAudio.filter(f => f !== format);
      return { ...p, formats: next };
    });
  }

  function clearManuscriptUpload() {
    setFd(p => ({ ...p, manuscriptFile: null, manuscriptPath: '', pageCount: '' }));
    setMsStructure(null);
    setMsHtml(null);
    setMsText(null);
    setMsPage(0);
  }

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
      content = section === 'backMatter' && key === 'aboutAuthor' && authorProfileBio
        ? authorProfileBio
        : item?.template(fd, authorName, fd.pubYear || String(new Date().getFullYear())) || '';
    }
    upMatter(section, key, 'enabled', newEnabled);
    if (newEnabled && !current.content) upMatter(section, key, 'content', content);
  }

  // ── Layout analysis ───────────────────────────────────────────
  function applyStyle(style) {
    styleTouchedRef.current = true;
    setFd(p => ({ ...p, bookStyle: style.id, pTheme: style.theme, pFont: style.font, pSize: style.size, pSpacing: style.spacing }));
    setMsPage(0); setMsSpread(false);
  }

  // Heading-aware pagination: walks the same structured blocks analyseHtml/
  // analyseTxt already parsed (real <h1>-<h4> tags for .docx, blank-line
  // isolation for .txt/.rtf), so a chapter heading always opens a fresh page
  // and is never mistaken for an ordinary first sentence.
  const msPages = useMemo(() => {
    const blocks = msStructure?.blocks;
    if (!blocks?.length) return [];
    const targetWords = selectedTrim.previewWords || 130;
    const pages = [];
    let current = null;
    let wc = 0;

    function closeCurrent() {
      if (current && (current.headingBlock || current.paras.length > 0)) pages.push(current);
    }

    for (const block of blocks) {
      if (block.type === 'heading') {
        closeCurrent();
        current = { headingBlock: { level: block.level, text: block.text }, paras: [] };
        wc = 0;
        continue;
      }
      const w = block.text.split(/\s+/).length;
      if (!current) current = { headingBlock: null, paras: [] };
      if (wc + w > targetWords && current.paras.length > 0) {
        closeCurrent();
        current = { headingBlock: null, paras: [block.text] };
        wc = w;
      } else {
        current.paras.push(block.text);
        wc += w;
      }
    }
    closeCurrent();
    return pages;
  }, [msStructure?.blocks, selectedTrim.previewWords]);

  function turnReadingPage(direction) {
    if (!msPages.length || msLoading || pageTurnDir) return;
    const targetPage = direction === 'next'
      ? Math.min(msPages.length - 1, msPage + 1)
      : Math.max(0, msPage - 1);
    if (targetPage === msPage) return;

    if (pageTurnTimerRef.current) window.clearTimeout(pageTurnTimerRef.current);
    setPageTurnDir(direction);
    pageTurnTimerRef.current = window.setTimeout(() => {
      setMsPage(targetPage);
      pageTurnTimerRef.current = window.setTimeout(() => {
        setPageTurnDir('');
        pageTurnTimerRef.current = null;
      }, 360);
    }, 180);
  }

  useEffect(() => {
    setMsPage(0);
  }, [fd.trimSize]);

  useEffect(() => () => {
    if (pageTurnTimerRef.current) window.clearTimeout(pageTurnTimerRef.current);
  }, []);

  // ── Book Structure preview: the whole assembled book, cover → front matter → manuscript → back matter ──
  const bookStructurePages = useMemo(() => {
    const pages = [{ type: 'cover' }];

    FM_ITEMS.forEach(item => {
      const data = fd.frontMatter[item.key];
      if (!data?.enabled) return;
      if (item.isToc) {
        const included = (data.entries || []).filter(e => e.include);
        if (included.length > 0) pages.push({ type: 'toc', label: item.label, entries: included });
        return;
      }
      if (data.content?.trim()) pages.push({ type: 'matter', label: item.label, content: data.content });
    });

    msPages.forEach(msPage => pages.push({ type: 'manuscript', headingBlock: msPage.headingBlock, paras: msPage.paras }));

    BM_ITEMS.forEach(item => {
      const data = fd.backMatter[item.key];
      if (!data?.enabled) return;
      if (data.content?.trim()) pages.push({ type: 'matter', label: item.label, content: data.content });
    });

    return pages;
  }, [fd.frontMatter, fd.backMatter, msPages]);

  // Jump-list targets: every front/back-matter page, the ToC page, and each
  // detected chapter opening in the manuscript (continuation pages are skipped
  // so the list stays short).
  const bookStructureJumpTargets = useMemo(() => (
    bookStructurePages
      .map((page, index) => {
        if (page.type === 'cover') return { index, label: 'Cover' };
        if (page.type !== 'manuscript') return { index, label: page.label };
        if (page.headingBlock) {
          const heading = formatChapterHeading(page.headingBlock.text);
          return { index, label: heading.label && heading.title ? `${heading.label}: ${heading.title}` : (heading.label || heading.title) };
        }
        const isFirstManuscriptPage = index === 0 || bookStructurePages[index - 1].type !== 'manuscript';
        return isFirstManuscriptPage ? { index, label: 'Manuscript' } : null;
      })
      .filter(Boolean)
  ), [bookStructurePages]);

  function turnBookStructurePage(direction) {
    if (!bookStructurePages.length || bsPageTurnDir) return;
    const targetPage = direction === 'next'
      ? Math.min(bookStructurePages.length - 1, bsPage + 1)
      : Math.max(0, bsPage - 1);
    if (targetPage === bsPage) return;

    if (bsPageTurnTimerRef.current) window.clearTimeout(bsPageTurnTimerRef.current);
    setBsPageTurnDir(direction);
    bsPageTurnTimerRef.current = window.setTimeout(() => {
      setBsPage(targetPage);
      bsPageTurnTimerRef.current = window.setTimeout(() => {
        setBsPageTurnDir('');
        bsPageTurnTimerRef.current = null;
      }, 360);
    }, 180);
  }

  function jumpToBookStructurePage(index) {
    if (bsPageTurnTimerRef.current) window.clearTimeout(bsPageTurnTimerRef.current);
    setBsPageTurnDir('');
    setBsPage(index);
  }

  // Swipe to turn pages on touch devices — this is the final read-through, so
  // it should feel like flicking through a real book, not just tapping arrows.
  function handleBsTouchStart(e) {
    bsTouchStartXRef.current = e.touches[0].clientX;
  }
  function handleBsTouchEnd(e) {
    const startX = bsTouchStartXRef.current;
    bsTouchStartXRef.current = null;
    if (startX === null) return;
    const deltaX = e.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) turnBookStructurePage('next');
    else turnBookStructurePage('prev');
  }

  // Keep bsPage in range if a front/back-matter item gets disabled while it's showing
  useEffect(() => {
    setBsPage(p => Math.min(p, Math.max(0, bookStructurePages.length - 1)));
  }, [bookStructurePages.length]);

  useEffect(() => () => {
    if (bsPageTurnTimerRef.current) window.clearTimeout(bsPageTurnTimerRef.current);
  }, []);

  // Close the reading-style dropdown on outside click
  useEffect(() => {
    if (!styleOpen) return;
    function handler(e) {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(e.target)) {
        setStyleOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [styleOpen]);

  useEffect(() => {
    if (!msStructure?.headings?.length) return;
    setFd(p => {
      const toc = p.frontMatter.toc;
      if (!toc?.enabled || !toc.entries?.length) return p;
      const fmOffset = Object.values(p.frontMatter).filter(v => v.enabled).length + 1;
      const entries = mergeTocPageEstimates(toc.entries, msStructure.headings, fmOffset, selectedTrim.wordsPerPage);
      if (sameTocEntries(toc.entries, entries)) return p;
      return {
        ...p,
        frontMatter: {
          ...p.frontMatter,
          toc: {
            ...toc,
            entries,
          },
        },
      };
    });
  }, [fd.frontMatter, msStructure?.headings, selectedTrim.wordsPerPage]);

  useEffect(() => {
    supabase.from('genres').select('slug, label').order('label').then(({ data }) => {
      if (data) setGenres(data);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    setAuthorProfileLoading(true);
    supabase
      .from('authors')
      .select('display_name, short_bio, long_bio, website_url, goodreads_url, location')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.warn('[author profile] load failed:', error.message);
        if (!cancelled) setAuthorProfile(data || null);
      })
      .finally(() => {
        if (!cancelled) setAuthorProfileLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.id]);

  // Auto-fill matter + fetch manuscript text for Reading Style preview
  useEffect(() => {
    if (step === 8 && !fd.frontMatter.copyright.content) {
      upMatter('frontMatter', 'copyright', 'content',
        FM_ITEMS[0].template(fd, authorName, fd.pubYear || String(new Date().getFullYear())));
    }
    if (step === 8 && !fd.backMatter.aboutAuthor.content && !authorProfileLoading) {
      upMatter('backMatter', 'aboutAuthor', 'content', authorProfileBio || BM_ITEMS[0].template(fd, authorName));
    }
    if ((step === 4 || step === 9) && fd.manuscriptPath && !msText && !msLoading) {
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
  }, [step, authorProfileLoading, authorProfileBio]);

  // Auto-save progress to localStorage on step change
  useEffect(() => {
    if (step === 11) return;
    if (!fd.title && !fd.manuscriptPath) return;
    try {
      localStorage.setItem('ic_wizard_progress', JSON.stringify({
        fd: { ...fd, coverFile: null, manuscriptFile: null, coverPreview: '', coverDataUrl: '', coverArtFile: null, coverArtPreview: '', coverArtDataUrl: '' },
        step,
        savedAt: Date.now(),
      }));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const primaryGenreLabel = genres.find(g => g.slug === fd.genre)?.label || '';
  const storyDraft = useMemo(() => buildStoryDraft(fd, {
    authorName,
    genreLabel: primaryGenreLabel,
    audienceLabel,
  }), [
    fd.title,
    fd.subtitle,
    fd.storyPremise,
    fd.storyReader,
    fd.storyPromise,
    fd.storyThemes,
    fd.storyTone,
    authorName,
    primaryGenreLabel,
    audienceLabel,
  ]);
  const selectedTemplate = coverTemplate(fd.coverTemplate);
  const stepGroups = WIZARD_STEPS.reduce((acc, item, index) => {
    const last = acc[acc.length - 1];
    if (last?.label === item.group) last.steps.push({ item, index });
    else acc.push({ label: item.group, steps: [{ item, index }] });
    return acc;
  }, []);

  // ── Validation ────────────────────────────────────────────────
  function validate(s) {
    if (s === 0 && !fd.title.trim())       return 'Book title is required.';
    if (s === 1 && !fd.description.trim()) return 'Description is required.';
    if (s === 1 && !fd.genre)              return 'Please select a primary genre.';
    if (s === 2 && !fd.pubYear)            return 'Publication year is required.';
    if (s === 2 && (fd.isbnOption === 'own' || fd.isbnOption === 'register')) {
      if (!fd.isbn.trim())                 return 'Enter your ISBN-13.';
      if (!isValidISBN13(fd.isbn))         return 'Invalid ISBN-13 — check the number and try again.';
    }
    if (s === 3 && fd.formats.length === 0) return 'Choose at least one format for this book.';
    if (s === 3 && audiobookOnly)          return 'Audiobook production is not available in this upload flow. Use one of the audiobook services listed here, or choose eBook, paperback, or hardcover to continue.';
    if (s === 3 && !fd.manuscriptPath)     return 'Upload your manuscript before continuing.';
    if (s === 3 && hasPrintFormat && selectedTrimAvailability.blocked) {
      return selectedTrimAvailability.detail;
    }
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
        setMsHtml(html); setMsStructure(analyseHtml(html, file.size, { wordsPerPage: selectedTrim.wordsPerPage })); setMsText(rawText);
      } else if (ext === 'txt' || ext === 'rtf') {
        const text = await file.text();
        setMsText(text); setMsStructure(analyseTxt(text, file.size, { wordsPerPage: selectedTrim.wordsPerPage }));
        const safeHtml = text.split(/\n{2,}/).map(p =>
          `<p>${p.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`
        ).join('\n');
        setMsHtml(safeHtml);
      } else {
        setMsStructure({ headings: [], wordCount: 0, paragraphCount: 0, estimatedPages: 0,
          maxBlankRun: 0, fileSize: file.size,
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

  function chooseCoverMode(mode) {
    setStepError('');
    setFd(p => mode === 'template'
      ? { ...p, coverMode: 'template', coverFile: null, coverPreview: '', coverDataUrl: '' }
      : { ...p, coverMode: 'upload' }
    );
  }

  function handleCover(file) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setStepError('Cover must be a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStepError(`Cover is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please upload an image under 5 MB.`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setFd(p => ({ ...p, coverMode: 'upload', coverFile: file, coverPreview: previewUrl, coverDataUrl: '' }));
    const reader = new FileReader();
    reader.onload = () => setFd(p => ({ ...p, coverDataUrl: reader.result || '' }));
    reader.readAsDataURL(file);
    setStepError('');
  }

  function handleCoverArt(file) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setStepError('Artwork must be a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setStepError(`Artwork is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please use an image under 3 MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFd(p => ({
        ...p,
        coverMode: 'template',
        coverArtFile: file,
        coverArtPreview: reader.result,
        coverArtDataUrl: reader.result,
      }));
      setStepError('');
    };
    reader.onerror = () => setStepError('Could not read that artwork image. Try another file.');
    reader.readAsDataURL(file);
  }

  function handleBookPreviewPointerMove(e) {
    if (e.pointerType === 'touch') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    e.currentTarget.style.setProperty('--book-rotate-x', `${(0.8 - y * 5).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--book-rotate-y', `${(-2.5 + x * 6).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--book-lift', '-6px');
    e.currentTarget.style.setProperty('--book-glare-x', `${((x + 0.5) * 100).toFixed(0)}%`);
    e.currentTarget.style.setProperty('--book-glare-y', `${((y + 0.5) * 100).toFixed(0)}%`);
  }

  function resetBookPreviewTilt(e) {
    e.currentTarget.style.removeProperty('--book-rotate-x');
    e.currentTarget.style.removeProperty('--book-rotate-y');
    e.currentTarget.style.removeProperty('--book-lift');
    e.currentTarget.style.removeProperty('--book-glare-x');
    e.currentTarget.style.removeProperty('--book-glare-y');
  }

  function clearCoverArt() {
    setFd(p => ({ ...p, coverArtFile: null, coverArtPreview: '', coverArtDataUrl: '' }));
    setStepError('');
  }

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

  async function uploadCoverAsset({ optional = false } = {}) {
    const fail = (error) => {
      if (optional) return null;
      throw new Error(`Cover: ${error.message}`);
    };

    if (fd.coverFile) {
      const cleanName = fd.coverFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${user.id}/${Date.now()}-${cleanName}`;
      const options = fd.coverFile.type ? { contentType: fd.coverFile.type } : undefined;
      const { error } = await supabase.storage.from('covers').upload(path, fd.coverFile, options);
      if (error) return fail(error);
      return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
    }

    const svg = buildTemplateCoverSvg({
      title: fd.title,
      subtitle: fd.subtitle,
      author: authorName,
      genreLabel: primaryGenreLabel,
      templateId: fd.coverTemplate,
      paletteId: fd.coverPalette,
      artDataUrl: fd.coverArtDataUrl,
      artPlacement: fd.coverArtPlacement,
    });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const base = slugify(fd.title || 'cover') || 'cover';
    const path = `${user.id}/${Date.now()}-${base}-${fd.coverTemplate || 'template'}.svg`;
    const { error } = await supabase.storage.from('covers').upload(path, blob, { contentType: 'image/svg+xml' });
    if (error) return fail(error);
    return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl;
  }

  // ── Save as Draft ─────────────────────────────────────────────
  async function handleSaveDraft() {
    if (!fd.title.trim()) { setStepError('Add a book title before saving.'); return; }
    setSavingDraft(true);
    try {
      const coverUrl = await uploadCoverAsset({ optional: true });
      const resolvedPageCount = fd.pageCount ? parseInt(fd.pageCount, 10) : (estimatedTrimPages || null);
      const bookData = {
        title: fd.title, subtitle: fd.subtitle || null, description: fd.description || null,
        cover_url: coverUrl, formats: fd.formats, keywords: fd.keywords,
        is_published: false, author_user_id: user.id, manuscript_path: fd.manuscriptPath || null,
        pub_year: fd.pubYear ? parseInt(fd.pubYear) : null, page_count: resolvedPageCount,
        trim_size: selectedTrim.id,
        isbn_13: (fd.isbnOption === 'own' || fd.isbnOption === 'register') && fd.isbn ? fd.isbn.replace(/[-\s]/g, '') : null,
        language: fd.language, publisher_name: fd.publisher || null,
        price: fd.isFree ? 0 : (fd.price ? parseFloat(fd.price) : null),
        front_matter: buildMatter(FM_ITEMS, fd.frontMatter), back_matter: buildMatter(BM_ITEMS, fd.backMatter),
        distribution_channels: fd.distributionChannels, draft_step: step,
        audience: fd.audience, mature_content: fd.matureContent,
        reading_style: { style: fd.bookStyle, theme: fd.pTheme, font: fd.pFont, size: fd.pSize, spacing: fd.pSpacing },
      };
      let bookId = draftId;
      if (draftId) {
        await supabase.from('books').update(bookData).eq('id', draftId).eq('author_user_id', user.id);
      } else {
        const bookSlug = `draft-${slugify(fd.title)}-${Date.now()}`;
        const { data: book, error: be } = await supabase.from('books').insert({ slug: bookSlug, ...bookData }).select('id').single();
        if (be) throw new Error(be.message);
        bookId = book.id;
        setDraftId(book.id);
        localStorage.setItem('ic_draft_id', book.id);
      }
      for (const rl of fd.retailerLinks.filter(l => l.url?.trim())) {
        const { data: retailer } = await supabase.from('retailers').select('id').eq('slug', rl.retailer).maybeSingle();
        if (!retailer) continue;
        await supabase.from('book_retailer_links').upsert(
          {
            book_id: bookId, retailer_id: retailer.id, url: rl.url.trim(),
            price: rl.price ? parseFloat(rl.price) : null,
            source: 'author', price_updated_at: new Date().toISOString(),
          },
          { onConflict: 'book_id,retailer_id' }
        );
      }
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } catch (err) { setStepError(err.message); } finally { setSavingDraft(false); }
  }

  // ── Publish ───────────────────────────────────────────────────
  async function handlePublish(mode = releasePlan) {
    setPublishError(''); setPublishing(true);
    try {
      if (mode === 'schedule' && releaseDateInvalid) {
        throw new Error(`Choose a release date at least ${RELEASE_LEAD_DAYS} days from today.`);
      }
      const coverUrl = await uploadCoverAsset();
      const resolvedPageCount = fd.pageCount ? parseInt(fd.pageCount, 10) : (estimatedTrimPages || null);
      const isPublishingNow = mode === 'now';
      const resolvedPubDate = mode === 'schedule'
        ? releaseDate
        : isPublishingNow
          ? dateInputFromNow(0)
          : null;
      const resolvedPubYear = resolvedPubDate
        ? parseInt(resolvedPubDate.slice(0, 4), 10)
        : (fd.pubYear ? parseInt(fd.pubYear) : null);
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
        keywords: fd.keywords, is_published: isPublishingNow, author_user_id: user.id,
        manuscript_path: fd.manuscriptPath,
        pub_date: resolvedPubDate,
        pub_year: resolvedPubYear,
        page_count: resolvedPageCount,
        trim_size: selectedTrim.id,
        isbn_13: (fd.isbnOption === 'own' || fd.isbnOption === 'register') && fd.isbn ? fd.isbn.replace(/[-\s]/g, '') : null,
        language: fd.language, publisher_name: fd.publisher || null,
        price: fd.isFree ? 0 : (fd.price ? parseFloat(fd.price) : null),
        front_matter: buildMatter(FM_ITEMS, fd.frontMatter), back_matter: buildMatter(BM_ITEMS, fd.backMatter),
        distribution_channels: fd.distributionChannels,
        audience: fd.audience, mature_content: fd.matureContent,
        reading_style: { style: fd.bookStyle, theme: fd.pTheme, font: fd.pFont, size: fd.pSize, spacing: fd.pSpacing },
      }).select('id').single();
      if (be) throw new Error(`Book: ${be.message}`);

      await supabase.from('books_authors').insert({ book_id: book.id, author_id: author.id, position: 1 });

      const genres2 = [fd.genre, fd.genreSecondary !== fd.genre ? fd.genreSecondary : ''].filter(Boolean);
      for (const gs of genres2) {
        const { data: gr } = await supabase.from('genres').select('id').eq('slug', gs).maybeSingle();
        if (gr) await supabase.from('books_genres').insert({ book_id: book.id, genre_id: gr.id });
      }
      for (const rl of fd.retailerLinks.filter(l => l.url?.trim())) {
        const { data: retailer } = await supabase.from('retailers').select('id').eq('slug', rl.retailer).maybeSingle();
        if (!retailer) continue;
        const { error: rle } = await supabase.from('book_retailer_links').insert({
          book_id: book.id, retailer_id: retailer.id, url: rl.url.trim(),
          price: rl.price ? parseFloat(rl.price) : null,
          source: 'author', price_updated_at: new Date().toISOString(),
        });
        if (rle) throw new Error(`Retailer link (${rl.retailer}): ${rle.message}`);
      }

      localStorage.removeItem('ic_draft_id');
      localStorage.removeItem('ic_wizard_progress');
      setPublishedSlug(bookSlug);
      setSavedAsDraft(!isPublishingNow);
      setPublishOutcome(mode);
      setFinalReleaseDate(resolvedPubDate || '');
      setStep(11);
    } catch (err) { setPublishError(err.message); } finally { setPublishing(false); }
  }

  // ── Preview theme/font lookups ────────────────────────────────
  const theme   = PREVIEW_THEMES.find(t => t.id === fd.pTheme) || PREVIEW_THEMES[0];
  const fontCss = PREVIEW_FONTS.find(f => f.id === fd.pFont)?.css || PREVIEW_FONTS[0].css;
  const sizeObj = PREVIEW_SIZES.find(s => s.id === fd.pSize) || PREVIEW_SIZES[1];
  const padObj  = PREVIEW_SPACING.find(s => s.id === fd.pSpacing) || PREVIEW_SPACING[1];

  // ── Live format-vs-structure checks ──────────────────────────
  const formatIssues = (() => {
    if (!resolvedSelectedPages) return [];
    const pg        = resolvedSelectedPages;
    const printFmts = fd.formats.filter(f => ['Paperback', 'Hardcover'].includes(f));
    const out       = [];
    if (printFmts.length > 0 && selectedTrimAvailability.blocked) {
      out.push({ type: 'print-trim-fit', severity: 'error',
        message: `${selectedTrimAvailability.label} at ${selectedTrim.label}: ${selectedTrimAvailability.detail}` });
    }
    if (fd.formats.includes('Paperback') && pg >= 24 && pg < 48) {
      out.push({ type: 'no-spine-text', severity: 'info',
        message: `At ~${pg} pages your paperback spine will be too narrow for lettering — KDP and IngramSpark require 48+ pages for spine text. Notify your cover designer to leave the spine blank.` });
    }
    return out;
  })();

  const _severityOrder = { error: 0, warning: 1, info: 2 };
  const layoutIssues = [...formatIssues, ...manuscriptIssues]
    .sort((a, b) => _severityOrder[a.severity] - _severityOrder[b.severity]);

  const pct    = Math.round((step / (WIZARD_STEPS.length - 1)) * 100);

  // ─────────────────── SUCCESS / DRAFT SCREEN ──────────────────
  if (step === 11) {
    return (
      <div className="wizard wizard--done">
        <SEO title="Upload Manuscript | IndieConverters" description="Upload and publish your manuscript." path="/upload" />
        <div className="wz-done">
          <div className="wz-done-cover">
            {fd.coverPreview
              ? <img src={fd.coverPreview} alt={fd.title} />
              : <CoverTemplatePreview
                  title={fd.title}
                  subtitle={fd.subtitle}
                  author={authorName}
                  genreLabel={primaryGenreLabel}
                  templateId={fd.coverTemplate}
                  paletteId={fd.coverPalette}
                  artPreview={fd.coverArtPreview}
                  artPlacement={fd.coverArtPlacement}
                />}
          </div>
          <div className="wz-done-text">
            {(publishOutcome === 'draft' || (!publishOutcome && savedAsDraft)) ? (
              <>
                <span className="wz-done-badge wz-done-badge--draft">·· Saved as Draft</span>
                <h1>{fd.title}</h1>
                {fd.subtitle && <p className="wz-done-sub">{fd.subtitle}</p>}
                <p className="wz-done-desc">Your book is saved as a draft. It won't be visible to readers until you publish it from your dashboard.</p>
                <div className="wz-done-actions">
                  <Link to="/dashboard" className="btn btn-primary">Go to dashboard →</Link>
                </div>
              </>
            ) : publishOutcome === 'schedule' ? (
              <>
                <span className="wz-done-badge wz-done-badge--scheduled">·· Scheduled</span>
                <h1>{fd.title}</h1>
                {fd.subtitle && <p className="wz-done-sub">{fd.subtitle}</p>}
                <p className="wz-done-desc">
                  Your book is queued for {formatDateInput(finalReleaseDate)}. It stays private while you finish review, collect feedback, and prepare launch assets.
                </p>
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
      <SEO title="Upload Manuscript | IndieConverters" description="Upload and publish your manuscript." path="/upload" />

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
          {stepGroups.map((group, groupIndex) => (
            <div key={`${group.label}-${groupIndex}`} className="wz-group">
              <span className="wz-group-label">{group.label}</span>
              {group.steps.map(({ item, index }) => (
                <button key={index} className={`wz-step-item ${index === step ? 'current' : ''} ${index < step ? 'done' : ''}`}
                  onClick={() => goTo(index)} disabled={index > step}>
                  <span className="wz-step-num">
                    {index < step ? <span className="wz-check">✓</span> : String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="wz-step-name">{item.label}</span>
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
                  styleTouchedRef.current = true;
                  setFd(prev => ({ ...prev, ...savedProgress.fd, trimSize: savedProgress.fd?.trimSize || prev.trimSize }));
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
                <div className="wz-story-builder">
                  <div className="wz-story-builder-head">
                    <div>
                      <span>Fast story builder</span>
                      <h3>Draft the reader-facing copy</h3>
                      <p>Answer what you know. We turn it into editable back-cover copy.</p>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => useStoryDraft()}>
                      Use draft
                    </button>
                  </div>

                  <div className="wz-story-grid">
                    <div className="wz-field">
                      <label>Core premise <span className="opt">optional</span></label>
                      <input
                        type="text"
                        value={fd.storyPremise}
                        onChange={e => up('storyPremise', e.target.value)}
                        placeholder="A family secret forces a daughter to redraw the map of home"
                      />
                    </div>
                    <div className="wz-field">
                      <label>Ideal reader <span className="opt">optional</span></label>
                      <input
                        type="text"
                        value={fd.storyReader}
                        onChange={e => up('storyReader', e.target.value)}
                        placeholder="readers who like intimate literary fiction"
                      />
                    </div>
                    <div className="wz-field">
                      <label>Reader promise <span className="opt">optional</span></label>
                      <input
                        type="text"
                        value={fd.storyPromise}
                        onChange={e => up('storyPromise', e.target.value)}
                        placeholder="A moving story about memory, identity, and belonging"
                      />
                    </div>
                    <div className="wz-field">
                      <label>Themes / mood <span className="opt">optional</span></label>
                      <input
                        type="text"
                        value={fd.storyThemes}
                        onChange={e => up('storyThemes', e.target.value)}
                        placeholder="family, grief, courage, second chances"
                      />
                    </div>
                  </div>

                  <div className="wz-story-tone-row" aria-label="Description tone">
                    <span>Tone</span>
                    <div>
                      {STORY_TONES.map(tone => (
                        <button
                          key={tone.id}
                          type="button"
                          className={fd.storyTone === tone.id ? 'selected' : ''}
                          onClick={() => up('storyTone', tone.id)}
                        >
                          <strong>{tone.label}</strong>
                          <small>{tone.note}</small>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wz-story-draft">
                    <div className="wz-story-draft-head">
                      <span>Draft preview</span>
                      <div>
                        <button
                          type="button"
                          className="wz-text-link"
                          onClick={() => useStoryDraft({ append: true })}
                          disabled={!fd.description.trim()}
                        >
                          Append
                        </button>
                        <button type="button" className="wz-text-link" onClick={clearStoryBuilder}>
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="wz-story-draft-copy">
                      {storyDraft.split('\n').filter(Boolean).map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>

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
                      <button key={a.value} type="button"
                        className={`wz-audience-btn ${fd.audience === a.value ? 'selected' : ''}`}
                        disabled={fd.matureContent && a.value !== 'adult'}
                        title={fd.matureContent && a.value !== 'adult' ? 'Not available while this book is marked as mature content' : undefined}
                        onClick={() => up('audience', a.value)}>
                        <strong>{a.label}</strong><span>{a.sub}</span>
                      </button>
                    ))}
                  </div>

                  <label className={`wz-toggle-card wz-mature-toggle ${fd.matureContent ? 'on' : ''}`}>
                    <div>
                      <strong>Contains mature content</strong>
                      <span>Explicit sexual content, graphic violence, or strong language. Marking this sets the target audience to Adult (18+).</span>
                    </div>
                    <div className={`wz-toggle ${fd.matureContent ? 'on' : ''}`}
                      onClick={() => setMatureContent(!fd.matureContent)} role="switch" aria-checked={fd.matureContent} />
                  </label>

                  {matureSignals.length > 0 && !fd.matureContent && !matureSuggestionDismissed && (
                    <div className="wz-mature-suggestion">
                      <span>
                        Your description or manuscript mentions themes like <strong>{matureSignals.join(', ')}</strong> — consider marking this book as containing mature content.
                      </span>
                      <div className="wz-mature-suggestion-actions">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setMatureContent(true)}>Mark as mature</button>
                        <button type="button" className="wz-text-link" onClick={() => setMatureSuggestionDismissed(true)}>Dismiss</button>
                      </div>
                    </div>
                  )}
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
                    <label>Publisher name <span className="opt">optional</span></label>
                    <input type="text" value={fd.publisher} onChange={e => up('publisher', e.target.value)} placeholder="Self-published" />
                  </div>
                </div>
                <div className="wz-format-card wz-format-card--estimate">
                  <div className="wz-format-card-icon">#</div>
                  <div>
                    <strong>Page count comes after manuscript upload</strong>
                    <p>We estimate pages from your manuscript word count and selected trim size in the next step. You can override it there if you already know the final print page count.</p>
                  </div>
                </div>
              </div>

              <div className="wz-section-divider"><span>ISBN</span></div>

              <div className="wz-fields">
                <div className="wz-isbn-options">
                  {[
                    { id: 'own',  title: 'I have my own ISBN-13', sub: 'Enter a 13-digit ISBN you already own or purchased from a registry.' },
                    { id: 'register', title: 'Register a new ISBN', sub: 'Choose an official registry, complete the purchase or application, then paste the ISBN here.' },
                    { id: 'skip', title: 'Skip for now',           sub: 'Your book can still be listed and found without one. You can add it later from your dashboard.' },
                  ].map(opt => (
                    <label key={opt.id} className={`wz-isbn-opt ${fd.isbnOption === opt.id ? 'selected' : ''}`}>
                      <input type="radio" name="isbnopt" value={opt.id} checked={fd.isbnOption === opt.id} onChange={() => up('isbnOption', opt.id)} />
                      <div><strong>{opt.title}</strong><span>{opt.sub}</span></div>
                    </label>
                  ))}
                </div>
                {fd.isbnOption === 'register' && (
                  <div className="wz-isbn-resources">
                    <div className="wz-isbn-resources-head">
                      <span className="wz-isbn-resources-title">Register a new ISBN</span>
                      <p>Open the right registry in a new tab, finish the purchase or application, then come back and paste the ISBN-13 below.</p>
                    </div>
                    <div className="wz-isbn-resource-grid">
                      {ISBN_REGISTRY_OPTIONS.map(option => (
                        <div key={option.title} className="wz-isbn-resource">
                          <div>
                            <strong>{option.title}</strong>
                            <span>{option.note}</span>
                          </div>
                          <div className="wz-isbn-resource-links">
                            {option.links.map(link => (
                              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                                {link.label} <span aria-hidden="true">{'->'}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="wz-isbn-resources-note">A platform-assigned ISBN can tie that edition to the platform that issued it. Owning your own ISBN gives you more control over imprint and distribution.</p>
                  </div>
                )}
                {(fd.isbnOption === 'own' || fd.isbnOption === 'register') && (
                  <div className="wz-field" style={{ marginTop: 20 }}>
                    <label>{fd.isbnOption === 'register' ? 'Paste your new ISBN-13' : 'ISBN-13'} <span className="req">*</span></label>
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
                    <span className="wz-file-name">{manuscriptFileName || 'Uploaded manuscript'}</span>
                    <span className="wz-file-size">{fd.manuscriptFile ? `${(fd.manuscriptFile.size / 1024).toFixed(0)} KB` : ''}</span>
                    <button type="button" className="wz-rm-btn" onClick={clearManuscriptUpload}>Replace</button>
                  </div>
                )}
                <div className="wz-field" style={{ marginTop: 28 }}>
                  <label>Available in these formats</label>
                  <div className="wz-formats">
                    {FORMATS.map(f => (
                      <label key={f} className={`wz-format-tag ${fd.formats.includes(f) ? 'on' : ''}`}>
                        <input type="checkbox" checked={fd.formats.includes(f)}
                          onChange={e => toggleFormat(f, e.target.checked)} />
                        {f}
                      </label>
                    ))}
                  </div>
                </div>
                {audiobookOnly && (
                  <div className="wz-audio-handoff">
                    <div className="wz-audio-handoff-head">
                      <span className="wz-audio-icon">AU</span>
                      <div>
                        <strong>Audiobook production is external</strong>
                        <p>Indie Converters does not create or host audiobook files yet. Use one of these services, then come back and list your eBook or print edition here.</p>
                      </div>
                    </div>
                    <div className="wz-audio-resource-grid">
                      {AUDIOBOOK_RESOURCES.map(resource => (
                        <a key={resource.href} className="wz-audio-resource" href={resource.href} target="_blank" rel="noreferrer">
                          <strong>{resource.title}</strong>
                          <span>{resource.note}</span>
                          <b>{resource.label} {'->'}</b>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {!audiobookOnly && (
                  <div className="wz-field wz-trim-picker">
                    <label>Trim size for preview and print estimate</label>
                    <p className="wz-hint">Used to estimate print pages and shape the Reading Style preview. eBooks still reflow on each reader's device.</p>
                    <div className="wz-trim-grid wz-trim-grid--select">
                      {TRIM_SIZES.map(t => {
                        const check = trimChecks.find(item => item.trim.id === t.id);
                        const availability = check?.availability || trimAvailability(t, 0, hasPrintFormat);
                        const isBlocked = availability.blocked;
                        return (
                          <label
                            key={t.id}
                            className={`wz-trim-option ${fd.trimSize === t.id ? 'selected' : ''} ${isBlocked ? 'disabled' : ''} wz-trim-option--${availability.severity}`}
                            aria-disabled={isBlocked}
                          >
                            <input type="radio" name="trimSize" value={t.id}
                              checked={fd.trimSize === t.id}
                              disabled={isBlocked}
                              onChange={() => up('trimSize', t.id)} />
                            <span className="wz-trim-copy">
                              <span className="wz-trim-size">{t.label}</span>
                              <span className="wz-trim-use">{t.note}</span>
                              {hasPrintFormat && availability.detail && (
                                <span className="wz-trim-status">{availability.detail}</span>
                              )}
                            </span>
                            <span className="wz-trim-est">{availability.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                {!audiobookOnly && (fd.formats.includes('Paperback') || fd.formats.includes('Hardcover')) && (
                  <div className="wz-format-card wz-format-card--print">
                    <div className="wz-format-card-icon">PR</div>
                    <div>
                      <strong>Print edition selected</strong>
                      <p>Using <b>{selectedTrim.label}</b> for print estimates, about {selectedTrim.wordsPerPage} words per page. Change the trim size above before refining your preview.</p>
                    </div>
                  </div>
                )}
                {!audiobookOnly && msStructure && (
                  <div className="wz-page-estimate-card">
                    <div className="wz-page-estimate-main">
                      <span className="wz-page-estimate-label">Estimated length</span>
                      <strong>{estimatedTrimPages ? `~${estimatedTrimPages} pages` : 'Page estimate unavailable'}</strong>
                      <p>
                        {estimatedTrimPages
                          ? `Based on ${msStructure.wordCount.toLocaleString()} words at ${selectedTrim.label}.`
                          : 'We could not estimate pages from this file type. Add a final page count if you know it.'}
                      </p>
                    </div>
                    <div className="wz-field wz-page-override">
                      <label>Manual page count override <span className="opt">optional</span></label>
                      <input
                        type="number"
                        min="1"
                        value={fd.pageCount}
                        onChange={e => up('pageCount', e.target.value)}
                        placeholder={estimatedTrimPages ? String(estimatedTrimPages) : 'e.g. 280'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Inline Layout Check ── */}
              {!audiobookOnly && msStructure && (
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
                          {estimatedTrimPages > 0 && <span>~{estimatedTrimPages} pages</span>}
                          <span>{selectedTrim.label}</span>
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
            const chapterHeading = currentPage?.headingBlock ? formatChapterHeading(currentPage.headingBlock.text) : null;
            const pageParagraphs = showMs ? currentPage.paras : [];
            const isChapterOpening = !showMs || !!chapterHeading || msPage === 0;
            const runningHead = isChapterOpening
              ? ''
              : (msPage % 2 === 0 ? (fd.title || 'Your Book Title') : authorName);
            const currentStyle = BOOK_STYLES.find(s => s.id === fd.bookStyle || s.legacyId === fd.bookStyle) || BOOK_STYLES[0];
            return (
              <div className="wz-step wz-step--preview wz-reading-step">
                <div className="wz-reading-head">
                  <span className="wz-reading-kicker">Interior reading experience</span>
                  <div className="wz-mobile-proofing-note">
                    For the best interior proofing experience, switch to a tablet or desktop.
                  </div>
                </div>

                <div className="wz-reading-controls">
                  <div className="wz-style-dropdown" ref={styleDropdownRef}>
                    <button
                      type="button"
                      className="wz-style-dropdown-btn"
                      onClick={() => setStyleOpen(o => !o)}
                      aria-expanded={styleOpen}
                    >
                      <span className="wz-style-dropdown-icon" style={{ background: currentStyle.cardBg, color: currentStyle.cardAccent }}>{currentStyle.icon}</span>
                      <span>{currentStyle.title}</span>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12" className={`wz-style-dropdown-chevron${styleOpen ? ' open' : ''}`}><path d="M4 6l4 4 4-4"/></svg>
                    </button>
                    {styleOpen && (
                      <div className="wz-style-dropdown-panel">
                        {BOOK_STYLES.map(style => {
                          const selected = fd.bookStyle === style.id || fd.bookStyle === style.legacyId;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              className={`wz-style-dropdown-option${selected ? ' active' : ''}`}
                              onClick={() => { applyStyle(style); setStyleOpen(false); }}
                            >
                              <span className="wz-style-dropdown-icon" style={{ background: style.cardBg, color: style.cardAccent }}>{style.icon}</span>
                              <span className="wz-style-dropdown-option-text">
                                <strong>{style.title}</strong>
                                <small>{style.tagline} — best for {style.bestFor}</small>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="wz-reading-controls-right">
                    <small className="wz-reading-controls-meta">{showMs ? `Page ${msPage + 1} of ${msPages.length}` : 'Sample text'}</small>
                    <button type="button" className="wz-reading-toolbtn" onClick={() => turnReadingPage('prev')} disabled={msPage === 0 || !!pageTurnDir} aria-label="Previous page">‹</button>
                    <button type="button" className="wz-reading-toolbtn" onClick={() => turnReadingPage('next')} disabled={isLastPage || !showMs || !!pageTurnDir} aria-label="Next page">›</button>
                    <details className="wz-finetune wz-finetune--icon">
                      <summary className="wz-finetune-summary wz-finetune-gear wz-reading-toolbtn" aria-label="Fine-tune type settings">⚙</summary>
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
                  </div>
                </div>

                <div className="wz-reading-stage">
                  <div className="wz-book-reader">
                    <div className={`wz-book-page ${pageTurnDir ? `is-page-turning is-page-turning-${pageTurnDir}` : ''}`} style={{ background: theme.bg, borderColor: theme.border, '--page-aspect': selectedTrim.aspect, '--page-width': selectedTrim.previewWidth }} tabIndex={0}
                      onKeyDown={e => {
                        if (['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)) { e.preventDefault(); if (!isLastPage) turnReadingPage('next'); }
                        if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); if (msPage > 0) turnReadingPage('prev'); }
                      }}>
                      <div className={`wz-book-page-hdr ${runningHead ? '' : 'is-empty'}`} style={{ borderColor: runningHead ? `${theme.text}08` : 'transparent' }}>
                        {runningHead && (
                          <span className="wz-book-running wz-book-running--center" style={{ fontFamily: fontCss, color: theme.text }}>
                            {runningHead}
                          </span>
                        )}
                      </div>
                      <div className={`wz-book-page-body ${isChapterOpening ? 'is-chapter-opening' : ''}`} style={{ fontFamily: fontCss, fontSize: sizeObj.size, lineHeight: sizeObj.lh, color: theme.text }}>
                        {msLoading ? (
                          <div className="wz-reader-loading" style={{ color: theme.text }}>
                            <div className="wz-spinner" style={{ borderColor: `${theme.text}22`, borderTopColor: theme.text }} />
                            Loading your manuscript…
                          </div>
                        ) : showMs ? (
                          <>
                            {chapterHeading && (
                              <div className="wz-reader-chapter" style={{ fontFamily: fontCss, color: theme.text }}>
                                {chapterHeading.label && <span className="wz-reader-chapter-kicker">{chapterHeading.label}</span>}
                                {chapterHeading.title && <span className="wz-reader-chapter-title">{chapterHeading.title}</span>}
                              </div>
                            )}
                            {pageParagraphs.map((para, i) => <p key={i} className="wz-reader-para">{para}</p>)}
                          </>
                        ) : (
                          SAMPLE_TEXT.map((block, i) =>
                            block.type === 'chapter'
                              ? <div key={i} className="wz-reader-chapter" style={{ fontFamily: fontCss, color: theme.text }}>{block.text}</div>
                              : <p key={i} className="wz-reader-para">{block.text}</p>
                          )
                        )}
                      </div>
                      <div className="wz-book-page-ftr" style={{ borderColor: 'transparent', color: theme.text }}>
                        {!msLoading && (
                          <span className="wz-book-page-number" style={{ fontFamily: fontCss }}>
                            {showMs ? msPage + 1 : 1}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ════════ STEP 5: Cover ════════ */}
          {step === 5 && (
            <div className="wz-step">
              <h2>Cover</h2>
              <p className="wz-sub">Create a clean starter cover, upload finished artwork, or hire a cover designer when you want a more polished launch.</p>

              <div className="wz-cover-mode-tabs" aria-label="Cover source options">
                <button
                  type="button"
                  className={fd.coverMode !== 'upload' ? 'active' : ''}
                  aria-pressed={fd.coverMode !== 'upload'}
                  onClick={() => chooseCoverMode('template')}
                >
                  Create from template
                </button>
                <button
                  type="button"
                  className={fd.coverMode === 'upload' ? 'active' : ''}
                  aria-pressed={fd.coverMode === 'upload'}
                  onClick={() => chooseCoverMode('upload')}
                >
                  Upload cover
                </button>
                <Link
                  to="/hire/browse?service=cover-design&source=cover-pricing"
                  className="wz-cover-mode-link"
                  aria-label="Hire a cover designer"
                >
                  Hire designer <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="wz-cover-layout">
                <div className="wz-cover-left">
                  {fd.coverMode === 'upload' ? (
                    !fd.coverPreview ? (
                      <div className="wz-dropzone" onClick={() => coverRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCover(f); }}>
                        <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                          onChange={e => { if (e.target.files[0]) handleCover(e.target.files[0]); }} />
                        <div className="wz-dropzone-icon">+</div>
                        <p className="wz-dropzone-label">Upload cover image</p>
                        <p className="wz-dropzone-sub">JPG, PNG or WebP - max 5 MB</p>
                        <p className="wz-dropzone-hint">Recommended: 1,600 x 2,560 px (portrait 5:8)</p>
                      </div>
                    ) : (
                      <div className="wz-cover-uploaded">
                        <img src={fd.coverPreview} alt="Cover" />
                        <div>
                          <span className="wz-file-name">{fd.coverFile?.name}</span>
                          <button
                            type="button"
                            className="wz-text-link"
                            onClick={() => setFd(p => ({ ...p, coverMode: 'template', coverFile: null, coverPreview: '', coverDataUrl: '' }))}
                          >
                            Remove and use template
                          </button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="wz-template-builder">
                      <div className="wz-template-section-head">
                        <div>
                          <span>Template</span>
                          <small>{selectedTemplate.name} - {selectedTemplate.note}</small>
                        </div>
                        <button type="button" className="wz-text-link" onClick={() => chooseCoverMode('upload')}>
                          Upload finished cover
                        </button>
                      </div>

                      <div className="wz-template-grid">
                        {COVER_TEMPLATES.map(t => (
                          <button
                            key={t.id}
                            type="button"
                            className={`wz-template-card ${fd.coverTemplate === t.id ? 'selected' : ''}`}
                            onClick={() => up('coverTemplate', t.id)}
                          >
                            <span className="wz-template-token">{t.short}</span>
                            <span>
                              <span className="wz-template-card-name">{t.name}</span>
                              <span className="wz-template-card-note">{t.note}</span>
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="wz-template-section-head wz-template-section-head--spaced">
                        <div>
                          <span>Palette</span>
                          <small>{coverPalette(fd.coverPalette).name}</small>
                        </div>
                      </div>

                      <div className="wz-palette-row">
                        {COVER_PALETTES.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className={`wz-palette-chip ${fd.coverPalette === p.id ? 'selected' : ''}`}
                            onClick={() => up('coverPalette', p.id)}
                          >
                            <span className="wz-palette-swatch" style={{ background: `linear-gradient(135deg, ${p.bg}, ${p.bg2})` }} />
                            <span>{p.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="wz-template-section-head wz-template-section-head--spaced">
                        <div>
                          <span>Artwork / photo</span>
                          <small>{fd.coverArtFile?.name || 'Optional image inside the template'}</small>
                        </div>
                        {fd.coverArtPreview && (
                          <button type="button" className="wz-text-link" onClick={clearCoverArt}>Remove</button>
                        )}
                      </div>

                      <div
                        className={`wz-art-drop ${fd.coverArtPreview ? 'has-image' : ''}`}
                        onClick={() => coverArtRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCoverArt(f); }}
                      >
                        <input ref={coverArtRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                          onChange={e => { if (e.target.files[0]) handleCoverArt(e.target.files[0]); }} />
                        {fd.coverArtPreview ? (
                          <>
                            <img src={fd.coverArtPreview} alt="Cover artwork" />
                            <span>Replace artwork</span>
                          </>
                        ) : (
                          <>
                            <span className="wz-art-plus">+</span>
                            <span>Add artwork/photo</span>
                          </>
                        )}
                      </div>

                      {fd.coverArtPreview && (
                        <div className="wz-art-placement" aria-label="Artwork placement">
                          {COVER_ART_PLACEMENTS.map(option => (
                            <button
                              key={option.id}
                              type="button"
                              className={fd.coverArtPlacement === option.id ? 'selected' : ''}
                              onClick={() => up('coverArtPlacement', option.id)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="wz-cover-right">
                  <div className="wz-cover-preview-head">
                    <span className="wz-preview-label">Preview</span>
                    <div className="wz-device-tabs" aria-label="Preview device">
                      {COVER_DEVICE_PREVIEWS.map(device => (
                        <button
                          key={device.id}
                          type="button"
                          className={coverPreviewDevice === device.id ? 'selected' : ''}
                          onClick={() => setCoverPreviewDevice(device.id)}
                        >
                          {device.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`wz-device-preview wz-device-preview--${coverPreviewDevice}`}>
                    <div className="wz-device-frame">
                      <div className="wz-device-chrome">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="wz-device-content">
                        <div className="wz-device-cover-stage">
                          <div className="wz-device-cover-slot">
                            <div
                              className={`wz-device-book-mockup ${fd.coverPreview ? 'wz-device-book-mockup--uploaded' : ''}`}
                              onPointerMove={handleBookPreviewPointerMove}
                              onPointerLeave={resetBookPreviewTilt}
                            >
                              <CoverPreviewArt
                                coverPreview={fd.coverPreview}
                                title={fd.title}
                                subtitle={fd.subtitle}
                                author={authorName}
                                genreLabel={primaryGenreLabel}
                                templateId={fd.coverTemplate}
                                paletteId={fd.coverPalette}
                                artPreview={fd.coverArtPreview}
                                artPlacement={fd.coverArtPlacement}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!fd.coverPreview && (
                    <div className="wz-template-preview-meta">
                      <strong>{selectedTemplate.name}</strong>
                      <span>{selectedTemplate.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 6: Pricing ════════ */}
          {step === 6 && (
            <div className="wz-step">
              <h2>Pricing</h2>
              <p className="wz-sub">Set your list price, see estimated royalties, and tell readers where to buy your book.</p>

              <div className="wz-fields">
                {hasPrintFormat && (
                  <div className="wz-print-cover-tool">
                    <div>
                      <strong>Need a full-wrap print cover?</strong>
                      <span>Calculate spine width, bleed, safe area, and 300 DPI export size before you design or hire a cover designer.</span>
                      {printCoverEstimate && (
                        <>
                          <div className="wz-print-cover-mini" aria-label="Estimated print cover size">
                            <div>
                              <span>Full wrap</span>
                              <strong>{formatCoverInches(printCoverEstimate.fullCoverWidth)} x {formatCoverInches(printCoverEstimate.fullCoverHeight)}</strong>
                            </div>
                            <div>
                              <span>Spine</span>
                              <strong>{formatCoverInches(printCoverEstimate.spineWidth)}</strong>
                            </div>
                            <div>
                              <span>300 DPI</span>
                              <strong>{printCoverEstimate.pixelWidth} x {printCoverEstimate.pixelHeight}px</strong>
                            </div>
                          </div>
                          <small className="wz-print-cover-assumption">
                            Based on {selectedTrim.label}
                            {resolvedSelectedPages ? `, ${resolvedSelectedPages} pages` : ', page count pending'}
                            , black and white interior, white paper.
                          </small>
                        </>
                      )}
                    </div>
                    <Link to={printCoverCalculatorPath}>Open calculator</Link>
                  </div>
                )}

                <div className="wz-pricing-snapshot" aria-label="Pricing summary">
                  <div>
                    <span>Formats</span>
                    <strong>{formatSummaryLabel}</strong>
                  </div>
                  <div>
                    <span>List price</span>
                    <strong>{priceStatusLabel}</strong>
                  </div>
                  <div>
                    <span>Best estimate</span>
                    <strong>{bestRoyaltyLabel}</strong>
                  </div>
                </div>

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
                    <div className="wz-price-presets" aria-label="Quick price presets">
                      {PRICE_PRESETS.map(preset => (
                        <button
                          key={preset.value}
                          type="button"
                          className={fd.price === preset.value ? 'selected' : ''}
                          aria-pressed={fd.price === preset.value}
                          onClick={() => up('price', preset.value)}
                        >
                          <strong>{preset.label}</strong>
                          <span>{preset.note}</span>
                        </button>
                      ))}
                    </div>
                    {hasPrintFormat && (
                      <p className="wz-pricing-note">
                        Print estimates use {selectedTrim.label}
                        {resolvedSelectedPages ? ` and ${resolvedSelectedPages} pages` : ''}
                        . Final print costs may change after file conversion.
                      </p>
                    )}
                  </div>
                )}

                <div className="wz-royalty-panel">
                  <div className="wz-royalty-head">
                    <div>
                      <span>Royalty estimate</span>
                      <small>Estimate only. Actual royalties vary by marketplace, tax, file size, print specs, and reader country.</small>
                    </div>
                    {royaltyEstimate.best && (
                      <div className="wz-royalty-best">
                        <small>Best estimate</small>
                        <strong>{formatRoyaltyMoney(royaltyEstimate.best.authorEarnings)}</strong>
                        <span>{royaltyEstimate.best.channel}</span>
                      </div>
                    )}
                  </div>

                  <div className="wz-royalty-promise">
                    Indie Converters direct is modeled with a platform fee 20% lower than KDP's comparable fee, so authors keep more on direct sales.
                  </div>

                  {royaltyEstimate.estimates.length > 0 ? (
                    <div className="wz-royalty-table" role="table" aria-label="Royalty estimates">
                      <div className="wz-royalty-row wz-royalty-row--head" role="row">
                        <span role="columnheader">Channel</span>
                        <span role="columnheader">Format</span>
                        <span role="columnheader">Costs</span>
                        <span role="columnheader">Author earns</span>
                      </div>
                      {royaltyEstimate.estimates.map(item => (
                        <div key={item.id} className={`wz-royalty-row ${item.featured ? 'is-featured' : ''}`} role="row">
                          <div role="cell">
                            <strong>{item.channel}</strong>
                            <small>{item.note}</small>
                          </div>
                          <span role="cell">{item.format}</span>
                          <span role="cell">
                            {item.productionCost
                              ? `${formatRoyaltyMoney(item.productionCost)} print`
                              : item.platformCosts
                                ? `${formatRoyaltyMoney(item.platformCosts)} ${item.costLabel || 'fee'}`
                                : '$0.00'}
                          </span>
                          <strong role="cell">{formatRoyaltyMoney(item.authorEarnings)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="wz-royalty-empty">{royaltyEstimate.warnings[0] || 'Enter a paid list price to preview royalties.'}</div>
                  )}

                  {royaltyEstimate.warnings.length > 0 && royaltyEstimate.estimates.length > 0 && (
                    <div className="wz-royalty-warnings">
                      {royaltyEstimate.warnings.map(warning => (
                        <span key={warning}>{warning}</span>
                      ))}
                    </div>
                  )}
                </div>

                <RetailerLinksEditor
                  links={fd.retailerLinks}
                  onChange={links => up('retailerLinks', links)}
                  label="Where do you sell it? — add every retailer, with a price if you have one"
                  hint="IndieConverters doesn't sell books directly — we link readers to wherever you sell yours, and show them which is cheapest."
                />
              </div>
            </div>
          )}

          {/* ════════ STEP 7: Distribution ════════ */}
          {step === 7 && (
            <div className="wz-step">
              <h2>Distribution</h2>
              <p className="wz-sub">
                By default your book publishes directly on Indie Converters only, so you can get a page live fast.
                Add retailers and libraries any time — before or after publishing — from your dashboard.
                We publish on your behalf through our platform accounts — no separate sign-ups needed. Wide distribution takes 24–72 hours after publishing.
              </p>

              <div className="wz-dist-summary" aria-label="Distribution summary">
                <div>
                  <span>Route</span>
                  <strong>{distributionModeLabel}</strong>
                </div>
                <div>
                  <span>Channels</span>
                  <strong>
                    {selectedDistributionChannels.length
                      ? `${selectedDistributionChannels.length} selected`
                      : 'Direct only'}
                  </strong>
                </div>
                <div>
                  <span>Best estimate</span>
                  <strong>{bestRoyaltyLabel}</strong>
                </div>
              </div>

              <div className="wz-dist-guidance">
                <strong>How earnings are estimated</strong>
                <p>Direct Indie Converters sales use the lower platform-fee model. Retailers and libraries use their own payout terms, so final statements may vary.</p>
              </div>

              {/* Presets */}
              <div className="wz-dist-presets">
                <button type="button"
                  className={`wz-dist-preset ${fd.distributionChannels.length === 0 ? 'selected' : ''}`}
                  onClick={() => up('distributionChannels', [])}>
                  Indie Converters Only <span className="wz-matter-rec">Recommended</span>
                </button>
                <button type="button"
                  className={`wz-dist-preset ${fd.distributionChannels.length === 1 && fd.distributionChannels[0] === 'amazon' ? 'selected' : ''}`}
                  onClick={() => up('distributionChannels', ['amazon'])}>
                  Amazon Only
                </button>
                <button type="button"
                  className={`wz-dist-preset ${fd.distributionChannels.length >= 6 && !fd.distributionChannels.includes('overdrive') && !fd.distributionChannels.includes('tolino') ? 'selected' : ''}`}
                  onClick={() => up('distributionChannels', ['amazon','apple','bn','kobo','google-play','scribd'])}>
                  Major Retailers Only
                </button>
                <button type="button"
                  className={`wz-dist-preset ${fd.distributionChannels.length >= 6 && fd.distributionChannels.includes('overdrive') ? 'selected' : ''}`}
                  onClick={() => up('distributionChannels', ['amazon','apple','bn','kobo','google-play','scribd','overdrive','hoopla','baker-taylor','tolino','vivlio'])}>
                  ✦ Go Wide — All Platforms
                </button>
              </div>

              {/* KDP Select note */}
              {fd.distributionChannels.includes('amazon') && fd.distributionChannels.length > 1 && (
                <div className="wz-dist-kdp-note">
                  <strong>Note on Kindle Unlimited (KDP Select)</strong>
                  <p>If you plan to enrol in <b>KDP Select</b>, Amazon requires your eBook to be exclusive to Kindle for 90-day periods — wide distribution is incompatible. You can always adjust distribution from your dashboard before enrolling.</p>
                </div>
              )}

              {hasEbookOnlyDistribution && (
                <div className="wz-dist-format-note">
                  Print editions mainly route through print-capable partners. eBook-only stores will receive the digital edition.
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
                              <span className="wz-dist-channel-meta">
                                <span>{ch.formats.join(' / ')}</span>
                                <span>{ch.timing}</span>
                                <span>{ch.payout}</span>
                              </span>
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

          {/* ════════ STEP 8: Front & Back Matter ════════ */}
          {step === 8 && (
            <div className="wz-step">
              <h2>Front & Back Matter</h2>
              <p className="wz-sub">Optional pages that surround your main content. Templates are pre-filled — toggle on to customise.</p>

              <div className="wz-section-divider"><span>Front Matter</span></div>
              <p className="wz-sub" style={{ marginTop: 0, marginBottom: 20 }}>Pages that appear before Chapter 1.</p>
              <div className="wz-matter-list">
                {FM_ITEMS.map(item => {
                  const data = fd.frontMatter[item.key];
                  const epigraphSamples = item.key === 'epigraph' ? buildEpigraphSamples(fd, primaryGenreLabel) : [];

                  function handleTocToggle() {
                    const newEnabled = !data.enabled;
                    if (newEnabled && data.entries.length === 0 && msStructure?.headings?.length > 0) {
                      const fmOffset = Object.values(fd.frontMatter).filter(v => v.enabled).length + 1;
                      setFd(p => ({ ...p, frontMatter: { ...p.frontMatter, toc: { enabled: true, entries: buildTocEntries(msStructure.headings, fmOffset, selectedTrim.wordsPerPage) } } }));
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
                    setFd(p => ({ ...p, frontMatter: { ...p.frontMatter, toc: { enabled: true, entries: buildTocEntries(msStructure.headings, fmOffset, selectedTrim.wordsPerPage) } } }));
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
                                    Rename any entry by editing the label. Uncheck entries you want to hide (e.g. internal sub-sections). Page numbers are estimates based on word count and selected trim size.
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
                          {item.key === 'dedication' && (
                            <div className="wz-matter-samples" aria-label="Dedication samples">
                              <div className="wz-matter-samples-head">
                                <span>Start with a sample</span>
                                <small>Pick one, then customise it.</small>
                              </div>
                              <div className="wz-matter-sample-grid">
                                {DEDICATION_SAMPLES.map(sample => (
                                  <button
                                    key={sample.label}
                                    type="button"
                                    className="wz-matter-sample"
                                    onClick={() => upMatter('frontMatter', 'dedication', 'content', sample.text)}
                                  >
                                    <span>{sample.label}</span>
                                    <small>{sample.text.split('\n')[0]}</small>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {item.key === 'epigraph' && (
                            <div className="wz-matter-samples" aria-label="Epigraph samples">
                              <div className="wz-matter-samples-head">
                                <span>Use book details</span>
                                <small>Original starters; replace with a licensed quote if needed.</small>
                              </div>
                              <div className="wz-matter-sample-grid">
                                {epigraphSamples.map(sample => (
                                  <button
                                    key={sample.label}
                                    type="button"
                                    className="wz-matter-sample"
                                    onClick={() => upMatter('frontMatter', 'epigraph', 'content', sample.text)}
                                  >
                                    <span>{sample.label}</span>
                                    <small>{sample.text.split('\n')[0]}</small>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
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
                          {item.key === 'aboutAuthor' && (
                            <div className={`wz-profile-bio-source ${authorProfileBio ? '' : 'is-empty'}`}>
                              <div>
                                <span>
                                  {authorProfileLoading
                                    ? 'Loading your author profile...'
                                    : authorProfileBio
                                      ? authorProfileBioSource
                                      : 'No author profile bio found yet'}
                                </span>
                                <small>
                                  {authorProfileBio
                                    ? 'This field starts from your saved profile bio. You can edit it here for this book.'
                                    : 'Add a bio below, or update your author profile from the dashboard later.'}
                                </small>
                              </div>
                              {authorProfileBio && (
                                <button
                                  type="button"
                                  className="wz-text-link"
                                  onClick={() => upMatter('backMatter', 'aboutAuthor', 'content', authorProfileBio)}
                                >
                                  Use profile bio
                                </button>
                              )}
                            </div>
                          )}
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

          {/* ════════ STEP 9: Book Structure (assembled preview) ════════ */}
          {step === 9 && (() => {
            const currentPage = bookStructurePages[bsPage] || null;
            const hasPages = bookStructurePages.length > 0;
            const isLastPage = bsPage >= bookStructurePages.length - 1;
            const isManuscript = currentPage?.type === 'manuscript';
            const chapterHeading = isManuscript && currentPage.headingBlock ? formatChapterHeading(currentPage.headingBlock.text) : null;
            const pageParagraphs = isManuscript ? currentPage.paras : [];
            const isChapterOpening = !isManuscript || !!chapterHeading || bsPage === 0;
            const runningHead = isChapterOpening
              ? ''
              : (bsPage % 2 === 0 ? (fd.title || 'Your Book Title') : authorName);

            return (
              <div className="wz-step wz-step--preview wz-step--bookstructure">
                <div className="wz-bs-layout">
                  <section className="wz-bs-side">
                    <div className="wz-bs-side-head">
                      <span>Contents</span>
                      <small>{bookStructurePages.length} page{bookStructurePages.length !== 1 ? 's' : ''}</small>
                    </div>

                    <div className="wz-bs-jumplist">
                      {bookStructureJumpTargets.length === 0 && (
                        <p className="wz-toc-empty">Nothing to preview yet — enable front/back matter or upload a manuscript.</p>
                      )}
                      {bookStructureJumpTargets.map(target => (
                        <button
                          key={target.index}
                          type="button"
                          className={`wz-bs-jump-item ${bsPage === target.index ? 'active' : ''}`}
                          onClick={() => jumpToBookStructurePage(target.index)}
                        >
                          {target.label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="wz-bs-stage">
                    <div className="wz-bs-reader">
                      <button className="wz-bs-arrow wz-bs-arrow--prev" onClick={() => turnBookStructurePage('prev')} disabled={bsPage === 0 || !!bsPageTurnDir} aria-label="Previous page">‹</button>
                      <div className="wz-bs-page-wrap">
                        <div className={`wz-book-page ${bsPageTurnDir ? `is-page-turning is-page-turning-${bsPageTurnDir}` : ''}`}
                          style={{ background: theme.bg, borderColor: theme.border, '--page-aspect': selectedTrim.aspect }} tabIndex={0}
                          onKeyDown={e => {
                            if (['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)) { e.preventDefault(); if (!isLastPage) turnBookStructurePage('next'); }
                            if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); if (bsPage > 0) turnBookStructurePage('prev'); }
                          }}
                          onTouchStart={handleBsTouchStart}
                          onTouchEnd={handleBsTouchEnd}>
                          <div className={`wz-book-page-hdr ${runningHead ? '' : 'is-empty'}`} style={{ borderColor: runningHead ? `${theme.text}08` : 'transparent' }}>
                            {runningHead && (
                              <span className="wz-book-running wz-book-running--center" style={{ fontFamily: fontCss, color: theme.text }}>
                                {runningHead}
                              </span>
                            )}
                          </div>
                          <div className={`wz-book-page-body ${isChapterOpening ? 'is-chapter-opening' : ''}`} style={{ fontFamily: fontCss, fontSize: sizeObj.size, lineHeight: sizeObj.lh, color: theme.text }}>
                            {!hasPages ? (
                              <div className="wz-reader-loading" style={{ color: theme.text }}>Nothing to preview yet.</div>
                            ) : currentPage.type === 'cover' ? (
                              <div className="wz-bs-cover-wrap">
                                <CoverPreviewArt
                                  coverPreview={fd.coverPreview}
                                  title={fd.title}
                                  subtitle={fd.subtitle}
                                  author={authorName}
                                  genreLabel={primaryGenreLabel}
                                  templateId={fd.coverTemplate}
                                  paletteId={fd.coverPalette}
                                  artPreview={fd.coverArtPreview}
                                  artPlacement={fd.coverArtPlacement}
                                />
                              </div>
                            ) : currentPage.type === 'toc' ? (
                              <div className="wz-toc-preview-entries">
                                {currentPage.entries.map((entry, idx) => (
                                  <div key={idx} className={`wz-toc-preview-row wz-toc-preview-h${entry.level}`}
                                    style={{ fontFamily: fontCss, color: entry.level === 2 ? `${theme.text}99` : theme.text }}>
                                    <span className="wz-toc-preview-label">{entry.label}</span>
                                    <span className="wz-toc-preview-leader" style={{ borderColor: `${theme.text}30` }} />
                                    <span className="wz-toc-preview-page">{entry.estimatedPage}</span>
                                  </div>
                                ))}
                              </div>
                            ) : currentPage.type === 'matter' ? (
                              <>
                                <div className="wz-bs-matter-label" style={{ fontFamily: fontCss, color: theme.text }}>
                                  {currentPage.label}
                                </div>
                                {currentPage.content.split('\n').filter(Boolean).map((para, i) => <p key={i} className="wz-bs-matter-para">{para}</p>)}
                              </>
                            ) : (
                              <>
                                {chapterHeading && (
                                  <div className="wz-reader-chapter" style={{ fontFamily: fontCss, color: theme.text }}>
                                    {chapterHeading.label && <span className="wz-reader-chapter-kicker">{chapterHeading.label}</span>}
                                    {chapterHeading.title && <span className="wz-reader-chapter-title">{chapterHeading.title}</span>}
                                  </div>
                                )}
                                {pageParagraphs.map((para, i) => <p key={i} className="wz-reader-para">{para}</p>)}
                              </>
                            )}
                          </div>
                          <div className="wz-book-page-ftr" style={{ borderColor: 'transparent', color: theme.text }}>
                            {hasPages && currentPage.type === 'manuscript' && (
                              <span className="wz-book-page-number" style={{ fontFamily: fontCss }}>{bsPage + 1}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="wz-bs-arrow wz-bs-arrow--next" onClick={() => turnBookStructurePage('next')} disabled={isLastPage || !hasPages || !!bsPageTurnDir} aria-label="Next page">›</button>
                      {hasPages && (
                        <div className="wz-bs-page-indicator">{bsPage + 1} / {bookStructurePages.length}</div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            );
          })()}

          {/* ════════ STEP 10: Review & Publish ════════ */}
          {step === 10 && (
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
                    ['Mature content',   fd.matureContent ? 'Yes' : 'No'],
                    ['Description',      fd.description ? fd.description.slice(0, 100) + (fd.description.length > 100 ? '…' : '') : '—'],
                    ['Primary genre',    genres.find(g => g.slug === fd.genre)?.label || '—'],
                    ['Secondary genre',  genres.find(g => g.slug === fd.genreSecondary)?.label || '—'],
                    ['Keywords',         fd.keywords.length ? fd.keywords.join(', ') : '—'],
                  ]},
                  { title: 'Publication', to: 2, rows: [
                    ['Year',      fd.pubYear || '—'],
                    ['Publisher', fd.publisher || '—'],
                    ['ISBN-13',   (fd.isbnOption === 'own' || fd.isbnOption === 'register') ? fd.isbn : 'Not provided'],
                    ['Release timing', releaseSummary],
                  ]},
                  { title: 'Manuscript', to: 3, rows: [
                    ['File',    manuscriptFileName || '—'],
                    ['Formats', fd.formats.join(', ') || '—'],
                    ['Trim size', selectedTrim.label],
                    ['Page count', pageCountDisplay || '—'],
                  ]},
                  { title: 'Reading Style', to: 4, rows: [
                    ['Template', BOOK_STYLES.find(s => s.id === fd.bookStyle || s.legacyId === fd.bookStyle)?.title || '—'],
                    ['Appearance', [
                      PREVIEW_THEMES.find(t => t.id === fd.pTheme)?.name,
                      PREVIEW_FONTS.find(f => f.id === fd.pFont)?.name,
                      { sm: 'Small', md: 'Medium', lg: 'Large' }[fd.pSize],
                      PREVIEW_SPACING.find(s => s.id === fd.pSpacing)?.label,
                    ].filter(Boolean).join(' · ') || '—'],
                  ]},
                  { title: 'Cover', to: 5, rows: [
                    ['Cover', fd.coverFile?.name || `${selectedTemplate.name} template${fd.coverArtPreview ? ' + artwork' : ''}`],
                  ]},
                  { title: 'Pricing', to: 6, rows: [
                    ['Price',     fd.isFree ? 'Free' : (fd.price ? `$${fd.price}` : '—')],
                    ['Best royalty estimate', royaltyEstimate.best ? `${formatRoyaltyMoney(royaltyEstimate.best.authorEarnings)} via ${royaltyEstimate.best.channel}` : '—'],
                    ...(fd.retailerLinks.filter(l => l.url?.trim()).length > 0
                      ? fd.retailerLinks.filter(l => l.url?.trim()).map(l => [
                          RETAILER_OPTIONS.find(o => o.slug === l.retailer)?.label || l.retailer,
                          l.price ? `$${l.price}` : 'No price set',
                        ])
                      : [['Where to buy', '—']]),
                  ]},
                  { title: 'Distribution', to: 7, rows: [
                    ['Route', distributionModeLabel],
                    ['Channels', selectedDistributionChannels.length
                      ? selectedDistributionChannels.map(channel => channel.label).join(', ')
                      : 'None selected — Indie Converters only'],
                  ]},
                  { title: 'Front & Back Matter', to: 8, rows: [
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
                <div className="wz-release-panel">
                  <div className="wz-release-head">
                    <span>Release timing</span>
                    <small>Most authors schedule a release so there is time for proofing, reviews, and launch prep.</small>
                  </div>

                  <div className="wz-release-options" role="radiogroup" aria-label="Release timing">
                    {[
                      {
                        value: 'schedule',
                        title: 'Schedule release',
                        text: 'Keep the book private now and prepare a launch date.',
                      },
                      {
                        value: 'draft',
                        title: 'Keep as draft',
                        text: 'Save everything privately and decide later from your dashboard.',
                      },
                      {
                        value: 'now',
                        title: 'Publish today',
                        text: 'Make the book visible immediately after this step.',
                      },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        className={`wz-release-option ${releasePlan === option.value ? 'active' : ''}`}
                        role="radio"
                        aria-checked={releasePlan === option.value}
                        onClick={() => setFd(p => ({ ...p, releasePlan: option.value }))}
                      >
                        <span className="wz-radio-dot" />
                        <strong>{option.title}</strong>
                        <small>{option.text}</small>
                      </button>
                    ))}
                  </div>

                  {releasePlan === 'schedule' && (
                    <div className="wz-release-date-row">
                      <label htmlFor="release-date">Release date</label>
                      <input
                        id="release-date"
                        type="date"
                        value={releaseDate}
                        min={minReleaseDate}
                        onChange={e => setFd(p => ({ ...p, releaseDate: e.target.value }))}
                      />
                      <span className={releaseDateInvalid ? 'is-error' : ''}>
                        {releaseDateInvalid
                          ? `Choose a date at least ${RELEASE_LEAD_DAYS} days from today.`
                          : `Scheduled for ${formatDateInput(releaseDate)}.`}
                      </span>
                    </div>
                  )}

                  {releasePlan === 'now' && (
                    <div className="wz-release-warning">
                      Publishing today makes the listing visible right away. Use this only when the manuscript, cover, links, and metadata are final.
                    </div>
                  )}
                </div>

                <div className="wz-publish-choice">
                  <button type="button" className="btn btn-primary wz-publish-btn" onClick={() => handlePublish(releasePlan)}
                    disabled={publishing || releaseDateInvalid || layoutIssues.some(i => i.severity === 'error')}
                    title={layoutIssues.some(i => i.severity === 'error') ? 'Fix errors in the Manuscript step before publishing' : undefined}>
                    {publishing
                      ? 'Saving…'
                      : releasePlan === 'now'
                        ? 'Publish today →'
                        : releasePlan === 'draft'
                          ? 'Save as draft →'
                          : 'Schedule release →'}
                  </button>
                </div>
                <p className="wz-publish-note">
                  Scheduled books stay private while you review proofs, gather early readers, and finish launch prep. You can still publish immediately when everything is final.
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="wz-nav">
            {step > 0 && <button type="button" className="btn btn-outline" onClick={goBack}>← Back</button>}
            {step < 10 && <button type="button" className="btn btn-primary" onClick={goNext}>Continue →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
