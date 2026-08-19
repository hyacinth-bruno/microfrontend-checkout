'use client';

import { useEffect } from 'react';
import { cartApi, installCartSideEffects, useCartStore } from '../store';
import type { Product } from '../types';
import { CartDrawer } from './CartDrawer';

declare global {
  interface Window {
    cartMFE?: typeof cartApi;
  }
}

interface CartRootProps {
  onCheckout?: (subtotalCents: number) => void;
  /** Passed straight through to the drawer's upsell rail. See CartDrawer. */
  suggestedProducts?: Product[];
  /** Expose the imperative API on `window.cartMFE` for non-React hosts. */
  exposeGlobalApi?: boolean;
}

/**
 * Single mount point for the micro-frontend. Render it once, anywhere in the
 * host tree. Responsibilities:
 * - rehydrate the persisted basket on the client only (no SSR mismatch);
 * - install cross-tab sync + `cart:change` broadcasting;
 * - render the drawer.
 */
export function CartRoot({ onCheckout, suggestedProducts, exposeGlobalApi = true }: CartRootProps) {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    const uninstall = installCartSideEffects();
    if (exposeGlobalApi) window.cartMFE = cartApi;
    return () => {
      uninstall();
      if (exposeGlobalApi && window.cartMFE === cartApi) delete window.cartMFE;
    };
  }, [exposeGlobalApi]);

  return <CartDrawer onCheckout={onCheckout} suggestedProducts={suggestedProducts} />;
}
