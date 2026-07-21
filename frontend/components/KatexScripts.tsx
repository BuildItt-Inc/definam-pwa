'use client';

import { useState } from 'react';
import Script from 'next/script';

// mhchem extends window.katex, so it must not load until katex.min.js has
// actually finished executing — two independent afterInteractive <Script>
// tags don't guarantee that order, so mhchem is gated on katex's onLoad.
export function KatexScripts() {
  const [katexLoaded, setKatexLoaded] = useState(false);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={() => setKatexLoaded(true)}
      />
      {katexLoaded && (
        <Script
          src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/mhchem.min.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
