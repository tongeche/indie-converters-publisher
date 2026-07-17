import test from 'node:test';
import assert from 'node:assert/strict';
import { createAssistantTextSelection, replaceAssistantTextSelection } from './selectionReplacement.js';

test('captures a bounded author selection', () => {
  const selection = createAssistantTextSelection({
    field: 'description',
    label: 'Description',
    value: 'Yollena embarks on a journey to Tuscany.',
    start: 8,
    end: 15,
  });

  assert.equal(selection.original, 'embarks');
  assert.equal(selection.sourceValue, 'Yollena embarks on a journey to Tuscany.');
});

test('replaces only the approved selected span', () => {
  const source = 'Yollena embarks on a journey to Tuscany.';
  const selection = createAssistantTextSelection({ field: 'description', label: 'Description', value: source, start: 8, end: 15 });
  const result = replaceAssistantTextSelection({ currentValue: source, selection, replacement: 'sets out' });

  assert.equal(result.applied, true);
  assert.equal(result.value, 'Yollena sets out on a journey to Tuscany.');
  assert.deepEqual([result.selectionStart, result.selectionEnd], [8, 16]);
});

test('does not apply a proposal after the author changed the field', () => {
  const selection = createAssistantTextSelection({ field: 'description', label: 'Description', value: 'Original wording.', start: 0, end: 8 });
  const result = replaceAssistantTextSelection({ currentValue: 'Edited wording.', selection, replacement: 'Revised' });

  assert.equal(result.applied, false);
  assert.match(result.error, /changed after/i);
});

test('does not let a selection replacement exceed the field character limit', () => {
  const source = 'A short description.';
  const selection = createAssistantTextSelection({
    field: 'description',
    label: 'Description',
    maxLength: source.length,
    value: source,
    start: 2,
    end: 7,
  });
  const result = replaceAssistantTextSelection({
    currentValue: source,
    selection,
    replacement: 'much longer',
  });

  assert.equal(result.applied, false);
  assert.match(result.error, /character limit/i);
});
