// Chemistry/physics/math notation drifting in the hero background. Declared
// as a static array (rather than the preview's runtime DOM-generation) so
// this renders the same on the server and the client — each item gets its
// own animation variant and duration so the cluster doesn't move in sync.
const SYMBOLS: {
  label: string;
  position: React.CSSProperties;
  fontSize: number;
  variant: 'A' | 'B';
  durationSeconds: number;
}[] = [
  { label: 'H2O', position: { top: '8%', left: '6%' }, fontSize: 16, variant: 'A', durationSeconds: 7 },
  { label: 'E=mc2', position: { top: '16%', right: '8%' }, fontSize: 22, variant: 'B', durationSeconds: 7.6 },
  { label: 'x2+y2', position: { top: '40%', left: '3%' }, fontSize: 28, variant: 'A', durationSeconds: 8.2 },
  { label: 'CaCO3', position: { top: '58%', right: '5%' }, fontSize: 16, variant: 'B', durationSeconds: 8.8 },
  { label: 'pH', position: { top: '76%', left: '12%' }, fontSize: 22, variant: 'A', durationSeconds: 9.4 },
  { label: 'F=ma', position: { top: '28%', right: '22%' }, fontSize: 28, variant: 'B', durationSeconds: 10 },
  { label: 'NaCl', position: { top: '88%', right: '16%' }, fontSize: 16, variant: 'A', durationSeconds: 10.6 },
  { label: 'delta-x', position: { top: '50%', left: '20%' }, fontSize: 22, variant: 'B', durationSeconds: 11.2 },
];

export default function FloatingSymbols() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {SYMBOLS.map((item, i) => (
        <div
          key={item.label}
          className="landing-float-item"
          style={{
            ...item.position,
            fontSize: item.fontSize,
            animation: `landingDrift${item.variant} ${item.durationSeconds}s ease-in-out infinite`,
            // stagger start points so items with the same duration don't sync
            animationDelay: `${-(i * 0.9)}s`,
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
