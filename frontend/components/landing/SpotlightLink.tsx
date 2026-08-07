'use client';

import Link from 'next/link';
import { useSpotlight } from '@/hooks/useSpotlight';

/**
 * Cursor-tracked spotlight hover link — shared by the nav, the hero CTAs,
 * and the "For Schools" band. Extracted out of `LandingPage.tsx` (where it
 * was originally defined inline) so `LandingNav`/`LandingHero` can use it
 * too without duplicating it per file.
 */
export default function SpotlightLink({
  href,
  filled = false,
  className = '',
  children,
}: {
  href: string;
  filled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, onMouseMove } = useSpotlight<HTMLAnchorElement>();
  return (
    <Link
      ref={ref}
      onMouseMove={onMouseMove}
      href={href}
      className={`spotlight relative overflow-hidden rounded-[10px] border px-[18px] py-[9px] text-[14px] font-semibold transition-colors ${
        filled
          ? 'spotlight-filled border-jade bg-jade text-white hover:bg-jade-dark'
          : 'border-white/[0.18] bg-white/[0.04] text-white hover:border-jade-light/50'
      } ${className}`}
    >
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
