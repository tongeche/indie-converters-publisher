const PLAN_STEP_STATUSES = new Set(['pending', 'current', 'in_progress', 'completed']);
const READINESS_PRIORITY = { blocker: 0, missing: 1, recommended: 2 };

function text(value, maxLength = 240) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function uniqueId(prefix, index) {
  const safePrefix = String(prefix || 'task').replace(/[^a-z0-9_-]/gi, '-').slice(0, 40) || 'task';
  return `${safePrefix}-${index + 1}`;
}

function readinessTasks(workflowContext) {
  const navigation = new Map((workflowContext?.wizardNavigation || []).map(item => [item.field, item]));
  return (workflowContext?.readiness?.items || [])
    .filter(item => item && item.status && item.status !== 'complete')
    .sort((a, b) => (READINESS_PRIORITY[a.status] ?? 9) - (READINESS_PRIORITY[b.status] ?? 9))
    .slice(0, 4)
    .map((item, index) => {
      const destination = item.field ? navigation.get(item.field) : null;
      return {
        id: uniqueId(item.id || item.field || 'task', index),
        title: text(item.label, 100) || 'Publishing task',
        detail: text(item.message, 280) || 'Complete this publishing task before moving on.',
        completionHint: item.status === 'blocker'
          ? 'Mark this complete only after you have resolved the blocker.'
          : 'Mark this complete when you have reviewed or supplied the required information.',
        field: destination?.field || item.field || null,
        step: Number(destination?.step || item.step) || null,
        status: index === 0 ? 'current' : 'pending',
        priority: item.status,
      };
    });
}

function fallbackTask(workflowContext) {
  const next = workflowContext?.nextAction || {};
  const fallbackLabel = next.label || workflowContext?.stepLabel || 'Final review';
  return {
    id: 'next-action-1',
    title: text(fallbackLabel, 100),
    detail: text(next.message, 280) || 'Review this publishing step and confirm the next action.',
    completionHint: 'Mark this complete only after you have completed or reviewed the task.',
    field: next.field || null,
    step: Number(next.step) || null,
    status: 'current',
    priority: next.status || 'recommended',
  };
}

export function createPublishingActionPlan(workflowContext = {}, goal = '') {
  const tasks = readinessTasks(workflowContext);
  const steps = tasks.length ? tasks : [fallbackTask(workflowContext)];
  const normalizedGoal = text(goal, 180);
  const title = normalizedGoal
    ? 'Your focused publishing plan'
    : 'Your next publishing steps';

  return {
    id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
    goal: normalizedGoal || 'Move the book forward with the most important publishing tasks.',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps,
  };
}

export function updatePublishingActionPlan(plan, stepId, status) {
  if (!plan || !Array.isArray(plan.steps) || !PLAN_STEP_STATUSES.has(status)) return null;
  const steps = plan.steps.map(step => step.id === stepId ? { ...step, status } : { ...step });
  const firstOpen = steps.find(step => step.status !== 'completed');
  const normalised = steps.map(step => {
    if (step.status === 'completed') return step;
    if (step.id === firstOpen?.id && status !== 'in_progress') return { ...step, status: step.status === 'in_progress' ? 'in_progress' : 'current' };
    return step.status === 'current' ? { ...step, status: 'pending' } : step;
  });
  const complete = normalised.every(step => step.status === 'completed');
  return {
    ...plan,
    status: complete ? 'completed' : 'active',
    updatedAt: new Date().toISOString(),
    steps: normalised,
  };
}

export function sanitizePublishingActionPlan(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.steps)) return null;
  const steps = value.steps.slice(0, 4).map((step, index) => {
    const status = PLAN_STEP_STATUSES.has(step?.status) ? step.status : index === 0 ? 'current' : 'pending';
    const field = text(step?.field, 80) || null;
    const stepNumber = Math.min(Math.max(Number(step?.step) || 0, 0), 20) || null;
    return {
      id: text(step?.id, 60) || uniqueId('task', index),
      title: text(step?.title, 100) || 'Publishing task',
      detail: text(step?.detail, 280) || 'Complete this publishing task before moving on.',
      completionHint: text(step?.completionHint, 280) || 'Mark this complete only after you have reviewed the task.',
      field,
      step: stepNumber,
      status,
      priority: ['blocker', 'missing', 'recommended'].includes(step?.priority) ? step.priority : 'recommended',
    };
  }).filter(step => step.title);
  if (!steps.length) return null;
  const firstOpen = steps.find(step => step.status !== 'completed');
  const normalisedSteps = steps.map(step => step.status !== 'completed' && step.id === firstOpen?.id && step.status === 'pending'
    ? { ...step, status: 'current' }
    : step);
  const complete = normalisedSteps.every(step => step.status === 'completed');
  return {
    id: text(value.id, 80) || `plan-${Date.now()}`,
    title: text(value.title, 120) || 'Your focused publishing plan',
    goal: text(value.goal, 180) || 'Move the book forward with the most important publishing tasks.',
    status: complete ? 'completed' : 'active',
    createdAt: text(value.createdAt, 40) || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: normalisedSteps,
  };
}

export function actionPlanProgress(plan) {
  const total = Array.isArray(plan?.steps) ? plan.steps.length : 0;
  const complete = total ? plan.steps.filter(step => step.status === 'completed').length : 0;
  return { complete, total, percent: total ? Math.round((complete / total) * 100) : 0 };
}
