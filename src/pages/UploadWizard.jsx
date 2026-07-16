import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import mammoth from 'mammoth/mammoth.browser';
import DOMPurify from 'dompurify';
import { validateManuscript, analyseHtml, analyseTxt, analyseImages, countManualPageBreaks } from '../lib/manuscriptValidator';
import { calculateRoyaltyEstimates, formatRoyaltyMoney } from '../lib/royaltyCalculator';
import { calculatePrintCover, formatInches as formatCoverInches, TRIM_SIZE_OPTIONS, COVER_SAFE_MARGIN_IN, COVER_BLEED_IN } from '../lib/printCoverCalculator';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import RetailerLinksEditor, { RETAILER_OPTIONS } from '../components/RetailerLinksEditor';
import PublishingAssistant from '../components/PublishingAssistant';
import { supabase } from '../lib/supabase';
import sampleCover1 from '../assets/dammie-covers/dammie-01.webp';
import sampleCover2 from '../assets/dammie-covers/dammie-02.webp';
import sampleCover3 from '../assets/dammie-covers/dammie-03.webp';
import './UploadWizard.css';

// ─── Constants ────────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { label: 'Your Book',       group: 'Publishing Steps',
    blurb: 'This information is used to present your book in the Indie Converters catalogue and on partner channels.',
    tips: ['Use a clear, compelling title.', 'Subtitles help readers discover your book.', 'You can add or change details anytime.'] },
  { label: 'About',           group: 'Publishing Steps',
    blurb: 'Your description and genre help readers find your book while browsing or searching.',
    tips: ['Lead with what makes the premise distinct.', 'Pick the genre readers would search for first.', 'Keywords widen how your book gets discovered.'] },
  { label: 'Publication',     group: 'Publishing Steps',
    blurb: "Publication details appear in your book's metadata and are used by retailers and libraries.",
    tips: ['An ISBN is optional but required by some retailers.', 'Page count is estimated from your manuscript.', 'You can skip ISBN now and add one later.'] },
  { label: 'Manuscript',      group: 'Files',
    blurb: 'Upload your manuscript file and choose which editions you plan to publish.',
    tips: ['.docx files give the most accurate conversion.', 'Trim size only matters for print editions.', 'You can replace this file anytime.'] },
  { label: 'Conversion Readiness', group: 'Files',
    blurb: 'A full health check of your manuscript before we convert it into eBook and print editions.',
    tips: ['Fix critical issues first — they block conversion.', 'Warnings are worth reviewing but won’t stop you.', 'You can come back to this check anytime before publishing.'] },
  { label: 'Reading Style',   group: 'Files',
    blurb: "Choose how your book's interior pages look across formats.",
    tips: ['The preview updates live as you change styles.', 'Fonts affect the final print page count.', 'You can fine-tune this later per format.'] },
  { label: 'Cover',           group: 'Publish',
    blurb: 'Your cover is the first thing readers see in the catalogue and on retailer pages.',
    tips: ['Templates are ready instantly — uploads take a moment to process.', 'Use a high-resolution image for print editions.', 'Preview the cover on multiple devices.'] },
  { label: 'Pricing',         group: 'Publish',
    blurb: 'Set how readers pay for your book, directly or through retailers.',
    tips: ['Direct sales keep a larger share of each sale.', 'You can list on multiple retailers at once.', 'Prices can be updated anytime after publishing.'] },
  { label: 'Distribution',    group: 'Publish',
    blurb: 'Choose which retailers and platforms will carry your book.',
    tips: ['Wide distribution reaches more readers.', 'Some retailers require exclusivity — check before selecting.', 'You can add more channels later.'] },
  { label: 'Front & Back Matter', group: 'Structure',
    blurb: 'These sections appear before and after your main text, like a printed book.',
    tips: ['A copyright page is included by default.', 'An About the Author section helps readers connect with you.', 'Only enabled sections are added to your manuscript.'] },
  { label: 'Book Structure',      group: 'Structure',
    blurb: 'Review how your manuscript will be laid out, page by page.',
    tips: ['Use this to check pacing and chapter breaks.', 'Formatting issues are flagged here before publishing.', 'Changes to your manuscript update this preview.'] },
  { label: 'Preview & Submit',    group: 'Review',
    blurb: 'Review everything before your book goes live or is scheduled for release.',
    tips: ['Scheduled books stay private until their release date.', 'You can still edit details after publishing.', 'Publishing today makes your listing visible immediately.'] },
];

const ASSISTANT_FIELD_DEFINITIONS = {
  title: { label: 'Title', purpose: 'The primary book title shown to readers and retailers.', required: true, maxLength: 160 },
  subtitle: { label: 'Subtitle', purpose: 'A supporting title or reader-facing promise.', maxLength: 200 },
  language: { label: 'Language', purpose: 'The primary language of the published book.' },
  edition: { label: 'Edition', purpose: 'The edition label for this version of the book.', maxLength: 80 },
  series: { label: 'Series name', purpose: 'The name shared by books in the same series.', maxLength: 160 },
  seriesVolume: { label: 'Volume / Part', purpose: 'The book’s numeric position in its series.' },
  description: { label: 'Description', purpose: 'Back-cover and retailer copy that explains the premise and gives readers a reason to read.', required: true, maxLength: 4000 },
  audience: { label: 'Target audience', purpose: 'The primary reader age classification for this edition.' },
  genre: { label: 'Primary genre', purpose: 'The main reader-facing market category.', required: true },
  genreSecondary: { label: 'Secondary genre', purpose: 'An optional second market category.' },
  keywords: { label: 'Keywords', purpose: 'Up to seven specific search phrases readers may use to discover the book.' },
  pubYear: { label: 'Publication year', purpose: 'The year attached to this published edition.' },
  publisher: { label: 'Publisher name', purpose: 'The publishing imprint or self-publishing name.', maxLength: 160 },
  pageCount: { label: 'Page count', purpose: 'The final or estimated print page count.' },
  trimSize: { label: 'Trim size', purpose: 'The physical page dimensions for print editions.' },
  price: { label: 'List price', purpose: 'The public list price before retailer-specific tax or delivery adjustments.' },
};

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
  { key: 'readerCta',
    label: 'Reader Call to Action',
    tip: 'Invite readers to review, subscribe, visit your website, or continue with another book.',
    required: false,
    template: () => 'Enjoyed this book? [Invite the reader to take one clear next step.]\n\n[Website or destination]',
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
const FORMAT_ICONS = {
  eBook:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>,
  Paperback:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Hardcover:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M8 2v20"/></svg>,
  Audiobook:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-3a9 9 0 0 1 18 0v3"/><path d="M21 14v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z"/><path d="M3 14v3a2 2 0 0 0 2 2h1v-7H5a2 2 0 0 0-2 2Z"/></svg>,
};
const FILE_HEALTH_ISSUE_TYPES = ['file-too-large', 'critically-short', 'very-short', 'short-content', 'very-long', 'unsupported', 'print-trim-fit'];
const HEADING_ISSUE_TYPES = ['no-headings', 'single-heading', 'wrong-heading-start', 'all-caps-headings', 'empty-chapters', 'short-chapters'];
const READINESS_ICONS = {
  formatting:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h13"/></svg>,
  headings:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>,
  images:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 16-5-5-9 9"/></svg>,
  pagebreaks:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>,
  filehealth:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="m9.5 13 1.8 1.8L15 11"/></svg>,
  frontmatter: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>,
  metadata:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 12 12 3.4H4v8l8.6 8.6a2 2 0 0 0 2.8 0l5.2-5.2a2 2 0 0 0 0-2.8Z"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/></svg>,
  readability: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="7"/><line x1="19" y1="20" x2="19" y2="15"/></svg>,
  spelling:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20 9 4h1l5 16M5.5 15h8"/><path d="m15 20 4-11 4 11M16.5 16.5h5"/></svg>,
};
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

// Bundled sample covers for trying the "upload finished cover" flow without
// a real file on hand. Picking one sets both front and back to the same
// image, since a real uploaded cover set is one continuous design.
const COVER_SAMPLES = [
  { id: 'sample1', label: 'Romance', src: sampleCover1, file: 'romance-background.webp' },
  { id: 'sample2', label: 'Sci-fi', src: sampleCover2, file: 'sci-fi-background.webp' },
  { id: 'sample3', label: 'Illustrated', src: sampleCover3, file: 'illustrated-background.webp' },
];

const BACK_COVER_BLOCK_LABELS = {
  blurb: 'Book description',
  bio: 'Author bio',
};

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

// A real keyword the author already chose (About step) beats a generic
// genre-mapped one, since it actually describes their book.
function buildCoverArtQuery(genreSlug, genreLabel, keywords) {
  const keyword = (keywords || []).find(Boolean) || (GENRE_KEYWORDS[genreSlug] || [])[0] || '';
  return [genreLabel || genreSlug, keyword, 'book cover'].filter(Boolean).join(' ').trim();
}

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

function likelyCentralName(value = '') {
  const ignored = new Set(['The', 'This', 'That', 'Their', 'Reader', 'Readers', 'Book', 'Story']);
  return (String(value).match(/\b[A-Z][a-z]{2,}\b/g) || []).find(name => !ignored.has(name)) || '';
}

function isValidISBN13(isbn) {
  const d = isbn.replace(/[-\s]/g, '');
  if (!/^\d{13}$/.test(d)) return false;
  const sum = d.split('').reduce((acc, c, i) => acc + parseInt(c) * (i % 2 === 0 ? 1 : 3), 0);
  return sum % 10 === 0;
}

const MANUSCRIPT_FILE_TYPES = {
  docx: { label: 'Microsoft Word Document', letter: 'W' },
  odt:  { label: 'OpenDocument Text',       letter: 'O' },
  rtf:  { label: 'Rich Text Format',        letter: 'R' },
  txt:  { label: 'Plain Text',              letter: 'T' },
};
function manuscriptFileType(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase();
  return MANUSCRIPT_FILE_TYPES[ext] || { label: 'Document', letter: '·' };
}
function manuscriptFileTypeLabel(filename = '') {
  return manuscriptFileType(filename).label;
}

// Groups the real issues from validateManuscript()/analyseHtml() into the five
// readiness rows shown to the author, taking the worst severity in each group.
function readinessRowFor(types, issues) {
  const matched = issues.filter(i => types.includes(i.type));
  const bySeverity = severity => matched.find(i => i.severity === severity);
  const issue = bySeverity('error') || bySeverity('warning') || matched[0] || null;
  return { severity: issue?.severity || 'good', issue };
}

function readImageDimensions(dataUri) {
  return new Promise(resolve => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUri;
  });
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

function HealthScoreRing({ percent }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="wz-healthcheck-ring-wrap">
      <svg width="132" height="132" viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(68,28,178,0.1)" strokeWidth="10" />
        <circle
          cx="66" cy="66" r={r} fill="none" stroke="var(--clay)" strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 66 66)"
        />
      </svg>
      <div className="wz-healthcheck-ring-label"><strong>{percent}%</strong></div>
    </div>
  );
}

function HealthDonut({ good, attention, critical }) {
  const total = Math.max(1, good + attention + critical);
  const r = 30, c = 2 * Math.PI * r;
  const segments = [
    ['#1a7a35', good],
    ['#b8763d', attention],
    ['#b83232', critical],
  ];
  let offset = 0;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="wz-healthcheck-donut">
      <g transform="rotate(-90 36 36)">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
        {segments.map(([color, value]) => {
          const len = (value / total) * c;
          const el = value > 0 && (
            <circle key={color} cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        })}
      </g>
    </svg>
  );
}

