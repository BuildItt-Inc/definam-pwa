import type { Metadata, Viewport } from 'next';
import LandingPage from '@/components/landing/LandingPage';

// `export const metadata` requires a Server Component — the actual page body
// is interactive (cursor-tracked spotlight hover, mobile menu) so it lives in
// a separate 'use client' component.
export const metadata: Metadata = {
  title: 'Recall: Study smarter. Remember longer.',
  description:
    'A modern study platform for Nigerian secondary school students. Clear explanations, real world examples, and an AI tutor built to help you actually retain what you learn.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Recall',
  },
  openGraph: {
    title: 'Recall',
    description: 'A modern study platform for Nigerian secondary school students.',
    url: 'https://definam.ng',
    siteName: 'Recall',
    locale: 'en_NG',
    type: 'website',
  },
};

export const viewport: Viewport = {};

export default function Page() {
  return <LandingPage />;
}
