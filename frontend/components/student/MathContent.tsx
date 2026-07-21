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
 *   \$       →  literal dollar sign (not treated as a math delimiter)
 *
 * Narrow markdown support: **bold**, *italic*, `- `/`* `/`• ` bullet lists,
 * and `1. ` numbered lists (real <ul>/<ol> markup, not literal characters).
 *
 * Double newlines (\n\n) become paragraph breaks.
 * Single newlines (\n) become line breaks within a paragraph.
 *
 * KaTeX (+ mhchem for \ce{} chemistry notation) is loaded from CDN
 * (window.katex). Falls back to plain text gracefully.
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

// Placeholder for `\$` (escaped literal dollar) while math delimiters are
// being matched, so it never gets treated as a delimiter. Swapped back to
// a literal `$` once all other processing is done.
const ESCAPED_DOLLAR = '\u0000';

function buildHtml(
  text: string,
  katex: KatexRenderer,
  allowBlock: boolean,
): string {
  // Normalize newlines
  let normalizedText = text.replace(/\r\n/g, '\n');

  // Protect \$ (literal dollar sign) before any math-delimiter matching runs
  normalizedText = normalizedText.replace(/\\\$/g, ESCAPED_DOLLAR);

  // Insert double newlines before any step markers to start a new paragraph
  normalizedText = normalizedText.replace(/\n(?:\*\*|)?Step\s+(\d+)/gi, '\n\nStep $1');

  // Insert double newlines between the step header line and the following explanation text
  normalizedText = normalizedText.replace(/(^|\n)((?:\*\*|)?Step\s+\d+[:.]?.*?)(\n)(?!\n)/gi, '$2\n\n');

  // Split into paragraphs on double newlines
  const paragraphs = normalizedText.split(/\n{2,}/);

  const html = paragraphs
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

      return renderParagraph(trimmed, katex, allowBlock);
    })
    .filter(Boolean)
    .join('');

  return html.replace(new RegExp(ESCAPED_DOLLAR, 'g'), '$');
}

// ── List-aware paragraph renderer ──────────────────────────────────────────

const BULLET_RE = /^[-*•]\s+(.*)$/;
const NUMBERED_RE = /^(\d+)[.)]\s+(.*)$/;

// A paragraph may mix prose lines with bullet/numbered list lines (single
// newlines within a blank-line-delimited block). Walk it line by line,
// grouping consecutive lines of the same kind into <p>/<ul>/<ol> blocks.
function renderParagraph(
  trimmed: string,
  katex: KatexRenderer,
  allowBlock: boolean,
): string {
  const lines = trimmed.split('\n');
  const hasListLine = lines.some((line) => BULLET_RE.test(line) || NUMBERED_RE.test(line));

  if (!hasListLine) {
    const inner = renderInline(trimmed, katex, allowBlock);
    return `<p class="math-para mb-3 text-[15px] leading-relaxed text-ink/90">${inner}</p>`;
  }

  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const bulletMatch = lines[i].match(BULLET_RE);
    if (bulletMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(BULLET_RE);
        if (!m) break;
        items.push(m[1]);
        i++;
      }
      blocks.push(
        `<ul class="math-list mb-3 list-none pl-0 space-y-1">${items
          .map(
            (item) =>
              `<li class="flex gap-2"><span class="flex-shrink-0 text-ink/40">•</span><span class="flex-1 text-[15px] leading-relaxed text-ink/90">${renderInline(item, katex, allowBlock)}</span></li>`,
          )
          .join('')}</ul>`,
      );
      continue;
    }

    const numberedMatch = lines[i].match(NUMBERED_RE);
    if (numberedMatch) {
      const items: { num: string; text: string }[] = [];
      while (i < lines.length) {
        const m = lines[i].match(NUMBERED_RE);
        if (!m) break;
        items.push({ num: m[1], text: m[2] });
        i++;
      }
      blocks.push(
        `<ol class="math-list mb-3 list-none pl-0 space-y-1">${items
          .map(
            ({ num, text }) =>
              `<li class="flex gap-2"><span class="flex-shrink-0 font-semibold text-ink/40">${num}.</span><span class="flex-1 text-[15px] leading-relaxed text-ink/90">${renderInline(text, katex, allowBlock)}</span></li>`,
          )
          .join('')}</ol>`,
      );
      continue;
    }

    const textLines: string[] = [];
    while (i < lines.length && !BULLET_RE.test(lines[i]) && !NUMBERED_RE.test(lines[i])) {
      textLines.push(lines[i]);
      i++;
    }
    const inner = renderInline(textLines.join('\n'), katex, allowBlock);
    blocks.push(`<p class="math-para mb-3 text-[15px] leading-relaxed text-ink/90">${inner}</p>`);
  }

  return blocks.join('');
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
        .map((line) => renderTextMarkdown(line))
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
    ? /(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g
    : /(\$[^$]+?\$)/g;

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

// Narrow markdown support: **bold** and *italic* only. Bold is matched first
// so `**text**` never gets misread as `*` + text + `*` + text + `*`.
// Bullet/numbered list markers are stripped out (see renderParagraph) before
// this ever runs on a line, so a leading list `*` never reaches here as the
// start of a spurious italic run.
// Escapes everything else so no other markdown/HTML sneaks through.
const MARKDOWN_RE = /(\*\*[^*]+?\*\*|\*[^*]+?\*)/g;

function renderTextMarkdown(str: string): string {
  return str
    .split(MARKDOWN_RE)
    .map((chunk) => {
      if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length > 4) {
        return `<strong>${escapeHtml(chunk.slice(2, -2))}</strong>`;
      }
      if (chunk.startsWith('*') && chunk.endsWith('*') && chunk.length > 2) {
        return `<em>${escapeHtml(chunk.slice(1, -1))}</em>`;
      }
      return escapeHtml(chunk);
    })
    .join('');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
