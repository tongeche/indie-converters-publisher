import mammoth from 'mammoth/mammoth.browser';

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

export function analyseHtml(html, fileSize, options = {}) {
  const wordsPerPage = options.wordsPerPage || 250;
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
  const estimatedPages = estimatePageCount(wordCount, wordsPerPage);
  return {
    headings,
    wordCount,
    paragraphCount,
    maxBlankRun,
    fileSize,
    estimatedPages,
    issues: validateManuscript({ headings, wordCount, paragraphCount, maxBlankRun, fileSize, wordsPerPage }),
  };
}

export function analyseTxt(text, fileSize, options = {}) {
  const wordsPerPage = options.wordsPerPage || 250;
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
  const estimatedPages = estimatePageCount(wordCount, wordsPerPage);
  return {
    headings,
    wordCount,
    paragraphCount,
    maxBlankRun,
    fileSize,
    estimatedPages,
    issues: validateManuscript({ headings, wordCount, paragraphCount, maxBlankRun, fileSize, wordsPerPage }),
  };
}

export async function analyseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'docx') {
    const buf = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
    return analyseHtml(html, file.size);
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
