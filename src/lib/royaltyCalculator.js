export const ROYALTY_ASSUMPTIONS = {
  currency: 'USD',
  lastReviewed: '2026-07-06',
  sources: [
    'Amazon KDP eBook royalties',
    'Amazon KDP paperback and hardcover royalties',
    'Amazon KDP print-cost tables',
    'Draft2Digital royalty guidance',
  ],
  indieConverters: {
    competitorFeeDiscount: 0.2,
    ebookStandardAuthorRate: 0.76,
    ebookLowPriceAuthorRate: 0.48,
    printStandardAuthorRate: 0.68,
    printLowPriceAuthorRate: 0.6,
  },
  kdp: {
    ebookHighRate: 0.7,
    ebookLowRate: 0.35,
    ebookHighRateMin: 2.99,
    ebookHighRateMax: 9.99,
    ebookDeliveryCostPerMb: 0.15,
    ebookEstimatedMb: 3,
    printHighRate: 0.6,
    printLowRate: 0.5,
    printHighRateMin: 9.99,
  },
  draft2Digital: {
    ebookAuthorRate: 0.6,
    printAuthorRate: 0.45,
  },
};

const PRINT_COSTS_US = {
  paperback: {
    regular: {
      short: { maxPages: 108, fixed: 2.3, perPage: 0 },
      long: { fixed: 1, perPage: 0.012 },
    },
    large: {
      short: { maxPages: 108, fixed: 2.84, perPage: 0 },
      long: { fixed: 1, perPage: 0.017 },
    },
  },
  hardcover: {
    regular: {
      short: { maxPages: 108, fixed: 6.8, perPage: 0 },
      long: { fixed: 5.65, perPage: 0.012 },
    },
    large: {
      short: { maxPages: 108, fixed: 7.49, perPage: 0 },
      long: { fixed: 5.65, perPage: 0.017 },
    },
  },
};

const LARGE_TRIM_IDS = new Set(['7x10', '8_5x11']);

export function parseRoyaltyPrice(value) {
  const price = Number.parseFloat(value);
  return Number.isFinite(price) && price > 0 ? price : 0;
}

