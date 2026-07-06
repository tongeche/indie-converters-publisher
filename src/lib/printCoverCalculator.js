export const COVER_DPI = 300;
export const COVER_BLEED_IN = 0.125;
export const COVER_SAFE_MARGIN_IN = 0.25;
export const SPINE_SAFE_MARGIN_IN = 0.0625;
export const BARCODE_WIDTH_IN = 2;
export const BARCODE_HEIGHT_IN = 1.2;
export const BARCODE_MARGIN_IN = 0.25;

export const TRIM_SIZE_OPTIONS = [
  { id: '5x8', label: '5 x 8 in', width: 5, height: 8, note: 'Compact fiction' },
  { id: '5.5x8.5', label: '5.5 x 8.5 in', width: 5.5, height: 8.5, note: 'Literary fiction, memoir' },
  { id: '6x9', label: '6 x 9 in', width: 6, height: 9, note: 'General trade paperback' },
  { id: '7x10', label: '7 x 10 in', width: 7, height: 10, note: 'Technical books, workbooks' },
  { id: '8.5x11', label: '8.5 x 11 in', width: 8.5, height: 11, note: 'Manuals, workbooks' },
  { id: 'custom', label: 'Custom', width: 6, height: 9, note: 'Enter width and height' },
];

export const INTERIOR_OPTIONS = [
  { id: 'blackWhite', label: 'Black and white' },
  { id: 'standardColor', label: 'Standard color' },
  { id: 'premiumColor', label: 'Premium color' },
];

export const PAPER_OPTIONS = [
  { id: 'white', label: 'White paper', interiors: ['blackWhite', 'standardColor', 'premiumColor'] },
  { id: 'cream', label: 'Cream paper', interiors: ['blackWhite'] },
  { id: 'groundwood', label: 'Groundwood paper', interiors: ['blackWhite'] },
];

const SPINE_FACTORS = {
  blackWhite: {
    white: 0.002252,
    cream: 0.0025,
    groundwood: 0.002252,
  },
  standardColor: {
    white: 0.002252,
  },
  premiumColor: {
    white: 0.002347,
  },
};

