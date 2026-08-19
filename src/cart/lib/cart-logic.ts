import type { CartLine, CartTotals, CurrencyCode, Product } from '../types';
import { lineTotalCents } from './money';

/** Hard ceiling per line when the catalogue does not supply stock info. */
export const DEFAULT_MAX_QUANTITY = 99;
export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

/**
 * Pure cart operations.
 *
 * Everything here is a plain `(lines, args) => lines` function: no React, no
 * store, no side effects. That keeps the rules of the basket testable in
 * microseconds and means the UI layer (or the state library) can be swapped
 * without touching business logic.
 *
 * All functions are immutable and return the *same array reference* when
 * nothing changed, so React/Zustand can bail out of re-rendering.
 */

export function clampQuantity(quantity: number, maxQuantity: number): number {
  // Guard against NaN/Infinity/floats arriving from a typed input or a host app.
  if (!Number.isFinite(quantity)) return 1;
  const whole = Math.trunc(quantity);
  if (whole < 1) return 0; // 0 is the signal to remove the line
  return Math.min(whole, maxQuantity);
}

export function addLine(lines: CartLine[], product: Product, quantity = 1): CartLine[] {
  const maxQuantity = product.maxQuantity ?? DEFAULT_MAX_QUANTITY;
  // Out of stock / non-purchasable: nothing to do.
  if (maxQuantity < 1) return lines;
  const requested = Math.trunc(Number.isFinite(quantity) ? quantity : 1);
  if (requested < 1) return lines;

  const index = lines.findIndex((line) => line.id === product.id);
  // Already in the basket: merge quantities rather than creating a second line.
  if (index !== -1) {
    const existing = lines[index];
    const nextQuantity = Math.min(existing.quantity + requested, maxQuantity);
    if (nextQuantity === existing.quantity) return lines; // already at stock cap
    const next = lines.slice();
    // Keep the original `addedAt` so the line does not jump position.
    next[index] = { ...existing, quantity: nextQuantity, maxQuantity };
    return next;
  }

  const line: CartLine = {
    id: product.id,
    name: product.name,
    variant: product.variant,
    imageUrl: product.imageUrl,
    unitPriceCents: product.priceCents,
    currency: product.currency,
    quantity: Math.min(requested, maxQuantity),
    maxQuantity,
    addedAt: Date.now(),
  };
  return [...lines, line];
}

/** Absolute set (used by the numeric input). Quantity <= 0 removes the line. */
export function setLineQuantity(lines: CartLine[], lineId: string, quantity: number): CartLine[] {
  const index = lines.findIndex((line) => line.id === lineId);
  if (index === -1) return lines;
  const existing = lines[index];
  const nextQuantity = clampQuantity(quantity, existing.maxQuantity);
  if (nextQuantity === 0) return removeLine(lines, lineId);
  if (nextQuantity === existing.quantity) return lines;
  const next = lines.slice();
  next[index] = { ...existing, quantity: nextQuantity };
  return next;
}

/** Relative change (used by the +/- stepper). */
export function incrementLineQuantity(lines: CartLine[], lineId: string, delta: number): CartLine[] {
  const existing = lines.find((line) => line.id === lineId);
  if (!existing) return lines;
  return setLineQuantity(lines, lineId, existing.quantity + delta);
}

export function removeLine(lines: CartLine[], lineId: string): CartLine[] {
  const next = lines.filter((line) => line.id !== lineId);
  return next.length === lines.length ? lines : next;
}

/**
 * Derive the totals. Called on every render of the summary, hence kept O(n)
 * and allocation-free.
 */
export function calculateTotals(
  lines: CartLine[],
  fallbackCurrency: CurrencyCode = DEFAULT_CURRENCY,
): CartTotals {
  let itemCount = 0;
  let subtotalCents = 0;
  for (const line of lines) {
    itemCount += line.quantity;
    subtotalCents += lineTotalCents(line.unitPriceCents, line.quantity);
  }
  return {
    lineCount: lines.length,
    itemCount,
    subtotalCents,
    currency: lines[0]?.currency ?? fallbackCurrency,
  };
}

/**
 * Defensive de-serialisation for anything restored from storage or handed over
 * by a host app. Persisted carts outlive deploys: a line written by last
 * month's bundle must never be able to crash today's.
 */
export function sanitizeLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const lines: CartLine[] = [];
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null) continue;
    const candidate = raw as Partial<CartLine>;
    const id = typeof candidate.id === 'string' ? candidate.id : null;
    if (!id || seen.has(id)) continue;
    const unitPriceCents = Number(candidate.unitPriceCents);
    const quantity = Number(candidate.quantity);
    const maxQuantity = Number(candidate.maxQuantity);
    if (!Number.isFinite(unitPriceCents) || unitPriceCents < 0) continue;
    if (!Number.isFinite(quantity) || quantity < 1) continue;
    const safeMax = Number.isFinite(maxQuantity) && maxQuantity > 0
      ? Math.trunc(maxQuantity)
      : DEFAULT_MAX_QUANTITY;
    seen.add(id);
    lines.push({
      id,
      name: typeof candidate.name === 'string' ? candidate.name : 'Unknown item',
      variant: typeof candidate.variant === 'string' ? candidate.variant : undefined,
      imageUrl: typeof candidate.imageUrl === 'string' ? candidate.imageUrl : undefined,
      unitPriceCents: Math.trunc(unitPriceCents),
      currency: (candidate.currency ?? DEFAULT_CURRENCY) as CurrencyCode,
      quantity: Math.min(Math.trunc(quantity), safeMax),
      maxQuantity: safeMax,
      addedAt: Number.isFinite(Number(candidate.addedAt)) ? Number(candidate.addedAt) : Date.now(),
    });
  }
  return lines;
}
