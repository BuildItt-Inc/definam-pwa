import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';

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

export default async function Page() {
  // Edge / Server-side instant redirect: authenticated users never receive landing page HTML
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (refreshToken) {
    try {
      const [, payloadB64] = refreshToken.split('.');
      if (payloadB64) {
        const json = Buffer.from(payloadB64, 'base64').toString('utf-8');
        const payload = JSON.parse(json) as Record<string, unknown>;
        const now = Math.floor(Date.now() / 1000);
        const exp = typeof payload.exp === 'number' ? payload.exp : 0;
        if (!exp || exp > now) {
          const role = typeof payload.role === 'string' ? payload.role : '';
          if (role.startsWith('student')) {
            redirect('/student');
          }
          if (role === 'admin') {
            redirect('/admin');
          }
        }
      }
    } catch (err: unknown) {
      // In Next.js, redirect() throws a NEXT_REDIRECT error which must be re-thrown
      if (err && typeof err === 'object' && 'digest' in err && typeof (err as { digest?: unknown }).digest === 'string' && (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')) {
        throw err;
      }
    }
  }

  return <LandingPage />;
}
