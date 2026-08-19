import type { Metadata } from 'next';
import { CartThemeProvider } from '@/cart/CartThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cart · Micro-frontend demo',
  description: 'A standalone, embeddable shopping cart built with Next.js, MUI and Redux.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <CartThemeProvider>{children}</CartThemeProvider>
      </body>
    </html>
  );
}
