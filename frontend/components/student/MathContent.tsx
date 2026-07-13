'use client';

import { useEffect, useRef } from 'react';

interface MathContentProps {
  content: string;
  className?: string;
  /** If true, block display equations ($$...$$) are centred. Default true. */
  allowBlock?: boolean;
}

/**
 * MathContent
 * -----------
 * Renders a string that may contain LaTeX math delimited by:
 *   - $...$ for inline math
 *   - $$...$$ for display (block) math
 *
 * All other text is rendered as-is. Line breaks (\n) become visual line breaks.
 *
 * Uses KaTeX loaded from CDN (window.katex). Falls back to plain text gracefully
 * if KaTeX hasn't loaded yet on very slow connections.
 */
export function MathContent({ content, className = '', allowBlock = true }: MathContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !content) return;

    // Poll for KaTeX up to 3s — it's loaded via afterInteractive CDN script
    let attempts = 0;
    const render = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const katex = (window as any).katex;
      if (!katex) {
        if (attempts++ < 30) setTimeout(render, 100);
        return;
      }

      const el = ref.current!;
      el.innerHTML = buildHtml(content, katex, allowBlock);
    };

    render();
  }, [content, allowBlock]);

  // Render plain text immediately (SSR + first paint), then hydrate with math
  return (
    <div
      ref={ref}
      className={`math-content leading-relaxed ${className}`}
      suppressHydrationWarning
    >
      {/* Plain text fallback rendered server-side */}
      {content}
    </div>
  );
}

// ── Build HTML string with KaTeX-rendered math segments ───────────────────

function buildHtml(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  katex: any,
  allowBlock: boolean,
): string {
  // Split on $$...$$ (display) and $...$ (inline)
  // Order matters: match $$ first so we don't accidentally eat display delimiters
  const parts = splitMath(text, allowBlock);

  return parts
    .map((part) => {
      if (part.type === 'block') {
        try {
          return `<div class="math-block my-4 overflow-x-auto text-center">${katex.renderToString(part.math, { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return `<div class="math-block my-4 text-center font-mono text-sm">${escapeHtml(part.math)}</div>`;
        }
      }
      if (part.type === 'inline') {
        try {
          return katex.renderToString(part.math, { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="font-mono text-sm">${escapeHtml(part.math)}</span>`;
        }
      }
      // Plain text — convert \n to <br> and preserve spacing
      return part.text
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br />');
    })
    .join('');
}

type Segment =
  | { type: 'block'; math: string }
  | { type: 'inline'; math: string }
  | { type: 'text'; text: string };

function splitMath(text: string, allowBlock: boolean): Segment[] {
  const segments: Segment[] = [];
  // Regex: match $$...$$ or $...$ (non-greedy, no newlines inside inline)
  const pattern = allowBlock
    ? /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g
    : /(\$[^$\n]+?\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    const raw = match[1];
    if (allowBlock && raw.startsWith('$$')) {
      segments.push({ type: 'block', math: raw.slice(2, -2).trim() });
    } else {
      segments.push({ type: 'inline', math: raw.slice(1, -1).trim() });
    }

    lastIndex = match.index + raw.length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return segments;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
