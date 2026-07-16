import aff from '../assets/dictionaries/en.aff?raw';
import dic from '../assets/dictionaries/en.dic?raw';
import nspell from 'nspell';

// Loaded once, lazily — this module is only ever reached via dynamic
// import() from the manuscript step, so the ~550KB word list never touches
// the main app bundle.
let spellInstance = null;
function getSpell() {
  if (!spellInstance) spellInstance = nspell({ aff, dic });
  return spellInstance;
}

const WORD_RE = /[A-Za-z][A-Za-z']*/g;

// A plain Hunspell dictionary lookup, same idea as Amazon KDP's spell check —
// it flags any word outside its word list, which includes real typos but
// also character names, place names, and invented words. That's expected;
// the UI says so rather than pretending this is smarter than it is.
export function checkSpelling(text) {
  const spell = getSpell();
  const counts = new Map();
  const words = String(text || '').match(WORD_RE) || [];
  for (const raw of words) {
    if (raw.length < 2) continue;
    const key = raw.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const misspelled = [];
  for (const [word, count] of counts) {
    if (!spell.correct(word)) misspelled.push({ word, count });
  }
  misspelled.sort((a, b) => b.count - a.count);

  // Suggestions are the real, actionable part — but nspell has to generate
  // and score edit candidates per word, so only run it for the words we'll
  // actually show, not the whole (potentially huge) misspelled list.
  const topMisspelled = misspelled.slice(0, 15).map(entry => ({
    ...entry,
    suggestions: spell.suggest(entry.word).slice(0, 3),
  }));

  return {
    uniqueWordCount: counts.size,
    misspelledCount: misspelled.length,
    misspelledOccurrences: misspelled.reduce((sum, m) => sum + m.count, 0),
    topMisspelled,
  };
}
