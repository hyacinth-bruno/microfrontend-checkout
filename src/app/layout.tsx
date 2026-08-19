import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cart · Micro-frontend demo',
  description: 'A standalone, embeddable shopping cart built with Next.js, Tailwind and Zustand.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
