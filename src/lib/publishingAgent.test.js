import assert from 'node:assert/strict';
import test from 'node:test';
import { createPublishingFactLedger, inspectPublishingReadiness, proposePublishingFieldUpdate } from './publishingAgent.js';

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
