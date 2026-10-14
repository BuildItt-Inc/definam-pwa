import './globals.css';
import type { Metadata } from 'next';
import { Inter, Roboto } from 'next/font/google';
import { typographyPlatformScript } from '@/lib/typography';
import { AppToaster } from '@/components/ui/AppToaster';
import { CelebrationProvider } from '@/components/ui/celebration/CelebrationContext';
import AuthSyncListener from '@/components/AuthSyncListener';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-roboto',
  display: 'swap',
  preload: false,
});

import type { Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Recall PWA',
  description: 'AI-powered learning for secondary school students',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: typographyPlatformScript }} />
      </head>
      <body
        className={`${inter.variable} ${roboto.variable} min-h-screen bg-bg-0 font-sans text-ink antialiased`}
      >
        <CelebrationProvider>
          {children}
          <AppToaster />
        </CelebrationProvider>
        <AuthSyncListener />
      </body>
    </html>
  );
}
