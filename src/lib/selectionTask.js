// A selected passage is context, not consent to change it. Keep this decision
// deterministic so the server never turns an analytical question into an edit
// proposal merely because text happens to be highlighted.
const TRANSFORMATION_VERB = '(?:rewrite|re-write|rephrase|shorten|simplify|tighten|polish|edit|revise|refine|rework|recast|improve|replace|correct|fix)';
const SELECTION_TARGET = '(?:this(?:\\s+(?:selected\\s+)?(?:text|passage|sentence|wording|phrase|part))?|it|that(?:\\s+(?:selected\\s+)?(?:text|passage|sentence|wording|phrase|part))?|the\\s+(?:selected\\s+)?(?:text|passage|sentence|wording|phrase|part))';

export function isExplicitSelectionTransformationRequest(value) {
  const message = String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!message) return false;

  // Questions about whether something should change are requests for advice,
  // not a direction to make the change.
  if (new RegExp(`^(?:should|would|could|can|do|does|is|are)\\s+(?:i|we|${SELECTION_TARGET})\\b[\\s\\S]*\\b${TRANSFORMATION_VERB}\\b`, 'i').test(message)
    || /^(?:how|what)\s+(?:can|could|should|would|do)\b/.test(message)) {
    return false;
  }

  // "Can you rewrite this?", "please shorten it", and direct imperatives all
  // clearly request a replacement of the highlighted passage.
  if (new RegExp(`\\b(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?${TRANSFORMATION_VERB}\\b`, 'i').test(message)
    || new RegExp(`^(?:please\\s+)?${TRANSFORMATION_VERB}\\b`, 'i').test(message)
    || new RegExp(`\\b${TRANSFORMATION_VERB}\\s+${SELECTION_TARGET}\\b`, 'i').test(message)) {
    return true;
  }

  // Style directions are also explicit transformations, even when they do
  // not use one of the verbs above (for example, "make this more intimate").
  if (new RegExp(`\\b(?:make|turn)\\s+${SELECTION_TARGET}\\s+(?:more|less|sound|feel|read|into|better|clearer|stronger|warmer|tighter|shorter|longer)\\b`, 'i').test(message)
    || new RegExp(`\\bchange\\s+${SELECTION_TARGET}\\s+(?:to|into|so\\s+(?:it|this)\\s+(?:sounds|feels|reads))\\b`, 'i').test(message)
    || new RegExp(`\\b(?:give|show|offer|provide)\\s+(?:me\\s+)?(?:an?\\s+|another\\s+)?(?:alternative|version|rewrite|rephrasing|wording)\\b`, 'i').test(message)) {
    return true;
  }

  return false;
}

// A model may occasionally put otherwise usable rewrite options into prose.
// When the author explicitly requested a transformation, recover only a
// clearly quoted list item so it can still be shown in the approval card.
export function extractSelectionProposalFromText(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const listItem = [...text.matchAll(/^\s*(?:[-*•]|\d+[.)])\s*(?:\*\*)?[“"]([^”"\n]{1,800})[”"](?:\*\*)?\s*$/gm)]
    .map(match => match[1].trim())
    .find(Boolean);
  if (listItem) return listItem;

  const labelled = text.match(/(?:replacement|revised(?:\s+wording)?|suggested(?:\s+wording)?|you could say)\s*[:,]?\s*[“"]([^”"\n]{1,800})[”"]/i)?.[1]?.trim();
  if (labelled) return labelled;

  // A single, standalone line is sometimes returned instead of the JSON
  // field. Treat only clear candidate copy as a proposal; advice and questions
  // remain normal assistant text.
  const standalone = text.replace(/^[“"]|[”"]$/g, '').trim();
  const soundsLikeAdvice = /^(?:i|you|we|please|sorry|try|consider|could|would|can|this(?:\s+(?:sentence|passage|text|wording))?\s+(?:is|needs)|the\s+selected|more\s+context|to\s+make)\b/i.test(standalone);
  if (!soundsLikeAdvice && !/[?\n]/.test(standalone) && standalone.length <= 800 && standalone.split(/\s+/).length >= 2) return standalone;
  return '';
}
