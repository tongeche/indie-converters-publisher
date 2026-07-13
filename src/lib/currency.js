export const DISPLAY_CURRENCY = 'EUR';

const DISPLAY_LOCALE = 'en-IE';

const EUR_RATES = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  KES: 0.0071,
};

export function convertToDisplayCurrency(amount, sourceCurrency = 'USD') {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return null;
  const rate = EUR_RATES[String(sourceCurrency || 'USD').toUpperCase()] || EUR_RATES.USD;
  return numeric * rate;
}

export function formatDisplayMoney(amount, sourceCurrency = 'USD') {
  const converted = convertToDisplayCurrency(amount, sourceCurrency);
  if (converted == null) return '';
  return new Intl.NumberFormat(DISPLAY_LOCALE, {
    style: 'currency',
    currency: DISPLAY_CURRENCY,
  }).format(converted);
}

export function isConvertedCurrency(sourceCurrency = 'USD') {
  return String(sourceCurrency || 'USD').toUpperCase() !== DISPLAY_CURRENCY;
}

