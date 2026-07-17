import assert from 'node:assert/strict';
import test from 'node:test';
import { actionPlanProgress, createPublishingActionPlan, sanitizePublishingActionPlan, updatePublishingActionPlan } from './publishingPlan.js';

const workflow = {
  wizardNavigation: [{ field: 'description', step: 2, label: 'About' }],
  readiness: {
    items: [
      { id: 'title', label: 'Book title', status: 'complete', message: 'Done.', step: 1, field: 'title' },
      { id: 'headings', label: 'Chapter headings', status: 'blocker', message: 'Apply Heading 1 to each chapter title.', step: 5 },
      { id: 'description', label: 'Book description', status: 'missing', message: 'Add reader-facing copy.', step: 2, field: 'description' },
    ],
  },
};

test('builds a blocker-first publishing plan from authoritative readiness', () => {
  const plan = createPublishingActionPlan(workflow, 'Help me prepare for launch');
  assert.equal(plan.steps.length, 2);
  assert.equal(plan.steps[0].title, 'Chapter headings');
  assert.equal(plan.steps[0].status, 'current');
  assert.equal(plan.steps[1].field, 'description');
});

test('moves the next unfinished plan step forward only after completion', () => {
  const plan = createPublishingActionPlan(workflow);
  const updated = updatePublishingActionPlan(plan, plan.steps[0].id, 'completed');
  assert.equal(updated.steps[0].status, 'completed');
  assert.equal(updated.steps[1].status, 'current');
  assert.deepEqual(actionPlanProgress(updated), { complete: 1, total: 2, percent: 50 });
});

test('sanitizes resumable action plans', () => {
  const plan = sanitizePublishingActionPlan({
    id: 'plan-1', title: 'Plan', goal: 'Finish', steps: [{ id: 'one', title: 'Task', detail: 'Do it', status: 'pending', step: 2 }],
  });
  assert.equal(plan.steps[0].status, 'current');
  assert.equal(plan.status, 'active');
});
