import assert from 'node:assert/strict';
import test from 'node:test';
import { extractSelectionProposalFromText, isExplicitSelectionTransformationRequest } from './selectionTask.js';

test('recognises explicit selected-text transformation requests', () => {
  [
    'Rewrite this to sound more intimate.',
    'Can you shorten it?',
    'Please rephrase the selected sentence.',
    'Make this more direct.',
    'Can you make this sentence more concise?',
    'Can you make it better?',
    'Fix this wording.',
    'Give me another version.',
  ].forEach(message => assert.equal(isExplicitSelectionTransformationRequest(message), true, message));
});

test('keeps selected-text questions and analysis non-editing', () => {
  [
    'What does this mean?',
    'Is this too long?',
    'Does this need to be rewritten?',
    'How can I make this better?',
    'Tell me if this is repetitive.',
    'Why does this sentence feel awkward?',
  ].forEach(message => assert.equal(isExplicitSelectionTransformationRequest(message), false, message));
});

test('recovers a clearly quoted rewrite option from prose', () => {
  assert.equal(
    extractSelectionProposalFromText('You could say, "Yollena journeys to Tuscany."'),
    'Yollena journeys to Tuscany.',
  );
  assert.equal(extractSelectionProposalFromText('Yollena journeys to Tuscany.'), 'Yollena journeys to Tuscany.');
  assert.equal(extractSelectionProposalFromText('This sentence is already clear.'), '');
});
