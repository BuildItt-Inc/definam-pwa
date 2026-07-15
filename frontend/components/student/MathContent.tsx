'use client';

import { useEffect, useRef } from 'react';

interface MathContentProps {
  content: string;
  className?: string;
  /** If true, $$...$$ renders as a centred display block. Default true. */
  allowBlock?: boolean;
}

interface KatexRenderer {
  renderToString: (tex: string, options?: { displayMode?: boolean; throwOnError?: boolean }) => string;
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
      const globalWindow = window as unknown as { katex?: KatexRenderer };
      const katex = globalWindow.katex;
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
  katex: KatexRenderer,
  allowBlock: boolean,
): string {
  // Normalize newlines
  let normalizedText = text.replace(/\r\n/g, '\n');

  // Insert double newlines before any step markers to start a new paragraph
  normalizedText = normalizedText.replace(/\n(?:\*\*|)?Step\s+(\d+)/gi, '\n\nStep $1');

  // Insert double newlines between the step header line and the following explanation text
  normalizedText = normalizedText.replace(/(^|\n)((?:\*\*|)?Step\s+\d+[:.]?.*?)(\n)(?!\n)/gi, '$2\n\n');

  // Split into paragraphs on double newlines
  const paragraphs = normalizedText.split(/\n{2,}/);

  return paragraphs
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';

      // Check if this paragraph is a Step header line
      const stepHeaderMatch = trimmed.match(/^(?:\*\*|)?(Step\s+\d+[:.]?)(?:\*\*|)?\s*(.*)$/i);
      if (stepHeaderMatch) {
        const stepNum = stepHeaderMatch[1].trim();
        const stepTitle = stepHeaderMatch[2].trim();
        const renderedTitle = renderInline(stepTitle, katex, allowBlock);
        
        return `<div class="mt-6 mb-2">
          <h4 class="text-[15px] font-bold text-brand uppercase tracking-wider mb-1">${stepNum} ${renderedTitle}</h4>
        </div>`;
      }

      // Render standard paragraph text/prose/math
      const inner = renderInline(trimmed, katex, allowBlock);
      return `<p class="math-para mb-3 text-[15px] leading-relaxed text-ink/90">${inner}</p>`;
    })
    .filter(Boolean)
    .join('');
}


function renderInline(
  text: string,
  katex: KatexRenderer,
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
          return `<span class="math-inline">${katex.renderToString(part.math, { displayMode: false, throwOnError: false })}</span>`;
        } catch {
          return `<code class="math-err">${escapeHtml(part.math)}</code>`;
        }
      }
      // Plain text — single newlines become <br>
      let escapedLines = part.text
        .split('\n')
        .map((line) => escapeHtml(line))
        .join('<br />');

      // Auto-convert standard plain-text fractions (e.g. 1/3, 3/4) to KaTeX, avoiding dates and URLs
      escapedLines = escapedLines.replace(/(?<!\/)\b(\d+)\/(\d+)\b(?!\/)/g, (match, num, den) => {
        try {
          return `<span class="math-inline">${katex.renderToString(`\\frac{${num}}{${den}}`, { displayMode: false, throwOnError: false })}</span>`;
        } catch {
          return match;
        }
      });

      return escapedLines;
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
