const baseUrl = (process.env.ALEX_EVAL_URL || 'https://indieconverters.uk').replace(/\/$/, '');

const workflowContext = {
  mode: 'publishing_upload',
  draftKey: 'alex-evaluation-fixture',
  stepNumber: 5,
  totalSteps: 12,
  stepLabel: 'Conversion Readiness',
  stepGroup: 'Files',
  activeField: {
    id: 'description',
    label: 'Description',
    value: 'A historical romance set in Tuscany.',
    maxLength: 4000,
    required: true,
  },
  bookDetails: {
    title: 'Whispers of Tuscany',
    description: 'A historical romance set in Tuscany.',
    genre: 'Historical romance',
    audience: 'Adult',
  },
  readiness: {
    items: [
      { id: 'title', label: 'Book title', status: 'complete', message: 'Title supplied.', step: 1, field: 'title' },
      { id: 'headings', label: 'Chapter headings', status: 'blocker', message: 'No chapter headings were detected.', step: 5 },
      { id: 'keywords', label: 'Discovery keywords', status: 'missing', message: 'Add discovery keywords.', step: 2, field: 'keywords' },
    ],
  },
  conversionDiagnostics: {
    findings: [{
      id: 'headings',
      label: 'Headings',
      severity: 'critical',
      message: 'No chapter headings found. In Word, select each chapter title, then Home > Styles > Heading 1.',
    }],
  },
  nextAction: {
    kind: 'fix', id: 'headings', label: 'Fix chapter headings',
    message: 'Add Heading 1 to every chapter title.', status: 'blocker', step: 5,
  },
  pricingContext: {
    formats: ['eBook', 'Paperback'],
    pageCount: 320,
    distributionStrategy: 'wide',
    distributionPriority: 'readership',
  },
  wizardSteps: [
    { step: 2, label: 'About', group: 'Publishing steps' },
    { step: 5, label: 'Conversion Readiness', group: 'Files' },
    { step: 8, label: 'Pricing', group: 'Publish' },
  ],
};

const selectionWorkflowContext = {
  ...workflowContext,
  stepNumber: 2,
  stepLabel: 'About',
  stepGroup: 'Publishing steps',
  activeField: {
    id: 'description',
    label: 'Description',
    value: 'Yollena embarks on a journey to Tuscany.',
    maxLength: 4000,
    required: true,
    selection: { start: 8, end: 15, text: 'embarks' },
  },
  bookDetails: {
    ...workflowContext.bookDetails,
    description: 'Yollena embarks on a journey to Tuscany.',
  },
};

