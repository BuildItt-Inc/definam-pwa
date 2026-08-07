'use client';

import { motion } from 'framer-motion';

// Static node/line layout (not runtime-random) so server and client render
// identically — same reasoning as FloatingSymbols. Weighted toward the
// right half of the viewBox so the mesh sits behind the phone mockup,
// keeping the left (text) side clean per the brief.
const NODES = [
  { x: 640, y: 60 }, { x: 760, y: 140 }, { x: 700, y: 240 },
  { x: 860, y: 90 }, { x: 900, y: 220 }, { x: 820, y: 320 },
  { x: 950, y: 340 }, { x: 680, y: 400 }, { x: 780, y: 460 },
  { x: 920, y: 470 }, { x: 600, y: 320 }, { x: 1000, y: 150 },
];

const EDGES: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [2, 10],
  [5, 6], [5, 8], [8, 9], [7, 8], [2, 7], [3, 11], [4, 11],
];

/**
 * Layered hero background: deep ink→jade gradient, a sparse constellation
 * mesh (right side, behind the phone), and 3 slow-drifting glow blobs.
 * Pure CSS/SVG, no image asset. Sits behind hero content via z-index; the
 * hero itself adds `relative z-10` to its content column.
 */
export default function HeroBackground() {
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

      {/* Node network — sparse, right-weighted, low opacity */}
      <svg
        className="absolute inset-0 hidden h-full w-full opacity-[0.35] sm:block"
        viewBox="0 0 1100 560"
        preserveAspectRatio="xMaxYMid slice"
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

      {/* Left-side contrast overlay — keeps hero copy readable over the mesh/glow */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(10,15,30,0.75) 0%, rgba(10,15,30,0.35) 45%, transparent 75%)' }}
      />
    </div>
  );
}
