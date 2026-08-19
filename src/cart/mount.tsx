'use client';

import { createRoot, type Root } from 'react-dom/client';
import { CartRoot } from './components/CartRoot';
import { CartTrigger } from './components/CartTrigger';
import { cartApi } from './store';

interface MountOptions {
  /** Element (or selector) to render the drawer into. */
  container: Element | string;
  /** Optional second element to render the header cart button into. */
  triggerContainer?: Element | string;
  onCheckout?: (subtotalCents: number) => void;
}

export interface CartMountHandle {
  unmount: () => void;
  api: typeof cartApi;
}

function resolve(target: Element | string): Element {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) throw new Error(`[cart-mfe] container not found: ${String(target)}`);
  return element;
}

/**
 * Framework-agnostic entry point.
 *
 * Lets a non-Next host (Rails, Angular, plain HTML, another React version
 * behind Module Federation) drop the cart in:
 *
 *   import { mountCart } from 'cart-mfe';
 *   const cart = mountCart({ container: '#cart', triggerContainer: '#cart-button' });
 *   cart.api.addItem(product);
 *   // later: cart.unmount();
 */
export function mountCart(options: MountOptions): CartMountHandle {
  const roots: Root[] = [];

  const drawerRoot = createRoot(resolve(options.container));
  drawerRoot.render(<CartRoot onCheckout={options.onCheckout} />);
  roots.push(drawerRoot);

  if (options.triggerContainer) {
    const triggerRoot = createRoot(resolve(options.triggerContainer));
    triggerRoot.render(<CartTrigger />);
    roots.push(triggerRoot);
  }

  return {
    unmount: () => roots.forEach((root) => root.unmount()),
    api: cartApi,
  };
}