export function formatRoyaltyMoney(value) {
  if (!Number.isFinite(value)) return '$0.00';
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function clampRoyalty(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function isLargeTrim(trimSize) {
  return LARGE_TRIM_IDS.has(trimSize);
}

export function estimatePrintCost({ format, pageCount, trimSize }) {
  const kind = format === 'Hardcover' ? 'hardcover' : 'paperback';
  const size = isLargeTrim(trimSize) ? 'large' : 'regular';
  const pages = Math.max(1, Number.parseInt(pageCount, 10) || 250);
  const costTable = PRINT_COSTS_US[kind][size];
  const tier = pages <= costTable.short.maxPages ? costTable.short : costTable.long;
  return {
    amount: tier.fixed + pages * tier.perPage,
    assumedPages: pages,
    size,
  };
}

function kdpEbookEstimate(price) {
  const isHighRate = price >= ROYALTY_ASSUMPTIONS.kdp.ebookHighRateMin
    && price <= ROYALTY_ASSUMPTIONS.kdp.ebookHighRateMax;
  const rate = isHighRate ? ROYALTY_ASSUMPTIONS.kdp.ebookHighRate : ROYALTY_ASSUMPTIONS.kdp.ebookLowRate;
  const deliveryCost = isHighRate
    ? ROYALTY_ASSUMPTIONS.kdp.ebookEstimatedMb * ROYALTY_ASSUMPTIONS.kdp.ebookDeliveryCostPerMb
    : 0;
  const royalty = isHighRate
    ? (price - deliveryCost) * rate
    : price * rate;

  return {
    id: 'kdp-ebook',
    channel: 'Amazon KDP',
    format: 'eBook',
    listPrice: price,
    authorEarnings: clampRoyalty(royalty),
    platformCosts: deliveryCost,
    costLabel: deliveryCost ? 'delivery' : 'included',
    authorRate: rate,
    note: isHighRate ? '70% tier, less estimated delivery cost' : '35% tier estimate',
  };
}

function indieEbookEstimate(price) {
  const comparableKdpFee = price >= ROYALTY_ASSUMPTIONS.kdp.ebookHighRateMin
    && price <= ROYALTY_ASSUMPTIONS.kdp.ebookHighRateMax
      ? 1 - ROYALTY_ASSUMPTIONS.kdp.ebookHighRate
      : 1 - ROYALTY_ASSUMPTIONS.kdp.ebookLowRate;
  const indieFee = comparableKdpFee * (1 - ROYALTY_ASSUMPTIONS.indieConverters.competitorFeeDiscount);
  const authorRate = 1 - indieFee;

  return {
    id: 'ic-ebook',
    channel: 'Indie Converters direct',
    format: 'eBook',
    listPrice: price,
    authorEarnings: clampRoyalty(price * authorRate),
    platformCosts: price * indieFee,
    costLabel: 'platform fee',
    authorRate,
    featured: true,
    note: 'Platform fee modeled 20% lower than KDP comparable fee',
  };
}

function d2dEbookEstimate(price) {
  const rate = ROYALTY_ASSUMPTIONS.draft2Digital.ebookAuthorRate;
  return {
    id: 'd2d-ebook',
    channel: 'Draft2Digital wide',
    format: 'eBook',
    listPrice: price,
    authorEarnings: clampRoyalty(price * rate),
    platformCosts: price * (1 - rate),
    costLabel: 'retailer share',
    authorRate: rate,
    note: 'Broad retail estimate after retailer and aggregator share',
  };
}

function printEstimate({ channel, format, price, pageCount, trimSize, authorRate, note, featured = false }) {
  const printCost = estimatePrintCost({ format, pageCount, trimSize });
  const royalty = price * authorRate - printCost.amount;
  return {
    id: `${channel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${format.toLowerCase()}`,
    channel,
    format,
    listPrice: price,
    authorEarnings: clampRoyalty(royalty),
    rawAuthorEarnings: royalty,
    platformCosts: price * (1 - authorRate),
    productionCost: printCost.amount,
    authorRate,
    assumedPages: printCost.assumedPages,
    featured,
    note,
  };
}

function printMinimum(authorRate, printCost) {
  return printCost / authorRate;
}

export function calculateRoyaltyEstimates({
  price,
  isFree = false,
  formats = [],
  pageCount,
  trimSize,
  distributionChannels = [],
}) {
  const listPrice = parseRoyaltyPrice(price);
  const selectedFormats = formats.length ? formats : ['eBook'];
  const hasWideDistribution = distributionChannels.some(id => id !== 'amazon');
  const hasAmazon = distributionChannels.includes('amazon');
  const warnings = [];

  if (isFree) {
    return {
      listPrice: 0,
      estimates: [],
      warnings: ['Free books are great for sampling and launch strategy, but royalty earnings are $0 until a paid price is set.'],
      best: null,
      assumedPages: Number.parseInt(pageCount, 10) || null,
    };
  }

  if (!listPrice) {
    return {
      listPrice: 0,
      estimates: [],
      warnings: ['Enter a list price to preview royalties.'],
      best: null,
      assumedPages: Number.parseInt(pageCount, 10) || null,
    };
  }

  const estimates = [];

  if (selectedFormats.includes('eBook')) {
    estimates.push(indieEbookEstimate(listPrice));
    if (hasAmazon) estimates.push(kdpEbookEstimate(listPrice));
    if (hasWideDistribution) estimates.push(d2dEbookEstimate(listPrice));

    if (listPrice < ROYALTY_ASSUMPTIONS.kdp.ebookHighRateMin || listPrice > ROYALTY_ASSUMPTIONS.kdp.ebookHighRateMax) {
      warnings.push('Amazon KDP eBook 70% royalty is usually price-limited; this price may fall into the 35% tier on KDP.');
    }
  }

  selectedFormats
    .filter(format => ['Paperback', 'Hardcover'].includes(format))
    .forEach(format => {
      const printCost = estimatePrintCost({ format, pageCount, trimSize });
      const kdpRate = listPrice >= ROYALTY_ASSUMPTIONS.kdp.printHighRateMin
        ? ROYALTY_ASSUMPTIONS.kdp.printHighRate
        : ROYALTY_ASSUMPTIONS.kdp.printLowRate;
      const indieRate = listPrice >= ROYALTY_ASSUMPTIONS.kdp.printHighRateMin
        ? ROYALTY_ASSUMPTIONS.indieConverters.printStandardAuthorRate
        : ROYALTY_ASSUMPTIONS.indieConverters.printLowPriceAuthorRate;

      estimates.push(printEstimate({
        channel: 'Indie Converters direct',
        format,
        price: listPrice,
        pageCount,
        trimSize,
        authorRate: indieRate,
        featured: true,
        note: 'Direct print fee modeled 20% lower than KDP comparable fee',
      }));

      if (hasAmazon) {
        estimates.push(printEstimate({
          channel: 'Amazon KDP',
          format,
          price: listPrice,
          pageCount,
          trimSize,
          authorRate: kdpRate,
          note: `${Math.round(kdpRate * 100)}% royalty minus estimated print cost`,
        }));
      }

      if (hasWideDistribution) {
        estimates.push(printEstimate({
          channel: 'Draft2Digital print',
          format,
          price: listPrice,
          pageCount,
          trimSize,
          authorRate: ROYALTY_ASSUMPTIONS.draft2Digital.printAuthorRate,
          note: 'Estimated 45% of list price minus print cost',
        }));
      }

      const indieMinimum = printMinimum(indieRate, printCost.amount);
      const kdpMinimum = printMinimum(kdpRate, printCost.amount);
      if (listPrice < indieMinimum || listPrice < kdpMinimum) {
        warnings.push(`${format} may be priced too low for print. Estimated minimum: ${formatRoyaltyMoney(Math.min(indieMinimum, kdpMinimum))} direct, ${formatRoyaltyMoney(kdpMinimum)} KDP.`);
      }
    });

  if (!Number.parseInt(pageCount, 10) && selectedFormats.some(format => ['Paperback', 'Hardcover'].includes(format))) {
    warnings.push('Print estimates use a 250-page fallback until the manuscript page estimate is available.');
  }

  const best = estimates.reduce((winner, current) => (
    !winner || current.authorEarnings > winner.authorEarnings ? current : winner
  ), null);

  return {
    listPrice,
    estimates,
    warnings,
    best,
    assumedPages: Number.parseInt(pageCount, 10) || 250,
  };
}

const PRICING_OBJECTIVES = {
  readership: { low: [0.99, 9.99, 15.99], balanced: [2.99, 12.99, 19.99], high: [4.99, 14.99, 24.99] },
  earnings: { low: [2.99, 12.99, 19.99], balanced: [5.99, 16.99, 24.99], high: [9.99, 19.99, 29.99] },
  launch: { low: [0.99, 9.99, 15.99], balanced: [1.99, 11.99, 17.99], high: [2.99, 13.99, 19.99] },
  series: { low: [0.99, 9.99, 15.99], balanced: [2.99, 11.99, 17.99], high: [4.99, 13.99, 20.99] },
  premium: { low: [6.99, 17.99, 27.99], balanced: [9.99, 24.99, 34.99], high: [14.99, 32.99, 44.99] },
};

export function buildPricingCoachScenarios({ objective, formats = [], pageCount, trimSize, distributionChannels = [] }) {
  const strategy = PRICING_OBJECTIVES[objective] || PRICING_OBJECTIVES.readership;
  const selectedFormats = formats.length ? formats : ['eBook'];
  const formatIndex = format => format === 'Hardcover' ? 2 : format === 'Paperback' ? 1 : 0;
  return Object.entries(strategy).map(([id, prices]) => {
    const comparisons = selectedFormats.flatMap(format => {
      let price = prices[formatIndex(format)];
      if (format === 'Audiobook') {
        return [{ channel: 'Retailer-specific', format, listPrice: price, platformFees: null, printCost: 0, estimatedRoyalty: null, note: 'Narration and retailer contract costs are not available in this estimate.' }];
      }
      if (format === 'Paperback' || format === 'Hardcover') {
        const cost = estimatePrintCost({ format, pageCount, trimSize }).amount;
        price = Math.max(price, Math.ceil((cost / 0.45 + 1) * 100) / 100);
      }
      const estimate = calculateRoyaltyEstimates({ price, formats: [format], pageCount, trimSize, distributionChannels });
      return estimate.estimates.map(item => ({
        channel: item.channel,
        format,
        listPrice: price,
        platformFees: item.platformCosts || 0,
        printCost: item.productionCost || 0,
        estimatedRoyalty: item.authorEarnings,
        note: item.note,
      }));
    });
    return {
      id,
      label: id === 'low' ? 'Accessible' : id === 'balanced' ? 'Balanced' : 'Higher-value',
      comparisons,
    };
  });
}
