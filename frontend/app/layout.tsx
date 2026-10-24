import './globals.css';
import type { Metadata } from 'next';
import { Inter, Roboto } from 'next/font/google';
import { typographyPlatformScript } from '@/lib/typography';
import { AppToaster } from '@/components/ui/AppToaster';
import { CelebrationProvider } from '@/components/ui/celebration/CelebrationContext';
import AuthSyncListener from '@/components/AuthSyncListener';
import PWARegistration from '@/components/PWARegistration';

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
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  title: 'Recall — Study Smarter',
  description: 'AI-powered spaced-repetition learning for secondary school students',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Recall',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
      { url: '/icons/icon-192.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Recall" />
        <link rel="preload" href="/recall-logo2.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/recall-logo.svg" as="image" type="image/svg+xml" />
        <script dangerouslySetInnerHTML={{ __html: typographyPlatformScript }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.pathname === '/') {
                try {
                  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
                  var hasProfile = !!localStorage.getItem('recall_student_profile');
                  if (isStandalone || hasProfile) {
                    document.documentElement.style.visibility = 'hidden';
                    document.documentElement.style.background = '#111827';
                    window.location.replace('/student');
                  }
                } catch(e) {}
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__pwaPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__pwaPrompt = e;
                window.dispatchEvent(new Event('pwa-prompt-ready'));
              });
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${roboto.variable} min-h-screen bg-bg-0 font-sans text-ink antialiased`}
      >
        <CelebrationProvider>
          {children}
          <AppToaster />
        </CelebrationProvider>
        <AuthSyncListener />
        <PWARegistration />
      </body>
    </html>
  );
}
