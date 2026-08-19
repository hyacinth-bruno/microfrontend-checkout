'use client';

import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import Box from '@mui/material/Box';
import { selectHydrated, useCartActions, useCartStore, useCartTotals } from '../store';
import { Button } from './Button';

/**
 * Header button with a live item-count badge.
 * The badge stays blank until the persisted cart is read, otherwise the server
 * HTML ("0") and the client's restored value would mismatch on hydration.
 *
 * The badge is only mounted (not just visually hidden) while empty/pre-hydration —
 * MUI's `Badge` keeps its DOM node present under an `invisible` class, which
 * would defeat the SSR test asserting the badge markup isn't there at all.
 */
export function CartTrigger({ className = '' }: { className?: string }) {
  const { itemCount } = useCartTotals();
  const hydrated = useCartStore(selectHydrated);
  const { toggleCart } = useCartActions();

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }} className={className}>
      <Button
        variant="outline"
        onClick={toggleCart}
        aria-label={
          itemCount > 0
            ? `Open cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
            : 'Open cart, empty'
        }
        startIcon={<ShoppingBagOutlinedIcon fontSize="small" />}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          Cart
        </Box>
      </Button>
      {hydrated && itemCount > 0 && (
        // `key` is the count itself: when it changes React swaps the node so
        // the CSS bump animation replays, with no state or timers involved.
        <Box
          key={itemCount}
          component="span"
          data-testid="cart-badge"
          sx={{
            position: 'absolute',
            top: -6,
            right: -6,
            display: 'grid',
            placeItems: 'center',
            height: 20,
            minWidth: 20,
            px: 0.5,
            borderRadius: '9999px',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: 11,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Box>
      )}
    </Box>
  );
}
