# Overview

This folder contains supporting notes for the microfrontend checkout project.

Use these documents to capture short explanations, decisions, and follow-up items that do not belong in the main project documentation.

## Project Purpose

The project provides a reusable checkout experience as a microfrontend. Its primary responsibility is to manage cart interactions while remaining small enough to mount inside a host application. The implementation should keep cart behavior predictable, expose a clear integration surface, and avoid making assumptions about the host's routing, product catalogue, or visual system.

The checkout experience includes product selection, cart state management, line-item updates, totals, suggestions, and a drawer-based cart interface. These pieces should work together whether they are used by the demonstration application or embedded in another application.

## Main Areas

### Cart Package

The `src/cart/` directory contains the reusable checkout behavior:

- `store.ts` owns cart state and the operations that change it.
- `types.ts` defines the shared product, line-item, and cart contracts.
- `lib/cart-logic.ts` contains deterministic cart calculations and transformations.
- `lib/money.ts` centralizes currency formatting and monetary display rules.
- `components/` contains the user interface for the cart drawer, summary, line items, controls, suggestions, and notifications.
- `mount.tsx` defines how the cart is attached to a host application.
- `__tests__/` verifies cart logic, rendering, server behavior, and store integration.

The cart package should remain usable without depending on demo-only catalogue data. Changes to public types, exports, or mounting behavior should be treated as integration changes and tested from a host consumer's perspective.

### Demo Application

The `src/demo/` directory provides catalogue data and a host-facing example of the checkout experience. It is useful for trying the user flow and showing how products and suggestions are passed into the cart, but it should not become the source of truth for reusable cart behavior.

### Application Shell

The `src/app/` directory contains the application shell and global styling used by the local Next.js experience. Shell-level concerns such as page layout and global CSS should stay separate from cart state and component logic so that the cart can continue to run in another host.

## Ownership Boundaries

- The cart owns line-item state, quantity changes, removal, undo behavior, totals, and cart-specific presentation.
- The host owns catalogue loading, product availability, navigation, checkout completion, and any business rules that are outside cart management.
- Shared types define the contract between the host and the microfrontend.
- The mount API owns setup and teardown; it should not leave listeners, subscriptions, or DOM nodes behind after unmounting.
- Tests should distinguish pure cart behavior from browser-dependent rendering and integration behavior.

Keeping these boundaries explicit makes it easier to embed the checkout experience, replace the demo data, and identify whether a future change belongs in the cart package or the host application.

## Documentation Conventions

Use this folder for supporting material that benefits from more context than an inline code comment but is too specific or provisional for the primary project documentation. Good candidates include:

- Short architectural explanations and decision records.
- Integration assumptions and host-application requirements.
- Investigation notes for behavior that crosses several components.
- Follow-up work that has a clear connection to a feature or test.
- Known limitations, migration notes, and questions awaiting a design decision.

Keep notes focused and link implementation details to the relevant source file or test when possible. Prefer concrete examples, explicit assumptions, and observable acceptance criteria over vague descriptions. Update or remove notes when the underlying behavior changes so that this folder remains useful rather than becoming a second, outdated source of truth.

## Related Documentation

- Use `next-steps.md` for detailed implementation, testing, integration, and documentation follow-up.
- Use the main `docs/` documents for stable project instructions and information intended for a broader audience.
- Use the source tests as the authoritative examples for behavior that must remain stable.

