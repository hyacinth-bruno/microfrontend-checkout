import { createTheme } from '@mui/material/styles';

/**
 * Shared MUI theme for the cart MFE (and the demo host, so the storefront
 * chrome and the cart read as one product). Palette/radius values mirror the
 * design tokens in `globals.css` (`--color-brand`, `--radius-control`, …) so
 * switching state libraries or UI kits never has to mean re-picking colors.
 */
export const cartTheme = createTheme({
  cssVariables: { colorSchemeSelector: 'media' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#0f172a', dark: '#1e293b', contrastText: '#ffffff' }, // slate-900 / slate-800
        success: { main: '#059669' }, // emerald-600
        warning: { main: '#d97706' }, // amber-600
        error: { main: '#dc2626' }, // red-600
        background: { default: '#f8fafc', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#f8fafc', dark: '#e2e8f0', contrastText: '#0f172a' },
        success: { main: '#10b981' },
        warning: { main: '#fbbf24' },
        error: { main: '#f87171' },
        background: { default: '#0f172a', paper: '#1e293b' },
      },
    },
  },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  shape: { borderRadius: 8 }, // --radius-control
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 16 } }, // --radius-panel
    },
  },
});
