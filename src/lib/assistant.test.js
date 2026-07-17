import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPublishingSocialReply,
  createWelcomeMessage,
  getAssistantActionMessage,
  isHumanSupportIntent,
  requestAssistantReply,
  sanitizeAssistantHistory,
} from './assistant.js';

test('Alex responds socially before routing a publishing task', () => {
  const context = { stepLabel: 'Book details', activeField: { label: 'Title' } };
  assert.equal(
    buildPublishingSocialReply('Hi', context).text,
    'Hi — good to see you. How are you feeling about title today?',
  );
  assert.match(buildPublishingSocialReply("I'm overwhelmed", context).text, /I understand/i);
  assert.match(buildPublishingSocialReply('I finally finished the manuscript', context).text, /congratulations/i);
  assert.equal(buildPublishingSocialReply('Help me price my paperback', context), null);
});

test('converts assistant-style pill questions into natural user replies', () => {
  assert.equal(getAssistantActionMessage({
    type: 'ask',
    label: 'Ask about publishing steps',
    value: 'What specific step are you working on?',
  }), 'Tell me about publishing steps.');
  assert.equal(getAssistantActionMessage({
    type: 'ask',
    label: 'Work on my book',
    value: 'Help me publish my book',
  }), 'Help me publish my book');
});

test('introduces Jane to anonymous and signed-in visitors', () => {
  assert.match(createWelcomeMessage(null).text, /I’m Jane/i);
  assert.match(
    createWelcomeMessage({ email: 'maya@example.com' }).text,
    /^Hi maya, I’m Jane/i,
  );
});

test('keeps knowledge replies focused and exposes the next step as an action', async () => {
  const { buildAssistantReply } = await import('./assistant.js');
  const reply = buildAssistantReply('How do I publish a book?');

  assert.doesNotMatch(reply.text, /Related:|Next step:/);
  assert.deepEqual(reply.actions, [
    { label: 'Start an upload', type: 'navigate', value: '/upload' },
  ]);
});

test('responds naturally when the visitor is not asking for anything yet', async () => {
  const { buildAssistantReply } = await import('./assistant.js');
  const reply = buildAssistantReply('nothing really');

  assert.equal(reply.text, 'No pressure. Have a look around, and I’ll be here when you need me.');
  assert.deepEqual(reply.actions.map(action => action.label), ['Browse books', 'Explore publishing']);
});

test('recognises common requests for a human', () => {
  [
    'Can I speak to a person?',
    'can I talk to someone',
    'I need customer service',
    'Could someone contact me?',
    'Please connect me with a representative',
    'I need help from support',
    'I want to escalate this',
    'Live chat please',
    'I need a person to help',
    'i need to takl to human real human',
    'Can I get an actual person?',
    'I want a human agent',
  ].forEach(message => assert.equal(isHumanSupportIntent(message), true, message));
});

test('does not treat ordinary assistant questions as human handoff requests', () => {
  assert.equal(isHumanSupportIntent('Can you help me price my book?'), false);
  assert.equal(isHumanSupportIntent('How do I publish a manuscript?'), false);
  assert.equal(isHumanSupportIntent('Find books about customer service'), false);
  assert.equal(isHumanSupportIntent('Can I chat with a literary agent?'), false);
});

test('keeps a bounded history of ordinary messages and drops private handoff UI', () => {
  const history = [
    { id: 'welcome', role: 'assistant', text: 'Welcome' },
    { role: 'user', text: 'oldest normal message' },
    { role: 'assistant', text: 'first reply' },
    { role: 'assistant', text: 'Would you like human help?', kind: 'human-offer' },
    { role: 'user', text: 'Private Name', handoffFlow: true },
    { role: 'user', text: 'private@example.com', handoffSensitive: true },
    ...Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 ? 'assistant' : 'user',
      text: `normal ${index}`,
    })),
  ];

  assert.deepEqual(
    sanitizeAssistantHistory(history),
    Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 ? 'assistant' : 'user',
      content: `normal ${index}`,
    })),
  );
});

test('does not duplicate the current user message in assistant history', () => {
  assert.deepEqual(
    sanitizeAssistantHistory([
      { role: 'user', text: 'What formats do you support?' },
      { role: 'assistant', text: 'Print and ebook.' },
      { role: 'user', text: 'How about EPUB?' },
    ], 'How about EPUB?'),
    [
      { role: 'user', content: 'What formats do you support?' },
      { role: 'assistant', content: 'Print and ebook.' },
    ],
  );
});

test('requestAssistantReply forwards only sanitized recent history', async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ text: 'A contextual reply.' }),
    };
  };

  try {
    await requestAssistantReply({
      message: 'What should I do next?',
      history: [
        { role: 'user', text: 'I uploaded my manuscript.' },
        { role: 'assistant', text: 'Next, check the preview.' },
        { role: 'user', text: 'private@example.com', handoffFlow: true },
        { role: 'user', text: 'What should I do next?' },
      ],
    });

    assert.deepEqual(requestBody.history, [
      { role: 'user', content: 'I uploaded my manuscript.' },
      { role: 'assistant', content: 'Next, check the preview.' },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('publishing workflow forwards field context and keeps a longer session history', async () => {
  const originalFetch = globalThis.fetch;
  let requestBody;
  globalThis.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({ text: 'A field-aware reply.', fieldSuggestions: [] }),
    };
  };

  try {
    const workflowContext = {
      mode: 'publishing_upload',
      stepLabel: 'About',
      activeField: { id: 'description', label: 'Description', value: 'Draft copy' },
    };
    await requestAssistantReply({
      message: 'Improve this.',
      workflowContext,
      history: Array.from({ length: 18 }, (_, index) => ({
        role: index % 2 ? 'assistant' : 'user',
        text: `message ${index}`,
      })),
    });

    assert.deepEqual(requestBody.workflowContext, workflowContext);
    assert.equal(requestBody.history.length, 16);
    assert.equal(requestBody.history.at(-1).content, 'message 17');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('returns a server-approved selection replacement contract unchanged for review', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      text: 'I prepared a focused edit for the selected text.',
      selectionReplacement: {
        field: 'description',
        start: 8,
        end: 15,
        original: 'embarks',
        replacement: 'sets out',
        reason: 'Uses a more active verb.',
      },
    }),
  });

  try {
    const reply = await requestAssistantReply({
      message: 'Improve the selected text.',
      requestType: 'selection_rewrite',
      workflowContext: {
        mode: 'publishing_upload',
        activeField: {
          id: 'description',
          label: 'Description',
          value: 'Yollena embarks on a journey to Tuscany.',
          selection: { start: 8, end: 15, text: 'embarks' },
        },
      },
    });

    assert.equal(reply.selectionReplacement?.replacement, 'sets out');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
