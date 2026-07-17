import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGroundedNextPublishingGuidance,
  createPublishingFactLedger,
  inspectPublishingReadiness,
  isBarePublishingContinuation,
  proposePublishingFieldUpdate,
} from './publishingAgent.js';

const workflow = {
  activeField: { id: 'description', label: 'Description', maxLength: 200 },
  bookDetails: { title: 'A Quiet Harbour', description: '', genre: 'fiction' },
  pricingContext: { distributionStrategy: 'wide' },
  readiness: { items: [{ id: 'title', status: 'complete' }, { id: 'description', status: 'missing' }] },
};

test('publishing fact ledger separates confirmed facts and decisions', () => {
  const ledger = createPublishingFactLedger(workflow);
  assert.deepEqual(ledger.confirmed.map(item => item.field), ['title', 'genre']);
  assert.equal(ledger.decisions[0].value, 'wide');
  assert.deepEqual(ledger.inferred, []);
});

test('readiness tool preserves authoritative readiness statuses', () => {
  const readiness = inspectPublishingReadiness(workflow);
  assert.equal(readiness.complete, 1);
  assert.equal(readiness.missing[0].id, 'description');
});

test('field proposals require approval and are restricted to the active field', () => {
  assert.equal(proposePublishingFieldUpdate(workflow, 'title', 'New title').allowed, false);
  const proposal = proposePublishingFieldUpdate(workflow, 'description', 'A careful draft.');
  assert.equal(proposal.allowed, true);
  assert.equal(proposal.requiresAuthorApproval, true);
});

test('bare continuation requests are grounded in the authoritative next action', () => {
  const guidance = buildGroundedNextPublishingGuidance({
    ...workflow,
    stepNumber: 5,
    nextAction: {
      kind: 'fix',
      id: 'headings',
      label: 'Fix chapter headings',
      message: 'Apply Heading 1 to every chapter title.',
      status: 'blocker',
      step: 5,
    },
    conversionDiagnostics: {
      findings: [{ id: 'headings', label: 'Headings', severity: 'critical', message: 'No chapter headings found.' }],
    },
  });

  assert.equal(isBarePublishingContinuation('next'), true);
  assert.equal(isBarePublishingContinuation('What should I do next?'), true);
  assert.equal(isBarePublishingContinuation('What price should I set next?'), false);
  assert.match(guidance.text, /Heading 1/i);
  assert.deepEqual(guidance.actions, [{ label: 'Open Headings details', type: 'health_detail', value: 'headings' }]);
  assert.deepEqual(guidance.fieldSuggestions, []);
});

test('continuation guidance falls back to readiness without proposing field copy', () => {
  const guidance = buildGroundedNextPublishingGuidance({
    ...workflow,
    stepNumber: 2,
    nextAction: null,
    readiness: {
      items: [{ id: 'description', label: 'Book description', status: 'missing', message: 'Add reader-facing copy.', step: 2, field: 'description' }],
    },
    wizardNavigation: [{ field: 'description', step: 2, label: 'About' }],
  });

  assert.match(guidance.text, /Book description/i);
  assert.deepEqual(guidance.actions, [{ label: 'Go to About', type: 'wizard', value: 'description' }]);
  assert.deepEqual(guidance.fieldSuggestions, []);
});
