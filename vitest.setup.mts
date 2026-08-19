import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

const isDom = typeof window !== 'undefined';

// The SSR suite runs in the `node` environment, where there is deliberately
// no DOM to reset.
beforeEach(async () => {
  if (!isDom) return;
  localStorage.clear();
  const { useCartStore } = await import('@/cart/store');
  useCartStore.setState({ lines: [], isOpen: false, hydrated: true, lastRemoved: null });
});

afterEach(() => {
  if (isDom) cleanup();
});