function num(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safePositive(value, fallback) {
  const parsed = num(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

export function roundInches(value, places = 3) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatInches(value, places = 3) {
  return `${roundInches(value, places).toFixed(places)} in`;
}

export function getSpineFactor(interiorType, paperType) {
  return SPINE_FACTORS[interiorType]?.[paperType] || SPINE_FACTORS.blackWhite.white;
}

export function getCompatiblePaperOptions(interiorType) {
  return PAPER_OPTIONS.filter(paper => paper.interiors.includes(interiorType));
}

function buildPanels({ trimWidth, trimHeight, spineWidth, bleed, readingDirection }) {
  const backFirst = readingDirection !== 'rtl';
  const leftPanel = {
    id: backFirst ? 'back' : 'front',
    label: backFirst ? 'Back cover' : 'Front cover',
    x: bleed,
    y: bleed,
    width: trimWidth,
    height: trimHeight,
  };
  const spinePanel = {
    id: 'spine',
    label: 'Spine',
    x: bleed + trimWidth,
    y: bleed,
    width: spineWidth,
    height: trimHeight,
  };
  const rightPanel = {
    id: backFirst ? 'front' : 'back',
    label: backFirst ? 'Front cover' : 'Back cover',
    x: bleed + trimWidth + spineWidth,
    y: bleed,
    width: trimWidth,
    height: trimHeight,
  };

  return [leftPanel, spinePanel, rightPanel];
}

function buildSafeAreas({ panels }) {
  return panels.flatMap(panel => {
    if (panel.id === 'spine') {
      const safeWidth = Math.max(panel.width - (SPINE_SAFE_MARGIN_IN * 2), 0);
      return [{
        id: 'spine-safe',
        label: 'Spine safe area',
        x: panel.x + SPINE_SAFE_MARGIN_IN,
        y: panel.y + COVER_SAFE_MARGIN_IN,
        width: safeWidth,
        height: Math.max(panel.height - (COVER_SAFE_MARGIN_IN * 2), 0),
      }];
    }

    return [{
      id: `${panel.id}-safe`,
      label: `${panel.label} safe area`,
      x: panel.x + COVER_SAFE_MARGIN_IN,
      y: panel.y + COVER_SAFE_MARGIN_IN,
      width: Math.max(panel.width - (COVER_SAFE_MARGIN_IN * 2), 0),
      height: Math.max(panel.height - (COVER_SAFE_MARGIN_IN * 2), 0),
    }];
  });
}

function buildBarcodeArea({ panels, readingDirection }) {
  const backPanel = panels.find(panel => panel.id === 'back');
  if (!backPanel) return null;
  const x = readingDirection === 'rtl'
    ? backPanel.x + BARCODE_MARGIN_IN
    : backPanel.x + backPanel.width - BARCODE_WIDTH_IN - BARCODE_MARGIN_IN;

  return {
    id: 'barcode',
    label: 'Barcode area',
    x,
    y: backPanel.y + backPanel.height - BARCODE_HEIGHT_IN - BARCODE_MARGIN_IN,
    width: BARCODE_WIDTH_IN,
    height: BARCODE_HEIGHT_IN,
  };
}

export function calculatePrintCover(input = {}) {
  const bindingType = input.bindingType || 'paperback';
  const trimWidth = safePositive(input.trimWidth, 6);
  const trimHeight = safePositive(input.trimHeight, 9);
  const pageCount = Math.max(0, Math.round(num(input.pageCount, 0)));
  const interiorType = input.interiorType || 'blackWhite';
  const paperType = input.paperType || 'white';
  const readingDirection = input.readingDirection === 'rtl' ? 'rtl' : 'ltr';
  const bleed = COVER_BLEED_IN;
  const spineFactor = getSpineFactor(interiorType, paperType);
  const spineWidth = pageCount * spineFactor;
  const fullCoverWidth = (trimWidth * 2) + spineWidth + (bleed * 2);
  const fullCoverHeight = trimHeight + (bleed * 2);
  const pixelWidth = Math.round(fullCoverWidth * COVER_DPI);
  const pixelHeight = Math.round(fullCoverHeight * COVER_DPI);
  const panels = buildPanels({ trimWidth, trimHeight, spineWidth, bleed, readingDirection });
  const safeAreas = buildSafeAreas({ panels });
  const barcodeArea = buildBarcodeArea({ panels, readingDirection });
  const pageLimits = bindingType === 'hardcover'
    ? { min: 76, max: 550, label: 'hardcover' }
    : { min: 24, max: 830, label: 'paperback' };
  const warnings = [];

  if (bindingType !== 'paperback') {
    warnings.push('Hardcover wrap dimensions can vary by printer and case type. Use paperback mode unless your printer provides exact hardcover specs.');
  }

  if (pageCount > 0 && pageCount < 79) {
    warnings.push('Do not include spine text. KDP may reject covers with spine text under 79 pages.');
  }

  if (pageCount > 0 && pageCount < pageLimits.min) {
    warnings.push(`This page count is below the common KDP ${pageLimits.label} minimum of ${pageLimits.min} pages.`);
  }

  if (pageCount > pageLimits.max) {
    warnings.push(`This page count is above the common KDP ${pageLimits.label} maximum of ${pageLimits.max} pages. Check current KDP limits for the selected trim and interior.`);
  }

  if (paperType === 'groundwood') {
    warnings.push('Groundwood uses the white-paper spine factor here. Confirm exact paper thickness with your print provider before final export.');
  }

  return {
    bindingType,
    trimWidth,
    trimHeight,
    pageCount,
    interiorType,
    paperType,
    readingDirection,
    bleed,
    safeMargin: COVER_SAFE_MARGIN_IN,
    spineSafeMargin: SPINE_SAFE_MARGIN_IN,
    barcodeArea,
    spineFactor,
    spineWidth,
    fullCoverWidth,
    fullCoverHeight,
    pixelWidth,
    pixelHeight,
    panels,
    safeAreas,
    warnings,
  };
}

export function copyableCoverSummary(result) {
  return [
    `Full cover: ${formatInches(result.fullCoverWidth)} x ${formatInches(result.fullCoverHeight)}`,
    `Spine: ${formatInches(result.spineWidth)}`,
    `Bleed: ${formatInches(result.bleed)}`,
    `300 DPI export: ${result.pixelWidth} x ${result.pixelHeight}px`,
  ].join('\n');
}
