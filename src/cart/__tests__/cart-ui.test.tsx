import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AddToCartButton } from '../components/AddToCartButton';
import { CartDrawer } from '../components/CartDrawer';
import { CartTrigger } from '../components/CartTrigger';
import { selectTotals, useCartStore } from '../store';
import type { Product } from '../types';

const beans: Product = {
  id: 'sku-beans',
  name: 'Single Origin Beans',
  variant: 'Ethiopia Guji · 250g',
  priceCents: 1850,
  currency: 'USD',
  maxQuantity: 24,
};

const scale: Product = {
  id: 'sku-scale',
  name: 'Precision Scale',
  priceCents: 6400,
  currency: 'USD',
  maxQuantity: 2,
};

/** Mini host app: trigger + two products + the drawer. */
function Storefront() {
  return (
    <>
      <CartTrigger />
      <AddToCartButton product={beans} />
      <AddToCartButton product={scale} />
      <CartDrawer />
    </>
  );
}

const subtotal = () => screen.getByTestId('cart-subtotal').textContent;
const openDrawer = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /open cart/i }));

describe('Add a product to the cart', () => {
  it('adds an item and shows it in the drawer with the correct subtotal', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    const drawer = screen.getByTestId('cart-drawer');
    expect(within(drawer).getByText('Single Origin Beans')).toBeInTheDocument();
    expect(subtotal()).toBe('$18.50');
  });

  it('merges repeat adds into one line', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    const add = screen.getByRole('button', { name: /add single origin beans to cart/i });
    await user.click(add);
    await user.click(add);
    await user.click(add);
    await openDrawer(user);
    expect(screen.getAllByText('Single Origin Beans')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: /quantity of single origin beans/i })).toHaveValue('3');
    expect(subtotal()).toBe('$55.50');
  });

  it('updates the header badge live', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    expect(screen.queryByTestId('cart-badge')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('1');
    await user.click(screen.getByRole('button', { name: /add precision scale to cart/i }));
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('2');
  });

  it('disables the button once stock is exhausted', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    const add = screen.getByRole('button', { name: /add precision scale to cart/i });
    await user.click(add);
    await user.click(add); // maxQuantity = 2
    expect(add).toBeDisabled();
    expect(add).toHaveTextContent(/max in cart/i);
  });
});

describe('Adjust the quantity of an item already in the cart', () => {
  it('increments and decrements with the stepper, recalculating the subtotal each time', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    expect(subtotal()).toBe('$18.50');
    await user.click(screen.getByRole('button', { name: /increase quantity of single origin beans/i }));
    expect(subtotal()).toBe('$37.00');
    await user.click(screen.getByRole('button', { name: /increase quantity of single origin beans/i }));
    expect(subtotal()).toBe('$55.50');
    await user.click(screen.getByRole('button', { name: /decrease quantity of single origin beans/i }));
    expect(subtotal()).toBe('$37.00');
  });

  it('accepts a typed quantity on blur', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    const input = screen.getByRole('textbox', { name: /quantity of single origin beans/i });
    await user.clear(input);
    await user.type(input, '7');
    await user.tab();
    expect(input).toHaveValue('7');
    expect(subtotal()).toBe('$129.50');
  });

  it('does not mangle the cart while the user is mid-edit', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    const input = screen.getByRole('textbox', { name: /quantity of single origin beans/i });
    await user.clear(input); // empty field must NOT remove the line
    expect(screen.getByText('Single Origin Beans')).toBeInTheDocument();
    expect(subtotal()).toBe('$18.50');
    await user.type(input, '12');
    await user.tab();
    expect(subtotal()).toBe('$222.00');
  });

  it('reverts non-numeric input', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    const input = screen.getByRole('textbox', { name: /quantity of single origin beans/i });
    await user.clear(input);
    await user.type(input, 'abc');
    await user.tab();
    expect(input).toHaveValue('1');
    expect(subtotal()).toBe('$18.50');
  });

  it('clamps a typed quantity to the available stock', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add precision scale to cart/i }));
    await openDrawer(user);
    const input = screen.getByRole('textbox', { name: /quantity of precision scale/i });
    await user.clear(input);
    await user.type(input, '99');
    await user.tab();
    expect(input).toHaveValue('2');
    expect(subtotal()).toBe('$128.00');
    expect(screen.getByText(/only 2 left in stock/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /increase quantity of precision scale/i }),
    ).toBeDisabled();
  });

  it('supports arrow keys on the quantity field', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    const input = screen.getByRole('textbox', { name: /quantity of single origin beans/i });
    await user.click(input);
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(subtotal()).toBe('$55.50');
    await user.keyboard('{ArrowDown}');
    expect(subtotal()).toBe('$37.00');
  });
});

