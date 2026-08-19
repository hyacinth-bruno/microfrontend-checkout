// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

/**
 * The micro-frontend is dropped into server-rendered hosts, so importing it
 * must never touch `window`/`localStorage`. If someone later moves the persist
 * hydration out of the effect, this test fails instead of production.
 */
describe('server-side rendering safety', () => {
  it('imports and renders without a DOM', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    const { CartTrigger } = await import('../components/CartTrigger');
    const { CartDrawer } = await import('../components/CartDrawer');
    const html = renderToString(
      <>
        <CartTrigger />
        <CartDrawer />
      </>,
    );
    // Trigger renders; the drawer is closed so it contributes nothing.
    expect(html).toContain('Open cart, empty');
    expect(html).not.toContain('cart-drawer');
    // No badge server-side: it would mismatch a restored client cart.
    expect(html).not.toContain('cart-badge');
  });

  it('starts from an empty basket on the server', async () => {
    const { useCartStore } = await import('../store');
    expect(useCartStore.getState().lines).toEqual([]);
    expect(useCartStore.getState().hydrated).toBe(false);
  });
});
