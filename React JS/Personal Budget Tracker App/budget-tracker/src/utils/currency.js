const CURRENCY_CONFIG = {
    INR: { code: 'INR', locale: 'en-IN', symbol: '₹', label: 'INR (₹)' },
    USD: { code: 'USD', locale: 'en-US', symbol: '$', label: 'USD ($)' },
    EUR: { code: 'EUR', locale: 'de-DE', symbol: '€', label: 'EUR (€)' }
};

export const normalizeCurrencyCode = (currencyCode) => {
    const code = String(currencyCode || '').toUpperCase();
    return CURRENCY_CONFIG[code] ? code : 'INR';
};

export const getCurrencyConfig = (currencyCode) => CURRENCY_CONFIG[normalizeCurrencyCode(currencyCode)];

export const getCurrencySymbol = (currencyCode) => getCurrencyConfig(currencyCode).symbol;

export const formatCurrency = (value, currencyCode, options = {}) => {
    const config = getCurrencyConfig(currencyCode);
    const amount = Number(value || 0);
    const safeAmount = Number.isFinite(amount) ? amount : 0;

    return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
    }).format(safeAmount);
};

export const CURRENCY_OPTIONS = Object.values(CURRENCY_CONFIG).map((item) => ({
    value: item.code,
    label: item.label
}));
