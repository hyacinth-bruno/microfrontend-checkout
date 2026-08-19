'use client';

import { useEffect, useRef, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
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
      fullWidth
      startIcon={justAdded ? <CheckIcon fontSize="small" /> : undefined}
      className={className}
    >
      {label}
    </Button>
  );
}
