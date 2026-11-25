'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Smooths bursty SSE chunks into a calm, steady reading flow using
 * requestAnimationFrame (shadcn / AI-elements smooth-streaming pattern).
 *
 * - Historical messages (`!isStreaming` and already aligned) render immediately.
 * - Active streams pace smoothly at ~65 chars/sec (~12–14 words/sec), snapping
 *   cleanly on whitespace when available and accelerating smoothly if a very
 *   long backlog accumulates so completion never lags behind.
 */
export function useSmoothedText(targetText: string, isStreaming: boolean): {
  displayedText: string;
  isRevealing: boolean;
} {
  const [displayedLength, setDisplayedLength] = useState<number>(() =>
    isStreaming ? 0 : targetText.length,
  );
  const displayedLengthRef = useRef<number>(isStreaming ? 0 : targetText.length);
  const targetRef = useRef<string>(targetText);
  const wasStreamingRef = useRef<boolean>(isStreaming);

  targetRef.current = targetText;

  useEffect(() => {
    // Track stream start vs static message
    if (isStreaming) {
      wasStreamingRef.current = true;
    }

    // If this was never streamed in this mount, or target was cleared/replaced
    if (!wasStreamingRef.current) {
      displayedLengthRef.current = targetText.length;
      setDisplayedLength(targetText.length);
      return;
    }

    if (targetText.length < displayedLengthRef.current) {
      displayedLengthRef.current = targetText.length;
      setDisplayedLength(targetText.length);
      return;
    }

    if (displayedLengthRef.current >= targetText.length) {
      if (!isStreaming) {
        wasStreamingRef.current = false;
      }
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const target = targetRef.current;
      const currentLen = displayedLengthRef.current;

      if (currentLen >= target.length) {
        if (!isStreaming) {
          wasStreamingRef.current = false;
        }
        return;
      }

      const dtSeconds = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const remaining = target.length - currentLen;
      // Calm base reading pace (~65 chars/sec); gently speed up only for large backlogs
      // or once the network stream has finished so final words wrap up smoothly.
      const baseRate = isStreaming ? 65 : 140;
      const adaptiveBoost = remaining > 180 ? (remaining - 180) * 1.4 : 0;
      const charsToAdvance = Math.max(1, Math.round((baseRate + adaptiveBoost) * dtSeconds));

      let nextLen = Math.min(target.length, currentLen + charsToAdvance);

      // Prefer snapping forward by 1-3 chars to a whitespace boundary for cleaner word flow
      if (nextLen < target.length) {
        for (let offset = 0; offset <= 3 && nextLen + offset < target.length; offset++) {
          const ch = target[nextLen + offset];
          if (ch === ' ' || ch === '\n') {
            nextLen = nextLen + offset + 1;
            break;
          }
        }
      }

      displayedLengthRef.current = nextLen;
      setDisplayedLength(nextLen);

      if (nextLen < target.length) {
        rafId = requestAnimationFrame(step);
      } else if (!isStreaming) {
        wasStreamingRef.current = false;
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [targetText, isStreaming]);

  const safeLen = Math.min(displayedLength, targetText.length);
  const isRevealing = isStreaming || (wasStreamingRef.current && safeLen < targetText.length);

  return {
    displayedText: targetText.slice(0, safeLen),
    isRevealing,
  };
}

/**
 * Smart chat scroll controller:
 * - Follows new output ONLY while the user stays pinned near the bottom.
 * - Immediately stops auto-scrolling the instant the user scrolls up (via wheel,
 *   touch drag, or scrollbar) and never fights or drags them back down.
 * - Shows a jump-to-bottom trigger whenever the user is away from the bottom.
 */
export function useSmartChatScroll() {
  const scrollContainerRef = useRef<HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      lastScrollTopRef.current = el.scrollTop;
      return;
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const scrolledUpDelta = lastScrollTopRef.current - el.scrollTop;
    lastScrollTopRef.current = el.scrollTop;

    // Any deliberate upward movement or sitting >28px above bottom pauses auto-follow
    if (scrolledUpDelta > 2 || distanceFromBottom > 28) {
      shouldAutoScrollRef.current = false;
    } else if (distanceFromBottom <= 16) {
      shouldAutoScrollRef.current = true;
    }

    setShowJumpToBottom(!shouldAutoScrollRef.current && distanceFromBottom > 64);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLElement>) => {
    if (e.deltaY < 0) {
      shouldAutoScrollRef.current = false;
      const el = scrollContainerRef.current;
      if (el) {
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowJumpToBottom(distanceFromBottom > 40);
      }
    }
  }, []);

  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
    const startY = touchStartYRef.current;
    const currentY = e.touches[0]?.clientY;
    if (startY !== null && currentY !== undefined && currentY - startY > 8) {
      // Finger dragging down -> viewport scrolling up toward older messages
      shouldAutoScrollRef.current = false;
      const el = scrollContainerRef.current;
      if (el) {
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowJumpToBottom(distanceFromBottom > 40);
      }
    }
  }, []);

  const scrollToBottomNow = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollContainerRef.current;
    if (el) {
      isProgrammaticScrollRef.current = true;
      if (behavior === 'smooth') {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      } else {
        el.scrollTop = el.scrollHeight;
        lastScrollTopRef.current = el.scrollTop;
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  }, []);

  const jumpToBottom = useCallback(() => {
    shouldAutoScrollRef.current = true;
    setShowJumpToBottom(false);
    scrollToBottomNow('smooth');
  }, [scrollToBottomNow]);

  const pinToBottom = useCallback(() => {
    shouldAutoScrollRef.current = true;
    setShowJumpToBottom(false);
    requestAnimationFrame(() => scrollToBottomNow('smooth'));
  }, [scrollToBottomNow]);

  const followIfPinned = useCallback(() => {
    if (!shouldAutoScrollRef.current) return;
    scrollToBottomNow('auto');
  }, [scrollToBottomNow]);

  return {
    scrollContainerRef,
    messagesEndRef,
    showJumpToBottom,
    handleScroll,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    jumpToBottom,
    pinToBottom,
    followIfPinned,
  };
}
