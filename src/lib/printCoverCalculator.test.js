import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePrintCover,
  copyableCoverSummary,
  getCompatiblePaperOptions,
  getSpineFactor,
} from './printCoverCalculator.js';

test('calculates the KDP-style paperback acceptance example', () => {
  const result = calculatePrintCover({
    bindingType: 'paperback',
    trimWidth: 6,
    trimHeight: 9,
    interiorType: 'blackWhite',
    paperType: 'white',
    pageCount: 220,
    readingDirection: 'ltr',
  });

  assert.equal(result.spineWidth, 0.49544);
  assert.equal(result.fullCoverWidth, 12.74544);
  assert.equal(result.fullCoverHeight, 9.25);
  assert.equal(result.pixelWidth, 3824);
  assert.equal(result.pixelHeight, 2775);
});

test('uses cream paper spine factor for black and white interiors', () => {
  const result = calculatePrintCover({
    trimWidth: 5.5,
    trimHeight: 8.5,
    interiorType: 'blackWhite',
    paperType: 'cream',
    pageCount: 200,
  });

  assert.equal(getSpineFactor('blackWhite', 'cream'), 0.0025);
  assert.equal(result.spineWidth, 0.5);
  assert.equal(result.fullCoverWidth, 11.75);
  assert.equal(result.fullCoverHeight, 8.75);
});

test('warns when page count is below KDP spine text threshold', () => {
  const result = calculatePrintCover({
    trimWidth: 6,
    trimHeight: 9,
    pageCount: 78,
  });

  assert.ok(result.warnings.some(warning => warning.includes('Do not include spine text')));
});

test('supports right-to-left cover panel ordering', () => {
  const result = calculatePrintCover({
    trimWidth: 6,
    trimHeight: 9,
    pageCount: 220,
    readingDirection: 'rtl',
  });

  assert.equal(result.panels[0].id, 'front');
  assert.equal(result.panels[1].id, 'spine');
  assert.equal(result.panels[2].id, 'back');
  assert.equal(result.barcodeArea.x, result.panels[2].x + 0.25);
});

test('filters compatible paper options by interior type', () => {
  assert.deepEqual(
    getCompatiblePaperOptions('premiumColor').map(paper => paper.id),
    ['white'],
  );
});

test('builds copyable summary text', () => {
  const result = calculatePrintCover({
    trimWidth: 6,
    trimHeight: 9,
    pageCount: 220,
  });

  assert.match(copyableCoverSummary(result), /Full cover: 12\.745 in x 9\.250 in/);
  assert.match(copyableCoverSummary(result), /300 DPI export: 3824 x 2775px/);
});
