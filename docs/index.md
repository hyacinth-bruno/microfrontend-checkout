# Cart micro-frontend

A self-contained shopping cart you can drop into any storefront.

- **Add a product to the cart** — `<AddToCartButton product={…} />` (or `cartApi.addItem`)
- **Adjust quantity** — `+` / `−` stepper *and* a typeable field, clamped to stock
- **Remove items** — explicit Remove, `−` at qty 1, or typing `0`; with Undo
- **Live subtotal** — derived from the lines on every change, never stored

Stack: **Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Zustand · Vitest + Testing Library**

```
npm install
npm run dev      # http://localhost:3000 — demo storefront
npm run verify   # typecheck + lint + 67 tests + production build
```

---

## Why Zustand (and not Context / Redux / the URL)

A cart is **cross-cutting, high-frequency, long-lived** state. That rules things in and out:

| Option | Verdict |
| --- | --- |
| `useState` lifted to a page | Dies on navigation; the header badge can't see it. |
| React Context | Works, but forces a `<CartProvider>` into the **host's** tree — an unacceptable coupling for an MFE — and re-renders *every* consumer on each keystroke in a quantity field. |
| Redux Toolkit | Fine, but a store + slices + provider + ~12kB to manage one array. The ceremony outweighs the domain. |
| Server state (RSC / DB cart) | Correct for a real checkout, but every `+` click becomes a round-trip. You still want this client store in front of it as the optimistic layer. |
| **Zustand** | ✅ Module singleton → **no provider in the host**. Selector subscriptions → only the components that use a slice re-render. `persist` middleware → basket survives refresh. ~1 kB. Readable/writable from outside React, which is exactly what a host app needs. |

The decisive argument for a *micro*-frontend is the **no-provider** property: the host renders `<CartRoot />` once and nothing else changes. A non-React host can call `window.cartMFE.addItem(...)`.

### State-shape rules this follows

1. **One source of truth: `lines`.** `subtotal`, `itemCount` and `lineCount` are **derived** (`selectTotals`). A stored total is a total that will eventually disagree with the items — the classic cart bug.
2. **Money is integer cents.** `0.1 + 0.2 !== 0.3`; a subtotal that's a penny out destroys trust. Formatting happens at the edge via `Intl.NumberFormat`.
3. **Business rules are pure functions** (`lib/cart-logic.ts`) — no React, no store. They return the *same array reference* when nothing changed, so React bails out of re-rendering.
4. **Only the basket is persisted.** Drawer open/closed and the undo buffer are ephemeral (`partialize`).

---

## Architecture

```
src/cart/                  ← the micro-frontend (the only thing you'd publish)
├── index.ts                ← public API; import from here and nowhere else
├── types.ts                 ← Product, CartLine, CartTotals
├── store.ts                  ← Zustand store, selectors, host API, side effects
├── mount.tsx                  ← mountCart() for non-Next / non-React hosts
├── lib/
│   ├── cart-logic.ts           ← pure add / set / increment / remove / totals
│   └── money.ts                 ← integer-cent formatting
├── components/
│   ├── CartRoot.tsx              ← single mount point (hydration + side effects + drawer)
│   ├── CartTrigger.tsx            ← header button + live badge
│   ├── AddToCartButton.tsx
│   ├── CartDrawer.tsx              ← accessible slide-over
│   ├── CartLineItem.tsx             ← memoised row
│   ├── QuantityStepper.tsx           ← −/input/+
│   ├── CartSummary.tsx                ← live subtotal + checkout
│   └── UndoToast.tsx
└── __tests__/                          ← 67 tests

src/app/, src/demo/          ← the demo storefront ("host app"), not part of the MFE
```

`src/demo` and `src/app` exist only to prove the cart works in a host. Delete them and `src/cart` still stands alone.

## Using it

### In a Next.js / React host

```tsx
import { AddToCartButton, CartRoot, CartTrigger } from '@/cart';

export default function Layout({ children }) {
  return (
    <>
      <header><CartTrigger /></header>
      {children}
      <CartRoot onCheckout={(subtotalCents) => router.push('/checkout')} />
    </>
  );
}

// anywhere in the product page:
<AddToCartButton product={{ id: 'sku-1', name: 'Beans', priceCents: 1850, currency: 'USD', maxQuantity: 24 }} />
```

