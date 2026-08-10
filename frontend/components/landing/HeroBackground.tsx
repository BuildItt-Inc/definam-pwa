'use client';

import { motion } from 'framer-motion';

// Static node/line layout (not runtime-random) so server and client render
// identically — same reasoning as FloatingSymbols. Spread across the FULL
// viewBox width now (previously clustered x:600-1000, right-weighted to
// sit only behind the phone) so the mesh reads as covering the whole hero
// on every breakpoint, mobile included.
const NODES = [
  { x: 60, y: 80 }, { x: 180, y: 200 }, { x: 120, y: 340 },
  { x: 260, y: 120 }, { x: 320, y: 280 }, { x: 220, y: 440 },
  { x: 420, y: 60 }, { x: 480, y: 220 }, { x: 400, y: 380 },
  { x: 560, y: 140 }, { x: 620, y: 340 }, { x: 540, y: 460 },
  { x: 700, y: 80 }, { x: 760, y: 240 }, { x: 680, y: 400 },
  { x: 860, y: 140 }, { x: 820, y: 320 }, { x: 940, y: 220 },
  { x: 1000, y: 400 }, { x: 1040, y: 100 },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 3], [1, 2], [2, 5], [3, 4], [3, 6], [4, 5], [4, 7],
  [6, 9], [7, 9], [7, 8], [8, 11], [9, 10], [9, 12], [10, 13],
  [12, 15], [13, 15], [13, 14], [15, 17], [16, 15], [16, 18], [17, 19],
];

/**
 * Layered hero background: deep ink→jade gradient, a sparse constellation
 * mesh spanning the full hero width, and 3 slow-drifting glow blobs. Pure
 * CSS/SVG, no image asset. Sits behind hero content via z-index; the
 * section using it adds `relative z-10` to its own content.
 *
 * `overlay`: `'left'` (default) is the hero's own left-anchored gradient,
 * tuned for its left-text/right-phone layout. `'center'` is a flat, even
 * dark wash instead — for sections that reuse this same background but
 * have centered content, where a directional gradient would darken one
 * side more than the other for no reason tied to the actual layout.
 */
export default function HeroBackground({ overlay = 'left' }: { overlay?: 'left' | 'center' }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base gradient: ink through a very dark jade, not flat navy */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #0D2818 58%, #0A0F1E 100%)' }}
      />

      {/* Glow blobs — soft, low-opacity, slow pulse/drift */}
      <motion.div
        className="absolute -left-24 top-[10%] h-72 w-72 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.22) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[8%] top-[-6%] h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(56,189,178,0.16) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[20%] h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.14) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Node network — sparse, now spans the full hero on every breakpoint.
          `xMidYMid slice` (center-cropped, not right-anchored) since the
          mesh itself is no longer right-weighted. No `hidden`/`sm:` gate —
          previously this was `hidden sm:block`, which is why it didn't
          render on mobile at all. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.28]"
        viewBox="0 0 1100 560"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {EDGES.map(([a, b], i) => (
          <line
            key={i}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
            stroke="#4ADE80"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
        ))}
        {NODES.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={i % 3 === 0 ? 3 : 2} fill="#EAFBF1" fillOpacity="0.6" />
        ))}
      </svg>

      {/* Contrast overlay — keeps copy readable over the mesh/glow. */}
      {overlay === 'left' ? (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(10,15,30,0.75) 0%, rgba(10,15,30,0.35) 45%, transparent 75%)' }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#0A0F1E]/55" />
      )}
    </div>
  );
}