describe('Remove items from the cart', () => {
  const lines = () => screen.getByTestId('cart-lines');

  it('removes a line with the Remove button', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await user.click(screen.getByRole('button', { name: /add precision scale to cart/i }));
    await openDrawer(user);
    expect(subtotal()).toBe('$82.50');
    await user.click(screen.getByTestId('remove-sku-scale'));
    expect(within(lines()).queryByText('Precision Scale')).not.toBeInTheDocument();
    expect(within(lines()).getByText('Single Origin Beans')).toBeInTheDocument();
    expect(subtotal()).toBe('$18.50');
  });

  it('removes a line whatever its quantity (not one click per unit)', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    const add = screen.getByRole('button', { name: /add single origin beans to cart/i });
    await user.click(add);
    await user.click(add);
    await user.click(add);
    await openDrawer(user);
    expect(subtotal()).toBe('$55.50');
    await user.click(screen.getByTestId('remove-sku-beans'));
    expect(screen.queryByTestId('cart-line-sku-beans')).not.toBeInTheDocument();
    expect(subtotal()).toBe('$0.00');
  });

  it('turns the stepper minus into a remove action at quantity 1', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    const decrement = screen.getByTestId('stepper-decrement');
    expect(decrement).toHaveAccessibleName('Remove Single Origin Beans from cart');
    await user.click(decrement);
    expect(screen.queryByTestId('cart-line-sku-beans')).not.toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(subtotal()).toBe('$0.00');
  });

  it('offers an undo that restores the line at its original quantity', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    const add = screen.getByRole('button', { name: /add single origin beans to cart/i });
    await user.click(add);
    await user.click(add);
    await openDrawer(user);
    await user.click(screen.getByTestId('remove-sku-beans'));
    expect(subtotal()).toBe('$0.00');
    await user.click(screen.getByRole('button', { name: /undo/i }));
    expect(screen.getByTestId('cart-line-sku-beans')).toBeInTheDocument();
    expect(subtotal()).toBe('$37.00'); // quantity restored too, not reset to 1
  });

  it('restores a removed line to its original position', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await user.click(screen.getByRole('button', { name: /add precision scale to cart/i }));
    await openDrawer(user);
    await user.click(screen.getByTestId('remove-sku-beans'));
    await user.click(screen.getByRole('button', { name: /undo/i }));
    const ids = within(lines())
      .getAllByRole('listitem')
      .map((item) => item.getAttribute('data-testid'));
    expect(ids).toEqual(['cart-line-sku-beans', 'cart-line-sku-scale']);
  });

  it('shows the empty state and disables checkout when the cart is emptied', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    await user.click(screen.getByTestId('remove-sku-beans'));
    expect(screen.getByRole('button', { name: /checkout/i })).toBeDisabled();
    expect(screen.queryByTestId('cart-badge')).not.toBeInTheDocument();
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });
});

describe('Live subtotal', () => {
  it('is announced politely to assistive technology', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    const liveRegion = screen.getByText(/cart subtotal/i);
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveTextContent('Cart subtotal $18.50 for 1 item.');
    await user.click(screen.getByRole('button', { name: /increase quantity of single origin beans/i }));
    expect(liveRegion).toHaveTextContent('Cart subtotal $37.00 for 2 items.');
  });

  it('mirrors the total on the checkout button', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await user.click(screen.getByRole('button', { name: /add precision scale to cart/i }));
    await openDrawer(user);
    expect(screen.getByRole('button', { name: /checkout · \$64\.00/i })).toBeEnabled();
  });

  it('reacts to changes made outside React (host app / another tab)', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await openDrawer(user);
    expect(subtotal()).toBe('$0.00');
    // A host application calling the imperative API:
    useCartStore.getState().addItem(beans, 4);
    expect(await screen.findByText('Single Origin Beans')).toBeInTheDocument();
    expect(subtotal()).toBe('$74.00');
  });
});

describe('Drawer accessibility', () => {
  it('is a labelled modal dialog that closes on Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    const trigger = screen.getByRole('button', { name: /open cart/i });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: /shopping cart/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await openDrawer(user);
    await user.click(screen.getByTestId('cart-drawer').firstElementChild as Element);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('locks background scroll while open', async () => {
    const user = userEvent.setup();
    render(<Storefront />);
    await openDrawer(user);
    expect(document.body).toHaveStyle({ overflow: 'hidden' });
    await user.keyboard('{Escape}');
    expect(document.body).not.toHaveStyle({ overflow: 'hidden' });
  });
});

describe('React StrictMode', () => {
  /**
   * Double-invoked renders and effects are where external-store bugs surface:
   * a memoised selector that returns a fresh object each call makes
   * `useSyncExternalStore` loop forever ("getSnapshot should be cached").
   */
  it('runs the full flow with double-invoked renders and effects', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <Storefront />
      </StrictMode>,
    );
    await user.click(screen.getByRole('button', { name: /add single origin beans to cart/i }));
    await openDrawer(user);
    expect(subtotal()).toBe('$18.50');
    await user.click(screen.getByRole('button', { name: /increase quantity of single origin beans/i }));
    expect(subtotal()).toBe('$37.00');
    await user.click(screen.getByTestId('remove-sku-beans'));
    expect(subtotal()).toBe('$0.00');
  });

  it('keeps the totals selector referentially stable', () => {
    useCartStore.getState().addItem(beans);
    const first = selectTotals(useCartStore.getState());
    const second = selectTotals(useCartStore.getState());
    expect(second).toBe(first); // same object, or React would re-render forever
  });
});