// Surfaces the Print Cover Calculator (a separate, standalone tool) wherever a
// print format is selected — real spine/full-wrap numbers computed from the
// same trim size and page estimate as the rest of the wizard, not a static ad.
function PrintCoverToolCard({ estimate, calculatorPath, trimLabel, pages }) {
  return (
    <div className="wz-print-cover-tool">
      <div>
        <strong>Need a full-wrap print cover?</strong>
        <span>Calculate spine width, bleed, safe area, and 300 DPI export size before you design or hire a cover designer.</span>
        {estimate && (
          <>
            <div className="wz-print-cover-mini" aria-label="Estimated print cover size">
              <div>
                <span>Full wrap</span>
                <strong>{formatCoverInches(estimate.fullCoverWidth)} x {formatCoverInches(estimate.fullCoverHeight)}</strong>
              </div>
              <div>
                <span>Spine</span>
                <strong>{formatCoverInches(estimate.spineWidth)}</strong>
              </div>
              <div>
                <span>300 DPI</span>
                <strong>{estimate.pixelWidth} x {estimate.pixelHeight}px</strong>
              </div>
            </div>
            <small className="wz-print-cover-assumption">
              Based on {trimLabel}{pages ? `, ${pages} pages` : ', page count pending'}, black and white interior, white paper.
            </small>
          </>
        )}
      </div>
      <Link to={calculatorPath}>Open calculator</Link>
    </div>
  );
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

// Real EAN-13 encoding (the standard ISBN barcodes use) rather than a
// generic icon — a barcode icon has ~6 sparse bars, a real one has 95
// modules of varying width, which is what actually reads as authentic.
const EAN13_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const EAN13_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const EAN13_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
const EAN13_PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

function ean13Bars(digits13) {
  const first = Number(digits13[0]);
  const left = digits13.slice(1, 7).split('').map(Number);
  const right = digits13.slice(7, 13).split('').map(Number);
  const parity = EAN13_PARITY[first];
  const leftBars = left.map((d, i) => (parity[i] === 'L' ? EAN13_L[d] : EAN13_G[d])).join('');
  const rightBars = right.map(d => EAN13_R[d]).join('');
  return `101${leftBars}01010${rightBars}101`;
}

// One reusable barcode graphic — a real ISBN barcode's own artwork never
// changes between books, so there's nothing to regenerate per template.
function BackCoverBarcode({ isbn }) {
  const rawDigits = (isbn || '').replace(/[-\s]/g, '');
  const digits13 = (rawDigits.length === 13 ? rawDigits : '9780000000000').padEnd(13, '0').slice(0, 13);
  const bars = ean13Bars(digits13);
  const moduleWidth = 1.1;
  const barHeight = 46;

  return (
    <div className="wz-back-barcode" aria-label="ISBN barcode placeholder">
      <span className="wz-back-barcode-label">ISBN {isbn?.trim() || 'pending'}</span>
      <svg
        viewBox={`0 0 ${bars.length * moduleWidth} ${barHeight}`}
        width={bars.length * moduleWidth}
        height={barHeight}
        shapeRendering="crispEdges"
      >
        <rect x="0" y="0" width={bars.length * moduleWidth} height={barHeight} fill="#fff" />
        {bars.split('').map((bit, i) => bit === '1' && (
          <rect key={i} x={i * moduleWidth} y="0" width={moduleWidth} height={barHeight} fill="#14100c" />
        ))}
      </svg>
      <span>{rawDigits || digits13}</span>
    </div>
  );
}

function CoverBackPreview({
  coverPreview, description, authorBio, authorName, authorPhoto, isbn, templateId, paletteId, artPreview,
  blockOrder, showBio, boldLede, marginPercent, small = false,
}) {
  if (coverPreview) {
    return <img src={coverPreview} alt="Back cover" className="wz-cover-preview-img" />;
  }

  const palette = coverPalette(paletteId);
  const template = coverTemplate(templateId);
  const blurb = (description || '').trim() || 'Your back-cover description will appear here once you add it in the About step.';
  const bio = (authorBio || '').trim();
  const authorInitials = (authorName || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const showBioBlock = !!showBio && !!bio;

  const sentences = boldLede ? (blurb.match(/[^.!?]+[.!?]*/g) || [blurb]) : null;
  const lede = boldLede ? sentences[0].trim() : null;
  const rest = boldLede ? sentences.slice(1).join(' ').trim() : blurb;

  const blockMap = {
    blurb: (
      <div key="blurb" className="wz-back-block">
        {lede && <p className="wz-back-lede">{lede}</p>}
        <p className="wz-back-blurb">{rest}</p>
      </div>
    ),
    bio: showBioBlock ? (
      <div key="bio" className="wz-back-block wz-back-bio">
        <span className="wz-back-bio-label">About the author</span>
        <div className="wz-back-bio-row">
          {authorPhoto
            ? <img className="wz-back-bio-avatar" src={authorPhoto} alt={authorName} />
            : <span className="wz-back-bio-avatar wz-back-bio-avatar--fallback">{authorInitials}</span>}
          <div className="wz-back-bio-text">
            <strong className="wz-back-bio-name">{authorName}</strong>
            <p>{bio}</p>
          </div>
        </div>
      </div>
    ) : null,
  };
  const orderedBlocks = (blockOrder?.length ? blockOrder : ['blurb', 'bio']).map(id => blockMap[id]).filter(Boolean);

  // No independent back palette — the back always inherits whatever the
  // front actually shows: the same image (full-bleed, same tint treatment)
  // when one's set, otherwise the same solid palette. That's the only way
  // front and back are guaranteed to match, since a printed book can't have
  // mismatched covers.
  return (
    <div
      className={`wz-template-cover wz-template-cover--back wz-template-cover--${template.id} ${artPreview ? 'wz-template-cover--has-art wz-template-cover--art-full' : ''} ${small ? 'wz-template-cover--small' : ''}`}
      style={{
        '--cover-bg': palette.bg,
        '--cover-bg2': palette.bg2,
        '--cover-ink': palette.ink,
        '--cover-muted': palette.muted,
        '--cover-accent': palette.accent,
        '--cover-soft': palette.soft,
        ...(marginPercent != null ? { padding: `${marginPercent}%` } : {}),
      }}
    >
      {artPreview && <span className="wz-template-art" style={{ backgroundImage: `url(${artPreview})` }} />}
      <span className="wz-template-mark">.in</span>
      {marginPercent != null && !small && (
        <span className="wz-back-safe-guide" style={{ inset: `${marginPercent}%` }} aria-hidden="true" />
      )}
      <div className="wz-back-blocks">{orderedBlocks}</div>
      <div className="wz-back-footer">
        <span className="wz-back-author">{authorName}</span>
        <BackCoverBarcode isbn={isbn} />
      </div>
    </div>
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
  const [assistantActiveField, setAssistantActiveField] = useState(null);
  const [genres,       setGenres]       = useState([]);
  const [stepError,    setStepError]    = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [manuscriptViewOpen, setManuscriptViewOpen] = useState(false);
  const [healthCheckInfoOpen, setHealthCheckInfoOpen] = useState(false);
  const [healthDetailModal, setHealthDetailModal] = useState(null); // null | 'images' | 'pagebreaks' | 'spelling'
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
  const [msImages,     setMsImages]     = useState([]);
  const [msPageBreaks, setMsPageBreaks] = useState(0);
  const [msSpelling,   setMsSpelling]   = useState(null);
  const [msPage,       setMsPage]       = useState(0);
  const [msSpread,     setMsSpread]     = useState(false);
  const [pageTurnDir,  setPageTurnDir]  = useState('');
  const [outgoingMsPage, setOutgoingMsPage] = useState(null);
  const [stageView,    setStageView]    = useState('plain');
  const [msLoading,    setMsLoading]    = useState(false);
  const [authorProfile,setAuthorProfile]= useState(null);
  const [authorProfileLoading, setAuthorProfileLoading] = useState(() => Boolean(user?.id));
  const [coverPreviewDevice, setCoverPreviewDevice] = useState('desktop');
  const [coverSide, setCoverSide] = useState('front');
  const [coverBackMode, setCoverBackMode] = useState('layout');
  const [coverArtSearch, setCoverArtSearch] = useState({ status: 'idle', query: '', results: [] });
  const [matureSuggestionDismissed, setMatureSuggestionDismissed] = useState(false);
  const [bsPage,        setBsPage]        = useState(0);
  const [bsPageTurnDir, setBsPageTurnDir] = useState('');
  const [styleOpen,     setStyleOpen]     = useState(false);
  const fileRef  = useRef(null);
  const coverRef = useRef(null);
  const coverArtRef = useRef(null);
  const backCoverRef = useRef(null);
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
    genre: '', genreSecondary: '', keywords: [], tags: [],
    pubYear: String(new Date().getFullYear()), publisher: 'Self-published', pageCount: '',
    isbnOption: 'skip', isbn: '',
    manuscriptFile: null, manuscriptPath: '', formats: ['eBook'], trimSize: '5x8',
    spellingIgnored: [],
    pTheme: 'light', pFont: 'fraunces', pSize: 'md', pSpacing: 'normal',
    coverFile: null, coverPreview: '', coverDataUrl: '', coverColor: 'cover-clay',
    coverMode: 'template', coverTemplate: 'editorial', coverPalette: 'violet',
    coverArtFile: null, coverArtPreview: '', coverArtDataUrl: '', coverArtPlacement: 'window',
    backBlockOrder: ['blurb', 'bio'], backShowBio: true, backBoldLede: false,
    backCoverFile: null, backCoverPreview: '', backCoverDataUrl: '',
    price: '', isFree: false, buyUrl: '', buyPlatform: 'own', sellDirect: false,
    retailerLinks: [],
    releasePlan: 'schedule', releaseDate: dateInputFromNow(DEFAULT_RELEASE_LEAD_DAYS),
    bookStyle: 'indie-romance',
    distributionChannels: [],
    distributionStrategy: '', distributionPriority: '',
    assistantFacts: { centralSubject: '' },
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
      readerCta:        { enabled: false, content: '' },
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
  // % padding on a fixed-aspect-ratio box is based on width for every side,
  // so this single percentage keeps the safe margin proportionally correct
  // on both axes without needing to measure rendered pixels.
  const backMarginPercent = hasPrintFormat ? (COVER_SAFE_MARGIN_IN / printCoverTrim.width) * 100 : null;
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
  // The storage path is `${uploadedAtMs}-${filename}` — a real timestamp already
  // captured at upload time, so "Uploaded X ago" works after a page reload too.
  const manuscriptUploadedAtMs = Number(fd.manuscriptPath?.split('/').pop()?.match(/^(\d+)-/)?.[1]) || null;
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

  function captureAssistantField(event) {
    const target = event.target;
    if (!target?.matches?.('input:not([type="file"]):not([type="password"]), textarea, select')) return;
    const fieldContainer = target.closest('.wz-field');
    const label = fieldContainer?.querySelector(':scope > label');
    const labelText = label?.childNodes?.[0]?.textContent?.trim() || label?.textContent?.trim() || '';
    const fieldId = Object.entries(ASSISTANT_FIELD_DEFINITIONS)
      .find(([, definition]) => labelText.toLowerCase().startsWith(definition.label.toLowerCase()))?.[0];
    if (!fieldId || fieldId === 'isbn') return;
    const definition = ASSISTANT_FIELD_DEFINITIONS[fieldId];
    const currentValue = fieldId === 'keywords' ? fd.keywords : target.value;
    setAssistantActiveField({
      id: fieldId,
      ...definition,
      value: currentValue,
      maxLength: definition.maxLength || (target.maxLength > 0 ? target.maxLength : null),
      validation: target.getAttribute('aria-invalid') === 'true' ? stepError : '',
    });
  }

  function insertAssistantSuggestion(suggestion) {
    const definition = ASSISTANT_FIELD_DEFINITIONS[suggestion?.field];
    if (!definition || typeof suggestion.value !== 'string') return false;
    if (suggestion.field === 'keywords') {
      const keywords = suggestion.value.split(/[,\n]/).map(value => value.trim()).filter(Boolean).slice(0, 7);
      up('keywords', keywords);
      setAssistantActiveField({ id: 'keywords', ...definition, value: keywords });
      return true;
    }
    const value = suggestion.value.slice(0, definition.maxLength || 4000);
    up(suggestion.field, value);
    setAssistantActiveField({ id: suggestion.field, ...definition, value });
    return true;
  }

  // Toggling mature content on always pins the target audience to Adult (18+) —
  // the two are linked by definition. Turning it off hands audience back to
  // the author rather than guessing, since a book can be Adult without being mature.
  function setMatureContent(value) {
    setFd(p => ({ ...p, matureContent: value, audience: value ? 'adult' : p.audience }));
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
    setPageTurnDir('');
    setOutgoingMsPage(null);
    setMsImages([]);
    setMsPageBreaks(0);
    setMsSpelling(null);
  }

  // Every readiness row has its own dedicated detail view.
  function openRowDetail(rowKey) {
    setHealthDetailModal(rowKey);
  }

  function upMatter(section, key, field, val) {
    setFd(p => ({
      ...p,
      [section]: { ...p[section], [key]: { ...p[section][key], [field]: val } },
    }));
  }

  function applyAssistantDistributionStrategy({ strategy, priority }) {
    const allWideChannels = DISTRIBUTION_CHANNELS.flatMap(group => group.channels.map(channel => channel.id));
    setFd(previous => ({
      ...previous,
      distributionStrategy: strategy,
      distributionPriority: priority,
      distributionChannels: strategy === 'amazon_exclusive' ? ['amazon'] : strategy === 'wide' ? allWideChannels : [],
      sellDirect: strategy === 'direct_first' ? true : previous.sellDirect,
    }));
    return true;
  }

  function rememberAssistantBookFacts(facts) {
    if (!facts || typeof facts !== 'object') return false;
    setFd(previous => ({ ...previous, assistantFacts: { ...previous.assistantFacts, centralSubject: String(facts.centralSubject || '').slice(0, 500) } }));
    return true;
  }

  function insertAssistantMatterDraft(draft) {
    const section = draft?.section;
    const key = draft?.key;
    if (!['frontMatter', 'backMatter'].includes(section) || !fd[section]?.[key] || typeof draft.content !== 'string') return false;
    setFd(previous => ({
      ...previous,
      [section]: { ...previous[section], [key]: { ...previous[section][key], enabled: true, content: draft.content.slice(0, 8000) } },
    }));
    return true;
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
    setPageTurnDir(''); setOutgoingMsPage(null);
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

  // Real flip: the outgoing page renders as an absolutely-positioned overlay
  // that rotates away (backface-visibility hidden), while the page underneath
  // switches to the new content immediately — so the flip actually reveals
  // the next page instead of rotating the same content back and forth.
  function turnReadingPage(direction) {
    if (!msPages.length || msLoading || pageTurnDir) return;
    const targetPage = direction === 'next'
      ? Math.min(msPages.length - 1, msPage + 1)
      : Math.max(0, msPage - 1);
    if (targetPage === msPage) return;

    if (pageTurnTimerRef.current) window.clearTimeout(pageTurnTimerRef.current);
    setOutgoingMsPage(msPage);
    setMsPage(targetPage);
    setPageTurnDir(direction);
    pageTurnTimerRef.current = window.setTimeout(() => {
      setPageTurnDir('');
      setOutgoingMsPage(null);
      pageTurnTimerRef.current = null;
    }, 900);
  }

  useEffect(() => {
    setMsPage(0);
    setPageTurnDir('');
    setOutgoingMsPage(null);
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
      .select('display_name, short_bio, long_bio, website_url, goodreads_url, location, photo_url')
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
    if (step === 9 && !fd.frontMatter.copyright.content) {
      upMatter('frontMatter', 'copyright', 'content',
        FM_ITEMS[0].template(fd, authorName, fd.pubYear || String(new Date().getFullYear())));
    }
    if (step === 9 && !fd.backMatter.aboutAuthor.content && !authorProfileLoading) {
      upMatter('backMatter', 'aboutAuthor', 'content', authorProfileBio || BM_ITEMS[0].template(fd, authorName));
    }
    if ((step === 5 || step === 10) && fd.manuscriptPath && !msText && !msLoading) {
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
    if (step === 12) return;
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
  const selectedTemplate = coverTemplate(fd.coverTemplate);

  // Genre-driven Unsplash search for the artwork slot — falls back to the
  // bundled static samples (via coverArtSearch.status !== 'ready' below) if
  // the search API isn't configured, rate-limited, or returns nothing.
  useEffect(() => {
    if (step !== 6 || coverSide !== 'front' || fd.coverMode !== 'template' || fd.coverArtPreview) return;
    if (!fd.genre) return;
    const query = buildCoverArtQuery(fd.genre, primaryGenreLabel, fd.keywords);
    if (coverArtSearch.status !== 'idle' && coverArtSearch.query === query) return;
    let cancelled = false;
    setCoverArtSearch({ status: 'loading', query, results: [] });
    fetch(`/api/cover-art-search?query=${encodeURIComponent(query)}`)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && Array.isArray(data.results) && data.results.length) {
          setCoverArtSearch({ status: 'ready', query, results: data.results });
        } else {
          setCoverArtSearch({ status: 'error', query, results: [] });
        }
      })
      .catch(() => { if (!cancelled) setCoverArtSearch({ status: 'error', query, results: [] }); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, coverSide, fd.coverMode, fd.coverArtPreview, fd.genre, fd.keywords, primaryGenreLabel]);
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
    setMsImages([]);
    setMsPageBreaks(0);
    setMsSpelling(null);
    const ext = file.name.split('.').pop().toLowerCase();
    try {
      if (ext === 'docx') {
        const collectedImages = [];
        const { value: rawHtml } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, {
          // Real image-resolution check: intercept each embedded image mammoth
          // finds, decode it to read its actual pixel dimensions, and keep that
          // alongside the normal HTML conversion (image still renders as usual).
          convertImage: mammoth.images.imgElement(async image => {
            const base64 = await image.readAsBase64String();
            const src = `data:${image.contentType};base64,${base64}`;
            const dims = await readImageDimensions(src);
            collectedImages.push({ contentType: image.contentType, width: dims?.width || 0, height: dims?.height || 0 });
            return { src };
          }),
        });
        const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        // mammoth carries hyperlink hrefs through verbatim from the docx's OOXML
        // relationships, which can contain javascript: URIs — sanitize before
        // this ever reaches dangerouslySetInnerHTML.
        const html = DOMPurify.sanitize(rawHtml);
        setMsHtml(html); setMsStructure(analyseHtml(html, file.size, { wordsPerPage: selectedTrim.wordsPerPage })); setMsText(rawText);
        setMsImages(collectedImages);
        setMsPageBreaks(await countManualPageBreaks(await file.arrayBuffer()));
        const { checkSpelling } = await import('../lib/spellChecker');
        setMsSpelling(checkSpelling(rawText));
      } else if (ext === 'txt' || ext === 'rtf') {
        const text = await file.text();
        setMsText(text); setMsStructure(analyseTxt(text, file.size, { wordsPerPage: selectedTrim.wordsPerPage }));
        const safeHtml = text.split(/\n{2,}/).map(p =>
          `<p>${p.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`
        ).join('\n');
        setMsHtml(safeHtml);
        const { checkSpelling } = await import('../lib/spellChecker');
        setMsSpelling(checkSpelling(text));
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

  function chooseCoverBackMode(mode) {
    setStepError('');
    if (mode === 'layout') {
      setFd(p => ({ ...p, backCoverFile: null, backCoverPreview: '', backCoverDataUrl: '' }));
    }
    setCoverBackMode(mode);
  }

  function moveBackBlock(from, to) {
    if (Number.isNaN(from) || from === to) return;
    setFd(p => {
      if (to < 0 || to > p.backBlockOrder.length - 1) return p;
      const order = [...p.backBlockOrder];
      const [item] = order.splice(from, 1);
      order.splice(to, 0, item);
      return { ...p, backBlockOrder: order };
    });
  }

  function handleBackCover(file) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setStepError('Back cover must be a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStepError(`Back cover is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please upload an image under 5 MB.`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setFd(p => ({ ...p, backCoverFile: file, backCoverPreview: previewUrl, backCoverDataUrl: '' }));
    const reader = new FileReader();
    reader.onload = () => setFd(p => ({ ...p, backCoverDataUrl: reader.result || '' }));
    reader.readAsDataURL(file);
    setStepError('');
  }

  // Sample photos feed the template's artwork slot — the real title, subtitle,
  // and author still render on top from actual form data, so this stays a
  // mockup of the user's own book rather than swapping in a static image.
  async function useSampleArtwork(sample) {
    const res = await fetch(sample.src);
    const blob = await res.blob();
    const file = new File([blob], sample.file, { type: blob.type || 'image/webp' });
    handleCoverArt(file);
    up('coverArtPlacement', 'full');
  }

  // Same idea for a genre-searched Unsplash photo, plus the download-tracking
  // ping their API guidelines require whenever a searched photo is actually used.
  async function usePhotoSearchResult(photo) {
    const res = await fetch(photo.fullUrl);
    const blob = await res.blob();
    const file = new File([blob], `${photo.id}.jpg`, { type: blob.type || 'image/jpeg' });
    handleCoverArt(file);
    up('coverArtPlacement', 'full');
    if (photo.downloadLocation) {
      fetch('/api/cover-art-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
      }).catch(() => {});
    }
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
        author_id: author.id, book_type: fd.sellDirect ? 'published' : 'affiliate',
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

      if (fd.sellDirect) {
        const { error: pbe } = await supabase.from('published_books').insert({
          book_id: book.id,
          list_price: fd.isFree ? 0 : (fd.price ? parseFloat(fd.price) : 0),
        });
        if (pbe) throw new Error(`Direct-sale settings: ${pbe.message}`);
      }

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

  // Book Health Check (step 4) — five rows are backed by real analysis;
  // Images/Page breaks have no dedicated check, so they show a factual
  // statement about the conversion pipeline's behaviour instead of a
  // pass/fail result for a test that was never run.
  const hasSubtitle = !!fd.subtitle.trim();
  const hasFrontMatter = Object.values(fd.frontMatter).some(m => m.enabled && m.content?.trim());
  const readingMinutes = msStructure?.wordCount ? Math.round(msStructure.wordCount / 200) : 0;
  const readingTimeLabel = readingMinutes >= 60
    ? `${Math.floor(readingMinutes / 60)}h ${readingMinutes % 60}m`
    : `${readingMinutes}m`;
  const trimWidthInches = parseFloat(selectedTrim.aspect?.split('/')[0]) || 5;
  const imageCheck = analyseImages(msImages, { trimWidthInches, hasPrintFormat });
  const readability = msStructure?.readability;

  // "Ignore" removes a flagged word from view (and from the counted totals)
  // without re-running the checker — the real action the Spelling row was
  // missing, since character names and invented words will always trip a
  // plain dictionary lookup.
  const spellingIgnoredSet = new Set(fd.spellingIgnored);
  const visibleMisspelled = msSpelling ? msSpelling.topMisspelled.filter(m => !spellingIgnoredSet.has(m.word)) : [];
  const ignoredAmongTop = msSpelling ? msSpelling.topMisspelled.filter(m => spellingIgnoredSet.has(m.word)) : [];
  const visibleMisspelledCount = msSpelling ? Math.max(0, msSpelling.misspelledCount - ignoredAmongTop.length) : 0;
  const visibleMisspelledOccurrences = msSpelling
    ? Math.max(0, msSpelling.misspelledOccurrences - ignoredAmongTop.reduce((sum, m) => sum + m.count, 0))
    : 0;

  function ignoreSpellingWord(word) {
    setFd(p => (p.spellingIgnored.includes(word) ? p : { ...p, spellingIgnored: [...p.spellingIgnored, word] }));
  }
  function resetIgnoredSpelling() {
    setFd(p => ({ ...p, spellingIgnored: [] }));
  }

  const readinessRows = msStructure ? [
    { key: 'formatting', icon: 'formatting', label: 'Formatting', sub: 'Styles, spacing & clean up',
      goodNote: 'Consistent styles detected across the document.',
      ...readinessRowFor(['excessive-blanks'], layoutIssues) },
    { key: 'headings', icon: 'headings', label: 'Headings', sub: 'Structure & hierarchy',
      goodNote: 'Chapter headings and structure look good.',
      ...readinessRowFor(HEADING_ISSUE_TYPES, layoutIssues) },
    { key: 'images', icon: 'images', label: 'Images', sub: 'Figures & illustrations',
      goodNote: imageCheck.count === 0
        ? 'No embedded images found.'
        : `${imageCheck.count} image${imageCheck.count === 1 ? '' : 's'} will be preserved.`,
      severity: imageCheck.checked && imageCheck.lowResCount > 0 ? 'warning' : 'good',
      issue: imageCheck.checked && imageCheck.lowResCount > 0
        ? { message: `${imageCheck.lowResCount} image${imageCheck.lowResCount === 1 ? '' : 's'} below 150dpi at ${selectedTrim.label} — may look blurry in print. Re-export at a higher resolution before publishing.` }
        : null },
    { key: 'pagebreaks', icon: 'pagebreaks', label: 'Page Breaks', sub: 'Automatic & manual breaks',
      goodNote: msPageBreaks > 0
        ? `${msPageBreaks} manual page break${msPageBreaks === 1 ? '' : 's'} found — kept for print, ignored in reflowable eBook formats.`
        : 'No manual page breaks — pagination is calculated automatically for both formats.',
      severity: 'good', issue: null },
    { key: 'filehealth', icon: 'filehealth', label: 'File Health', sub: 'Technical issues',
      goodNote: 'File is readable and valid.',
      ...readinessRowFor(FILE_HEALTH_ISSUE_TYPES, layoutIssues) },
    { key: 'frontmatter', icon: 'frontmatter', label: 'Front Matter', sub: 'Title pages & prelims',
      goodNote: 'All essential front matter elements are present.',
      severity: hasFrontMatter ? 'good' : 'info',
      issue: hasFrontMatter ? null : { message: 'No front matter written yet — a copyright page and title details help readers and retailers.' } },
    { key: 'metadata', icon: 'metadata', label: 'Metadata', sub: 'Book details & identifiers',
      goodNote: hasSubtitle ? 'Title, author, and keywords look good.' : 'Title, author, and keywords look good. Consider adding a subtitle for discoverability.',
      severity: 'good', issue: null },
    { key: 'readability', icon: 'readability', label: 'Readability', sub: 'Reader experience & flow',
      goodNote: readability
        ? `${readability.label} — Flesch score ${readability.fleschScore}, grade level ~${readability.fleschGrade}. Est. reading time: ${readingTimeLabel}.`
        : 'Add more text to get a readability estimate.',
      severity: readability && readability.fleschScore < 30 ? 'info' : 'good',
      issue: readability && readability.fleschScore < 30
        ? { message: `${readability.label} (Flesch score ${readability.fleschScore}) — this reads as quite dense. Consider shorter sentences if that isn't intentional for your genre.` }
        : null },
    { key: 'spelling', icon: 'spelling', label: 'Spelling', sub: 'Typos & unrecognised words',
      goodNote: msSpelling ? 'No potential spelling issues found.' : 'Checking spelling…',
      severity: msSpelling && visibleMisspelledCount > 0 ? 'info' : 'good',
      issue: msSpelling && visibleMisspelledCount > 0
        ? { message: `${visibleMisspelledCount} word${visibleMisspelledCount === 1 ? '' : 's'} not in our dictionary (${visibleMisspelledOccurrences} occurrences) — includes character names and invented words, so review rather than fix on sight. Examples: ${visibleMisspelled.slice(0, 5).map(m => m.word).join(', ')}.` }
        : null },
  ] : [];
  const readinessAllGood = readinessRows.every(r => r.severity === 'good');
  const readinessGoodCount = readinessRows.filter(r => r.severity === 'good').length;
  const readinessAttentionCount = readinessRows.filter(r => r.severity === 'warning' || r.severity === 'info').length;
  const readinessCriticalCount = readinessRows.filter(r => r.severity === 'error').length;
  const readinessScore = readinessRows.length ? Math.round((readinessGoodCount / readinessRows.length) * 100) : 100;
  const readinessScoreLabel = readinessScore >= 90 ? 'Mostly ready' : readinessScore >= 70 ? 'Almost there' : 'Needs work';

  const pct    = Math.round((step / (WIZARD_STEPS.length - 1)) * 100);
  const consistencyChecks = useMemo(() => {
    const centralName = likelyCentralName(fd.assistantFacts?.centralSubject);
    const releaseYear = releasePlan === 'schedule' && releaseDate
      ? releaseDate.slice(0, 4)
      : releasePlan === 'now'
        ? String(new Date().getFullYear())
        : '';
    const incompatibleChannels = selectedDistributionChannels.filter(channel => (
      !channel.formats?.some(format => fd.formats.includes(format))
    ));
    const hasWideExclusiveConflict = fd.distributionStrategy === 'amazon_exclusive' && fd.distributionChannels.some(channel => channel !== 'amazon');
    return [
      {
        id: 'consistency-cover-subtitle', label: 'Cover and subtitle', step: 6,
        status: fd.coverMode === 'upload' && fd.subtitle.trim() ? 'recommended' : 'complete',
        message: fd.coverMode === 'upload' && fd.subtitle.trim() ? 'Confirm the uploaded cover shows the same subtitle as your metadata.' : 'Template cover text is synchronized with metadata.',
      },
      {
        id: 'consistency-central-subject', label: 'Description subject', step: 1, field: 'description',
        status: centralName && fd.description.trim() && !fd.description.toLowerCase().includes(centralName.toLowerCase()) ? 'missing' : 'complete',
        message: centralName && fd.description.trim() && !fd.description.toLowerCase().includes(centralName.toLowerCase()) ? `The confirmed central name “${centralName}” does not appear in the description.` : centralName ? `Description is consistent with the confirmed central subject (${centralName}).` : 'No separate central subject has been confirmed yet.',
      },
      {
        id: 'consistency-audience', label: 'Audience and mature content', step: 1, field: 'audience',
        status: matureSignals.length > 0 && fd.audience !== 'adult' ? 'blocker' : 'complete',
        message: matureSignals.length > 0 && fd.audience !== 'adult' ? `The content indicators (${matureSignals.join(', ')}) conflict with a non-adult audience.` : 'No audience and mature-content conflict detected.',
      },
      {
        id: 'consistency-series', label: 'Series details', step: 0, field: 'series',
        status: String(fd.seriesVolume || '').trim() && !fd.series.trim() ? 'missing' : 'complete',
        message: String(fd.seriesVolume || '').trim() && !fd.series.trim() ? 'A series volume is set without a series name.' : 'Series name and volume are consistent.',
      },
      {
        id: 'consistency-release-year', label: 'Publication year and release', step: 2, field: 'pubYear',
        status: fd.pubYear && releaseYear && fd.pubYear !== releaseYear ? 'blocker' : 'complete',
        message: fd.pubYear && releaseYear && fd.pubYear !== releaseYear ? `Publication year ${fd.pubYear} conflicts with the scheduled release year ${releaseYear}.` : 'Publication year matches the release plan.',
      },
      {
        id: 'consistency-distribution', label: 'Formats and distribution', step: 8,
        status: hasWideExclusiveConflict || incompatibleChannels.length ? 'blocker' : 'complete',
        message: hasWideExclusiveConflict ? 'Amazon ebook exclusivity conflicts with selected wide-distribution channels.' : incompatibleChannels.length ? `${incompatibleChannels.map(channel => channel.label).join(', ')} do not support the selected formats.` : 'Selected formats and distribution channels are compatible.',
      },
    ];
  }, [fd, matureSignals, releaseDate, releasePlan, selectedDistributionChannels]);
  const publishingReadiness = useMemo(() => {
    const hasBlockingLayoutIssue = layoutIssues.some(issue => issue.severity === 'error');
    const items = [
      { id: 'title', label: 'Book title', status: fd.title.trim() ? 'complete' : 'missing', message: fd.title.trim() ? 'Title added.' : 'Add the title readers will see.', step: 0, field: 'title' },
      { id: 'description', label: 'Book description', status: !fd.description.trim() ? 'missing' : fd.description.trim().length < 100 ? 'recommended' : 'complete', message: !fd.description.trim() ? 'Add your reader-facing description.' : fd.description.trim().length < 100 ? 'Consider adding more premise, conflict, and stakes.' : 'Description added.', step: 1, field: 'description' },
      { id: 'genre', label: 'Primary genre', status: fd.genre ? 'complete' : 'missing', message: fd.genre ? 'Primary genre selected.' : 'Choose the category readers will search first.', step: 1, field: 'genre' },
      { id: 'keywords', label: 'Discovery keywords', status: fd.keywords.length >= 3 ? 'complete' : 'recommended', message: fd.keywords.length >= 3 ? `${fd.keywords.length} keywords added.` : 'Add at least three specific reader search phrases.', step: 1, field: 'keywords' },
      { id: 'manuscript', label: 'Manuscript file', status: manuscriptFileName ? 'complete' : 'missing', message: manuscriptFileName ? 'Manuscript uploaded.' : 'Upload the manuscript you want to convert.', step: 3 },
      { id: 'formats', label: 'Publishing formats', status: fd.formats.length ? 'complete' : 'missing', message: fd.formats.length ? fd.formats.join(', ') : 'Select at least one publishing format.', step: 3 },
      { id: 'conversion', label: 'Conversion readiness', status: hasBlockingLayoutIssue ? 'blocker' : msStructure ? 'complete' : manuscriptFileName ? 'recommended' : 'missing', message: hasBlockingLayoutIssue ? 'Resolve critical manuscript issues before publishing.' : msStructure ? 'No blocking conversion issues detected.' : manuscriptFileName ? 'Run the manuscript health check.' : 'Available after manuscript upload.', step: 4 },
      { id: 'cover', label: 'Book cover', status: fd.coverMode === 'upload' && !fd.coverPreview ? 'missing' : fd.title.trim() ? 'complete' : 'recommended', message: fd.coverMode === 'upload' && !fd.coverPreview ? 'Upload the selected cover artwork.' : fd.title.trim() ? 'Cover source selected.' : 'Add a title before finalising the template cover.', step: 6 },
      { id: 'price', label: 'List price', status: fd.isFree || Number.parseFloat(fd.price) > 0 ? 'complete' : 'recommended', message: fd.isFree ? 'Book is set to free.' : Number.parseFloat(fd.price) > 0 ? `List price set to ${fd.price}.` : 'Set a price or mark the book as free.', step: 7, field: 'price' },
      { id: 'frontmatter', label: 'Essential front matter', status: fd.frontMatter.copyright?.enabled ? 'complete' : 'missing', message: fd.frontMatter.copyright?.enabled ? 'Copyright page enabled.' : 'Enable the copyright page.', step: 9 },
      { id: 'release', label: 'Release plan', status: releaseDateInvalid ? 'blocker' : 'complete', message: releaseDateInvalid ? `Choose a release date at least ${RELEASE_LEAD_DAYS} days away.` : releaseSummary, step: 11 },
      ...consistencyChecks,
    ];
    const complete = items.filter(item => item.status === 'complete').length;
    return {
      score: Math.round((complete / items.length) * 100),
      complete,
      total: items.length,
      blockers: items.filter(item => item.status === 'blocker').length,
      missing: items.filter(item => item.status === 'missing').length,
      recommended: items.filter(item => item.status === 'recommended').length,
      items,
    };
  }, [consistencyChecks, fd, layoutIssues, manuscriptFileName, msStructure, releaseDateInvalid, releaseSummary]);

  function navigateToReadinessItem(item) {
    if (!item || item.step > step) return false;
    setStepError('');
    setStep(item.step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (item.field) {
      window.setTimeout(() => {
        const definition = ASSISTANT_FIELD_DEFINITIONS[item.field];
        const field = Array.from(document.querySelectorAll('.wz-field'))
          .find(container => container.querySelector(':scope > label')?.textContent?.trim().toLowerCase().startsWith(definition?.label.toLowerCase()));
        field?.querySelector('input, textarea, select')?.focus();
      }, 350);
    }
    return true;
  }

  const publishingAssistantContext = useMemo(() => ({
    mode: 'publishing_upload',
    draftKey: draftId || 'new',
    stepNumber: step + 1,
    totalSteps: WIZARD_STEPS.length,
    stepLabel: WIZARD_STEPS[step]?.label || 'Publishing',
    stepGroup: WIZARD_STEPS[step]?.group || 'Publishing',
    stepGuidance: WIZARD_STEPS[step]?.blurb || '',
    stepTips: WIZARD_STEPS[step]?.tips || [],
    readiness: publishingReadiness,
    metadataOptions: {
      genres: genres.slice(0, 80).map(item => ({ value: item.slug, label: item.label })),
      audiences: AUDIENCES.filter(item => !fd.matureContent || item.value === 'adult').map(item => ({ value: item.value, label: item.label })),
    },
    wizardNavigation: [
      ['title', 0], ['subtitle', 0], ['language', 0], ['edition', 0], ['series', 0], ['seriesVolume', 0],
      ['description', 1], ['audience', 1], ['genre', 1], ['genreSecondary', 1], ['keywords', 1],
      ['pubYear', 2], ['publisher', 2], ['pageCount', 2], ['trimSize', 3], ['price', 7],
    ].map(([field, targetStep]) => ({ field, step: targetStep, label: ASSISTANT_FIELD_DEFINITIONS[field].label })),
    pricingContext: {
      formats: fd.formats,
      pageCount: resolvedSelectedPages || null,
      trimSize: fd.trimSize,
      distributionChannels: fd.distributionChannels,
      distributionStrategy: fd.distributionStrategy,
      distributionPriority: fd.distributionPriority,
    },
    matterContext: {
      authorName,
      publisher: fd.publisher,
      publicationYear: fd.pubYear || String(new Date().getFullYear()),
      isbn: fd.isbn,
      authorBio: authorProfileBio.slice(0, 1500),
    },
    activeField: assistantActiveField ? {
      ...assistantActiveField,
      value: assistantActiveField.id === 'keywords'
        ? fd.keywords
        : fd[assistantActiveField.id] ?? assistantActiveField.value,
    } : null,
    bookDetails: {
      title: fd.title.slice(0, 160),
      subtitle: fd.subtitle.slice(0, 200),
      description: fd.description.slice(0, 1200),
      language: fd.language,
      audience: fd.audience,
      genre: fd.genre,
      secondaryGenre: fd.genreSecondary,
      keywords: fd.keywords.slice(0, 12),
      formats: fd.formats,
      trimSize: fd.trimSize,
      price: fd.price,
      isFree: fd.isFree,
      publisher: fd.publisher.slice(0, 160),
    },
  }), [step, draftId, assistantActiveField, authorName, authorProfileBio, fd, genres, publishingReadiness, resolvedSelectedPages]);

  // ─────────────────── SUCCESS / DRAFT SCREEN ──────────────────
  if (step === 12) {
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
          {fd.title ? (
            <Link to="/dashboard" className="wz-sidebar-back">
              <span className="wz-sidebar-back-arrow">‹</span>
              <span className="wz-sidebar-back-text">
                <strong>{fd.title}</strong>
                <span>Book Project</span>
              </span>
            </Link>
          ) : (
            <Link to="/" className="wz-sidebar-logo">
              <span className="wz-dot">··</span> indieconverters
            </Link>
          )}
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
      <div className="wz-main" onFocusCapture={captureAssistantField}>
        <div className="wz-topbar">
          <span className="wz-topbar-label">
            <span className="wz-topbar-num">Step {String(step + 1).padStart(2, '0')}</span>
            {WIZARD_STEPS[step].label}
          </span>
          <div className="wz-topbar-right">
            <span className="wz-topbar-group">{WIZARD_STEPS[step].group}</span>
          </div>
        </div>

        <div className="wz-content-row">
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
                  setFd(prev => ({
                    ...prev,
                    ...savedProgress.fd,
                    trimSize: savedProgress.fd?.trimSize || prev.trimSize,
                    frontMatter: { ...prev.frontMatter, ...(savedProgress.fd?.frontMatter || {}) },
                    backMatter: { ...prev.backMatter, ...(savedProgress.fd?.backMatter || {}) },
                  }));
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

          {/* ════════ STEP 3: Manuscript ════════ */}
          {step === 3 && (
            <div className="wz-step wz-step--manuscript">
              <h2>Manuscript</h2>
              <p className="wz-sub">Upload your manuscript and prepare it for print and eBook conversion.</p>
              <div className="wz-fields">
                <input ref={fileRef} type="file" accept=".docx,.odt,.rtf,.txt" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files[0]) handleManuscript(e.target.files[0]); }} />

                {!fd.manuscriptPath && !uploading && (
                  <div className="wz-dropzone" onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleManuscript(f); }}>
                    <div className="wz-dropzone-icon">··</div>
                    <p className="wz-dropzone-label">Drag your manuscript here</p>
                    <p className="wz-dropzone-sub">.docx · .odt · .rtf · .txt · max 50 MB</p>
                  </div>
                )}
                {uploading && (
                  <div className="wz-uploading"><div className="wz-spinner" /><span>Uploading and analysing…</span></div>
                )}
                {fd.manuscriptPath && !uploading && (
                  <div className="wz-file-card">
                    <span className="wz-file-card-status">✓</span>
                    <span className="wz-file-card-icon">{manuscriptFileType(manuscriptFileName).letter}</span>
                    <div className="wz-file-card-info">
                      <span className="wz-file-card-name">{manuscriptFileName || 'Uploaded manuscript'}</span>
                      <span className="wz-file-card-meta">
                        {manuscriptFileTypeLabel(manuscriptFileName)}
                        {fd.manuscriptFile && <> · {(fd.manuscriptFile.size / 1024).toFixed(0)} KB</>}
                        {manuscriptUploadedAtMs && <> · Uploaded {formatTimeAgo(manuscriptUploadedAtMs)}</>}
                      </span>
                    </div>
                    <div className="wz-file-card-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setManuscriptViewOpen(true)}>View</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>Replace</button>
                      <button type="button" className="wz-rm-btn" onClick={clearManuscriptUpload} aria-label="Remove manuscript">✕</button>
                    </div>
                  </div>
                )}
                <div className="wz-field" style={{ marginTop: 28 }}>
                  <label>Choose your output formats</label>
                  <div className="wz-formats">
                    {FORMATS.map(f => (
                      <button key={f} type="button"
                        className={`wz-format-tag ${fd.formats.includes(f) ? 'on' : ''}`}
                        onClick={() => toggleFormat(f, !fd.formats.includes(f))}>
                        <span className="wz-format-tag-icon">{FORMAT_ICONS[f]}</span>
                        {f}
                      </button>
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
                {hasPrintFormat && (
                  <PrintCoverToolCard
                    estimate={printCoverEstimate}
                    calculatorPath={printCoverCalculatorPath}
                    trimLabel={selectedTrim.label}
                    pages={resolvedSelectedPages}
                  />
                )}
              </div>

              <p className="wz-manuscript-footnote">Accepted file types: .docx, .odt, .rtf, .txt · Max size: 50 MB</p>
            </div>
          )}

          {/* ════════ STEP 4: Book Health Check ════════ */}
          {step === 4 && (
            <div className="wz-step wz-step--healthcheck">
              <div className="wz-healthcheck-layout">
                <div className="wz-healthcheck-main">
                  <div className="wz-healthcheck-header">
                    <div>
                      <h2>Book Health Check</h2>
                      <p className="wz-sub">We've analyzed your manuscript to help ensure the best possible reading experience.</p>
                    </div>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setHealthCheckInfoOpen(true)}>
                      <span className="wz-healthcheck-info-icon">i</span> Learn how this works
                    </button>
                  </div>

                  {!msStructure ? (
                    <div className="wz-healthcheck-empty">
                      <p>Upload a manuscript on the previous step to run a health check.</p>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => goTo(3)}>Go to Manuscript →</button>
                    </div>
                  ) : (
                    <>
                      <div className="wz-healthcheck-score-card">
                        <HealthScoreRing percent={readinessScore} />
                        <div className="wz-healthcheck-score-copy">
                          <h3>
                            {readinessCriticalCount > 0
                              ? 'A few things need your attention.'
                              : readinessAllGood
                                ? 'Your manuscript is in good shape.'
                                : 'Your manuscript is almost ready.'}
                          </h3>
                          <p>Address the issues below to improve conversion quality and reader experience.</p>
                          <span className="wz-healthcheck-score-tag">{readinessScoreLabel}</span>
                        </div>
                        <div className="wz-healthcheck-tallies">
                          <div className="wz-healthcheck-tally">
                            <span className="wz-healthcheck-tally-icon wz-healthcheck-tally-icon--good">✓</span>
                            <strong>{readinessGoodCount}</strong>
                            <span>Good</span>
                            <small>All set</small>
                          </div>
                          <div className="wz-healthcheck-tally">
                            <span className="wz-healthcheck-tally-icon wz-healthcheck-tally-icon--attention">!</span>
                            <strong>{readinessAttentionCount}</strong>
                            <span>Needs attention</span>
                            <small>Review these</small>
                          </div>
                          <div className="wz-healthcheck-tally">
                            <span className="wz-healthcheck-tally-icon wz-healthcheck-tally-icon--critical">✕</span>
                            <strong>{readinessCriticalCount}</strong>
                            <span>Critical</span>
                            <small>Fix required</small>
                          </div>
                        </div>
                      </div>

                      <div className="wz-healthcheck-table">
                        <div className="wz-healthcheck-table-head">
                          <span>Check</span>
                          <span>Summary &amp; recommendations</span>
                          <span>Status</span>
                        </div>
                        {readinessRows.map(row => (
                          <div className="wz-healthcheck-row" key={row.key}>
                            <div className="wz-healthcheck-row-check">
                              <span className={`wz-healthcheck-row-icon wz-healthcheck-row-icon--${row.severity}`}>
                                {READINESS_ICONS[row.icon]}
                              </span>
                              <div>
                                <strong>{row.label}</strong>
                                <span>{row.sub}</span>
                              </div>
                            </div>
                            <ul className="wz-healthcheck-row-summary">
                              {(row.issue ? row.issue.message : row.goodNote).split(/(?<=[.!])\s+(?=[A-Z])/).map((line, i) => (
                                <li key={i}>{line}</li>
                              ))}
                            </ul>
                            <div className="wz-healthcheck-row-status">
                              <em className={`wz-readiness-status wz-readiness-status--${row.severity}`}>
                                {row.severity === 'good' ? 'Good' : row.severity === 'error' ? 'Critical' : 'Needs attention'}
                              </em>
                              <button
                                type="button"
                                className={`wz-healthcheck-action wz-healthcheck-action--${row.severity === 'good' ? 'good' : row.severity === 'error' ? 'critical' : 'attention'}`}
                                onClick={() => openRowDetail(row.key)}
                              >
                                {row.severity === 'good' ? 'Details' : row.severity === 'error' ? 'Fix issues' : 'Review'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="wz-manuscript-footnote">Checks are based on best practices for print and digital conversion.</p>
                    </>
                  )}
                </div>

                <aside className="wz-healthcheck-side">
                  <div className="wz-panel-card">
                    <h3 className="wz-healthcheck-side-title">Publishing progress</h3>
                    <span className="wz-healthcheck-progress-step">Step {step + 1} of {WIZARD_STEPS.length}</span>
                    <div className="wz-healthcheck-progress-dots">
                      {WIZARD_STEPS.map((s, i) => (
                        <span key={i} className={`wz-healthcheck-dot ${i < step ? 'done' : i === step ? 'current' : ''}`} />
                      ))}
                    </div>
                    {WIZARD_STEPS[step + 1] && (
                      <button type="button" className="btn btn-primary btn-sm wz-healthcheck-next-btn" onClick={goNext}>
                        Next up: {WIZARD_STEPS[step + 1].label} <span aria-hidden="true">→</span>
                      </button>
                    )}
                  </div>

                  {msStructure && (
                    <div className="wz-panel-card">
                      <h3 className="wz-healthcheck-side-title">Manuscript overview</h3>
                      <div className="wz-healthcheck-overview-list">
                        <div className="wz-healthcheck-overview-row">
                          <span>Word count</span>
                          <strong>{(msStructure.wordCount || 0).toLocaleString()} words</strong>
                        </div>
                        <div className="wz-healthcheck-overview-row">
                          <span>Estimated pages</span>
                          <strong>{estimatedTrimPages ? `~${estimatedTrimPages} pages` : '—'}</strong>
                        </div>
                        <div className="wz-healthcheck-overview-row">
                          <span>Trim size</span>
                          <strong>{selectedTrim.label}</strong>
                        </div>
                        <div className="wz-healthcheck-overview-row">
                          <span>Reading time</span>
                          <strong>{readingTimeLabel}</strong>
                        </div>
                        <div className="wz-healthcheck-overview-row">
                          <span>Language</span>
                          <strong>{fd.language}</strong>
                        </div>
                      </div>
                      <div className="wz-field wz-page-override">
                        <label>Manual page count override <span className="opt">optional</span></label>
                        <div className="wz-page-override-input">
                          <input
                            type="number"
                            min="1"
                            value={fd.pageCount}
                            onChange={e => up('pageCount', e.target.value)}
                            placeholder={estimatedTrimPages ? String(estimatedTrimPages) : 'e.g. 280'}
                          />
                          <span>pages</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {msStructure && (
                    <div className="wz-panel-card">
                      <h3 className="wz-healthcheck-side-title">Quality at a glance</h3>
                      <div className="wz-healthcheck-donut-row">
                        <HealthDonut good={readinessGoodCount} attention={readinessAttentionCount} critical={readinessCriticalCount} />
                        <ul className="wz-healthcheck-legend">
                          <li><span className="wz-healthcheck-legend-dot wz-healthcheck-legend-dot--good" />Good <b>{readinessGoodCount}</b></li>
                          <li><span className="wz-healthcheck-legend-dot wz-healthcheck-legend-dot--attention" />Needs attention <b>{readinessAttentionCount}</b></li>
                          <li><span className="wz-healthcheck-legend-dot wz-healthcheck-legend-dot--critical" />Critical <b>{readinessCriticalCount}</b></li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {msStructure && !readinessAllGood && (
                    <div className="wz-panel-card">
                      <h3 className="wz-healthcheck-side-title">Top recommendations</h3>
                      <ul className="wz-healthcheck-recs">
                        {readinessRows.filter(r => r.severity !== 'good').slice(0, 3).map(r => (
                          <li key={r.key}>{r.issue.message.split(/(?<=[.!])\s/)[0]}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          {healthCheckInfoOpen && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthCheckInfoOpen(false)}>
              <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>How the Book Health Check works</span>
                  <button type="button" onClick={() => setHealthCheckInfoOpen(false)} aria-label="Close">×</button>
                </div>
                <div className="wz-healthcheck-info-body">
                  <p>We scan your uploaded manuscript for the same issues that commonly cause EPUB validation failures or a poor reading experience on retailers like Amazon KDP, Apple Books, and Kobo.</p>
                  <ul>
                    <li><strong>Good</strong> — no issues found, nothing to do.</li>
                    <li><strong>Needs attention</strong> — worth a look, but won't block conversion.</li>
                    <li><strong>Critical</strong> — likely to cause a conversion or validation failure. Fix these before publishing.</li>
                  </ul>
                  <p>Formatting, chapter/heading structure, file health, embedded image resolution, manual page breaks, and readability (Flesch reading ease) are all checked directly from your uploaded file. Front matter and metadata checks reflect what you've filled in on earlier steps.</p>
                </div>
              </div>
            </div>
          )}

          {healthDetailModal === 'formatting' && (() => {
            const formattingIssue = layoutIssues.find(issue => issue.type === 'excessive-blanks');
            return (
              <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
                <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                  <div className="wz-manuscript-view-head">
                    <span>Formatting</span>
                    <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                  </div>
                  <div className="wz-healthcheck-info-body">
                    {!formattingIssue ? (
                      <p>No formatting issues found — spacing and paragraph styles look consistent across the document.</p>
                    ) : (
                      <>
                        <p>{formattingIssue.message}</p>
                        {msStructure?.maxBlankRunHeading && (
                          <p>Location: shortly after <strong>{msStructure.maxBlankRunHeading}</strong>.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {healthDetailModal === 'headings' && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
              <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>Headings</span>
                  <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                </div>
                <div className="wz-healthcheck-info-body">
                  {!msStructure?.headings || msStructure.headings.length === 0 ? (
                    <p>No chapter headings were detected. In Word, select each chapter title and apply the "Heading 1" style; in Google Docs, use Format → Paragraph styles → Heading 1.</p>
                  ) : (
                    <>
                      <p>{msStructure.headings.length} heading{msStructure.headings.length === 1 ? '' : 's'} detected. Flagged ones below are what's affecting your Headings check.</p>
                      <table className="wz-healthcheck-detail-table">
                        <thead>
                          <tr><th>#</th><th>Heading</th><th>Words</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {msStructure.headings.map((h, i) => {
                            const isEmpty = h.words === 0;
                            const isShort = !isEmpty && h.words < 100;
                            const isAllCaps = h.text.length > 3 && h.text === h.text.toUpperCase() && /[A-Z]/.test(h.text);
                            const isWrongStart = i === 0 && h.level > 1;
                            const flagged = isEmpty || isAllCaps || isWrongStart;
                            return (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{h.text || '(untitled)'}</td>
                                <td>{h.words.toLocaleString()}</td>
                                <td className={flagged ? 'is-warning' : 'is-good'}>
                                  {isEmpty ? 'Empty' : isWrongStart ? `Starts at H${h.level}` : isAllCaps ? 'ALL CAPS' : isShort ? 'Short' : 'Good'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {healthDetailModal === 'readability' && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
              <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>Readability</span>
                  <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                </div>
                <div className="wz-healthcheck-info-body">
                  {!readability ? (
                    <p>Add more text to get a readability estimate.</p>
                  ) : (
                    <>
                      <p>
                        {readability.label} — this manuscript scores {readability.fleschScore} on the Flesch Reading Ease scale (0–100, higher is easier), roughly a US grade {readability.fleschGrade} reading level.
                      </p>
                      <table className="wz-healthcheck-detail-table">
                        <tbody>
                          <tr><td>Sentences</td><td>{readability.sentenceCount.toLocaleString()}</td></tr>
                          <tr><td>Avg. words per sentence</td><td>{readability.avgWordsPerSentence.toFixed(1)}</td></tr>
                          <tr><td>Avg. syllables per word</td><td>{readability.avgSyllablesPerWord.toFixed(2)}</td></tr>
                          <tr><td>Estimated reading time</td><td>{readingTimeLabel}</td></tr>
                        </tbody>
                      </table>
                      <p>Shorter sentences and simpler words push the score up; longer sentences and multi-syllable words push it down. There's no universally "right" score — literary fiction often reads harder than commercial genre fiction on purpose.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {healthDetailModal === 'images' && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
              <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>Images</span>
                  <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                </div>
                <div className="wz-healthcheck-info-body">
                  {msImages.length === 0 ? (
                    <p>No images were found in this manuscript — there's nothing to check here.</p>
                  ) : (
                    <>
                      <p>
                        {msImages.length} image{msImages.length === 1 ? '' : 's'} found.{' '}
                        {hasPrintFormat
                          ? `Checked against ${selectedTrim.label} trim size — anything under 150dpi is flagged as low resolution for print.`
                          : "You're only publishing eBook formats, so resolution isn't checked — screens don't need print-grade DPI."}
                      </p>
                      <table className="wz-healthcheck-detail-table">
                        <thead>
                          <tr><th>#</th><th>Type</th><th>Dimensions</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {msImages.map((img, i) => {
                            const dpi = hasPrintFormat && img.width ? Math.round(img.width / trimWidthInches) : null;
                            const low = dpi != null && dpi < 150;
                            return (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{img.contentType?.replace('image/', '') || '—'}</td>
                                <td>{img.width && img.height ? `${img.width} × ${img.height}px` : 'Unknown'}</td>
                                <td className={low ? 'is-warning' : 'is-good'}>
                                  {dpi == null ? 'Not checked' : low ? `Low res (~${dpi}dpi)` : `Good (~${dpi}dpi)`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {healthDetailModal === 'pagebreaks' && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
              <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>Page Breaks</span>
                  <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                </div>
                <div className="wz-healthcheck-info-body">
                  {msPageBreaks === 0 ? (
                    <p>This manuscript has no manual page breaks. Pagination for print is calculated automatically from your word count and {selectedTrim.label} trim size — there's nothing you need to do here.</p>
                  ) : (
                    <p>
                      This manuscript contains {msPageBreaks} manual page break{msPageBreaks === 1 ? '' : 's'} (from <code>Ctrl/Cmd + Enter</code> or Word's "Insert Page Break").
                      They're kept wherever you placed them in the print edition, but ignored in reflowable eBook formats — eBook readers reflow text automatically based on the reader's screen and font size.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {healthDetailModal === 'spelling' && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
              <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>Spelling</span>
                  <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                </div>
                <div className="wz-healthcheck-info-body">
                  {!msSpelling || visibleMisspelledCount === 0 ? (
                    <p>{fd.spellingIgnored.length > 0 ? 'No remaining spelling issues — everything else was marked as ignored.' : 'No potential spelling issues found.'}</p>
                  ) : (
                    <>
                      <p>{visibleMisspelledCount} word{visibleMisspelledCount === 1 ? '' : 's'} not in our dictionary, {visibleMisspelledOccurrences} occurrences total. Real typos and invented words (character names, places) both land here — use the suggestion if there is one, or ignore it if it's intentional.</p>
                      <ul className="wz-healthcheck-spelling-list">
                        {visibleMisspelled.map(m => (
                          <li key={m.word}>
                            <div className="wz-healthcheck-spelling-word">
                              <strong>{m.word}</strong>
                              <span>
                                {m.count}× in this manuscript
                                {m.suggestions.length > 0 && <> · did you mean "{m.suggestions[0]}"?</>}
                              </span>
                            </div>
                            <button type="button" className="wz-text-link" onClick={() => ignoreSpellingWord(m.word)}>Ignore</button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {fd.spellingIgnored.length > 0 && (
                    <p className="wz-healthcheck-ignored-note">
                      {fd.spellingIgnored.length} word{fd.spellingIgnored.length === 1 ? '' : 's'} ignored.{' '}
                      <button type="button" className="wz-text-link" onClick={resetIgnoredSpelling}>Reset</button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {healthDetailModal === 'metadata' && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
              <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>Metadata</span>
                  <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                </div>
                <div className="wz-healthcheck-info-body">
                  <p>This is the metadata retailers and readers will see for this book.</p>
                  <table className="wz-healthcheck-detail-table">
                    <tbody>
                      <tr><td>Title</td><td>{fd.title || '—'}</td></tr>
                      <tr><td>Subtitle</td><td className={hasSubtitle ? 'is-good' : 'is-warning'}>{fd.subtitle || 'Not set'}</td></tr>
                      <tr><td>Author</td><td>{authorName}</td></tr>
                      <tr><td>Primary genre</td><td className={primaryGenreLabel ? 'is-good' : 'is-warning'}>{primaryGenreLabel || 'Not set'}</td></tr>
                      <tr><td>Secondary genre</td><td>{genres.find(g => g.slug === fd.genreSecondary)?.label || 'Not set'}</td></tr>
                      <tr><td>Keywords</td><td className={fd.keywords.length ? 'is-good' : 'is-warning'}>{fd.keywords.length ? fd.keywords.join(', ') : 'None added'}</td></tr>
                      <tr><td>Language</td><td>{fd.language}</td></tr>
                      <tr><td>ISBN-13</td><td>{(fd.isbnOption === 'own' || fd.isbnOption === 'register') ? (fd.isbn || 'Not entered yet') : 'Not provided'}</td></tr>
                    </tbody>
                  </table>
                  {(!hasSubtitle || !fd.keywords.length) && (
                    <p>
                      Tip: adding {!hasSubtitle && !fd.keywords.length ? 'a subtitle and a few keywords' : !hasSubtitle ? 'a subtitle' : 'a few keywords'} helps readers discover this book while browsing or searching.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {healthDetailModal === 'frontmatter' && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
              <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>Front Matter</span>
                  <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                </div>
                <div className="wz-healthcheck-info-body">
                  <p>These sections can appear before your first chapter, like the opening pages of a printed book.</p>
                  <table className="wz-healthcheck-detail-table">
                    <tbody>
                      {FM_ITEMS.map(item => {
                        const data = fd.frontMatter[item.key];
                        const chapterCount = msStructure?.headings?.length || 0;
                        const filled = item.isToc ? chapterCount > 0 : !!data?.content?.trim();
                        const included = !!data?.enabled && filled;
                        return (
                          <tr key={item.key}>
                            <td>{item.label}{!item.required && ' (optional)'}</td>
                            <td className={included ? 'is-good' : item.required ? 'is-warning' : ''}>
                              {item.isToc
                                ? (filled ? `Auto-generated, ${chapterCount} entr${chapterCount === 1 ? 'y' : 'ies'}` : 'No chapter headings detected yet')
                                : !data?.enabled
                                  ? 'Not included'
                                  : filled ? 'Written' : 'Enabled, but empty'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p>You'll write and enable these on the Front &amp; Back Matter step, later in this wizard.</p>
                </div>
              </div>
            </div>
          )}

          {healthDetailModal === 'filehealth' && (() => {
            const fileIssues = layoutIssues.filter(issue => FILE_HEALTH_ISSUE_TYPES.includes(issue.type));
            return (
              <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setHealthDetailModal(null)}>
                <div className="wz-manuscript-view-modal wz-healthcheck-info-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                  <div className="wz-manuscript-view-head">
                    <span>File Health</span>
                    <button type="button" onClick={() => setHealthDetailModal(null)} aria-label="Close">×</button>
                  </div>
                  <div className="wz-healthcheck-info-body">
                    <table className="wz-healthcheck-detail-table">
                      <tbody>
                        <tr><td>File</td><td>{manuscriptFileName || '—'}</td></tr>
                        <tr><td>Type</td><td>{manuscriptFileType(manuscriptFileName).label}</td></tr>
                        {fd.manuscriptFile && <tr><td>Size</td><td>{(fd.manuscriptFile.size / 1024).toFixed(0)} KB</td></tr>}
                        <tr><td>Word count</td><td>{(msStructure?.wordCount || 0).toLocaleString()}</td></tr>
                        <tr><td>Estimated pages</td><td>{estimatedTrimPages ? `~${estimatedTrimPages}` : '—'}</td></tr>
                      </tbody>
                    </table>

                    {fileIssues.length === 0 ? (
                      <p>No file-health issues found — this file is a good size and length for the retailers you're targeting.</p>
                    ) : (
                      <ul>
                        {fileIssues.map(issue => <li key={issue.type}>{issue.message}</li>)}
                      </ul>
                    )}

                    <div className="wz-healthcheck-detail-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => { setHealthDetailModal(null); goTo(3); }}>
                        Go to Manuscript →
                      </button>
                      <Link to="/help/publishing" className="btn btn-outline btn-sm" onClick={() => setHealthDetailModal(null)}>
                        Publishing help center
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {manuscriptViewOpen && (
            <div className="wz-manuscript-view-backdrop" role="presentation" onClick={() => setManuscriptViewOpen(false)}>
              <div className="wz-manuscript-view-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                <div className="wz-manuscript-view-head">
                  <span>{manuscriptFileName || 'Manuscript'}</span>
                  <button type="button" onClick={() => setManuscriptViewOpen(false)} aria-label="Close preview">×</button>
                </div>
                <div className="wz-manuscript-view-body"
                  dangerouslySetInnerHTML={{ __html: msHtml ? msHtml.slice(0, 8000) : '<p><em>No preview available for this file type.</em></p>' }} />
              </div>
            </div>
          )}

          {/* ════════ STEP 5: Reading Style ════════ */}
          {step === 5 && (() => {
            const currentPage = msPages[msPage] || null;
            const showMs = !!currentPage;
            const isLastPage = msPage >= msPages.length - 1;
            const currentStyle = BOOK_STYLES.find(s => s.id === fd.bookStyle || s.legacyId === fd.bookStyle) || BOOK_STYLES[0];

            // Renders one page's header/body/footer for a given page index —
            // called once for the static page underneath and, while a flip is
            // in progress, once more for the outgoing page rotating away on
            // top of it, so the two never have to share state mid-animation.
            const renderPageFace = pageIndex => {
              const page = msPages[pageIndex] || null;
              const show = !!page;
              const heading = page?.headingBlock ? formatChapterHeading(page.headingBlock.text) : null;
              const paragraphs = show ? page.paras : [];
              const chapterOpening = !show || !!heading || pageIndex === 0;
              const runHead = chapterOpening ? '' : (pageIndex % 2 === 0 ? (fd.title || 'Your Book Title') : authorName);
              return (
                <>
                  <div className={`wz-book-page-hdr ${runHead ? '' : 'is-empty'}`} style={{ borderColor: runHead ? `${theme.text}08` : 'transparent' }}>
                    {runHead && (
                      <span className="wz-book-running wz-book-running--center" style={{ fontFamily: fontCss, color: theme.text }}>
                        {runHead}
                      </span>
                    )}
                  </div>
                  <div className={`wz-book-page-body ${chapterOpening ? 'is-chapter-opening' : ''}`} style={{ fontFamily: fontCss, fontSize: sizeObj.size, lineHeight: sizeObj.lh, color: theme.text }}>
                    {msLoading ? (
                      <div className="wz-reader-loading" style={{ color: theme.text }}>
                        <div className="wz-spinner" style={{ borderColor: `${theme.text}22`, borderTopColor: theme.text }} />
                        Loading your manuscript…
                      </div>
                    ) : show ? (
                      <>
                        {heading && (
                          <div className="wz-reader-chapter" style={{ fontFamily: fontCss, color: theme.text }}>
                            {heading.label && <span className="wz-reader-chapter-kicker">{heading.label}</span>}
                            {heading.title && <span className="wz-reader-chapter-title">{heading.title}</span>}
                          </div>
                        )}
                        {paragraphs.map((para, i) => <p key={i} className="wz-reader-para">{para}</p>)}
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
                        {show ? pageIndex + 1 : 1}
                      </span>
                    )}
                  </div>
                </>
              );
            };
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
                    <button
                      type="button"
                      className={`wz-stage-view-toggle${stageView === 'desk' ? ' active' : ''}`}
                      onClick={() => setStageView(v => (v === 'desk' ? 'plain' : 'desk'))}
                      aria-pressed={stageView === 'desk'}
                    >
                      {stageView === 'desk' ? 'Desk view' : 'Plain view'}
                    </button>
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

                <div className={`wz-reading-stage${stageView === 'desk' ? ' wz-reading-stage--desk' : ''}`}>
                  <div className="wz-book-reader">
                    <div className="wz-book-page-stack" style={{ '--page-aspect': selectedTrim.aspect, '--page-width': selectedTrim.previewWidth }}>
                      <div className="wz-book-page" style={{ background: theme.bg, borderColor: theme.border }} tabIndex={0}
                        onKeyDown={e => {
                          if (['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)) { e.preventDefault(); if (!isLastPage) turnReadingPage('next'); }
                          if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)) { e.preventDefault(); if (msPage > 0) turnReadingPage('prev'); }
                        }}>
                        {renderPageFace(msPage)}
                      </div>
                      {outgoingMsPage != null && (
                        <div
                          className={`wz-book-page wz-book-page-flip is-page-turning-${pageTurnDir}`}
                          style={{ background: theme.bg, borderColor: theme.border }}
                          aria-hidden="true"
                        >
                          {renderPageFace(outgoingMsPage)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ════════ STEP 6: Cover ════════ */}
          {step === 6 && (
            <div className="wz-step">
              <h2>Cover</h2>
              <p className="wz-sub">Create a clean starter cover, upload finished artwork, or hire a cover designer when you want a more polished launch.</p>

              <div className={`wz-cover-mode-tabs ${coverSide === 'back' ? 'wz-cover-mode-tabs--underline' : ''}`} aria-label="Cover source options">
                {coverSide === 'back' ? (
                  <>
                    <button
                      type="button"
                      className={coverBackMode !== 'upload' ? 'active' : ''}
                      aria-pressed={coverBackMode !== 'upload'}
                      onClick={() => chooseCoverBackMode('layout')}
                    >
                      Layouts
                    </button>
                    <button
                      type="button"
                      className={coverBackMode === 'upload' ? 'active' : ''}
                      aria-pressed={coverBackMode === 'upload'}
                      onClick={() => chooseCoverBackMode('upload')}
                    >
                      Upload design
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                  {coverSide === 'back' ? (
                    coverBackMode === 'upload' ? (
                      !fd.backCoverPreview ? (
                        <div className="wz-dropzone" onClick={() => backCoverRef.current?.click()}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleBackCover(f); }}>
                          <input ref={backCoverRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                            onChange={e => { if (e.target.files[0]) handleBackCover(e.target.files[0]); }} />
                          <div className="wz-dropzone-icon">+</div>
                          <p className="wz-dropzone-label">Upload back cover image</p>
                          <p className="wz-dropzone-sub">JPG, PNG or WebP - max 5 MB</p>
                          <p className="wz-dropzone-hint">Recommended: 1,600 x 2,560 px (portrait 5:8)</p>
                        </div>
                      ) : (
                        <div className="wz-cover-uploaded">
                          <img src={fd.backCoverPreview} alt="Back cover" />
                          <div>
                            <span className="wz-file-name">{fd.backCoverFile?.name}</span>
                            <button
                              type="button"
                              className="wz-text-link"
                              onClick={() => { setFd(p => ({ ...p, backCoverFile: null, backCoverPreview: '', backCoverDataUrl: '' })); setCoverBackMode('layout'); }}
                            >
                              Remove and use layout
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="wz-template-builder">
                        <div className="wz-template-section-head">
                          <div>
                            <span>Content order</span>
                            <small>Drag a section, or use the arrows — the author name and barcode always stay pinned to the bottom corner for retail scanning.</small>
                          </div>
                          <button type="button" className="wz-text-link" onClick={() => chooseCoverBackMode('upload')}>
                            Upload finished back cover
                          </button>
                        </div>

                        <div className="wz-back-block-list">
                          {fd.backBlockOrder.map((blockId, index) => {
                            const isBio = blockId === 'bio';
                            const bioUnavailable = isBio && !authorProfileBio;
                            return (
                              <div
                                key={blockId}
                                className={`wz-back-block-row ${bioUnavailable ? 'is-disabled' : ''}`}
                                draggable={!bioUnavailable}
                                onDragStart={e => e.dataTransfer.setData('text/plain', String(index))}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                  e.preventDefault();
                                  moveBackBlock(Number(e.dataTransfer.getData('text/plain')), index);
                                }}
                              >
                                <span className="wz-back-block-handle" aria-hidden="true">⠿</span>
                                <span className="wz-back-block-name">{BACK_COVER_BLOCK_LABELS[blockId]}</span>
                                {isBio && (
                                  <label className="wz-back-block-toggle">
                                    <input
                                      type="checkbox"
                                      checked={fd.backShowBio}
                                      disabled={!authorProfileBio}
                                      onChange={e => up('backShowBio', e.target.checked)}
                                    />
                                    Show
                                  </label>
                                )}
                                <div className="wz-back-block-actions">
                                  <button type="button" onClick={() => moveBackBlock(index, index - 1)} disabled={index === 0} aria-label={`Move ${BACK_COVER_BLOCK_LABELS[blockId]} up`}>↑</button>
                                  <button type="button" onClick={() => moveBackBlock(index, index + 1)} disabled={index === fd.backBlockOrder.length - 1} aria-label={`Move ${BACK_COVER_BLOCK_LABELS[blockId]} down`}>↓</button>
                                </div>
                              </div>
                            );
                          })}
                          <div className="wz-back-block-row wz-back-block-row--pinned">
                            <span className="wz-back-block-handle wz-back-block-handle--locked" aria-hidden="true">🔒</span>
                            <span className="wz-back-block-name">Author name + ISBN barcode</span>
                          </div>
                        </div>

                        {!authorProfileBio && (
                          <p className="wz-hint">Add a bio on your author profile to include it on the back cover.</p>
                        )}

                        <label className="wz-back-lede-toggle">
                          <input type="checkbox" checked={fd.backBoldLede} onChange={e => up('backBoldLede', e.target.checked)} />
                          Enlarge the opening line of your description
                        </label>

                        <div className="wz-template-section-head wz-template-section-head--spaced">
                          <div>
                            <span>Appearance</span>
                            <small>
                              {fd.coverArtPreview
                                ? 'Same photo and template as your front cover'
                                : `Same ${coverPalette(fd.coverPalette).name} palette as your front cover`}
                            </small>
                          </div>
                        </div>

                        {hasPrintFormat && (
                          <p className="wz-hint">
                            The shaded outline in the preview marks the {formatCoverInches(COVER_SAFE_MARGIN_IN)} safe margin for {printCoverTrim.label} — keep text inside it. A {formatCoverInches(COVER_BLEED_IN)} bleed is added automatically outside the trim edge when your print file is exported.
                          </p>
                        )}

                        <div className="wz-cover-tip">
                          <span aria-hidden="true">💡</span>
                          <div>
                            <strong>Tip</strong>
                            <p>A thoughtful back cover summary builds trust and helps readers decide to buy.</p>
                          </div>
                        </div>
                      </div>
                    )
                  ) : fd.coverMode === 'upload' ? (
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

                      <div className="wz-cover-thumb-grid">
                        {COVER_TEMPLATES.map(t => {
                          const selected = fd.coverTemplate === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={`wz-cover-thumb-card ${selected ? 'selected' : ''}`}
                              onClick={() => up('coverTemplate', t.id)}
                              title={t.note}
                            >
                              {selected && <span className="wz-cover-thumb-check" aria-hidden="true">✓</span>}
                              <CoverTemplatePreview
                                title={fd.title}
                                subtitle={fd.subtitle}
                                author={authorName}
                                genreLabel={primaryGenreLabel}
                                templateId={t.id}
                                paletteId={fd.coverPalette}
                                artPreview={fd.coverArtPreview}
                                artPlacement={fd.coverArtPlacement}
                                small
                              />
                              <span className="wz-cover-thumb-name">{t.name}</span>
                            </button>
                          );
                        })}
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

                      {!fd.coverArtPreview && coverArtSearch.status === 'ready' && coverArtSearch.results.length > 0 && (
                        <div className="wz-cover-samples">
                          <span>Photos matched to {primaryGenreLabel || 'your genre'} — your real title, subtitle, and author still render on top.</span>
                          <div className="wz-cover-samples-row">
                            {coverArtSearch.results.map(photo => (
                              <div key={photo.id} className="wz-cover-sample-card">
                                <button type="button" className="wz-cover-sample-thumb" onClick={() => usePhotoSearchResult(photo)}>
                                  <img src={photo.thumbUrl} alt={photo.alt} />
                                </button>
                                <span className="wz-cover-sample-credit-line">
                                  Photo by{' '}
                                  <a
                                    href={`${photo.photographerUrl}?utm_source=indieconverters&utm_medium=referral`}
                                    target="_blank" rel="noreferrer"
                                  >
                                    {photo.photographerName}
                                  </a>
                                </span>
                              </div>
                            ))}
                          </div>
                          <span className="wz-cover-samples-credit">
                            via <a href="https://unsplash.com/?utm_source=indieconverters&utm_medium=referral" target="_blank" rel="noreferrer">Unsplash</a>
                          </span>
                        </div>
                      )}

                      {!fd.coverArtPreview && coverArtSearch.status !== 'ready' && (
                        <div className="wz-cover-samples">
                          <span>No photo handy? Try a sample — your real title, subtitle, and author still render on top of it.</span>
                          <div className="wz-cover-samples-row">
                            {COVER_SAMPLES.map(sample => (
                              <button key={sample.id} type="button" className="wz-cover-sample-thumb" onClick={() => useSampleArtwork(sample)}>
                                <img src={sample.src} alt={sample.label} />
                                <span>{sample.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

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
                    <div className="wz-cover-preview-head-tabs">
                      <div className="wz-device-tabs" aria-label="Cover side">
                        <button type="button" className={coverSide === 'front' ? 'selected' : ''} onClick={() => setCoverSide('front')}>Front</button>
                        <button type="button" className={coverSide === 'back' ? 'selected' : ''} onClick={() => setCoverSide('back')}>Back</button>
                      </div>
                      {coverSide === 'front' && (
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
                      )}
                    </div>
                  </div>

                  {coverSide === 'back' ? (
                    // Back covers are print-only — there's no "how it looks on a phone
                    // browser" question, so this skips the responsive device-chrome
                    // frame used for the front cover and shows a plain preview stage.
                    <div className="wz-backcover-stage">
                      <div className="wz-device-cover-slot">
                        <div
                          className={`wz-device-book-mockup ${fd.backCoverPreview ? 'wz-device-book-mockup--uploaded' : ''}`}
                          onPointerMove={handleBookPreviewPointerMove}
                          onPointerLeave={resetBookPreviewTilt}
                        >
                          <CoverBackPreview
                            coverPreview={fd.backCoverPreview}
                            description={fd.description}
                            authorBio={authorProfileBio}
                            authorName={authorName}
                            authorPhoto={authorProfile?.photo_url}
                            isbn={fd.isbn}
                            templateId={fd.coverTemplate}
                            paletteId={fd.coverPalette}
                            artPreview={fd.coverArtPreview}
                            blockOrder={fd.backBlockOrder}
                            showBio={fd.backShowBio}
                            boldLede={fd.backBoldLede}
                            marginPercent={backMarginPercent}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
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
                  )}

                  {coverSide === 'back' ? (
                    !fd.backCoverPreview && (
                      <div className="wz-template-preview-meta">
                        <strong>Custom order</strong>
                        <span>Uses your book description from the About step and matches the {selectedTemplate.name} template.</span>
                      </div>
                    )
                  ) : !fd.coverPreview && (
                    <div className="wz-template-preview-meta">
                      <strong>{selectedTemplate.name}</strong>
                      <span>{selectedTemplate.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════ STEP 7: Pricing ════════ */}
          {step === 7 && (
            <div className="wz-step">
              <h2>Pricing</h2>
              <p className="wz-sub">Set your list price, see estimated royalties, and tell readers where to buy your book.</p>

              <div className="wz-fields">
                {hasPrintFormat && (
                  <PrintCoverToolCard
                    estimate={printCoverEstimate}
                    calculatorPath={printCoverCalculatorPath}
                    trimLabel={selectedTrim.label}
                    pages={resolvedSelectedPages}
                  />
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

                <label className={`wz-toggle-card ${fd.sellDirect ? 'on' : ''}`}>
                  <div>
                    <strong>Sell directly through Indie Converters</strong>
                    <span>
                      We track your sales and payouts instead of just linking out to a retailer.
                      Leave this off to keep linking out to wherever you already sell.
                    </span>
                  </div>
                  <div className={`wz-toggle ${fd.sellDirect ? 'on' : ''}`} onClick={() => up('sellDirect', !fd.sellDirect)} role="switch" />
                </label>

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

          {/* ════════ STEP 8: Distribution ════════ */}
          {step === 8 && (
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

          {/* ════════ STEP 9: Front & Back Matter ════════ */}
          {step === 9 && (
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

          {/* ════════ STEP 10: Book Structure (assembled preview) ════════ */}
          {step === 10 && (() => {
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

          {/* ════════ STEP 11: Review & Publish ════════ */}
          {step === 11 && (
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
                  { title: 'Book Health Check', to: 4, rows: [
                    ['Status', readinessAllGood ? 'All checks passed' : 'Needs attention'],
                  ]},
                  { title: 'Reading Style', to: 5, rows: [
                    ['Template', BOOK_STYLES.find(s => s.id === fd.bookStyle || s.legacyId === fd.bookStyle)?.title || '—'],
                    ['Appearance', [
                      PREVIEW_THEMES.find(t => t.id === fd.pTheme)?.name,
                      PREVIEW_FONTS.find(f => f.id === fd.pFont)?.name,
                      { sm: 'Small', md: 'Medium', lg: 'Large' }[fd.pSize],
                      PREVIEW_SPACING.find(s => s.id === fd.pSpacing)?.label,
                    ].filter(Boolean).join(' · ') || '—'],
                  ]},
                  { title: 'Cover', to: 6, rows: [
                    ['Cover', fd.coverFile?.name || `${selectedTemplate.name} template${fd.coverArtPreview ? ' + artwork' : ''}`],
                  ]},
                  { title: 'Pricing', to: 7, rows: [
                    ['Price',     fd.isFree ? 'Free' : (fd.price ? `$${fd.price}` : '—')],
                    ['Selling via', fd.sellDirect ? 'Direct through Indie Converters' : 'Retailer links'],
                    ['Best royalty estimate', royaltyEstimate.best ? `${formatRoyaltyMoney(royaltyEstimate.best.authorEarnings)} via ${royaltyEstimate.best.channel}` : '—'],
                    ...(fd.retailerLinks.filter(l => l.url?.trim()).length > 0
                      ? fd.retailerLinks.filter(l => l.url?.trim()).map(l => [
                          RETAILER_OPTIONS.find(o => o.slug === l.retailer)?.label || l.retailer,
                          l.price ? `$${l.price}` : 'No price set',
                        ])
                      : [['Where to buy', '—']]),
                  ]},
                  { title: 'Distribution', to: 8, rows: [
                    ['Route', distributionModeLabel],
                    ['Remembered strategy', fd.distributionStrategy === 'amazon_exclusive' ? 'Amazon ebook exclusivity' : fd.distributionStrategy === 'wide' ? 'Wide distribution' : fd.distributionStrategy === 'direct_first' ? 'Direct-first' : 'Not chosen'],
                    ['Channels', selectedDistributionChannels.length
                      ? selectedDistributionChannels.map(channel => channel.label).join(', ')
                      : 'None selected — Indie Converters only'],
                  ]},
                  { title: 'Front & Back Matter', to: 9, rows: [
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
                  <button type="button" className="wz-text-link" onClick={() => goTo(4)}>Go to Book Health Check →</button>
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

        </div>

        <aside className="wz-side-panel">
          <div className="wz-panel-card">
            <div className="wz-panel-card-head">
              <h3>Details</h3>
              <span className="wz-panel-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>
              </span>
            </div>
            <p className="wz-panel-blurb">{WIZARD_STEPS[step].blurb}</p>
            <div className="wz-prog-bar wz-panel-prog-bar"><div className="wz-prog-fill" style={{ width: `${pct}%` }} /></div>
            <span className="wz-panel-prog-label">{step + 1} of {WIZARD_STEPS.length} steps completed</span>
          </div>

          <div className="wz-panel-card">
            <div className="wz-panel-card-head">
              <h3>Quick tips</h3>
              <span className="wz-panel-icon wz-panel-icon--tip">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.2 1 2.1h5c0-.9.4-1.65 1-2.1A6 6 0 0 0 12 3Z"/></svg>
              </span>
            </div>
            <ul className="wz-panel-tips">
              {WIZARD_STEPS[step].tips.map((tip, i) => (
                <li key={i}><span className="wz-panel-tip-check">✓</span>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="wz-panel-card wz-panel-help">
            <h3>Need help?</h3>
            <p>Our publishing guide walks you through each step.</p>
            <Link to="/help" className="wz-panel-help-btn">Open guide <span aria-hidden="true">↗</span></Link>
          </div>
        </aside>
        </div>

        {/* ── Navigation ── */}
        <div className="wz-nav">
          <span className="wz-nav-status">
            {savingDraft
              ? 'Saving…'
              : draftSaved
                ? <><span className="wz-nav-status-check">✓</span> All changes saved</>
                : 'Not saved yet'}
          </span>
          <div className="wz-nav-actions">
            {step > 0 && <button type="button" className="btn btn-outline" onClick={goBack}>← Back</button>}
            {fd.title && <button type="button" className="btn btn-outline" onClick={handleSaveDraft} disabled={savingDraft}>Save draft</button>}
            {step < 11 && <button type="button" className="btn btn-primary" onClick={goNext}>Save & continue →</button>}
          </div>
        </div>
      </div>
      <PublishingAssistant
        workflowContext={publishingAssistantContext}
        onInsertSuggestion={insertAssistantSuggestion}
        onNavigateReadiness={navigateToReadinessItem}
        onInsertMatterDraft={insertAssistantMatterDraft}
        onApplyDistributionStrategy={applyAssistantDistributionStrategy}
        onRememberBookFacts={rememberAssistantBookFacts}
        supportContact={{ name: authorName, email: user?.email || '' }}
      />
    </div>
  );
}
