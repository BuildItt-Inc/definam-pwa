import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';

// `export const metadata` requires a Server Component — the actual page body
// is interactive (cursor-tracked spotlight hover, mobile menu) so it lives in
// a separate 'use client' component.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` :
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ),
  title: 'Recall: Study smarter. Remember longer.',
  description:
    'A modern study platform for secondary school students. Clear explanations, real world examples, and an AI tutor built to help you actually retain what you learn.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Recall',
  },
  openGraph: {
    title: 'Recall',
    description: 'A modern study platform for secondary school students.',
    url: '/',
    siteName: 'Recall',
    locale: 'en_US',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      {/* Zero-latency early redirect for installed PWA / returning students.
          Runs before React mounts or DOM paints to guarantee no landing page flash. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
                var hasProfile = !!localStorage.getItem('recall_student_profile');
                if (isStandalone && hasProfile) {
                  document.documentElement.style.display = 'none';
                  window.location.replace('/student');
                }
              } catch(e) {}
            })();
          `,
        }}
      />
      <LandingPage />
    </>
  );
}
