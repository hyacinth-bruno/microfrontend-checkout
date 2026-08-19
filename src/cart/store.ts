'use client';

import { useSyncExternalStore } from 'react';
import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
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

type StoredState = Omit<
  CartState,
  | 'addItem'
  | 'setQuantity'
  | 'incrementQuantity'
  | 'removeItem'
  | 'undoRemove'
  | 'clear'
  | 'openCart'
  | 'closeCart'
  | 'toggleCart'
>;

const initialState: StoredState = { lines: [], isOpen: false, hydrated: false, lastRemoved: null };

/* ------------------------------------------------------------------ *
 * Redux slice — plain actions + a plain reducer (no Immer draft       *
 * mutation) so every branch is a mechanical mirror of the pure        *
 * `cart-logic` helpers: same bail-out-on-no-change behaviour, so      *
 * `state.lines` keeps its reference when nothing actually changed.    *
 * ------------------------------------------------------------------ */

const addItemAction = createAction<{ product: Product; quantity: number }>('cart/addItem');
const setQuantityAction = createAction<{ lineId: string; quantity: number }>('cart/setQuantity');
const incrementQuantityAction = createAction<{ lineId: string; delta: number }>('cart/incrementQuantity');
const removeItemAction = createAction<{ lineId: string }>('cart/removeItem');
const undoRemoveAction = createAction('cart/undoRemove');
const clearAction = createAction('cart/clear');
const openCartAction = createAction('cart/openCart');
const closeCartAction = createAction('cart/closeCart');
const toggleCartAction = createAction('cart/toggleCart');
const hydrateAction = createAction<CartLine[]>('cart/hydrate');
/** Generic escape hatch mirroring Zustand's `setState` (used by tests + UndoToast's auto-dismiss). */
const patchAction = createAction<Partial<StoredState>>('cart/patch');

// `createReducer`'s builder narrows `action.payload` per case for free, and
// every case below *returns* a full replacement object rather than mutating
// `state` — so Immer treats it as a plain swap, no draft-proxy caveats.
const cartReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(addItemAction, (state, action) => {
      const { product, quantity } = action.payload;
      const lines = addLine(state.lines, product, quantity);
      return lines === state.lines ? state : { ...state, lines, lastRemoved: null };
    })
    .addCase(setQuantityAction, (state, action) => {
      const { lineId, quantity } = action.payload;
      const index = state.lines.findIndex((line) => line.id === lineId);
      const lines = setLineQuantity(state.lines, lineId, quantity);
      if (lines === state.lines) return state;
      // Quantity driven to zero === removal, so keep undo working.
      const removed = index !== -1 && lines.length < state.lines.length
        ? { line: state.lines[index], index }
        : null;
      return { ...state, lines, lastRemoved: removed };
    })
    .addCase(incrementQuantityAction, (state, action) => {
      const { lineId, delta } = action.payload;
      const index = state.lines.findIndex((line) => line.id === lineId);
      const lines = incrementLineQuantity(state.lines, lineId, delta);
      if (lines === state.lines) return state;
      const removed = index !== -1 && lines.length < state.lines.length
        ? { line: state.lines[index], index }
        : null;
      return { ...state, lines, lastRemoved: removed };
    })
    .addCase(removeItemAction, (state, action) => {
      const { lineId } = action.payload;
      const index = state.lines.findIndex((line) => line.id === lineId);
      if (index === -1) return state;
      return {
        ...state,
        lines: removeLine(state.lines, lineId),
        lastRemoved: { line: state.lines[index], index },
      };
    })
    .addCase(undoRemoveAction, (state) => {
      const snapshot = state.lastRemoved;
      if (!snapshot) return state;
      if (state.lines.some((line) => line.id === snapshot.line.id)) {
        return { ...state, lastRemoved: null };
      }
      const lines = state.lines.slice();
      // Put it back exactly where it was rather than at the end.
      lines.splice(Math.min(snapshot.index, lines.length), 0, snapshot.line);
      return { ...state, lines, lastRemoved: null };
    })
    .addCase(clearAction, (state) => ({ ...state, lines: [], lastRemoved: null }))
    .addCase(openCartAction, (state) => (state.isOpen ? state : { ...state, isOpen: true }))
    .addCase(closeCartAction, (state) => (state.isOpen ? { ...state, isOpen: false } : state))
    .addCase(toggleCartAction, (state) => ({ ...state, isOpen: !state.isOpen }))
    .addCase(hydrateAction, (state, action) => ({ ...state, lines: action.payload, hydrated: true }))
    .addCase(patchAction, (state, action) => ({ ...state, ...action.payload }));
});

