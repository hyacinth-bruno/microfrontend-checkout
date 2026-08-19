'use client';

import CloseIcon from '@mui/icons-material/Close';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { selectIsOpen, selectLines, useCartActions, useCartStore, useCartTotals } from '../store';
import type { Product } from '../types';
import { Button } from './Button';
import { CartLineItem } from './CartLineItem';
import { CartSuggestions } from './CartSuggestions';
import { CartSummary } from './CartSummary';
import { UndoToast } from './UndoToast';

interface CartDrawerProps {
  onCheckout?: (subtotalCents: number) => void;
  /** Optional upsell rail rendered under the cart lines. The cart has no
   *  notion of "related" products — this is whatever the host decides is
   *  relevant right now (e.g. based on what's already in the basket). */
  suggestedProducts?: Product[];
}

/**
 * Slide-over basket, built on MUI's `Drawer` (a `Modal` under the hood), so
 * focus trapping, Escape-to-close, focus restoration on close and background
 * scroll lock all come from MUI instead of being hand-rolled here.
 */
export function CartDrawer({ onCheckout, suggestedProducts = [] }: CartDrawerProps) {
  const isOpen = useCartStore(selectIsOpen);
  const lines = useCartStore(selectLines);
  const { lineCount } = useCartTotals();
  const { closeCart } = useCartActions();

  // Declared separately (not inline) so TS's excess-property check doesn't
  // reject `data-testid` — MUI's slot prop types don't name arbitrary
  // `data-*` attributes even though they're forwarded to the DOM node.
  const paperSlotProps = {
    role: 'dialog',
    'aria-modal': true,
    'aria-label': 'Shopping cart',
    'data-testid': 'cart-drawer',
    sx: { width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column' },
  };
  const backdropSlotProps = { 'data-testid': 'cart-backdrop' };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={closeCart}
      slotProps={{ paper: paperSlotProps, backdrop: backdropSlotProps }}
    >
      <Stack
        component="header"
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', px: 2.5, py: 2 }}
      >
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
          Your cart
          {lineCount > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({lineCount} {lineCount === 1 ? 'product' : 'products'})
            </Typography>
          )}
        </Typography>
        <IconButton onClick={closeCart} aria-label="Close cart" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {lines.length === 0 ? (
        <EmptyState onContinue={closeCart} />
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain' }}>
          <Box component="ul" data-testid="cart-lines" sx={{ px: 2.5, listStyle: 'none', m: 0 }}>
            {lines.map((line) => (
              <CartLineItem key={line.id} line={line} />
            ))}
          </Box>
          <CartSuggestions products={suggestedProducts} />
        </Box>
      )}

      <UndoToast />
      <CartSummary onCheckout={onCheckout} />
    </Drawer>
  );
}

function EmptyState({ onContinue }: { onContinue: () => void }) {
  return (
    <Stack
      spacing={1.5}
      sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', px: 4, textAlign: 'center' }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          height: 56,
          width: 56,
          borderRadius: '9999px',
          bgcolor: 'action.hover',
          color: 'text.disabled',
        }}
      >
        <ShoppingBagOutlinedIcon sx={{ fontSize: 28 }} />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        Your cart is empty
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '28ch' }}>
        Browse the catalogue and add something you like — it will show up here.
      </Typography>
      <Button variant="outline" onClick={onContinue} sx={{ mt: 1 }}>
        Start shopping
      </Button>
    </Stack>
  );
}