No provider. No cart state in the host.

### In a non-React host (Rails, Angular, plain HTML, Module Federation)

```js
import { mountCart } from 'cart-mfe';

const cart = mountCart({ container: '#cart', triggerContainer: '#cart-button' });
cart.api.addItem(product, 2);
cart.api.subscribe(({ totals }) => analytics.track('cart_changed', totals));
window.addEventListener('cart:change', (e) => console.log(e.detail.totals.subtotalCents));
```

### Public API

| Export | Purpose |
| --- | --- |
| `<CartRoot />` | Mount once. Rehydrates storage, installs side effects, renders the drawer. |
| `<CartTrigger />` | Header button with live item count. |
| `<AddToCartButton product qty openCartOnAdd />` | Add to cart with "Added" feedback and stock awareness. |
| `useCartTotals()` | `{ itemCount, subtotalCents, currency, lineCount }` — live. |
| `useCartActions()` | `addItem`, `setQuantity`, `incrementQuantity`, `removeItem`, `undoRemove`, `clear`, `openCart`… |
| `cartApi` / `window.cartMFE` | Imperative API for non-React hosts. |
| `cart:change` DOM event | `{ detail: { lines, totals } }` on every basket change. |

## Details that matter in production

- **No SSR/hydration mismatch.** Persisted state is read in an effect (`skipHydration: true`), and the badge stays hidden until `hydrated` — otherwise server HTML ("no badge") and client ("3 items") disagree and React blows away the tree. Enforced by `__tests__/ssr.test.tsx`, which renders with **no DOM at all**.
- **Corrupt/stale storage can't crash the host.** `sanitizeLines` re-validates every persisted line — carts outlive deploys, and a line written by last month's bundle must not break today's.
- **Cross-tab sync** via the `storage` event.
- **Stock caps** are enforced in the pure layer, so the `+` button, the typed input, the merge-on-re-add path and restored storage all clamp identically.
- **The quantity input keeps a local draft** while typing, so clearing the field mid-edit doesn't delete the line or fight the caret. Committed on blur/Enter; `Esc` reverts; `↑`/`↓` step.
- **Accessibility**: the drawer is a real modal (focus trap, `Escape`, focus restored to the trigger, scroll lock without layout shift); the subtotal is announced through one polite, atomic live region; every icon button has a name; the empty-state copy is deliberately *not* duplicated in the live region.
- **Motion** is CSS-only and driven by `key` remounts (no state, no timers, no extra renders), and every animation sits behind `motion-safe:`.
- **Render isolation**: rows are `memo`ised and actions come from a `useShallow` selector, so editing line A doesn't re-render line B or the product grid.

## Tests

```
npm test
```

67 tests across four suites:

| Suite | Covers |
| --- | --- |
| `cart-logic.test.ts` | Pure rules: merging, clamping, removal, integer-cent totals, malformed-data recovery. |
| `cart-ui.test.tsx` | The four required behaviours driven through the real UI with `user-event`, plus drawer a11y and StrictMode. |
| `store-integration.test.ts` | localStorage persistence, corrupt payloads, imperative API, `cart:change`, cross-tab sync. |
| `ssr.test.tsx` | Imports and renders with no DOM. |

## If this were going further

1. **Server reconciliation** — `POST /cart` on each mutation with the local store as the optimistic layer, re-pricing (promotions, tax) server-side; `subtotalCents` becomes the *estimate* until the server answers.
2. **Variant-aware line ids** — `id` is the purchasable unit today; with per-line options the key becomes `sku + hash(options)`.
3. **Ship as a package** — this is already structured for it: `src/cart` has no dependency on `src/app`. Build with `tsup`, mark `react`/`react-dom` as peers, expose `mount.tsx` as the Module Federation remote entry, and ship Tailwind as pre-built CSS (or scope it with a prefix) so the host's styles can't collide.
