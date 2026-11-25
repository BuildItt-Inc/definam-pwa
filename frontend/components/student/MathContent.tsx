'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildHtml, formatPlainText, type KatexRenderer } from '@/lib/utils/mathHtml';

interface MathContentProps {
  content: string;
  className?: string;
  /** If true, $$...$$ renders as a centred display block. Default true. */
  allowBlock?: boolean;
  /** If true, renders a blinking cursor at the end of streamed content */
  isStreaming?: boolean;
}

/**
 * MathContent
 * -----------
 * Renders mixed prose + LaTeX math + Markdown (headings, tables, lists, code)
 * safely without React virtual DOM reconciliation bugs.
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
      } catch {
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
