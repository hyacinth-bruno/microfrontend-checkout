'use client';

import { memo } from 'react';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { formatMoney, lineTotalCents } from '../lib/money';
import { useCartActions } from '../store';
import type { CartLine } from '../types';
import { QuantityStepper } from './QuantityStepper';

interface CartLineItemProps {
  line: CartLine;
}

/**
 * One row of the basket. Memoised: updating line A must not re-render line B.
 * Actions come from the store (stable references), so the memo actually holds.
 */
export const CartLineItem = memo(function CartLineItem({ line }: CartLineItemProps) {
  const { setQuantity, removeItem } = useCartActions();
  const total = lineTotalCents(line.unitPriceCents, line.quantity);
  const atMax = line.quantity >= line.maxQuantity;

  return (
    <Stack
      component="li"
      direction="row"
      spacing={2}
      sx={{ py: 2.5, borderBottom: 1, borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}
      data-testid={`cart-line-${line.id}`}
    >
      <Avatar
        variant="rounded"
        src={line.imageUrl}
        alt=""
        sx={{ height: 80, width: 80, bgcolor: 'action.hover', color: 'text.disabled' }}
      >
        <ImageOutlinedIcon />
      </Avatar>

      <Stack sx={{ minWidth: 0, flex: 1 }} spacing={1}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
              {line.name}
            </Typography>
            {line.variant && (
              <Typography variant="caption" color="text.secondary" noWrap component="p" sx={{ mt: 0.25 }}>
                {line.variant}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.25 }}>
              {formatMoney(line.unitPriceCents, line.currency)} each
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ flexShrink: 0, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatMoney(total, line.currency)}
            <Box component="span" sx={visuallyHidden}>
              {' '}total for {line.name}
            </Box>
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
          <QuantityStepper
            quantity={line.quantity}
            maxQuantity={line.maxQuantity}
            itemName={line.name}
            onChange={(quantity) => setQuantity(line.id, quantity)}
            onRemove={() => removeItem(line.id)}
          />
          <Box
            component="button"
            type="button"
            onClick={() => removeItem(line.id)}
            data-testid={`remove-${line.id}`}
            sx={{
              bgcolor: 'transparent',
              border: 0,
              cursor: 'pointer',
              p: 0,
              font: 'inherit',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'text.secondary',
              textUnderlineOffset: '4px',
              '&:hover': { color: 'error.main', textDecoration: 'underline' },
            }}
          >
            Remove
            <Box component="span" sx={visuallyHidden}>
              {' '}{line.name} from cart
            </Box>
          </Box>
        </Stack>

        {atMax && (
          <Typography variant="caption" color="warning.main">
            Only {line.maxQuantity} left in stock
          </Typography>
        )}
      </Stack>
    </Stack>
  );
});

