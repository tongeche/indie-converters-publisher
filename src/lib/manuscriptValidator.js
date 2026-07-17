import mammoth from 'mammoth/mammoth.browser';
import JSZip from 'jszip';

function estimatePageCount(wordCount, wordsPerPage = 250) {
  const words = Number(wordCount) || 0;
  const pageWords = Math.max(1, Number(wordsPerPage) || 250);
  if (words <= 0) return 0;
  return Math.max(1, Math.round(words / pageWords));
}

export function validateManuscript({ headings = [], wordCount = 0, paragraphCount = 0, maxBlankRun = 0, fileSize = 0, wordsPerPage = 250 }) {
  const issues = [];
  const est = estimatePageCount(wordCount, wordsPerPage);

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

// ── Readability (Flesch Reading Ease / Flesch-Kincaid Grade) ────────────────
// Standard vowel-group syllable heuristic (the same approach used by most
// JS readability libraries) — not exact dictionary lookup, but accurate
// enough for a manuscript-level average across thousands of words.
function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const matches = trimmed.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function computeReadability(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  const words = clean.split(' ').filter(Boolean);
  const sentences = clean.split(/[.!?]+(?:\s|$)/).map(s => s.trim()).filter(Boolean);
  const wordCount = words.length;
  if (wordCount === 0) return null;
  const sentenceCount = Math.max(1, sentences.length);
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  const fleschScore = Math.round(206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord);
  const fleschGrade = Math.max(0, Math.round((0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59) * 10) / 10);
  let label;
  if (fleschScore >= 90) label = 'Very easy to read';
  else if (fleschScore >= 80) label = 'Easy to read';
  else if (fleschScore >= 70) label = 'Fairly easy to read';
  else if (fleschScore >= 60) label = 'Standard, conversational';
  else if (fleschScore >= 50) label = 'Fairly difficult';
  else if (fleschScore >= 30) label = 'Difficult';
  else label = 'Very difficult';
  return { sentenceCount, avgWordsPerSentence, avgSyllablesPerWord, fleschScore, fleschGrade, label };
}

// ── Embedded image resolution (print only — screens don't need 300dpi) ─────
// Takes the {width, height} pixel dimensions mammoth reads off each embedded
// image and flags ones that would print below a legible DPI at the chosen
// trim width. Skipped for eBook-only books since screen resolution isn't a
// fixed physical constraint the way a printed page is.
export function analyseImages(images = [], { trimWidthInches = 5, hasPrintFormat = false, dpiThreshold = 150 } = {}) {
  const decoded = images.filter(img => img && img.width && img.height);
  if (!hasPrintFormat) {
    return { count: images.length, checked: false, lowResCount: 0, lowRes: [] };
  }
  const lowRes = decoded
    .map((img, index) => ({ ...img, index, dpi: Math.round(img.width / trimWidthInches) }))
    .filter(img => img.dpi < dpiThreshold);
  return { count: images.length, checked: true, lowResCount: lowRes.length, lowRes };
}

// ── Manual page breaks (.docx only) ──────────────────────────────────────
// A .docx is a zip archive; Word records a hard page break as a
// <w:br w:type="page"/> run inside word/document.xml. Reading that
// directly (rather than through mammoth's HTML output, which drops it)
// gives a real count instead of guessing from paragraph spacing.
export async function countManualPageBreaks(arrayBuffer) {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = zip.file('word/document.xml');
    if (!docXml) return 0;
    const xml = await docXml.async('string');
    const matches = xml.match(/<w:br[^>]*w:type="page"[^>]*\/?>/g);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}

export function analyseHtml(html, fileSize, options = {}) {
  const wordsPerPage = options.wordsPerPage || 250;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = [];
  const blocks = [];
  let headingIdx = -1, maxBlankRun = 0, blankRun = 0, maxBlankRunHeading = null;
  for (const el of [...doc.body.children]) {
    const tag = el.tagName;
    if (/^H[1-4]$/.test(tag)) {
      const level = parseInt(tag[1]);
      const text = el.textContent.trim();
      headings.push({ level, text, index: headings.length, words: 0 });
      blocks.push({ type: 'heading', level, text });
      headingIdx = headings.length - 1; blankRun = 0;
    } else if (tag === 'P' && !el.textContent.trim()) {
      blankRun++;
      if (blankRun > maxBlankRun) {
        maxBlankRun = blankRun;
        maxBlankRunHeading = headingIdx >= 0 ? headings[headingIdx].text : null;
      }
    } else {
      blankRun = 0;
      const t = el.textContent.trim();
      if (t) {
        if (headingIdx >= 0) headings[headingIdx].words += t.split(/\s+/).filter(Boolean).length;
        blocks.push({ type: 'para', text: t });
      }
    }
  }
  const wordCount      = doc.body.textContent.trim().split(/\s+/).filter(Boolean).length;
  const paragraphCount = doc.querySelectorAll('p').length;
  const estimatedPages = estimatePageCount(wordCount, wordsPerPage);
  return {
    headings,
    blocks,
    wordCount,
    paragraphCount,
    maxBlankRun,
    maxBlankRunHeading,
    fileSize,
    estimatedPages,
    readability: computeReadability(doc.body.textContent),
    readingMinutes: Math.max(1, Math.round(wordCount / 200)),
    issues: validateManuscript({ headings, wordCount, paragraphCount, maxBlankRun, fileSize, wordsPerPage }),
  };
}

export function analyseTxt(text, fileSize, options = {}) {
  const wordsPerPage = options.wordsPerPage || 250;
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const headings = [];
  const blocks = [];
  let headingIdx = -1;
  paragraphs.forEach(p => {
    const isSingleLine = !p.includes('\n');
    if (isSingleLine && p.length > 2 && p.length <= 80) {
      const isAllCaps = p === p.toUpperCase() && /[A-Z]/.test(p);
      const level = isAllCaps ? 1 : 2;
      headings.push({ level, text: p, index: headings.length, words: 0 });
      blocks.push({ type: 'heading', level, text: p });
      headingIdx = headings.length - 1;
      return;
    }
    if (headingIdx >= 0) headings[headingIdx].words += p.split(/\s+/).filter(Boolean).length;
    blocks.push({ type: 'para', text: p });
  });
  const headingTexts = new Set(headings.map(h => h.text));
  let maxBlankRun = 0, blankRun = 0, maxBlankRunHeading = null, lastHeadingSeen = null;
  text.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      blankRun++;
      if (blankRun > maxBlankRun) { maxBlankRun = blankRun; maxBlankRunHeading = lastHeadingSeen; }
    } else {
      blankRun = 0;
      if (headingTexts.has(trimmed)) lastHeadingSeen = trimmed;
    }
  });
  const wordCount      = text.trim().split(/\s+/).filter(Boolean).length;
  const paragraphCount = paragraphs.length;
  const estimatedPages = estimatePageCount(wordCount, wordsPerPage);
  return {
    headings,
    blocks,
    wordCount,
    paragraphCount,
    maxBlankRun,
    maxBlankRunHeading,
    fileSize,
    estimatedPages,
    readability: computeReadability(text),
    readingMinutes: Math.max(1, Math.round(wordCount / 200)),
    issues: validateManuscript({ headings, wordCount, paragraphCount, maxBlankRun, fileSize, wordsPerPage }),
  };
}

