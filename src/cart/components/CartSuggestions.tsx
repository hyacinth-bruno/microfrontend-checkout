'use client';

import { formatMoney } from '../lib/money';
import { selectLines, useCartStore } from '../store';
import type { Product } from '../types';
import { AddToCartButton } from './AddToCartButton';

interface CartSuggestionsProps {
  products: Product[];
}

/**
 * "You might also like" — a compact horizontal rail under the cart lines.
 * `products` is whatever the host decides is relevant; this component's own
 * job is just to not suggest something that's already in the basket.
 */
export function CartSuggestions({ products }: CartSuggestionsProps) {
  const lines = useCartStore(selectLines);
  const inCart = new Set(lines.map((line) => line.id));
  const visible = products.filter((product) => !inCart.has(product.id)).slice(0, 4);

  if (visible.length === 0) return null;

  return (
    <div
      data-testid="cart-suggestions"
      className="border-t border-slate-100 px-5 py-4 dark:border-slate-700"
    >
      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        You might also like
      </h3>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1">
        {visible.map((product) => (
          <li key={product.id} data-testid={`suggestion-${product.id}`} className="w-32 shrink-0">
            <div className="aspect-square overflow-hidden rounded-control bg-slate-100 dark:bg-slate-700">
              {product.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- MFE must run against arbitrary host image CDNs
                <img
                  src={product.imageUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <p className="mt-2 truncate text-xs font-medium text-slate-900 dark:text-white">
              {product.name}
            </p>
            <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {formatMoney(product.priceCents, product.currency)}
            </p>
            <AddToCartButton product={product} className="mt-2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
