'use client';

import { useRef, useEffect, useId } from 'react';

interface Props {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

export default function SubjectMorph({
  texts,
  morphTime = 0.9,
  cooldownTime = 1.1,
  className,
  textClassName,
}: Props) {
  const uid = useId();
  const filterId = `morph${uid.replace(/:/g, '_')}`;

  const span1Ref = useRef<HTMLSpanElement>(null);
  const span2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const s1 = span1Ref.current;
    const s2 = span2Ref.current;
    if (!s1 || !s2) return;

    let textIndex = 0;
    let morph = 0;
    let cooldown = cooldownTime;
    let lastTime: number | null = null;
    let rafId: number;

    s1.textContent = texts[texts.length - 1];
    s2.textContent = texts[0];

    function setMorphFraction(frac: number) {
      // Clamp away from 0 and 1 to avoid division-by-zero in blur formula
      const f = Math.max(0.001, Math.min(0.999, frac));
      s2!.style.filter = `blur(${Math.min(8 / f - 8, 100)}px)`;
      s2!.style.opacity = `${Math.pow(f, 0.4) * 100}%`;
      const inv = 1 - f;
      s1!.style.filter = `blur(${Math.min(8 / inv - 8, 100)}px)`;
      s1!.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;
    }

    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      const dt = lastTime == null ? 0 : (now - lastTime) / 1000;
      lastTime = now;

      const wasInCooldown = cooldown > 0;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (wasInCooldown) {
          textIndex = (textIndex + 1) % texts.length;
          s1!.textContent = texts[(textIndex - 1 + texts.length) % texts.length];
          s2!.textContent = texts[textIndex];
          morph = 0;
        }
        morph += dt;
        const fraction = morph / morphTime;
        if (fraction >= 1) {
          cooldown = cooldownTime;
          setMorphFraction(0.999);
        } else {
          setMorphFraction(fraction);
        }
      } else {
        // Resting: s2 fully visible, s1 invisible
        s2!.style.filter = '';
        s2!.style.opacity = '100%';
        s1!.style.filter = '';
        s1!.style.opacity = '0%';
        morph = 0;
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [texts, morphTime, cooldownTime]);

  const spanClass = `absolute inset-0 flex items-center justify-center${textClassName ? ` ${textClassName}` : ''}`;

  return (
    <div className={`relative${className ? ` ${className}` : ''}`}>
      {/* SVG filter — zero-size, invisible, but must be in the document */}
      <svg
        className="absolute w-0 h-0 overflow-hidden"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      {/* The filter wrapper; both spans are stacked absolutely inside */}
      <div
        className="absolute inset-0"
        style={{ filter: `url(#${filterId})` }}
      >
        <span ref={span1Ref} className={spanClass} />
        <span ref={span2Ref} className={spanClass} />
      </div>
    </div>
  );
}
