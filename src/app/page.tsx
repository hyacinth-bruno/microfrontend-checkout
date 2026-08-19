import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { CartTrigger } from '@/cart';
import { CartMount } from '@/demo/CartMount';
import { ProductCard } from '@/demo/ProductCard';
import { catalogue } from '@/demo/catalogue';

/**
 * Demo "host application".
 *
 * Note how little it knows about the cart: it renders <CartTrigger /> in its
 * header, <CartMount /> once anywhere in the tree, and <AddToCartButton /> on
 * each product. No provider, no prop-drilling. The one exception is
 * <CartMount />, which reads the live basket to compute "you might also
 * like" suggestions — the cart itself still has no idea what "related"
 * means, that logic lives entirely on the host side (see demo/suggestions.ts).
 */
export default function HomePage() {
  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(8px)', bgcolor: 'rgba(255,255,255,0.8)' }}
      >
        <Toolbar sx={{ maxWidth: 1152, width: '100%', mx: 'auto', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flex: 1 }}>
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                height: 36,
                width: 36,
                borderRadius: 'var(--radius-control)',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              BW
            </Box>
            <Box sx={{ lineHeight: 1.2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Brewhouse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Coffee equipment
              </Typography>
            </Box>
          </Box>
          <CartTrigger />
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 4, sm: 6 } }}>
        <Box sx={{ mb: 4, maxWidth: 640 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Shop all
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This storefront is a stand-in host application. Everything cart-related — the button in
            the header, the slide-over and the live subtotal — is the self-contained cart
            micro-frontend.
          </Typography>
        </Box>
        <Grid container spacing={2.5}>
          {catalogue.map((product) => (
            <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 3 }}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box component="footer" sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Cart state is persisted to localStorage and synced across tabs. Try adding items, then
            open this page in a second tab.
          </Typography>
        </Container>
      </Box>

      {/* The micro-frontend's single mount point. */}
      <CartMount />
    </>
  );
}
