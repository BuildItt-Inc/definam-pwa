'use client';

import { useEffect, useRef } from 'react';

interface MathContentProps {
  content: string;
  className?: string;
  /** If true, $$...$$ renders as a centred display block. Default true. */
  allowBlock?: boolean;
}

/**
 * MathContent
 * -----------
 * Renders mixed prose + LaTeX math content.
 *
 * Delimiters:
 *   $$...$$  →  display (block) math, centred
 *   $...$    →  inline math
 *
 * Double newlines (\n\n) become paragraph breaks.
 * Single newlines (\n) become line breaks within a paragraph.
 *
 * KaTeX is loaded from CDN (window.katex). Falls back to plain text gracefully.
 */
export function MathContent({
  content,
  className = '',
  allowBlock = true,
}: MathContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !content) return;

    let attempts = 0;
    const render = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const katex = (window as any).katex;
      if (!katex) {
        if (attempts++ < 30) setTimeout(render, 100);
        return;
      }
      ref.current!.innerHTML = buildHtml(content, katex, allowBlock);
    };

    render();
  }, [content, allowBlock]);

  // Server-side / first-paint: show plain text, hydrate after KaTeX loads
  return (
    <div ref={ref} className={`math-content ${className}`} suppressHydrationWarning>
      {content}
    </div>
  );
}

// ── HTML builder ───────────────────────────────────────────────────────────

function buildHtml(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  katex: any,
  allowBlock: boolean,
): string {
  // Split into paragraphs on double newlines first
  const paragraphs = text.split(/\n{2,}/);

  return paragraphs
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';

      // Render inline content (may contain $...$ and $$...$$)
      const inner = renderInline(trimmed, katex, allowBlock);

      // Each paragraph gets its own block — line breaks inside become <br>
      return `<p class="math-para">${inner}</p>`;
    })
    .filter(Boolean)
    .join('');
}

function renderInline(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  katex: any,
  allowBlock: boolean,
): string {
  const segments = splitMath(text, allowBlock);

  return segments
    .map((part) => {
      if (part.type === 'block') {
        try {
          return `<span class="math-block">${katex.renderToString(part.math, { displayMode: true, throwOnError: false })}</span>`;
        } catch {
          return `<code class="math-err">${escapeHtml(part.math)}</code>`;
        }
      }
      if (part.type === 'inline') {
        try {
          return katex.renderToString(part.math, { displayMode: false, throwOnError: false });
        } catch {
          return `<code class="math-err">${escapeHtml(part.math)}</code>`;
        }
      }
      // Plain text — single newlines become <br>
      return part.text
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br />');
    })
    .join('');
}

// ── Math segment splitter ──────────────────────────────────────────────────

type Segment =
  | { type: 'block'; math: string }
  | { type: 'inline'; math: string }
  | { type: 'text'; text: string };

function splitMath(text: string, allowBlock: boolean): Segment[] {
  const segments: Segment[] = [];
  const pattern = allowBlock
    ? /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g
    : /(\$[^$\n]+?\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
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
