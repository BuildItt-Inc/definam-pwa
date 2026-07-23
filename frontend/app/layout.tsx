import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { KatexScripts } from '@/components/KatexScripts';
import { AppToaster } from '@/components/ui/AppToaster';
import { CelebrationProvider } from '@/components/ui/celebration/CelebrationContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Recall PWA',
  description: "Nigeria's AI learning brain for secondary school students",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* KaTeX CSS — renders LaTeX math beautifully, child-friendly */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} min-h-screen bg-bg-0 font-sans text-ink antialiased`}
      >
        <CelebrationProvider>
          {children}
          <AppToaster />
        </CelebrationProvider>
        {/* KaTeX JS + mhchem — loaded after page content, never blocks render */}
        <KatexScripts />
      </body>
    </html>
  );
}
