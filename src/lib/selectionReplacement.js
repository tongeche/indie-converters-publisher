export const MAX_ASSISTANT_SELECTION_LENGTH = 800;

/**
 * Capture a small, immutable snapshot of author-highlighted text. Keeping the
 * source value lets us reject an old AI proposal if the author edits the field
 * before approving it.
 */
export function createAssistantTextSelection({ field, label, purpose = '', maxLength = null, value, start, end, bounds = null }) {
  const sourceValue = typeof value === 'string' ? value : '';
  const from = Number(start);
  const to = Number(end);
  if (!field || !label || !Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to <= from || to > sourceValue.length) return null;

  const original = sourceValue.slice(from, to);
  if (!original.trim() || original.length > MAX_ASSISTANT_SELECTION_LENGTH) return null;

  return {
    field,
    label,
    purpose,
    maxLength: Number.isFinite(maxLength) && maxLength > 0 ? maxLength : null,
    start: from,
    end: to,
    text: original,
    original,
    sourceValue,
    bounds: bounds && Number.isFinite(bounds.top) && Number.isFinite(bounds.left)
      ? {
          top: bounds.top,
          left: bounds.left,
          width: Number(bounds.width) || 0,
          height: Number(bounds.height) || 0,
        }
      : null,
  };
}

/** Apply only a still-current selected span; never overwrite an edited field. */
export function replaceAssistantTextSelection({ currentValue, selection, replacement }) {
  const value = typeof currentValue === 'string' ? currentValue : '';
  const nextText = typeof replacement === 'string' ? replacement : '';
  if (!selection || !nextText.trim()) return { applied: false, error: 'Alex needs a replacement before it can be applied.' };
  if (value !== selection.sourceValue) {
    return { applied: false, error: 'That field changed after the text was selected. Select the passage again so Alex can keep the edit precise.' };
  }
  if (!Number.isInteger(selection.start) || !Number.isInteger(selection.end)
    || selection.start < 0 || selection.end <= selection.start || selection.end > value.length
    || value.slice(selection.start, selection.end) !== selection.original) {
    return { applied: false, error: 'The selected text is no longer in the same place. Select it again before applying Alex’s edit.' };
  }

  // A browser selection can include an adjacent space. Keep it instead of
  // making the surrounding sentence run together when Alex returns clean copy.
  const leadingWhitespace = selection.original.match(/^\s*/)?.[0] || '';
  const trailingWhitespace = selection.original.match(/\s*$/)?.[0] || '';
  const appliedReplacement = `${leadingWhitespace}${nextText.trim()}${trailingWhitespace}`;
  const nextValue = `${value.slice(0, selection.start)}${appliedReplacement}${value.slice(selection.end)}`;
  if (Number.isFinite(selection.maxLength) && selection.maxLength > 0 && nextValue.length > selection.maxLength) {
    return {
      applied: false,
      error: `That edit would exceed this field’s ${selection.maxLength.toLocaleString()}-character limit. Ask Alex for a shorter version.`,
    };
  }
  return {
    applied: true,
    value: nextValue,
    selectionStart: selection.start,
    selectionEnd: selection.start + appliedReplacement.length,
  };
}
