const LABELS = {
  title: 'Title', subtitle: 'Subtitle', language: 'Language', edition: 'Edition', series: 'Series',
  seriesVolume: 'Series volume', description: 'Description', audience: 'Audience', genre: 'Primary genre',
  genreSecondary: 'Secondary genre', keywords: 'Discovery keywords', pubYear: 'Publication year',
  publisher: 'Publisher', pageCount: 'Page count', trimSize: 'Trim size', price: 'Price',
};

const CONTINUATION_REQUEST = /^(?:next|continue|what(?:'s| is)? next|what should i do (?:now|next))\??$/i;
const READINESS_PRIORITY = { blocker: 0, missing: 1, recommended: 2 };

function hasValue(value) {
  return Array.isArray(value) ? value.some(Boolean) : value !== null && value !== undefined && String(value).trim() !== '';
}

export function createPublishingFactLedger(workflowContext = {}) {
  const details = workflowContext.bookDetails || {};
  const confirmed = Object.entries(details)
    .filter(([, value]) => hasValue(value))
    .map(([field, value]) => ({ field, label: LABELS[field] || field, value, source: 'author_confirmed' }));
  const decisions = [];
  if (workflowContext.pricingContext?.distributionStrategy) {
    decisions.push({
      field: 'distributionStrategy',
      value: workflowContext.pricingContext.distributionStrategy,
      source: 'author_confirmed',
    });
  }
  if (workflowContext.pricingContext?.distributionPriority) {
    decisions.push({
      field: 'distributionPriority',
      value: workflowContext.pricingContext.distributionPriority,
      source: 'author_confirmed',
    });
  }
  return {
    confirmed,
    decisions,
    inferred: [],
    rule: 'Never promote inferred information into confirmed facts without explicit author approval.',
  };
}

export function inspectPublishingContext(workflowContext = {}) {
  return {
    currentStep: {
      number: workflowContext.stepNumber || null,
      label: workflowContext.stepLabel || '',
      group: workflowContext.stepGroup || '',
    },
    activeField: workflowContext.activeField || null,
    facts: createPublishingFactLedger(workflowContext),
  };
}

export function inspectPublishingReadiness(workflowContext = {}) {
  const readiness = workflowContext.readiness || {};
  const items = Array.isArray(readiness.items) ? readiness.items : [];
  return {
    score: readiness.score ?? null,
    complete: readiness.complete ?? items.filter(item => item.status === 'complete').length,
    blockers: items.filter(item => item.status === 'blocker'),
    missing: items.filter(item => item.status === 'missing'),
    recommended: items.filter(item => item.status === 'recommended'),
  };
}

export function inspectNextPublishingAction(workflowContext = {}) {
  return workflowContext.nextAction || { kind: 'review', label: 'Final review' };
}

// Short continuation messages should not be left to a model to infer. The
// wizard already calculated the authoritative next action from its readiness
// state, so use that state directly and keep any navigation tightly scoped.
export function isBarePublishingContinuation(message) {
  return CONTINUATION_REQUEST.test(String(message || '').trim());
}

function fallbackNextAction(workflowContext = {}) {
  const items = Array.isArray(workflowContext.readiness?.items) ? workflowContext.readiness.items : [];
  const currentStep = Number(workflowContext.stepNumber) || 0;
  const issue = items
    .filter(item => item?.status && item.status !== 'complete')
    .sort((left, right) => {
      const leftCurrent = Number(left.step) === currentStep ? 0 : 1;
      const rightCurrent = Number(right.step) === currentStep ? 0 : 1;
      return leftCurrent - rightCurrent
        || (READINESS_PRIORITY[left.status] ?? 9) - (READINESS_PRIORITY[right.status] ?? 9);
    })[0];
  if (issue) return { kind: 'fix', ...issue };
  return { kind: 'review', label: 'Final review', step: currentStep };
}

export function buildGroundedNextPublishingGuidance(workflowContext = {}) {
  const supplied = workflowContext.nextAction;
  const next = supplied && ['fix', 'continue', 'review'].includes(supplied.kind)
    ? supplied
    : fallbackNextAction(workflowContext);
  const label = String(next.label || workflowContext.stepLabel || 'the next publishing step').trim();
  const wizardNavigation = Array.isArray(workflowContext.wizardNavigation) ? workflowContext.wizardNavigation : [];
  const wizardSteps = Array.isArray(workflowContext.wizardSteps) ? workflowContext.wizardSteps : [];
  const diagnostics = Array.isArray(workflowContext.conversionDiagnostics?.findings)
    ? workflowContext.conversionDiagnostics.findings
    : [];
  const actions = [];

  if (next.kind === 'fix') {
    const finding = diagnostics.find(item => item?.id === next.id);
    const destination = next.field && wizardNavigation.find(item => item?.field === next.field);
    const stepDestination = wizardSteps.find(item => Number(item?.step) === Number(next.step));
    if (finding?.id) {
      actions.push({ label: `Open ${finding.label} details`, type: 'health_detail', value: finding.id });
    } else if (destination?.field) {
      actions.push({ label: `Go to ${destination.label}`, type: 'wizard', value: destination.field });
    } else if (stepDestination) {
      actions.push({ label: `Go to ${stepDestination.label}`, type: 'wizard_step', value: String(stepDestination.step) });
    }
    return {
      text: `Next, **${label}**: ${String(next.message || 'Complete this issue before you continue.').trim()}`,
      actions,
      fieldSuggestions: [],
    };
  }

  if (next.kind === 'continue') {
    return {
      text: `This step is ready. Continue to **${label}**.`,
      actions: [{ label: `Continue to ${label}`, type: 'wizard_next', value: 'continue' }],
      fieldSuggestions: [],
    };
  }

  const reviewDestination = wizardSteps.find(item => Number(item?.step) === Number(next.step));
  if (reviewDestination) {
    actions.push({ label: `Go to ${reviewDestination.label}`, type: 'wizard_step', value: String(reviewDestination.step) });
  }
  return {
    text: `You’re ready for **${label}**. Review the publishing details, then confirm your release plan.`,
    actions,
    fieldSuggestions: [],
  };
}

export function proposePublishingFieldUpdate(workflowContext = {}, field, value, reason = '') {
  const active = workflowContext.activeField;
  if (!active || field !== active.id) {
    return { allowed: false, reason: 'Alex may only propose wording for the active field.' };
  }
  if (!hasValue(value)) return { allowed: false, reason: 'A proposed value is required.' };
  return {
    allowed: true,
    requiresAuthorApproval: true,
    field,
    label: active.label,
    value: String(value).slice(0, active.maxLength || 4000),
    reason: String(reason).slice(0, 240),
  };
}
