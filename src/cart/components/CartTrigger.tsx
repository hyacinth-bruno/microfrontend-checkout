'use client';

import { selectHydrated, useCartActions, useCartStore, useCartTotals } from '../store';
import { Button } from './Button';

/**
 * Header button with a live item-count badge.
 * The badge stays blank until the persisted cart is read, otherwise the server
 * HTML ("0") and the client's restored value would mismatch on hydration.
 */
export function CartTrigger({ className = '' }: { className?: string }) {
  const { itemCount } = useCartTotals();
  const hydrated = useCartStore(selectHydrated);
  const { toggleCart } = useCartActions();

  return (
    <Button
      variant="outline"
      onClick={toggleCart}
      aria-label={
        itemCount > 0
          ? `Open cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
          : 'Open cart, empty'
      }
      className={`relative px-3.5 py-2.5 shadow-resting hover:shadow-raised ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
        <path d="M6.2 6h14l-1.6 7.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.3 4.6A1 1 0 0 0 4.3 4H2.5v1.5h1.4zM9.5 18.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3" />
      </svg>
      <span className="hidden sm:inline">Cart</span>
      {hydrated && itemCount > 0 && (
        /*
          `key` is the count itself: when it changes React swaps the node and
          the CSS animation replays. No state, no timers, no extra renders —
          the browser owns the animation.
        */
        <span
          key={itemCount}
          data-testid="cart-badge"
          className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white tabular-nums motion-safe:animate-[cart-bump_300ms_ease-out] dark:bg-white dark:text-slate-900"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Button>
  );
}
