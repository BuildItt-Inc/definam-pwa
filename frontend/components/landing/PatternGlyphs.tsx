interface Glyph {
  text: string;
  top: string;
  left: string;
  rotate: number;
  size: number;
  color: string;
}

export default function PatternGlyphs({ glyphs }: { glyphs: Glyph[] }) {
  return (
    <>
      {glyphs.map((g, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: g.top,
            left: g.left,
            transform: `rotate(${g.rotate}deg)`,
            fontSize: `${g.size}px`,
            color: g.color,
            fontFamily: 'var(--font-syne), sans-serif',
            fontWeight: 800,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0,
          }}
        >
          {g.text}
        </span>
      ))}
    </>
  );
}
