export interface KatexRenderer {
  renderToString: (
    tex: string,
    options?: { displayMode?: boolean; throwOnError?: boolean },
  ) => string;
}

export function cleanMathPlainText(tex: string): string {
  return escapeHtml(tex)
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\(?:rightarrow|to)\b/g, '→')
    .replace(/\\leftarrow\b/g, '←')
    .replace(/\\leftrightarrow\b/g, '↔')
    .replace(/\\(?:times|cdot)\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\pm\b/g, '±')
    .replace(/\\(?:le|leq)\b/g, '≤')
    .replace(/\\(?:ge|geq)\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\ce\{([^}]+)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .trim();
}

export function formatPlainText(text: string): string {
  if (!text) return '';
  try {
    return buildHtml(text, undefined, true);
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

// Placeholder for `\$` (escaped literal dollar) while math delimiters are
// being matched, so it never gets treated as a delimiter.
const ESCAPED_DOLLAR = '\u0000';

export function buildHtml(
  text: string,
  katex: KatexRenderer | undefined,
  allowBlock: boolean,
): string {
  if (!text) return '';
  try {
    let normalizedText = text.replace(/\r\n/g, '\n');
    normalizedText = normalizedText.replace(/\\\$/g, ESCAPED_DOLLAR);

    // Extract fenced code blocks first so math and formatting don't corrupt code
    const codeBlocks: string[] = [];
    normalizedText = normalizedText.replace(/```(?:[a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_, code) => {
      codeBlocks.push(code.trimEnd());
      return `\n\n\u0001CODE_BLOCK_${codeBlocks.length - 1}\u0001\n\n`;
    });

    // Extract display math blocks (\[...\] or $$...$$) so multi-line equations aren't split by \n{2,}
    const mathBlocks: string[] = [];
    normalizedText = normalizedText.replace(/(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)/g, (match) => {
      mathBlocks.push(match);
      return `\n\n\u0001MATH_BLOCK_${mathBlocks.length - 1}\u0001\n\n`;
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

    const paragraphs = normalizedText.split(/\n{2,}/);

    const html = paragraphs
      .map((para) => {
        const trimmed = para.trim();
        if (!trimmed) return '';

        const mathBlockMatch = trimmed.match(/^\u0001MATH_BLOCK_(\d+)\u0001$/);
        if (mathBlockMatch) {
          const rawMath = mathBlocks[Number(mathBlockMatch[1])] || '';
          const mathContent = rawMath.startsWith('$$')
            ? rawMath.slice(2, -2).trim()
            : rawMath.startsWith('\\[')
              ? rawMath.slice(2, -2).trim()
              : rawMath;

          if (katex) {
            try {
              const rendered = katex.renderToString(mathContent, { displayMode: true, throwOnError: false });
              return `<div class="my-2.5 overflow-x-auto text-center"><span class="math-block inline-block max-w-full">${rendered}</span></div>`;
            } catch {
              return `<div class="my-2 text-center font-mono text-[13.5px] text-ink bg-bg-2 py-2 px-3 rounded-xl border border-border">${cleanMathPlainText(mathContent)}</div>`;
            }
          }
          return `<div class="my-2 text-center font-mono text-[13.5px] text-ink bg-bg-2 py-2 px-3 rounded-xl border border-border">${cleanMathPlainText(mathContent)}</div>`;
        }

        const codeBlockMatch = trimmed.match(/^\u0001CODE_BLOCK_(\d+)\u0001$/);
        if (codeBlockMatch) {
          const rawCode = codeBlocks[Number(codeBlockMatch[1])] || '';
          return `<pre class="my-3 overflow-x-auto rounded-xl bg-bg-2 p-3.5 font-mono text-[13px] leading-relaxed text-ink border border-border"><code>${escapeHtml(rawCode)}</code></pre>`;
        }

        if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
          return '<hr class="my-4 border-t border-border-2" />';
        }

        const stepHeaderMatch = trimmed.match(/^(?:\*\*|)?(Step\s+\d+[:.]?)(?:\*\*|)?\s*(.*)$/i);
        if (stepHeaderMatch) {
          const stepNum = stepHeaderMatch[1].trim();
          const stepTitle = stepHeaderMatch[2].trim();
          const renderedTitle = renderInline(stepTitle, katex, allowBlock);

          return `<div class="mt-4 mb-2">
            <h4 class="text-[14px] font-bold text-brand uppercase tracking-wider mb-1">${stepNum} ${renderedTitle}</h4>
          </div>`;
        }

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

// ── List- & table-aware paragraph renderer ──────────────────────────────────

const BULLET_RE = /^[-*•]\s+(.*)$/;
const NUMBERED_RE = /^(\d+)[.)]\s+(.*)$/;
const STANDALONE_BOLD_RE = /^\*\*([^*\n]{1,100})\*\*$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)+\|?\s*$/;

function splitTableCells(row: string): string[] {
  let trimmed = row.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
  if (trimmed.endsWith('|') && !trimmed.endsWith('\\|')) trimmed = trimmed.slice(0, -1);
  return trimmed.split(/(?<!\\)\|/).map((cell) => cell.replace(/\\\|/g, '|').trim());
}

function parseTableAlignments(sepRow: string): Array<'left' | 'center' | 'right'> {
  return splitTableCells(sepRow).map((cell) => {
    const t = cell.trim();
    const startsColon = t.startsWith(':');
    const endsColon = t.endsWith(':');
    if (startsColon && endsColon) return 'center';
    if (endsColon) return 'right';
    return 'left';
  });
}

function isTableStart(lines: string[], idx: number): boolean {
  if (idx + 1 >= lines.length) return false;
  return lines[idx].includes('|') && TABLE_SEP_RE.test(lines[idx + 1]);
}

function renderMarkdownTable(
  headerLine: string,
  sepLine: string,
  bodyLines: string[],
  katex: KatexRenderer | undefined,
  allowBlock: boolean,
): string {
  const headers = splitTableCells(headerLine);
  const alignments = parseTableAlignments(sepLine);

  const thHtml = headers
    .map((h, idx) => {
      const align = alignments[idx] ?? 'left';
      const alignClass =
        align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
      return `<th class="px-3.5 py-2.5 text-[12.5px] font-semibold text-ink ${alignClass} whitespace-nowrap">${renderInline(h, katex, allowBlock)}</th>`;
    })
    .join('');

  const rowsHtml = bodyLines
    .map((line) => {
      const cells = splitTableCells(line);
      const tdHtml = headers
        .map((_, idx) => {
          const cell = cells[idx] ?? '';
          const align = alignments[idx] ?? 'left';
          const alignClass =
            align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
          return `<td class="px-3.5 py-2.5 text-[13.5px] leading-snug text-ink/90 align-top ${alignClass}">${renderInline(cell, katex, allowBlock)}</td>`;
        })
        .join('');
      return `<tr class="border-t border-border/70">${tdHtml}</tr>`;
    })
    .join('');

  return `<div class="my-3 w-full overflow-x-auto rounded-xl border border-border bg-card"><table class="w-full min-w-[280px] border-collapse"><thead class="bg-bg-2/70"><tr>${thHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
}

function renderParagraph(
  trimmed: string,
  katex: KatexRenderer | undefined,
  allowBlock: boolean,
): string {
  const lines = trimmed.split('\n');
  const hasSpecialLine = lines.some(
    (line, idx) =>
      BULLET_RE.test(line) ||
      NUMBERED_RE.test(line) ||
      STANDALONE_BOLD_RE.test(line.trim()) ||
      isTableStart(lines, idx),
  );

  if (!hasSpecialLine) {
    const inner = renderInline(trimmed, katex, allowBlock);
    return `<p class="math-para mb-3 text-[14.5px] leading-relaxed text-ink/90">${inner}</p>`;
  }

  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (isTableStart(lines, i)) {
      const headerLine = lines[i];
      const sepLine = lines[i + 1];
      i += 2;
      const bodyLines: string[] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        bodyLines.push(lines[i]);
        i++;
      }
      blocks.push(renderMarkdownTable(headerLine, sepLine, bodyLines, katex, allowBlock));
      continue;
    }

    const boldLineMatch = lines[i].trim().match(STANDALONE_BOLD_RE);
    if (boldLineMatch) {
      const renderedHeading = renderInline(boldLineMatch[1].trim(), katex, allowBlock);
      blocks.push(
        `<h4 class="mt-4 mb-1.5 text-[15px] font-bold leading-snug text-ink">${renderedHeading}</h4>`,
      );
      i++;
      continue;
    }

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
      // Only render as a numbered list if there are multiple items OR the sequence starts at 1.
      // A single "5. Food Tests" is a section heading — render cleanly with uniform styling.
      if (items.length >= 2 || (items.length === 1 && items[0].num === '1')) {
        blocks.push(
          `<ol class="math-list mb-3 list-none pl-0 space-y-1.5">${items
            .map(
              ({ num, text }) =>
                `<li class="flex gap-2 items-baseline"><span class="flex-shrink-0 min-w-[1.5rem] text-[13.5px] font-medium text-ink-2 tabular-nums">${num}.</span><span class="flex-1 text-[14.5px] leading-relaxed text-ink/90">${renderInline(text, katex, allowBlock)}</span></li>`,
            )
            .join('')}</ol>`,
        );
      } else {
        const item = items[0];
        const renderedText = renderInline(item.text, katex, allowBlock);
        blocks.push(
          `<h4 class="mt-4 mb-1.5 text-[15px] font-bold leading-snug text-ink">${item.num}. ${renderedText}</h4>`,
        );
      }
      continue;
    }

    const textLines: string[] = [];
    while (
      i < lines.length &&
      !BULLET_RE.test(lines[i]) &&
      !NUMBERED_RE.test(lines[i]) &&
      !STANDALONE_BOLD_RE.test(lines[i].trim()) &&
      !isTableStart(lines, i)
    ) {
      textLines.push(lines[i]);
      i++;
    }
    const joined = textLines.join('\n').trim();
    if (joined) {
      const inner = renderInline(joined, katex, allowBlock);
      blocks.push(`<p class="math-para mb-3 text-[14.5px] leading-relaxed text-ink/90">${inner}</p>`);
    }
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
            return `<div class="my-2.5 overflow-x-auto text-center"><span class="math-block inline-block max-w-full">${katex.renderToString(part.math, { displayMode: true, throwOnError: false })}</span></div>`;
          } catch {
            return `<div class="my-2 text-center font-mono text-[13.5px] text-ink bg-bg-2 py-1.5 px-3 rounded-xl border border-border">${cleanMathPlainText(part.math)}</div>`;
          }
        }
        return `<div class="my-2 text-center font-mono text-[13.5px] text-ink bg-bg-2 py-1.5 px-3 rounded-xl border border-border">${cleanMathPlainText(part.math)}</div>`;
      }
      if (part.type === 'inline') {
        if (katex) {
          try {
            return `<span class="math-inline">${katex.renderToString(part.math, { displayMode: false, throwOnError: false })}</span>`;
          } catch {
            return `<span class="math-inline font-mono text-[13.5px] text-ink">${cleanMathPlainText(part.math)}</span>`;
          }
        }
        return `<span class="math-inline font-mono text-[13.5px] text-ink">${cleanMathPlainText(part.math)}</span>`;
      }
      let escapedLines = part.text
        .split('\n')
        .map((line) => renderTextMarkdown(line))
        .join('<br />');

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

type Segment =
  | { type: 'block'; math: string }
  | { type: 'inline'; math: string }
  | { type: 'text'; text: string };

function splitMath(text: string, allowBlock: boolean): Segment[] {
  const segments: Segment[] = [];
  const pattern = allowBlock
    ? /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\ce\{[\s\S]*?\}|\\\([\s\S]*?\\\)|\$[^$\n]+?\$)/g
    : /(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\ce\{[\s\S]*?\}|\\\([\s\S]*?\\\)|\$[^$\n]+?\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    const raw = match[1];
    if (raw.startsWith('$$') || raw.startsWith('\\[')) {
      const math = raw.slice(2, -2).trim();
      segments.push({ type: 'block', math });
    } else if (raw.startsWith('\\(')) {
      const math = raw.slice(2, -2).trim();
      segments.push({ type: 'inline', math });
    } else if (raw.startsWith('$')) {
      const math = raw.slice(1, -1).trim();
      segments.push({ type: 'inline', math });
    } else if (raw.startsWith('\\ce{')) {
      segments.push({ type: 'inline', math: raw });
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return segments;
}

function renderTextMarkdown(str: string): string {
  const codeSegments: string[] = [];
  let s = str.replace(/`([^`]+)`/g, (_, code) => {
    codeSegments.push(code);
    return `\u0002CODE_${codeSegments.length - 1}\u0002`;
  });

  s = s.replace(/(^|\s)#{1,6}\s+/g, '$1');
  s = escapeHtml(s);
  s = s.replace(/~~([^~]+?)~~/g, '<del class="text-faint">$1</del>');
  s = s.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  s = s.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^\w*])\*([^*\n]+?)\*([^\w*]|$)/g, '$1<em>$2</em>$3');

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
