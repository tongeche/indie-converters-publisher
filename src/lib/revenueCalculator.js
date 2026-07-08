export const PRICE_MIN = 0.99;
export const PRICE_MAX = 24.99;
export const SALES_MIN = 0;
export const SALES_MAX = 1000;
export const PRINTING_COST = 3.65;

export const FORMAT_OPTIONS = [
  { id: 'ebook', label: 'Ebook' },
  { id: 'paperback', label: 'Paperback' },
  { id: 'both', label: 'Both' },
];

// Mirrors RETAILER_OPTIONS in src/components/RetailerLinksEditor.jsx — the
// actual retailers authors link to from the upload wizard, not a generic
// traditional-publishing platform list.
export const PLATFORM_OPTIONS = [
  { id: 'own', label: 'My Own Website', formats: ['ebook', 'paperback'] },
  { id: 'gumroad', label: 'Gumroad', formats: ['ebook', 'paperback'] },
  { id: 'payhip', label: 'Payhip', formats: ['ebook', 'paperback'] },
  { id: 'amazon', label: 'Amazon', formats: ['ebook', 'paperback'] },
  { id: 'bookshop', label: 'Bookshop.org', formats: ['paperback'] },
  { id: 'other', label: 'Other', formats: ['ebook', 'paperback'] },
];

export function platformSupportsFormat(platformId, format) {
  const platform = PLATFORM_OPTIONS.find(p => p.id === platformId);
  if (!platform) return false;
  if (format === 'both') return platform.formats.includes('ebook') && platform.formats.includes('paperback');
  return platform.formats.includes(format);
}

export function firstSupportedPlatform(format) {
  return PLATFORM_OPTIONS.find(p => platformSupportsFormat(p.id, format))?.id || 'amazon';
}

// Own-site sales still pass through a card processor (assume Stripe-like
// rates) even though the platform itself takes no cut.
const OWN_SITE_PROCESSING_RATE = 0.029;
const OWN_SITE_PROCESSING_FLAT = 0.30;

function royaltyRate(platformId, format, price) {
  switch (platformId) {
    case 'own':
      return 1.0; // no platform cut — payment processing is modeled separately below
    case 'gumroad':
      return 0.90; // Gumroad: flat 10% fee, all-inclusive of payment processing
    case 'payhip':
      return 0.92; // Payhip free plan: ~5% fee + payment processing, combined estimate
    case 'amazon':
      if (format === 'paperback') return 0.60; // KDP paperback royalty
      return price >= 2.99 && price <= 9.99 ? 0.70 : 0.35; // KDP ebook tiers
    case 'bookshop':
      return 0.45; // paperback only, via wholesale/distributor economics (e.g. IngramSpark)
    case 'other':
      return format === 'paperback' ? 0.50 : 0.65; // generic estimate — actual terms vary by platform
    default:
      return 0;
  }
}

function royaltyPerCopy(platformId, format, price) {
  const rate = royaltyRate(platformId, format, price);
  const platformCut = price * (1 - rate);
  const processingFee = platformId === 'own' ? (price * OWN_SITE_PROCESSING_RATE) + OWN_SITE_PROCESSING_FLAT : 0;
  const printingCost = format === 'paperback' ? PRINTING_COST : 0;
  const royalty = Math.max(0, (price * rate) - processingFee - printingCost);
  return { rate, platformCut, processingFee, printingCost, royalty };
}

export function calculateRevenue({ price, monthlySales, format, platformId }) {
  const safePrice = Math.min(PRICE_MAX, Math.max(PRICE_MIN, Number(price) || 0));
  const safeSales = Math.min(SALES_MAX, Math.max(SALES_MIN, Number(monthlySales) || 0));
  const platform = PLATFORM_OPTIONS.find(p => p.id === platformId) || PLATFORM_OPTIONS[0];

  if (format === 'both') {
    const ebookSales = Math.round(safeSales / 2);
    const paperbackSales = safeSales - ebookSales;
    const ebook = royaltyPerCopy(platform.id, 'ebook', safePrice);
    const paperback = royaltyPerCopy(platform.id, 'paperback', safePrice);
    const monthlyEarnings = (ebook.royalty * ebookSales) + (paperback.royalty * paperbackSales);

    return {
      platform,
      format,
      price: safePrice,
      monthlySales: safeSales,
      breakdown: [
        { label: 'Ebook', sales: ebookSales, ...ebook },
        { label: 'Paperback', sales: paperbackSales, ...paperback },
      ],
      monthlyEarnings,
      annualEarnings: monthlyEarnings * 12,
    };
  }

  const single = royaltyPerCopy(platform.id, format, safePrice);
  const monthlyEarnings = single.royalty * safeSales;

  return {
    platform,
    format,
    price: safePrice,
    monthlySales: safeSales,
    breakdown: [
      { label: format === 'paperback' ? 'Paperback' : 'Ebook', sales: safeSales, ...single },
    ],
    monthlyEarnings,
    annualEarnings: monthlyEarnings * 12,
  };
}

export function formatCurrency(value) {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(rate) {
  return `${Math.round(rate * 100)}%`;
}
