const ROUTES = {
  metadata: 'consult_metadata_specialist',
  conversion: 'consult_conversion_specialist',
  pricing: 'consult_pricing_distribution_specialist',
  readiness: 'consult_readiness_specialist',
};

export function routeAlexSpecialist(message, workflowContext = {}) {
  const text = String(message || '').toLowerCase();
  if (/\b(manuscript|conversion|epub|chapter heading|headings|table of contents|toc|formatting|image|file health|health check)\b/.test(text)) {
    return ROUTES.conversion;
  }
  if (/\b(price|pricing|royalt|earnings|retailer fee|distribution|wide|exclusive|exclusivity|amazon|print cost)\b/.test(text)) {
    return ROUTES.pricing;
  }
  if (/\b(metadata|title|subtitle|description|blurb|genre|audience|keyword|category|bisac|comparable|positioning)\b/.test(text)) {
    return ROUTES.metadata;
  }
  if (/^(?:what(?:'s| is) )?(?:next|now)\??$/.test(text.trim())
    || /\b(ready|readiness|missing|blocker|what (?:should|do) i (?:do|fix)|what comes next|continue|next step)\b/.test(text)) {
    return ROUTES.readiness;
  }
  if (workflowContext?.stepLabel === 'Conversion Readiness'
    && /\b(issue|issues|problem|problems|critical|warning|attention|fix)\b/.test(text)) {
    return ROUTES.conversion;
  }
  return null;
}

export const ALEX_SPECIALIST_ROUTES = Object.freeze({ ...ROUTES });
