'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { formatMoney } from '../lib/money';
import { useCartActions, useCartTotals } from '../store';
import { Button } from './Button';

interface CartSummaryProps {
  onCheckout?: (subtotalCents: number) => void;
}

export function CartSummary({ onCheckout }: CartSummaryProps) {
  const { itemCount, subtotalCents, currency } = useCartTotals();
  const { closeCart } = useCartActions();
  const isEmpty = itemCount === 0;
  const formatted = formatMoney(subtotalCents, currency);

  return (
    <Box
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        p: 2.5,
        pb: 'max(1.25rem, env(safe-area-inset-bottom))',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Subtotal
          <Box component="span" sx={{ ml: 0.5, color: 'text.disabled' }}>
            ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </Box>
        </Typography>
        {/*
          Re-keyed on the value so a changed subtotal briefly flashes green:
          confirmation that the number the customer is looking at just
          recalculated.
        */}
        <Typography
          key={subtotalCents}
          data-testid="cart-subtotal"
          variant="h6"
          sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
        >
          {formatted}
        </Typography>
      </Stack>

      {/*
        Always the same sentence shape so the announcement is predictable, and
        deliberately *not* duplicating the visible "Your cart is empty" copy —
        otherwise the empty state gets read out twice.
      */}
      <Box aria-live="polite" aria-atomic="true" sx={visuallyHidden}>
        {`Cart subtotal ${formatted} for ${itemCount} ${itemCount === 1 ? 'item' : 'items'}.`}
      </Box>

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
        Shipping &amp; taxes calculated at checkout.
      </Typography>

      <Button
        variant="primary"
        disabled={isEmpty}
        onClick={() => onCheckout?.(subtotalCents)}
        fullWidth
        size="large"
        sx={{ mt: 2 }}
      >
        Checkout · {formatted}
      </Button>
      <Button variant="ghost" onClick={closeCart} fullWidth sx={{ mt: 1 }}>
        Continue shopping
      </Button>
    </Box>
  );
}
