/**
 * Public API of the Cart micro-frontend.
 * Host applications should import from here and nowhere else — everything
 * below `./lib` and `./components` is an implementation detail.
 */
export { CartRoot } from './components/CartRoot';
export { CartTrigger } from './components/CartTrigger';
export { AddToCartButton } from './components/AddToCartButton';
export { CartDrawer } from './components/CartDrawer';
export { CartSummary } from './components/CartSummary';
export { QuantityStepper } from './components/QuantityStepper';
export {
  CART_CHANGE_EVENT,
  CART_STORAGE_KEY,
  cartApi,
  installCartSideEffects,
  selectTotals,
  useCartActions,
  useCartLine,
  useCartStore,
  useCartTotals,
  useLineQuantity,
} from './store';
export type { CartChangeDetail, CartState } from './store';
export { formatMoney } from './lib/money';
export {
  DEFAULT_MAX_QUANTITY,
  addLine,
  calculateTotals,
  removeLine,
  setLineQuantity,
} from './lib/cart-logic';
export type { CartLine, CartTotals, CurrencyCode, Product } from './types';
