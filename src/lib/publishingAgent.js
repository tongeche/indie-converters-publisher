const LABELS = {
  title: 'Title', subtitle: 'Subtitle', language: 'Language', edition: 'Edition', series: 'Series',
  seriesVolume: 'Series volume', description: 'Description', audience: 'Audience', genre: 'Primary genre',
  genreSecondary: 'Secondary genre', keywords: 'Discovery keywords', pubYear: 'Publication year',
  publisher: 'Publisher', pageCount: 'Page count', trimSize: 'Trim size', price: 'Price',
};

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
