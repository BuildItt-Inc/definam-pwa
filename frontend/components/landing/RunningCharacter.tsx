/**
 * Small animated character that loops left-to-right across the bottom of the
 * hero, legs alternating, with a subtle bounce. Kept as its own component so
 * it's a single JSX line to remove from the hero if the team decides its
 * energy level is off, or to remove it entirely, after seeing it live at
 * full scale — not meant to be precious, hand-tuned production art.
 *
 * Hidden on mobile (see the `hidden sm:block` on its wrapper in the hero) —
 * at narrow widths it competes with the headline for very little payoff.
 */
export default function RunningCharacter() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[6%] left-0 right-0 hidden h-[70px] sm:block"
    >
      <div className="landing-runner absolute h-[60px] w-[46px]">
        <svg viewBox="0 0 46 60" fill="none" className="h-full w-full">
          <circle cx="23" cy="14" r="11" fill="#4ADE80" />
          <circle cx="19" cy="12" r="1.6" fill="#0F1F17" />
          <circle cx="27" cy="12" r="1.6" fill="#0F1F17" />
          <path d="M17 17q6 6 12 0" stroke="#0F1F17" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <rect x="17" y="24" width="12" height="16" rx="5" fill="#4ADE80" />
          <rect className="leg" x="15" y="38" width="5" height="16" rx="2.5" fill="#16A34A" />
          <rect className="leg leg-back" x="26" y="38" width="5" height="16" rx="2.5" fill="#16A34A" />
        </svg>
      </div>
    </div>
  );
}
