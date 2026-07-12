import './globals.css';
import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '600'],
});

export const metadata: Metadata = {
  title: 'DefinAm PWA',
  description: "Nigeria's AI learning brain for secondary school students",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${dmSans.variable} font-dm-sans bg-bg-0 text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
