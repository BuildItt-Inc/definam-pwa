'use client';

import { useCallback, useRef } from 'react';

/**
 * Cursor-tracked spotlight hover effect, shared by every bordered/filled nav
 * button and every card on the landing page (see .spotlight in globals.css).
 * Sets --x/--y CSS custom properties to the pointer's position within the
 * element on every mousemove; the element's own ::before pseudo-element
 * reads them to position a radial-gradient glow that follows the cursor.
 */
export function useSpotlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--y', `${e.clientY - rect.top}px`);
  }, []);

  return { ref, onMouseMove };
}
