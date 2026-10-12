# Repository Instructions

## Overview

`microfrontend-checkout` is a standalone shopping-cart micro-frontend built with Next.js App Router, React, Tailwind CSS, Zustand, and Vitest. The reusable micro-frontend lives in `src/cart`; `src/app` and `src/demo` are only a demonstration host application.

## Development commands

Run these commands from the repository root:

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run verify
```

- `npm run dev` starts the demo storefront at `http://localhost:3000`.
- `npm test` runs the Vitest suite once.
- `npm run test:watch` runs Vitest in watch mode.
- `npm run verify` runs type-checking, linting, all tests, and the production build.

Run `npm run verify` before submitting changes.

## Repository layout

```text
src/
├── cart/                 # Reusable cart micro-frontend
│   ├── index.ts          # Public API; hosts should import from here
│   ├── types.ts          # Product, CartLine, and CartTotals types
│   ├── store.ts          # Zustand state, selectors, persistence, host API
│   ├── mount.tsx         # Mounting API for non-React hosts
│   ├── lib/              # Pure cart rules and money formatting
│   ├── components/       # Cart UI components
│   └── __tests__/        # Logic, UI, integration, and SSR tests
├── app/                  # Next.js demo host application
└── demo/                 # Demo catalogue and host-side integration code
docs/                     # Project documentation
```

The cart package must remain independent of `src/app` and `src/demo`. Do not import demo-specific code into `src/cart`.

## Architecture and state rules

- Treat `src/cart/index.ts` as the only public entry point for host applications. Keep implementation details private unless an export is intentionally part of the host API.
- Keep business rules in `src/cart/lib/cart-logic.ts` as pure functions. They must not depend on React, Zustand, browser globals, or side effects.
- `lines` is the single source of truth. Do not store `subtotal`, `itemCount`, or `lineCount`; derive them through `calculateTotals`/`selectTotals`.
- Represent money as integer minor units (`priceCents`, `subtotalCents`). Do not use floating-point currency arithmetic.
- Preserve immutable updates and return the original array reference when an operation makes no change.
- Enforce quantity limits consistently for adding, re-adding, typed input, stepper changes, and restored localStorage data.
- Persist only the basket lines. Drawer state, hydration state, and undo state are ephemeral.
- Preserve SSR safety: persisted state is rehydrated on the client, and UI that depends on hydration must not create a server/client markup mismatch.
- Keep host integration working through `cartApi`, `window.cartMFE`, and the `cart:change` event.
- Preserve cross-tab synchronization through the `storage` event.

## Component guidelines

- Mount `<CartRoot />` once in the host application.
- Use `<CartTrigger />` for the header cart control and `<AddToCartButton />` for product pages.
- Keep cart rows isolated with selectors and memoization where appropriate; changing one quantity should not cause unrelated product or cart rows to re-render.
- Preserve accessibility behavior in `CartDrawer`: modal semantics, focus management, Escape-to-close, focus restoration, scroll locking, and live subtotal announcements.
- Keep animations CSS-only and behind `motion-safe:` styles.
- Keep host-specific recommendation logic in `src/demo` or the consuming application, not in the cart domain layer.

## Testing expectations

Add or update tests when changing behavior:

- `src/cart/__tests__/cart-logic.test.ts` for pure add, merge, clamp, remove, totals, and sanitization rules.
- `src/cart/__tests__/cart-ui.test.tsx` for user-visible interactions, drawer behavior, accessibility, and StrictMode behavior.
- `src/cart/__tests__/store-integration.test.ts` for persistence, the imperative API, DOM events, and cross-tab synchronization.
- `src/cart/__tests__/ssr.test.tsx` for imports and rendering without a DOM.

Use Testing Library and `user-event` for UI behavior rather than testing implementation details. Reset localStorage and Zustand state consistently with `vitest.setup.mts`.

## TypeScript and styling

- TypeScript is strict and uses the `@/*` alias for `src/*`.
- Prefer explicit domain types from `src/cart/types.ts`.
- Follow the existing Next.js ESLint configuration; do not weaken lint rules to bypass a failure.
- Use Tailwind CSS v4 classes and the existing design conventions in `src/app/globals.css`.
- Avoid adding dependencies unless the existing stack cannot reasonably support the requirement.

## Change checklist

Before opening a pull request:

1. Confirm the change belongs in the reusable cart or in the demo host.
2. Update the relevant tests and documentation.
3. Check SSR, persistence, quantity limits, accessibility, and non-React host behavior when applicable.
4. Run `npm run verify`.
5. Keep public API changes deliberate and document new exports or behavior in `docs/index.md`.
