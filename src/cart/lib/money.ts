import type { CurrencyCode } from '../types';

/** Currencies without minor units need a different divisor. */
const ZERO_DECIMAL: ReadonlySet<string> = new Set(['JPY']);

const formatterCache = new Map<string, Intl.NumberFormat>();

/** Default locale for currency formatting, kept explicit so output doesn't
 *  drift with the host machine/browser's default locale. */
const DEFAULT_LOCALE = 'en-US';

function getFormatter(currency: CurrencyCode, locale: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Render minor units as a localised currency string.
 * `formatMoney(1299, 'USD') === '$12.99'`
 */
export function formatMoney(
  cents: number,
  currency: CurrencyCode,
  locale: string = DEFAULT_LOCALE,
): string {
  const divisor = ZERO_DECIMAL.has(currency) ? 1 : 100;
  return getFormatter(currency, locale).format(cents / divisor);
}

/** Total for a single line. Integer maths only. */
export function lineTotalCents(unitPriceCents: number, quantity: number): number {
  return unitPriceCents * quantity;
}
