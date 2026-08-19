'use client';

import { memo } from 'react';
import { formatMoney, lineTotalCents } from '../lib/money';
import { useCartActions } from '../store';
import type { CartLine } from '../types';
import { QuantityStepper } from './QuantityStepper';

interface CartLineItemProps {
  line: CartLine;
}

/**
 * One row of the basket. Memoised: updating line A must not re-render line B.
 * Actions come from the store (stable references), so the memo actually holds.
 */
export const CartLineItem = memo(function CartLineItem({ line }: CartLineItemProps) {
  const { setQuantity, removeItem } = useCartActions();
  const total = lineTotalCents(line.unitPriceCents, line.quantity);
  const atMax = line.quantity >= line.maxQuantity;

  return (
    <li className="flex gap-4 py-5" data-testid={`cart-line-${line.id}`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-control bg-slate-100 ring-1 ring-slate-900/5 dark:bg-slate-700 dark:ring-white/10">
        {line.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- MFE must run against arbitrary host image CDNs
          <img
            src={line.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="grid h-full w-full place-items-center text-slate-300 dark:text-slate-500">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor">
              <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1m1 2v8.3l3.6-3.2 3.2 2.9 3.7-3.4L19 14.4V7zm11.5 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-slate-900 dark:text-white">{line.name}</h3>
            {line.variant && (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{line.variant}</p>
            )}
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {formatMoney(line.unitPriceCents, line.currency)} each
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-slate-900 tabular-nums dark:text-white">
            {formatMoney(total, line.currency)}
            <span className="sr-only"> total for {line.name}</span>
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <QuantityStepper
            quantity={line.quantity}
            maxQuantity={line.maxQuantity}
            itemName={line.name}
            onChange={(quantity) => setQuantity(line.id, quantity)}
            onRemove={() => removeItem(line.id)}
          />
          <button
            type="button"
            onClick={() => removeItem(line.id)}
            data-testid={`remove-${line.id}`}
            className="rounded text-xs font-medium text-slate-500 underline-offset-4 transition hover:text-danger hover:underline focus-visible:focus-ring dark:text-slate-400"
          >
            Remove<span className="sr-only"> {line.name} from cart</span>
          </button>
        </div>

        {atMax && <p className="text-xs text-warning">Only {line.maxQuantity} left in stock</p>}
      </div>
    </li>
  );
});
