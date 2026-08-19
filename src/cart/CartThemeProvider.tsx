'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import type { ReactNode } from 'react';
import { cartTheme } from './theme';

/**
 * Wraps a subtree in the cart's MUI theme, with Next's App Router emotion
 * cache wired up (so styles land in the initial SSR payload instead of
 * flashing unstyled). Host apps that already run their own MUI theme can
 * skip this and just import `cartTheme` to align their own ThemeProvider.
 */
export function CartThemeProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={cartTheme} defaultMode="system">
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
