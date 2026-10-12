# Cart Micro-Frontend Documentation

This document is the implementation guide for integrating and maintaining the cart micro-frontend. It intentionally focuses on engineering contracts, host integration, and operational behavior rather than repeating the product overview in the repository root `README.md`.

## Purpose and boundaries

The reusable package is the `src/cart` directory. It is designed to be mounted inside a storefront without requiring the host application to own cart state or provide a React context.

The following directories are demonstration code only:

- `src/app` — the Next.js App Router host page and global styling.
- `src/demo` — catalogue data, product cards, host-side mounting, and recommendations.

Changes to the reusable cart should not import from `src/app` or `src/demo`. Host-specific behavior belongs in the consuming application.

## Integration contract

### React host

A React or Next.js host should import from the public barrel file only:

```tsx
import { AddToCartButton, CartRoot, CartTrigger } from '@/cart';

export function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <CartTrigger />
      </header>
      {children}
      <CartRoot
        onCheckout={(subtotalCents) => {
          // Replace with the host's checkout navigation.
          console.log('checkout requested', subtotalCents);
        }}
      />
    </>
  );
}
```

Mount `CartRoot` once. Product pages can render `AddToCartButton` with a complete `Product` object:

```tsx
<AddToCartButton
  product={{
    id: 'sku-1',
    name: 'Coffee beans',
    priceCents: 1850,
    currency: 'USD',
    maxQuantity: 24,
  }}
/>
```

Do not add a provider around the cart. Zustand exposes the store as a module singleton and selectors keep updates localized.

### Non-React host

For Rails, Angular, plain HTML, or another independently bundled frontend, use the mounting API from `src/cart/mount.tsx`:

```tsx
import { mountCart } from 'cart-mfe';

const mountedCart = mountCart({
  container: '#cart-drawer-root',
  triggerContainer: '#cart-trigger',
});

mountedCart.api.addItem(product, 1);

const unsubscribe = mountedCart.api.subscribe(({ totals }) => {
  analytics.track('cart_changed', totals);
});

// When the host removes the cart from the page:
unsubscribe();
mountedCart.unmount();
```

The browser integration also exposes `window.cartMFE` when `CartRoot` or `mountCart` is configured to expose the global API. Basket updates dispatch a `cart:change` event whose detail contains `lines` and derived `totals`.

## Domain contracts

### Product identity

`Product.id` is the identity of the purchasable unit. The store maintains one line per ID and merges repeated additions into that line. If a future product has selectable options, the host must provide a stable variant-aware ID rather than relying on display names.

### Money

All prices are integer minor units:

```ts
const product = {
  priceCents: 1299, // $12.99
  currency: 'USD',
};
```

Never introduce floating-point currency calculations. Use `formatMoney` only at the presentation boundary.

### Quantity

Quantity changes pass through the pure functions in `src/cart/lib/cart-logic.ts`:

- `addLine` adds or merges a product.
- `setLineQuantity` applies an absolute quantity.
- `incrementLineQuantity` applies a relative change.
- `removeLine` removes a line by ID.
- `calculateTotals` derives line count, item count, subtotal, and currency.
- `sanitizeLines` validates persisted or host-provided data.

A quantity of `0` is interpreted as removal. Missing stock information uses `DEFAULT_MAX_QUANTITY`; supplied stock limits are applied consistently across buttons, typed input, re-addition, and storage restoration.

## State and browser behavior

The Zustand state in `src/cart/store.ts` contains the durable `lines` collection plus ephemeral UI state:

- `lines` is persisted under the `cart-mfe:v1` localStorage key.
- `isOpen`, `hydrated`, and `lastRemoved` are not persisted.
- Totals are derived and memoized from the `lines` array reference.
- Rehydration is deliberately manual with `skipHydration: true` to prevent SSR/client markup mismatches.
- Invalid or stale localStorage records are filtered by `sanitizeLines`.
- The `storage` event triggers cross-tab rehydration.
- `cart:change` is emitted only when the lines reference changes.

When changing persistence behavior, update the integration tests in `src/cart/__tests__/store-integration.test.ts` and consider storage-version compatibility.

## UI and accessibility expectations

The drawer is a modal surface, not merely a visual panel. Changes must preserve:

- keyboard access to all controls;
- Escape-to-close behavior;
- focus restoration to the trigger;
- scroll locking without layout shift;
- a single polite live announcement for subtotal changes;
- clear disabled and sold-out states;
- reduced-motion support through `motion-safe:` classes.

`QuantityStepper` intentionally keeps a local draft while a user edits the input. Commit on blur or Enter, revert on Escape, and keep arrow-key increment/decrement behavior intact.

## Testing map

Use the narrowest appropriate suite first, then run the complete verification command:

| Change | Primary test location |
| --- | --- |
| Add, merge, clamp, remove, totals, sanitization | `src/cart/__tests__/cart-logic.test.ts` |
| Drawer, buttons, quantity input, accessibility | `src/cart/__tests__/cart-ui.test.tsx` |
| localStorage, events, imperative API, tab sync | `src/cart/__tests__/store-integration.test.ts` |
| Server-safe imports and rendering | `src/cart/__tests__/ssr.test.tsx` |

Run locally:

```bash
npm test
npm run typecheck
npm run lint
npm run verify
```

Vitest uses `jsdom` by default and loads `vitest.setup.mts`. The SSR suite opts into a no-DOM environment, so avoid unguarded `window`, `document`, or `localStorage` access at module scope.

## Change workflow

1. Identify whether the change belongs to the reusable cart or the demo host.
2. Put business rules in pure functions before wiring them into Zustand or React.
3. Preserve the public API in `src/cart/index.ts`; avoid importing implementation files from hosts.
4. Add regression coverage for the behavior and its browser/SSR boundary when relevant.
5. Update this documentation when an integration contract, storage rule, or public export changes.
6. Run `npm run verify` before merging.

## Known extension points

The current design leaves clear places for future work:

- server reconciliation can be added around the optimistic Zustand layer;
- variant-aware IDs can replace the current one-ID-per-product assumption;
- `src/cart` can be packaged independently with React as a peer dependency;
- checkout, tax, promotion, and inventory authority should remain server-side when introduced.
