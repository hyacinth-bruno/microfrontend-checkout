import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CART_CHANGE_EVENT,
  CART_STORAGE_KEY,
  type CartChangeDetail,
  cartApi,
  installCartSideEffects,
  useCartStore,
} from '../store';
import type { Product } from '../types';

const beans: Product = {
  id: 'sku-beans',
  name: 'Single Origin Beans',
  priceCents: 1850,
  currency: 'USD',
  maxQuantity: 24,
};

const teardowns: Array<() => void> = [];
afterEach(() => {
  while (teardowns.length) teardowns.pop()?.();
});

describe('persistence', () => {
  it('writes the basket to localStorage', async () => {
    useCartStore.getState().addItem(beans, 2);
    // our persist layer writes synchronously for a sync storage engine.
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.lines).toHaveLength(1);
    expect(parsed.state.lines[0]).toMatchObject({ id: 'sku-beans', quantity: 2 });
    expect(parsed.version).toBe(1);
  });

  it('does not persist ephemeral UI state', () => {
    useCartStore.getState().openCart();
    useCartStore.getState().addItem(beans);
    useCartStore.getState().removeItem('sku-beans');
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) as string);
    expect(parsed.state).not.toHaveProperty('isOpen');
    expect(parsed.state).not.toHaveProperty('lastRemoved');
  });

  it('restores a persisted basket on rehydrate', async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          lines: [
            {
              id: 'sku-beans',
              name: 'Single Origin Beans',
              unitPriceCents: 1850,
              currency: 'USD',
              quantity: 3,
              maxQuantity: 24,
              addedAt: 1,
            },
          ],
        },
      }),
    );
    await useCartStore.persist.rehydrate();
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().hydrated).toBe(true);
    expect(cartApi.getState().totals.subtotalCents).toBe(5550);
  });

  it('survives a corrupted storage payload instead of crashing the host page', async () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { lines: [{ id: 'x' }, 42, null] } }),
    );
    await useCartStore.persist.rehydrate();
    expect(useCartStore.getState().lines).toEqual([]);
    expect(useCartStore.getState().hydrated).toBe(true);
  });
});

describe('host integration', () => {
  it('exposes an imperative API for non-React hosts', () => {
    cartApi.addItem(beans, 2);
    expect(cartApi.getState().totals).toMatchObject({ itemCount: 2, subtotalCents: 3700 });
    cartApi.setQuantity('sku-beans', 5);
    expect(cartApi.getState().totals.subtotalCents).toBe(9250);
    cartApi.removeItem('sku-beans');
    expect(cartApi.getState().lines).toEqual([]);
    expect(cartApi.getState().totals.subtotalCents).toBe(0);
  });

  it('notifies subscribers with lines and totals', () => {
    const listener = vi.fn();
    teardowns.push(cartApi.subscribe(listener));
    cartApi.addItem(beans);
    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0][0] as CartChangeDetail;
    expect(detail.totals.subtotalCents).toBe(1850);
    expect(detail.lines[0].id).toBe('sku-beans');
  });

  it('does not fire change events for UI-only updates', () => {
    const listener = vi.fn();
    teardowns.push(cartApi.subscribe(listener));
    cartApi.open();
    cartApi.close();
    expect(listener).not.toHaveBeenCalled();
  });

  it('broadcasts a DOM CustomEvent so non-JS-framework hosts can listen', () => {
    teardowns.push(installCartSideEffects());
    const handler = vi.fn();
    window.addEventListener(CART_CHANGE_EVENT, handler as EventListener);
    teardowns.push(() => window.removeEventListener(CART_CHANGE_EVENT, handler as EventListener));
    cartApi.addItem(beans, 3);
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<CartChangeDetail>;
    expect(event.detail.totals).toMatchObject({ itemCount: 3, subtotalCents: 5550 });
  });

  it('pulls in changes made in another browser tab', async () => {
    teardowns.push(installCartSideEffects());
    // Simulate tab B writing a basket, then notifying tab A.
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          lines: [
            {
              id: 'sku-kettle',
              name: 'Gooseneck Kettle',
              unitPriceCents: 8900,
              currency: 'USD',
              quantity: 1,
              maxQuantity: 6,
              addedAt: 2,
            },
          ],
        },
      }),
    );
    window.dispatchEvent(new StorageEvent('storage', { key: CART_STORAGE_KEY }));
    await vi.waitFor(() => {
      expect(useCartStore.getState().lines.map((line) => line.id)).toEqual(['sku-kettle']);
    });
  });

  it('ignores storage events for unrelated keys', async () => {
    teardowns.push(installCartSideEffects());
    useCartStore.getState().addItem(beans);
    window.dispatchEvent(new StorageEvent('storage', { key: 'some-other-app' }));
    expect(useCartStore.getState().lines).toHaveLength(1);
  });
});