export const store = configureStore({ reducer: cartReducer });

/* ------------------------------------------------------------------ *
 * Action dispatchers — stable, module-scoped function references so   *
 * they double as the store's "actions" without being rebuilt on every *
 * render (that stability is what keeps `useSyncExternalStore` happy). *
 * ------------------------------------------------------------------ */

const addItem: CartState['addItem'] = (product, quantity = 1) =>
  store.dispatch(addItemAction({ product, quantity }));
const setQuantity: CartState['setQuantity'] = (lineId, quantity) =>
  store.dispatch(setQuantityAction({ lineId, quantity }));
const incrementQuantity: CartState['incrementQuantity'] = (lineId, delta) =>
  store.dispatch(incrementQuantityAction({ lineId, delta }));
const removeItem: CartState['removeItem'] = (lineId) => store.dispatch(removeItemAction({ lineId }));
const undoRemove: CartState['undoRemove'] = () => store.dispatch(undoRemoveAction());
const clear: CartState['clear'] = () => store.dispatch(clearAction());
const openCart: CartState['openCart'] = () => store.dispatch(openCartAction());
const closeCart: CartState['closeCart'] = () => store.dispatch(closeCartAction());
const toggleCart: CartState['toggleCart'] = () => store.dispatch(toggleCartAction());

const actions = {
  addItem,
  setQuantity,
  incrementQuantity,
  removeItem,
  undoRemove,
  clear,
  openCart,
  closeCart,
  toggleCart,
} as const;

/* ------------------------------------------------------------------ *
 * `useCartStore` — a Zustand-shaped facade over the Redux store, so   *
 * every component below keeps calling `useCartStore(selector)` with   *
 * no provider. That's what lets a host mount `<CartRoot />` (or a bare *
 * `<CartTrigger />`) anywhere without wrapping its tree in <Provider>. *
 * ------------------------------------------------------------------ */

let cachedBase: StoredState | null = null;
let cachedSnapshot: CartState | null = null;

function getSnapshot(): CartState {
  const base = store.getState();
  if (cachedSnapshot && cachedBase === base) return cachedSnapshot;
  cachedBase = base;
  cachedSnapshot = { ...base, ...actions };
  return cachedSnapshot;
}

// Stable across the module's lifetime: server render and pre-hydration client
// render must agree, or React flags a hydration mismatch.
const serverSnapshot: CartState = { ...initialState, ...actions };
function getServerSnapshot(): CartState {
  return serverSnapshot;
}

export function useCartStore<T = CartState>(
  selector: (state: CartState) => T = (state) => state as unknown as T,
): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

useCartStore.getState = getSnapshot;
/** Generic partial-merge escape hatch, same contract as Zustand's `setState`. */
useCartStore.setState = (partial: Partial<StoredState>) => store.dispatch(patchAction(partial));
/** Fires on every dispatch, `(state, prevState)`, same contract as Zustand's `subscribe`. */
useCartStore.subscribe = (listener: (state: CartState, prevState: CartState) => void): (() => void) => {
  let prev = getSnapshot();
  return store.subscribe(() => {
    const curr = getSnapshot();
    if (curr === prev) return;
    const previous = prev;
    prev = curr;
    listener(curr, previous);
  });
};

/* ------------------------------------------------------------------ *
 * Persistence — hand-rolled (no `redux-persist`) so the on-disk shape *
 * stays byte-compatible with the previous Zustand `persist` middleware *
 * (`{ version, state: { lines } }`), and hydration stays an explicit, *
 * client-only step: the server (and the first client render) always   *
 * start from `initialState`, never touching `localStorage` at import  *
 * time, so SSR stays crash-free (see `CartHydrationGate`/`CartRoot`). *
 * ------------------------------------------------------------------ */

let lastPersistedLines: CartLine[] | null = null;
store.subscribe(() => {
  const state = store.getState();
  if (state.lines === lastPersistedLines) return;
  lastPersistedLines = state.lines;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { lines: state.lines } }),
    );
  } catch (error) {
    console.error('[cart] failed to persist basket', error);
  }
});

function rehydrate(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  let lines: CartLine[] = [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { lines?: unknown } } | null;
      lines = sanitizeLines(parsed?.state?.lines);
    }
  } catch (error) {
    console.error('[cart] failed to restore basket', error);
  }
  store.dispatch(hydrateAction(lines));
  return Promise.resolve();
}

useCartStore.persist = { rehydrate };

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

/** Stable grab-bag of actions: a module-level constant, so it never triggers a re-render. */
export const useCartActions = () => useCartStore(() => actions);

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
