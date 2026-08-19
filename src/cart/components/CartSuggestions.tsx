'use client';

import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatMoney } from '../lib/money';
import { selectLines, useCartStore } from '../store';
import type { Product } from '../types';
import { AddToCartButton } from './AddToCartButton';

interface CartSuggestionsProps {
  products: Product[];
}

/**
 * "You might also like" — a compact horizontal rail under the cart lines.
 * `products` is whatever the host decides is relevant; this component's own
 * job is just to not suggest something that's already in the basket.
 */
export function CartSuggestions({ products }: CartSuggestionsProps) {
  const lines = useCartStore(selectLines);
  const inCart = new Set(lines.map((line) => line.id));
  const visible = products.filter((product) => !inCart.has(product.id)).slice(0, 4);

  if (visible.length === 0) return null;

  return (
    <Box data-testid="cart-suggestions" sx={{ borderTop: 1, borderColor: 'divider', px: 2.5, py: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
        You might also like
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
        {visible.map((product) => (
          <Box key={product.id} data-testid={`suggestion-${product.id}`} sx={{ width: 128, flexShrink: 0 }}>
            <Avatar
              variant="rounded"
              src={product.imageUrl}
              alt=""
              sx={{ width: '100%', height: 128, bgcolor: 'action.hover', color: 'text.disabled' }}
            >
              <ImageOutlinedIcon />
            </Avatar>
            <Typography variant="caption" noWrap component="p" sx={{ mt: 1, fontWeight: 500 }}>
              {product.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(product.priceCents, product.currency)}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <AddToCartButton product={product} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
