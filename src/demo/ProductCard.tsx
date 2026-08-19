'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { AddToCartButton, formatMoney, useLineQuantity, type Product } from '@/cart';

export function ProductCard({ product }: { product: Product }) {
  const inCart = useLineQuantity(product.id);
  const soldOut = (product.maxQuantity ?? Infinity) < 1;

  return (
    <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', bgcolor: 'action.hover' }}>
        <CardMedia
          component="img"
          image={product.imageUrl}
          alt={product.name}
          loading="lazy"
          sx={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            filter: soldOut ? 'grayscale(1)' : 'none',
            opacity: soldOut ? 0.5 : 1,
          }}
        />
        {inCart > 0 && (
          <Chip
            label={`${inCart} in cart`}
            size="small"
            sx={{
              position: 'absolute',
              left: 12,
              top: 12,
              bgcolor: 'rgba(15, 23, 42, 0.9)',
              color: 'common.white',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        )}
        {soldOut && (
          <Chip
            label="Sold out"
            size="small"
            sx={{ position: 'absolute', right: 12, top: 12, bgcolor: 'rgba(255,255,255,0.9)', fontWeight: 600 }}
          />
        )}
      </Box>
      <CardContent sx={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {product.name}
        </Typography>
        {product.variant && (
          <Typography variant="caption" color="text.secondary">
            {product.variant}
          </Typography>
        )}
        <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(product.priceCents, product.currency)}
        </Typography>
        <Box sx={{ mt: 1.5 }}>
          <AddToCartButton product={product} />
        </Box>
      </CardContent>
    </Card>
  );
}