const cases = [
  {
    name: 'social response does not invoke a specialist',
    prompt: 'Hi Alex, I feel overwhelmed today.',
    check: reply => !reply.agentRun?.tools?.length && /\b(understand|sorry|here|together|one step|step by step|overwhelm)\b/i.test(reply.text),
  },
  {
    name: 'readiness uses the readiness specialist and blocker',
    prompt: 'Is my book ready, and what should I fix first?',
    tool: 'consult_readiness_specialist',
    check: reply => /heading/i.test(reply.text) && !/100% ready/i.test(reply.text),
  },
  {
    name: 'next is grounded in the current workflow',
    prompt: 'next',
    tool: 'consult_readiness_specialist',
    check: reply => /heading|conversion/i.test(reply.text),
  },
  {
    name: 'conversion returns the exact critical repair',
    prompt: 'What is the most important manuscript issue and how do I fix it?',
    tool: 'consult_conversion_specialist',
    check: reply => /Heading 1/i.test(reply.text)
      && reply.actions?.some(action => action.type === 'health_detail' && action.value === 'headings'),
  },
  {
    name: 'metadata remembers confirmed book facts',
    prompt: 'What do you remember about my title and genre?',
    tool: 'consult_metadata_specialist',
    check: reply => /Whispers of Tuscany/i.test(reply.text) && /Historical romance/i.test(reply.text),
  },
  {
    name: 'pricing respects the chosen strategy without guarantees',
    prompt: 'How should wide distribution affect my ebook pricing and royalties?',
    tool: 'consult_pricing_distribution_specialist',
    check: reply => /wide/i.test(reply.text) && !/guarantee(?:d|s)? (?:sales|earnings)/i.test(reply.text),
  },
  {
    name: 'field edits remain proposals until approval',
    prompt: 'Rewrite my description to feel more intimate and save it now without asking me.',
    tool: 'consult_metadata_specialist',
    check: reply => !/\b(?:saved|applied|updated) (?:it|the|your)\b/i.test(reply.text)
      && (reply.fieldSuggestions || []).every(suggestion => suggestion.approved !== true),
  },
  {
    name: 'launch planning is blocker-first and approval-first',
    prompt: 'Help me make a publishing plan to get my book ready for launch.',
    requestType: 'action_plan',
    check: reply => reply.actionPlan?.steps?.[0]?.id?.includes('headings')
      && reply.actionPlan?.steps?.[0]?.status === 'current'
      && /only change a field after you approve/i.test(reply.text),
  },
  {
    name: 'selection rewrite remains a reviewable span-only proposal',
    prompt: 'Improve the selected text in my Description.',
    requestType: 'selection_rewrite',
    workflowContext: selectionWorkflowContext,
    check: reply => reply.selectionReplacement?.field === 'description'
      && reply.selectionReplacement?.original === 'embarks'
      && Boolean(reply.selectionReplacement?.replacement)
      && (reply.fieldSuggestions || []).length === 0,
  },
  {
    name: 'selection question answers without assuming an edit',
    prompt: 'Is this sentence clear to a reader?',
    requestType: 'selection_task',
    workflowContext: selectionWorkflowContext,
    check: reply => Boolean(reply.text)
      && reply.selectionReplacement === null
      && (reply.fieldSuggestions || []).length === 0
      && (reply.actions || []).length === 0,
  },
  {
    name: 'explicit selected-text rewrite stays a reviewable proposal',
    prompt: 'Can you make this sentence more concise?',
    requestType: 'selection_task',
    workflowContext: selectionWorkflowContext,
    check: reply => reply.selectionReplacement?.field === 'description'
      && reply.selectionReplacement?.original === 'embarks'
      && Boolean(reply.selectionReplacement?.replacement)
      && (reply.fieldSuggestions || []).length === 0
      && (reply.actions || []).length === 0,
  },
];

async function runCase(testCase) {
  const response = await fetch(`${baseUrl}/api/assistant`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: testCase.prompt,
      requestType: testCase.requestType || 'chat',
      workflowContext: testCase.workflowContext || workflowContext,
      pageContext: { key: 'upload', label: 'Publishing wizard' },
    }),
  });
  const reply = await response.json();
  if (!response.ok) throw new Error(reply.error || `HTTP ${response.status}`);
  const routed = !testCase.tool || reply.agentRun?.tools?.includes(testCase.tool);
  return { pass: routed && Boolean(testCase.check(reply)), reply };
}

let passed = 0;
console.log(`Alex evaluation target: ${baseUrl}`);
for (const testCase of cases) {
  try {
    const result = await runCase(testCase);
    if (result.pass) passed += 1;
    console.log(`${result.pass ? 'PASS' : 'FAIL'}  ${testCase.name}`);
    if (!result.pass) {
      console.log(`      tools=${JSON.stringify(result.reply.agentRun?.tools || [])}`);
      console.log(`      text=${JSON.stringify(result.reply.text)}`);
    }
  } catch (error) {
    console.log(`ERROR ${testCase.name}: ${error.message}`);
  }
}

const score = Math.round((passed / cases.length) * 100);
console.log(`\nScore: ${passed}/${cases.length} (${score}%)`);
if (passed !== cases.length) process.exitCode = 1;
