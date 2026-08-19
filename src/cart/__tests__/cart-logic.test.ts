import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_QUANTITY,
  addLine,
  calculateTotals,
  clampQuantity,
  incrementLineQuantity,
  removeLine,
  sanitizeLines,
  setLineQuantity,
} from '../lib/cart-logic';
import { formatMoney } from '../lib/money';
import type { CartLine, Product } from '../types';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'sku-1',
  name: 'AeroPress Go',
  priceCents: 3995,
  currency: 'USD',
  ...overrides,
});

describe('addLine', () => {
  it('adds a new line', () => {
    const lines = addLine([], product());
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ id: 'sku-1', quantity: 1, unitPriceCents: 3995 });
  });

  it('merges quantity instead of duplicating the line', () => {
    const lines = addLine(addLine([], product()), product(), 2);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });

  it('keeps the original position when merging', () => {
    let lines = addLine([], product({ id: 'a' }));
    lines = addLine(lines, product({ id: 'b' }));
    lines = addLine(lines, product({ id: 'a' }));
    expect(lines.map((line) => line.id)).toEqual(['a', 'b']);
  });

  it('caps at the available stock', () => {
    const lines = addLine([], product({ maxQuantity: 2 }), 10);
    expect(lines[0].quantity).toBe(2);
  });

  it('returns the same reference when already at the cap (no pointless re-render)', () => {
    const lines = addLine([], product({ maxQuantity: 1 }));
    expect(addLine(lines, product({ maxQuantity: 1 }))).toBe(lines);
  });

  it('ignores sold-out and non-positive quantities', () => {
    expect(addLine([], product({ maxQuantity: 0 }))).toHaveLength(0);
    expect(addLine([], product(), 0)).toHaveLength(0);
    expect(addLine([], product(), -3)).toHaveLength(0);
  });

  it('defaults maxQuantity when the catalogue omits it', () => {
    expect(addLine([], product())[0].maxQuantity).toBe(DEFAULT_MAX_QUANTITY);
  });
});

describe('setLineQuantity', () => {
  const base = addLine([], product({ maxQuantity: 5 }));

  it('updates the quantity', () => {
    expect(setLineQuantity(base, 'sku-1', 4)[0].quantity).toBe(4);
  });

  it('clamps to stock', () => {
    expect(setLineQuantity(base, 'sku-1', 99)[0].quantity).toBe(5);
  });

  it('removes the line at zero or below', () => {
    expect(setLineQuantity(base, 'sku-1', 0)).toHaveLength(0);
    expect(setLineQuantity(base, 'sku-1', -2)).toHaveLength(0);
  });

  it('truncates floats and survives NaN', () => {
    expect(setLineQuantity(base, 'sku-1', 2.7)[0].quantity).toBe(2);
    expect(setLineQuantity(base, 'sku-1', Number.NaN)[0].quantity).toBe(1);
  });

  it('is a no-op for an unknown line', () => {
    expect(setLineQuantity(base, 'nope', 3)).toBe(base);
  });
});

describe('incrementLineQuantity', () => {
  it('steps up and down', () => {
    let lines = addLine([], product());
    lines = incrementLineQuantity(lines, 'sku-1', 1);
    expect(lines[0].quantity).toBe(2);
    lines = incrementLineQuantity(lines, 'sku-1', -1);
    expect(lines[0].quantity).toBe(1);
  });

  it('removes the line when decremented past one', () => {
    const lines = addLine([], product());
    expect(incrementLineQuantity(lines, 'sku-1', -1)).toHaveLength(0);
  });
});

describe('removeLine', () => {
  it('removes only the target line', () => {
    const lines = addLine(addLine([], product({ id: 'a' })), product({ id: 'b' }));
    expect(removeLine(lines, 'a').map((line) => line.id)).toEqual(['b']);
  });

  it('returns the same reference when nothing matched', () => {
    const lines = addLine([], product());
    expect(removeLine(lines, 'ghost')).toBe(lines);
  });
});

describe('calculateTotals', () => {
  it('sums quantities and money in integer cents', () => {
    let lines = addLine([], product({ id: 'a', priceCents: 1850 }), 3); // 55.50
    lines = addLine(lines, product({ id: 'b', priceCents: 999 }), 2); // 19.98
    const totals = calculateTotals(lines);
    expect(totals).toEqual({
      lineCount: 2,
      itemCount: 5,
      subtotalCents: 7548,
      currency: 'USD',
    });
    expect(formatMoney(totals.subtotalCents, totals.currency)).toBe('$75.48');
  });

  it('has no floating point drift on prices that break naive float maths', () => {
    // 0.1 + 0.2 in dollars
    const lines = addLine(addLine([], product({ id: 'a', priceCents: 10 })), product({ id: 'b', priceCents: 20 }));
    expect(calculateTotals(lines).subtotalCents).toBe(30);
  });

  it('reports an empty cart', () => {
    expect(calculateTotals([])).toMatchObject({ itemCount: 0, subtotalCents: 0, lineCount: 0 });
  });
});

describe('clampQuantity', () => {
  it.each([
    [5, 10, 5],
    [50, 10, 10],
    [0, 10, 0],
    [-4, 10, 0],
    [Number.NaN, 10, 1],
    [Number.POSITIVE_INFINITY, 10, 1],
    [3.9, 10, 3],
  ])('clamp(%s, max %s) === %s', (quantity, max, expected) => {
    expect(clampQuantity(quantity, max)).toBe(expected);
  });
});

describe('sanitizeLines (persisted/host data)', () => {
  it('drops malformed entries and de-duplicates ids', () => {
    const restored = sanitizeLines([
      null,
      'nonsense',
      { id: 'ok', name: 'Fine', unitPriceCents: 100, quantity: 2, currency: 'USD', maxQuantity: 9 },
      { id: 'ok', name: 'Duplicate', unitPriceCents: 100, quantity: 1 },
      { id: 'bad-price', unitPriceCents: 'free', quantity: 1 },
      { id: 'bad-qty', unitPriceCents: 100, quantity: 0 },
      { quantity: 1, unitPriceCents: 100 },
    ] as unknown[]);
    expect(restored.map((line) => line.id)).toEqual(['ok']);
    expect(restored[0]).toMatchObject({ name: 'Fine', quantity: 2 });
  });

  it('re-clamps a quantity that now exceeds stock', () => {
    const [line] = sanitizeLines([
      { id: 'a', name: 'A', unitPriceCents: 100, quantity: 50, maxQuantity: 3 },
    ] as Partial<CartLine>[]);
    expect(line.quantity).toBe(3);
  });

  it('returns an empty cart for garbage input', () => {
    expect(sanitizeLines(undefined)).toEqual([]);
    expect(sanitizeLines({ lines: [] })).toEqual([]);
  });
});

describe('formatMoney', () => {
  it('formats minor units', () => {
    expect(formatMoney(1299, 'USD')).toBe('$12.99');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
  });

  it('handles zero-decimal currencies', () => {
    expect(formatMoney(1200, 'JPY')).toBe('¥1,200');
  });
});
