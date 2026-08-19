'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { CartLine, CartTotals, CurrencyCode, Product } from './types';
import {
  DEFAULT_CURRENCY,
  addLine,
  calculateTotals,
  incrementLineQuantity,
  removeLine,
  sanitizeLines,
  setLineQuantity,
} from './lib/cart-logic';

export const CART_STORAGE_KEY = 'cart-mfe:v1';
export const CART_CHANGE_EVENT = 'cart:change';

/** A removed line held in memory so the "Undo" affordance can restore it. */
interface RemovedSnapshot {
  line: CartLine;
  index: number;
}

export interface CartState {
  lines: CartLine[];
  /** Drawer open/closed lives here too: the host's header button toggles it. */
  isOpen: boolean;
  /** False until the persisted cart has been read — prevents SSR mismatch. */
  hydrated: boolean;
  lastRemoved: RemovedSnapshot | null;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  incrementQuantity: (lineId: string, delta: number) => void;
  removeItem: (lineId: string) => void;
  undoRemove: () => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

/**
 * Zustand store.
 *
 * Why Zustand for a micro-frontend cart:
 * - the store is a module singleton, so the host app (or another MFE) can
 *   `useCartStore.getState().addItem(...)` without being wrapped in a provider;
 * - subscriptions are selector-based, so typing in one quantity input does not
 *   re-render the whole product grid;
 * - `persist` gives us session-surviving baskets in ~5 lines;
 * - it is ~1kB gzipped, which matters when you ship a bundle into someone
 *   else's page.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      hydrated: false,
      lastRemoved: null,

      addItem: (product, quantity = 1) =>
        set((state) => {
          const lines = addLine(state.lines, product, quantity);
          return lines === state.lines ? state : { lines, lastRemoved: null };
        }),

      setQuantity: (lineId, quantity) =>
        set((state) => {
          const index = state.lines.findIndex((line) => line.id === lineId);
          const lines = setLineQuantity(state.lines, lineId, quantity);
          if (lines === state.lines) return state;
          // Quantity driven to zero === removal, so keep undo working.
          const removed = index !== -1 && lines.length < state.lines.length
            ? { line: state.lines[index], index }
            : null;
          return { lines, lastRemoved: removed };
        }),

      incrementQuantity: (lineId, delta) =>
        set((state) => {
          const index = state.lines.findIndex((line) => line.id === lineId);
          const lines = incrementLineQuantity(state.lines, lineId, delta);
          if (lines === state.lines) return state;
          const removed = index !== -1 && lines.length < state.lines.length
            ? { line: state.lines[index], index }
            : null;
          return { lines, lastRemoved: removed };
        }),

      removeItem: (lineId) =>
        set((state) => {
          const index = state.lines.findIndex((line) => line.id === lineId);
          if (index === -1) return state;
          return {
            lines: removeLine(state.lines, lineId),
            lastRemoved: { line: state.lines[index], index },
          };
        }),

      undoRemove: () =>
        set((state) => {
          const snapshot = state.lastRemoved;
          if (!snapshot) return state;
          if (state.lines.some((line) => line.id === snapshot.line.id)) {
            return { lastRemoved: null };
          }
          const lines = state.lines.slice();
          // Put it back exactly where it was rather than at the end.
          lines.splice(Math.min(snapshot.index, lines.length), 0, snapshot.line);
          return { lines, lastRemoved: null };
        }),

      clear: () => set({ lines: [], lastRemoved: null }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the basket is durable. Drawer state and undo are ephemeral.
      partialize: (state) => ({ lines: state.lines }),
      // Hydrate manually from an effect so server HTML and first client render
      // always match (see `CartHydrationGate`).
      skipHydration: true,
      merge: (persisted, current) => ({
        ...current,
        lines: sanitizeLines((persisted as { lines?: unknown } | undefined)?.lines),
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.error('[cart] failed to restore basket', error);
        useCartStore.setState({ hydrated: true });
      },
    },
  ),
);

/* ------------------------------------------------------------------ *
 * Selectors — exported so components subscribe to the smallest slice. *
 * ------------------------------------------------------------------ */

export const selectLines = (state: CartState) => state.lines;
export const selectIsOpen = (state: CartState) => state.isOpen;
export const selectHydrated = (state: CartState) => state.hydrated;

/**
 * Totals are *derived*, never stored, so the subtotal can never drift out of
 * sync with the lines. `calculateTotals` is cheap, but we memoise on the lines
 * reference to keep the returned object stable between unrelated renders.
 */
let totalsCache: { lines: CartLine[]; totals: CartTotals } | null = null;
export function selectTotals(state: CartState): CartTotals {
  if (totalsCache && totalsCache.lines === state.lines) return totalsCache.totals;
  const totals = calculateTotals(state.lines, DEFAULT_CURRENCY);
  totalsCache = { lines: state.lines, totals };
  return totals;
}

/** Convenience hook: the live subtotal / item count. */
export const useCartTotals = (): CartTotals => useCartStore(selectTotals);

/** Subscribe to a single line without re-rendering on sibling updates. */
export const useCartLine = (lineId: string): CartLine | undefined =>
  useCartStore((state) => state.lines.find((line) => line.id === lineId));

/** Quantity of a product already in the basket (0 when absent). */
export const useLineQuantity = (productId: string): number =>
  useCartStore((state) => state.lines.find((line) => line.id === productId)?.quantity ?? 0);

/** Stable grab-bag of actions; `useShallow` stops it causing re-renders. */
export const useCartActions = () =>
  useCartStore(
    useShallow((state) => ({
      addItem: state.addItem,
      setQuantity: state.setQuantity,
      incrementQuantity: state.incrementQuantity,
      removeItem: state.removeItem,
      undoRemove: state.undoRemove,
      clear: state.clear,
      openCart: state.openCart,
      closeCart: state.closeCart,
      toggleCart: state.toggleCart,
    })),
  );

/* ------------------------------------------------- *
 * Host-application integration (the "micro" bit).   *
 * ------------------------------------------------- */

export interface CartChangeDetail {
  lines: CartLine[];
  totals: CartTotals;
}

/**
 * Imperative API for a host that is not written in React (or is on a different
 * React version). Attached to `window.cartMFE` by `mountCart`/`CartRoot`.
 */
export const cartApi = {
  getState: () => {
    const state = useCartStore.getState();
    return { lines: state.lines, totals: calculateTotals(state.lines) };
  },
  addItem: (product: Product, quantity = 1) => useCartStore.getState().addItem(product, quantity),
  setQuantity: (lineId: string, quantity: number) =>
    useCartStore.getState().setQuantity(lineId, quantity),
  removeItem: (lineId: string) => useCartStore.getState().removeItem(lineId),
  clear: () => useCartStore.getState().clear(),
  open: () => useCartStore.getState().openCart(),
  close: () => useCartStore.getState().closeCart(),
  /** Returns an unsubscribe function. */
  subscribe: (listener: (detail: CartChangeDetail) => void) =>
    useCartStore.subscribe((state, prev) => {
      if (state.lines === prev.lines) return;
      listener({ lines: state.lines, totals: calculateTotals(state.lines) });
    }),
};

let sideEffectsInstalled = false;

/**
 * Installed once on the client:
 * 1. broadcasts `cart:change` DOM events so non-React hosts can listen;
 * 2. syncs the basket across browser tabs.
 */
export function installCartSideEffects(): () => void {
  if (typeof window === 'undefined' || sideEffectsInstalled) return () => {};
  sideEffectsInstalled = true;

  const unsubscribe = useCartStore.subscribe((state, prev) => {
    if (state.lines === prev.lines) return;
    window.dispatchEvent(
      new CustomEvent<CartChangeDetail>(CART_CHANGE_EVENT, {
        detail: { lines: state.lines, totals: calculateTotals(state.lines) },
      }),
    );
  });

  const onStorage = (event: StorageEvent) => {
    if (event.key !== CART_STORAGE_KEY) return;
    // Another tab changed the basket — pull its version in.
    void useCartStore.persist.rehydrate();
  };
  window.addEventListener('storage', onStorage);

  return () => {
    unsubscribe();
    window.removeEventListener('storage', onStorage);
    sideEffectsInstalled = false;
  };
}

export type { CartLine, CartTotals, CurrencyCode, Product };
