import assert from 'node:assert/strict';
import test from 'node:test';
import { ALEX_SPECIALIST_ROUTES, routeAlexSpecialist } from './alexRouting.js';

const cases = [
  ['Review my title, description, genre and keywords', 'metadata'],
  ['Suggest BISAC categories for my book', 'metadata'],
  ['Why did my EPUB health check fail?', 'conversion'],
  ['How do I fix the chapter headings?', 'conversion'],
  ['Compare wide distribution with Amazon exclusivity', 'pricing'],
  ['How will print cost affect my royalty?', 'pricing'],
  ['Is my book ready to publish?', 'readiness'],
  ['What should I fix first?', 'readiness'],
  ['next', 'readiness'],
];

for (const [prompt, route] of cases) {
  test(`routes “${prompt}” to ${route}`, () => {
    assert.equal(routeAlexSpecialist(prompt), ALEX_SPECIALIST_ROUTES[route]);
  });
}

test('answers social conversation directly', () => {
  assert.equal(routeAlexSpecialist('Hi Alex, I feel overwhelmed today.'), null);
});

test('uses current conversion page context for ambiguous issue questions', () => {
  assert.equal(
    routeAlexSpecialist('What issues need attention?', { stepLabel: 'Conversion Readiness' }),
    ALEX_SPECIALIST_ROUTES.conversion,
  );
});
