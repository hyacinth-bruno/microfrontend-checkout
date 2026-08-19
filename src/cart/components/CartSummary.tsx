'use client';

import { formatMoney } from '../lib/money';
import { useCartActions, useCartTotals } from '../store';
import { Button } from './Button';

interface CartSummaryProps {
  onCheckout?: (subtotalCents: number) => void;
}

export function CartSummary({ onCheckout }: CartSummaryProps) {
  const { itemCount, subtotalCents, currency } = useCartTotals();
  const { closeCart } = useCartActions();
  const isEmpty = itemCount === 0;
  const formatted = formatMoney(subtotalCents, currency);

  return (
    <div className="border-t border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Subtotal
          <span className="ml-1 text-slate-400 dark:text-slate-500">
            ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
        </span>
        {/*
          Re-keyed on the value so a changed subtotal briefly flashes green:
          confirmation that the number the customer is looking at just
          recalculated. Purely CSS, and skipped under prefers-reduced-motion.
        */}
        <span
          key={subtotalCents}
          data-testid="cart-subtotal"
          className="text-xl font-semibold text-slate-900 tabular-nums motion-safe:animate-[cart-flash_600ms_ease-out] dark:text-white"
        >
          {formatted}
        </span>
      </div>

      {/*
        Always the same sentence shape so the announcement is predictable, and
        deliberately *not* duplicating the visible "Your cart is empty" copy —
        otherwise the empty state gets read out twice.
      */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {`Cart subtotal ${formatted} for ${itemCount} ${itemCount === 1 ? 'item' : 'items'}.`}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Shipping &amp; taxes calculated at checkout.
      </p>

      <Button
        variant="primary"
        disabled={isEmpty}
        onClick={() => onCheckout?.(subtotalCents)}
        className="mt-4 w-full px-4 py-3 font-semibold active:scale-[0.99] disabled:active:scale-100"
      >
        Checkout · {formatted}
      </Button>
      <Button variant="ghost" onClick={closeCart} className="mt-2 w-full px-4 py-2">
        Continue shopping
      </Button>
    </div>
  );
}
