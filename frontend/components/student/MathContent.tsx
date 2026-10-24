'use client';

import { useEffect, useMemo, useState } from 'react';

interface MathContentProps {
  content: string;
  className?: string;
  /** If true, $$...$$ renders as a centred display block. Default true. */
  allowBlock?: boolean;
  /** If true, renders a blinking cursor at the end of streamed content */
  isStreaming?: boolean;
}

interface KatexRenderer {
  renderToString: (tex: string, options?: { displayMode?: boolean; throwOnError?: boolean }) => string;
}

/**
 * MathContent
 * -----------
 * Renders mixed prose + LaTeX math content safely without React virtual DOM reconciliation bugs.
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
  isStreaming = false,
}: MathContentProps) {
  const [katexLoaded, setKatexLoaded] = useState<boolean>(() => {
    return typeof window !== 'undefined' && !!(window as unknown as { katex?: KatexRenderer }).katex;
  });

  useEffect(() => {
    if (katexLoaded) return;
    const checkKatex = () => {
      if (typeof window !== 'undefined' && (window as unknown as { katex?: KatexRenderer }).katex) {
        setKatexLoaded(true);
        return true;
      }
      return false;
    };

    if (checkKatex()) return;

    const interval = setInterval(() => {
      if (checkKatex()) clearInterval(interval);
    }, 150);

    const onKatexReady = () => setKatexLoaded(true);
    window.addEventListener('katex-ready', onKatexReady);

    return () => {
      clearInterval(interval);
      window.removeEventListener('katex-ready', onKatexReady);
    };
  }, [katexLoaded]);

  const html = useMemo(() => {
    if (!content) return '';
    const katex = typeof window !== 'undefined'
      ? (window as unknown as { katex?: KatexRenderer }).katex
      : undefined;

    if (katexLoaded && katex) {
      try {
        return buildHtml(content, katex, allowBlock);
      } catch (e) {
        return formatPlainText(content);
      }
    }
    return formatPlainText(content);
  }, [content, allowBlock, katexLoaded]);

  const cursorHtml = isStreaming
    ? '<span class="inline-block w-1.5 h-3.5 ml-1 rounded-[1px] bg-brand animate-pulse align-middle" aria-hidden="true"></span>'
    : '';

  // Use dangerouslySetInnerHTML exclusively so React never diffs child text nodes against KaTeX-injected DOM
  return (
    <div
      className={`math-content ${className}`}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html + cursorHtml }}
    />
  );
}

// ── Plain text fallback formatter ──────────────────────────────────────────

function formatPlainText(text: string): string {
  if (!text) return '';
  try {
    return buildHtml(text, undefined, false);
  } catch {
    const normalized = text.replace(/\r\n/g, '\n');
    return normalized
      .split(/\n{2,}/)
      .map((para) => {
        const trimmed = para.trim();
        if (!trimmed) return '';
        return `<p class="math-para mb-3 text-[14.5px] leading-relaxed text-ink/90">${renderTextMarkdown(trimmed.replace(/\n/g, '<br />'))}</p>`;
      })
      .join('');
  }
}

// ── HTML builder ───────────────────────────────────────────────────────────

// Placeholder for `\$` (escaped literal dollar) while math delimiters are
// being matched, so it never gets treated as a delimiter. Swapped back to
// a literal `$` once all other processing is done.
const ESCAPED_DOLLAR = '\u0000';

function buildHtml(
  text: string,
  katex: KatexRenderer | undefined,
  allowBlock: boolean,
): string {
  if (!text) return '';
  try {
    // Normalize newlines
    let normalizedText = text.replace(/\r\n/g, '\n');

    // Protect \$ (literal dollar sign) before any math-delimiter matching runs
    normalizedText = normalizedText.replace(/\\\$/g, ESCAPED_DOLLAR);

    // Extract fenced code blocks first so math and formatting don't corrupt code
    const codeBlocks: string[] = [];
    normalizedText = normalizedText.replace(/```(?:[a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, code) => {
      codeBlocks.push(code.trimEnd());
      return `\n\n\u0001CODE_BLOCK_${codeBlocks.length - 1}\u0001\n\n`;
    });

    // Normalize bold wrapped around headings e.g. **### Heading** -> ### Heading
    normalizedText = normalizedText.replace(/(^|\n)\s*\*\*(#{1,6}\s+[^\n*]+)\*\*/g, '$1$2');

    // Isolate markdown headings so they are always their own clean block
    normalizedText = normalizedText.replace(/(^|\n)\s*(#{1,6}\s+[^\n]+)/g, '\n\n$2\n\n');

    // Insert double newlines before any step markers to start a new paragraph
    normalizedText = normalizedText.replace(/\n(?:\*\*|)?Step\s+(\d+)/gi, '\n\nStep $1');

    // Insert double newlines between the step header line and the following explanation text
    normalizedText = normalizedText.replace(/(^|\n)((?:\*\*|)?Step\s+\d+[:.]?.*?)(\n)(?!\n)/gi, '$2\n\n');

    // Isolate horizontal rules
    normalizedText = normalizedText.replace(/(^|\n)\s*(\*{3,}|-{3,}|_{3,})\s*(\n|$)/g, '\n\n$2\n\n');

    // Split into paragraphs on double newlines
    const paragraphs = normalizedText.split(/\n{2,}/);

    const html = paragraphs
      .map((para) => {
        const trimmed = para.trim();
        if (!trimmed) return '';

        // Check if this paragraph is a fenced code block
        const codeBlockMatch = trimmed.match(/^\u0001CODE_BLOCK_(\d+)\u0001$/);
        if (codeBlockMatch) {
          const rawCode = codeBlocks[Number(codeBlockMatch[1])] || '';
          return `<pre class="my-3 overflow-x-auto rounded-xl bg-bg-2 p-3.5 font-mono text-[13px] leading-relaxed text-ink border border-border"><code>${escapeHtml(rawCode)}</code></pre>`;
        }

        // Check if this paragraph is a horizontal rule
        if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
          return '<hr class="my-4 border-t border-border-2" />';
        }

        // Check if this paragraph is a Step header line
        const stepHeaderMatch = trimmed.match(/^(?:\*\*|)?(Step\s+\d+[:.]?)(?:\*\*|)?\s*(.*)$/i);
        if (stepHeaderMatch) {
          const stepNum = stepHeaderMatch[1].trim();
          const stepTitle = stepHeaderMatch[2].trim();
          const renderedTitle = renderInline(stepTitle, katex, allowBlock);

          return `<div class="mt-4 mb-2">
            <h4 class="text-[14px] font-bold text-brand uppercase tracking-wider mb-1">${stepNum} ${renderedTitle}</h4>
          </div>`;
        }

        // Check if this paragraph is a Markdown heading (#, ##, ###, ####, etc.)
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingText = headingMatch[2].trim();
          const renderedHeading = renderInline(headingText, katex, allowBlock);

          if (level === 1) {
            return `<h3 class="mt-4 mb-1.5 text-[16px] font-bold text-ink leading-snug">${renderedHeading}</h3>`;
          }
          if (level === 2) {
            return `<h4 class="mt-3.5 mb-1.5 text-[15px] font-bold text-ink leading-snug">${renderedHeading}</h4>`;
          }
          if (level === 3) {
            return `<h5 class="mt-3 mb-1 text-[14px] font-bold text-ink leading-snug">${renderedHeading}</h5>`;
          }
          return `<h6 class="mt-2.5 mb-1 text-[13.5px] font-semibold text-ink/90 leading-snug">${renderedHeading}</h6>`;
        }

        // Check if this paragraph is a blockquote (> quote)
        if (trimmed.startsWith('>')) {
          const quoteLines = trimmed
            .split('\n')
            .map((line) => line.replace(/^>\s*/, ''))
            .join(' ');
          const renderedQuote = renderInline(quoteLines, katex, allowBlock);
          return `<blockquote class="my-2.5 border-l-2 border-brand/60 pl-3 italic text-ink/85 text-[13.5px] leading-relaxed">${renderedQuote}</blockquote>`;
        }

        return renderParagraph(trimmed, katex, allowBlock);
      })
      .filter(Boolean)
      .join('');

    return html.replace(new RegExp(ESCAPED_DOLLAR, 'g'), '$');
  } catch (err) {
    console.error('KaTeX buildHtml fallback:', err);
    return `<p class="math-para mb-3 text-[14.5px] leading-relaxed text-ink/90">${renderTextMarkdown(text)}</p>`;
  }
}