export async function analyseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'docx') {
    const buf = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
    const [result, manualPageBreaks] = await Promise.all([
      Promise.resolve(analyseHtml(html, file.size)),
      countManualPageBreaks(buf),
    ]);
    return { ...result, manualPageBreaks };
  }
  const text = await file.text();
  return analyseTxt(text, file.size);
}

// Per-platform readiness gates
export function platformStatus(result) {
  const { issues, estimatedPages, wordCount } = result;
  const types = new Set(issues.map(i => i.type));
  const errors = issues.filter(i => i.severity === 'error');
  const hasError = t => types.has(t);

  const epubFail = hasError('no-headings') || hasError('empty-chapters') || hasError('file-too-large');
  const epubWarn = hasError('wrong-heading-start') || hasError('excessive-blanks') || hasError('single-heading');

  const kdpFail = errors.length > 0;
  const kdpWarn = hasError('very-short') || hasError('very-long') || hasError('single-heading') || hasError('all-caps-headings');

  const d2dFail = errors.length > 0 || wordCount < 1000;
  const d2dWarn = wordCount >= 1000 && wordCount < 2500;

  const ingramFail = errors.length > 0 || estimatedPages > 828;
  const ingramWarn = estimatedPages > 0 && estimatedPages < 24;

  const appleFail = hasError('no-headings') || hasError('file-too-large') || hasError('critically-short');
  const appleWarn = hasError('single-heading') || hasError('wrong-heading-start');

  const koboFail  = appleFail;
  const koboWarn  = appleWarn;

  function grade(fail, warn) {
    if (fail) return 'fail';
    if (warn) return 'warn';
    return 'pass';
  }

  return {
    epubcheck:   { label: 'EPUBCheck',     status: grade(epubFail, epubWarn)   },
    kdp:         { label: 'Amazon KDP',    status: grade(kdpFail, kdpWarn)     },
    d2d:         { label: 'Draft2Digital', status: grade(d2dFail, d2dWarn)     },
    ingram:      { label: 'IngramSpark',   status: grade(ingramFail, ingramWarn) },
    apple:       { label: 'Apple Books',   status: grade(appleFail, appleWarn)  },
    kobo:        { label: 'Kobo',          status: grade(koboFail, koboWarn)    },
  };
}
