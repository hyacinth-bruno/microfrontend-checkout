'use client';

import { useEffect, useRef } from 'react';
import { selectIsOpen, selectLines, useCartActions, useCartStore, useCartTotals } from '../store';
import type { Product } from '../types';
import { Button } from './Button';
import { CartLineItem } from './CartLineItem';
import { CartSuggestions } from './CartSuggestions';
import { CartSummary } from './CartSummary';
import { UndoToast } from './UndoToast';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface CartDrawerProps {
  onCheckout?: (subtotalCents: number) => void;
  /** Optional upsell rail rendered under the cart lines. The cart has no
   *  notion of "related" products — this is whatever the host decides is
   *  relevant right now (e.g. based on what's already in the basket). */
  suggestedProducts?: Product[];
}

/**
 * Slide-over basket.
 *
 * Implemented as a modal dialog by hand (rather than pulling in a headless UI
 * library) because a micro-frontend pays for every kB it injects into someone
 * else's page. It still does the four things a modal must do:
 * 1. trap focus, 2. close on Escape, 3. restore focus to the trigger,
 * 4. lock background scroll.
 */
export function CartDrawer({ onCheckout, suggestedProducts = [] }: CartDrawerProps) {
  const isOpen = useCartStore(selectIsOpen);
  const lines = useCartStore(selectLines);
  const { lineCount } = useCartTotals();
  const { closeCart } = useCartActions();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  // Remember the trigger, move focus in, and hand it back on close.
  useEffect(() => {
    if (!isOpen) return;
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? panel)?.focus();
    return () => {
      restoreFocusTo.current?.focus?.();
    };
  }, [isOpen]);

  // Escape to close + focus trap.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        closeCart();
        return;
      }
      if (event.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, closeCart]);

  // Scroll lock without layout shift (compensate for the scrollbar we hide).
  useEffect(() => {
    if (!isOpen) return;
    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" data-testid="cart-drawer">
      <div
        aria-hidden="true"
        onClick={closeCart}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] motion-safe:animate-[cart-fade-in_200ms_ease-out]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-overlay outline-none motion-safe:animate-[cart-slide-in_250ms_cubic-bezier(0.32,0.72,0,1)] dark:bg-slate-800"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Your cart
            {lineCount > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                ({lineCount} {lineCount === 1 ? 'product' : 'products'})
              </span>
            )}
          </h2>
          <Button variant="ghost" onClick={closeCart} aria-label="Close cart" className="h-9 w-9">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
              <path d="m8 6.94 4.47-4.47 1.06 1.06L9.06 8l4.47 4.47-1.06 1.06L8 9.06l-4.47 4.47-1.06-1.06L6.94 8 2.47 3.53l1.06-1.06z" />
            </svg>
          </Button>
        </header>

        {lines.length === 0 ? (
          <EmptyState onContinue={closeCart} />
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <ul data-testid="cart-lines" className="divide-y divide-slate-100 px-5 dark:divide-slate-700">
              {lines.map((line) => (
                <CartLineItem key={line.id} line={line} />
              ))}
            </ul>
            <CartSuggestions products={suggestedProducts} />
          </div>
        )}

        <UndoToast />
        <CartSummary onCheckout={onCheckout} />
      </div>
    </div>
  );
}

function EmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7" fill="currentColor">
          <path d="M6.2 6h14l-1.6 7.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5.3 4.6A1 1 0 0 0 4.3 4H2.5v1.5h1.4zM9.5 18.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3m7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-900 dark:text-white">Your cart is empty</p>
      <p className="max-w-[28ch] text-sm text-slate-500 dark:text-slate-400">
        Browse the catalogue and add something you like — it will show up here.
      </p>
      <Button variant="outline" onClick={onContinue} className="mt-2 px-4 py-2">
        Start shopping
      </Button>
    </div>
  );
}
