'use client';

import { useMemo } from 'react';
import { CartRoot, useCartStore } from '@/cart';
import { catalogue } from './catalogue';
import { getSuggestedProducts } from './suggestions';

/**
 * Wraps CartRoot with the host's own "you might also like" logic. Kept out
 * of page.tsx so the storefront shell can stay a server component — only
 * this piece needs to subscribe to live cart state.
 */
export function CartMount() {
  const lines = useCartStore((state) => state.lines);
  const suggestedProducts = useMemo(() => getSuggestedProducts(lines, catalogue), [lines]);

  return <CartRoot suggestedProducts={suggestedProducts} />;
}
