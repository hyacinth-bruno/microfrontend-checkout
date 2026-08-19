'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_MAX_QUANTITY } from '../lib/cart-logic';
import { useCartActions, useLineQuantity } from '../store';
import type { Product } from '../types';
import { Button } from './Button';

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  /** Slide the basket open after adding. Default: false (less disruptive). */
  openCartOnAdd?: boolean;
  className?: string;
}

/**
 * Adds a product, then flips to a transient "Added" state so the customer gets
 * confirmation without a modal interrupting their browsing.
 */
export function AddToCartButton({
  product,
  quantity = 1,
  openCartOnAdd = false,
  className = '',
}: AddToCartButtonProps) {
  const { addItem, openCart } = useCartActions();
  const inCart = useLineQuantity(product.id);
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Same fallback the store uses, so the button disables exactly when the
  // store would stop accepting items.
  const maxQuantity = product.maxQuantity ?? DEFAULT_MAX_QUANTITY;
  const soldOut = maxQuantity < 1;
  const atMax = inCart >= maxQuantity;

  const handleClick = () => {
    addItem(product, quantity);
    if (openCartOnAdd) openCart();
    setJustAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), 1600);
  };

  const label = soldOut ? 'Sold out' : atMax ? 'Max in cart' : justAdded ? 'Added to cart' : 'Add to cart';

  return (
    <Button
      variant={justAdded ? 'success' : 'primary'}
      onClick={handleClick}
      disabled={soldOut || atMax}
      aria-label={`Add ${product.name} to cart`}
      data-state={justAdded ? 'added' : 'idle'}
      className={`w-full px-4 py-2.5 font-semibold active:scale-[0.98] disabled:active:scale-100 ${className}`}
    >
      {justAdded && (
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-6.5 6.5a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 1 1 1.06-1.06L6.75 10.19l5.97-5.97a.75.75 0 0 1 1.06 0" />
        </svg>
      )}
      {label}
    </Button>
  );
}