// ── List-aware paragraph renderer ──────────────────────────────────────────

const BULLET_RE = /^[-*•]\s+(.*)$/;
const NUMBERED_RE = /^(\d+)[.)]\s+(.*)$/;

function renderParagraph(
  trimmed: string,
  katex: KatexRenderer | undefined,
  allowBlock: boolean,
): string {
  const lines = trimmed.split('\n');
  const hasListLine = lines.some((line) => BULLET_RE.test(line) || NUMBERED_RE.test(line));

  if (!hasListLine) {
    const inner = renderInline(trimmed, katex, allowBlock);
    return `<p class="math-para mb-3 text-[14.5px] leading-relaxed text-ink/90">${inner}</p>`;
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
        `<ul class="math-list mb-3 list-none pl-0 space-y-1.5">${items
          .map(
            (item) =>
              `<li class="flex gap-2"><span class="flex-shrink-0 text-brand font-bold">•</span><span class="flex-1 text-[14.5px] leading-relaxed text-ink/90">${renderInline(item, katex, allowBlock)}</span></li>`,
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
        `<ol class="math-list mb-3 list-none pl-0 space-y-1.5">${items
          .map(
            ({ num, text }) =>
              `<li class="flex gap-2"><span class="flex-shrink-0 font-semibold text-brand">${num}.</span><span class="flex-1 text-[14.5px] leading-relaxed text-ink/90">${renderInline(text, katex, allowBlock)}</span></li>`,
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
    blocks.push(`<p class="math-para mb-3 text-[14.5px] leading-relaxed text-ink/90">${inner}</p>`);
  }

  return blocks.join('');
}

function renderInline(
  text: string,
  katex: KatexRenderer | undefined,
  allowBlock: boolean,
): string {
  const segments = splitMath(text, allowBlock);

  return segments
    .map((part) => {
      if (part.type === 'block') {
        if (katex) {
          try {
            return `<span class="math-block">${katex.renderToString(part.math, { displayMode: true, throwOnError: false })}</span>`;
          } catch {
            return `<code class="math-err">${escapeHtml(part.math)}</code>`;
          }
        }
        return `<code class="math-err">${escapeHtml(part.math)}</code>`;
      }
      if (part.type === 'inline') {
        if (katex) {
          try {
            return `<span class="math-inline">${katex.renderToString(part.math, { displayMode: false, throwOnError: false })}</span>`;
          } catch {
            return `<code class="math-err">${escapeHtml(part.math)}</code>`;
          }
        }
        return `<code class="math-err">${escapeHtml(part.math)}</code>`;
      }
      // Plain text — single newlines become <br>
      let escapedLines = part.text
        .split('\n')
        .map((line) => renderTextMarkdown(line))
        .join('<br />');

      // Auto-convert standard plain-text fractions (e.g. 1/3, 3/4) to KaTeX, avoiding dates and URLs
      if (katex) {
        try {
          escapedLines = escapedLines.replace(/(?<!\/)\b(\d+)\/(\d+)\b(?!\/)/g, (match, num, den) => {
            try {
              return `<span class="math-inline">${katex.renderToString(`\\frac{${num}}{${den}}`, { displayMode: false, throwOnError: false })}</span>`;
            } catch {
              return match;
            }
          });
        } catch {
          // Fallback safely
        }
      }

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

function renderTextMarkdown(str: string): string {
  // First, extract inline code `code` so bold/italic inside code doesn't get formatted
  const codeSegments: string[] = [];
  let s = str.replace(/`([^`]+)`/g, (_, code) => {
    codeSegments.push(code);
    return `\u0002CODE_${codeSegments.length - 1}\u0002`;
  });

  // Strip any stray hashtags in inline text e.g. "### Note:"
  s = s.replace(/(^|\s)#{1,6}\s+/g, '$1');

  // Escape HTML before injecting safe tags
  s = escapeHtml(s);

  // Strikethrough ~~text~~
  s = s.replace(/~~([^~]+?)~~/g, '<del class="text-faint">$1</del>');

  // Bold + Italic ***text***
  s = s.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');

  // Bold **text**
  s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  s = s.replace(/(^|[^\w*])\*([^*\n]+?)\*([^\w*]|$)/g, '$1<em>$2</em>$3');

  // Restore inline code safely
  s = s.replace(/\u0002CODE_(\d+)\u0002/g, (_, idx) => {
    const raw = codeSegments[Number(idx)] || '';
    return `<code class="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-[13px] text-ink border border-border/60">${escapeHtml(raw)}</code>`;
  });

  return s;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
