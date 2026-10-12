# Next Steps

- Review the checkout flow across the cart, summary, and drawer components.
- Add or update tests for the main customer interactions.
- Verify the microfrontend mount behavior in the host application.
- Document any integration decisions and known follow-up work.

## Checkout Flow

- Confirm that products can be added, removed, and updated without losing cart state.
	- Exercise the flow from product cards and from any alternate host entry points.
	- Confirm that the same product merges into one line rather than creating duplicate lines.
	- Check that state remains correct after opening, closing, and reopening the cart drawer.
- Check that quantity changes update line totals, the cart subtotal, and the item count consistently.
	- Cover increasing and decreasing quantities, the minimum quantity of one, and removal at zero.
	- Ensure every displayed monetary value uses the same currency and rounding rules.
	- Verify that invalid, negative, or non-integer quantities cannot reach the cart state.
- Verify that the drawer opens and closes correctly from the cart trigger and remains usable on smaller screens.
	- Check focus behavior when the drawer opens and returns focus to the trigger when it closes.
	- Confirm that Escape, close controls, and outside interactions behave consistently.
	- Test long product names, many line items, and narrow viewport widths without clipping content.
- Review empty-cart, loading, and error states for clear user feedback.
	- Confirm that the empty state offers a clear path back to the catalogue.
	- Make failures understandable without exposing internal errors or leaving stale totals visible.

## Testing

- Cover add-to-cart, quantity updates, item removal, undo behavior, and cart persistence.
	- Include a regression test for undoing a removal after other cart changes have occurred.
	- Verify that persistence is restored safely when storage is empty, malformed, or unavailable.
	- Test rapid repeated actions so the final state reflects the complete sequence of user intent.
- Include keyboard navigation and accessible labels for interactive controls.
	- Check tab order, visible focus, button names, dialog semantics, and screen-reader announcements.
	- Ensure quantity controls expose their current value and purpose without relying on visual context.
- Run the unit, component, and server-rendering tests before integrating changes.
	- Keep pure cart logic tests independent from browser-only APIs.
	- Confirm that server rendering does not access `window`, `document`, or storage during import or render.
	- Record the exact test command and any environment assumptions in the project documentation.

## Integration

- Test the mount API from the host application with realistic product and cart data.
	- Verify the required inputs, defaults, callbacks, and cleanup behavior.
	- Mount and unmount more than once to detect duplicate listeners, stale subscriptions, or leaked nodes.
	- Confirm that host-provided product data is not mutated by cart interactions.
- Confirm that the checkout microfrontend does not leak styles or state into its host.
	- Inspect generated class names and global selectors for collisions with host styles.
	- Verify that multiple instances do not share state unless that behavior is explicitly supported.
	- Check that events and subscriptions are removed during unmount.
- Verify that the public exports and shared types remain compatible with consuming applications.
	- Review the package entry point and ensure consumers receive only intended public APIs.
	- Check that type declarations describe optional values, callbacks, and cleanup functions accurately.
	- Test the integration against the supported framework and module-loading environments.

## Documentation

- Record integration assumptions and required host configuration.
	- Document the mount sequence, expected container element, input shape, and teardown contract.
	- Explain ownership of cart state, persistence, product data, and navigation responsibilities.
- Add examples for the most common cart integration paths.
	- Include a minimal mount example and a controlled-state example where applicable.
	- Show how hosts handle cart updates, checkout actions, and unavailable products.
	- Keep examples synchronized with exported names and current TypeScript types.
- Track unresolved decisions and link them to the relevant implementation or test.
	- Capture decisions about persistence, currency handling, accessibility, and error recovery.
	- Add an owner or review date for open items so they do not become permanently ambiguous.

## Definition Of Done

- All customer-visible cart actions have automated coverage for success and failure paths.
- The interface remains usable with keyboard navigation, assistive technology, and narrow screens.
- Mounting, unmounting, and repeated host integration do not produce stale state or resource leaks.
- Public APIs, examples, and documentation agree with the implementation.
- The full test suite passes and any remaining limitations are recorded with a clear follow-up owner.

