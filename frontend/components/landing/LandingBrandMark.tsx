/**
 * Landing-page-only brand mark: a green gradient badge with an R-shaped
 * monogram and a stylized brain "cap" sitting on top of it, per the
 * approved redesign preview. This is a placeholder direction, not final
 * production art — the team is doing real logo design separately — so this
 * intentionally isn't the same component as the shared LogoMark used
 * elsewhere in the app (login, register, mobile nav), which stays untouched.
 */
export default function LandingBrandMark({ size = 38 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)',
        boxShadow: '0 4px 14px rgba(74,222,128,0.25)',
      }}
      className="flex flex-shrink-0 items-center justify-center rounded-[11px]"
    >
      <svg
        width={Math.round(size * 0.63)}
        height={Math.round(size * 0.63)}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M13 34V14h6a5 5 0 0 1 0 9h-6"
          stroke="#0F1F17"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M15 23 24 34" stroke="#0F1F17" strokeWidth="3.2" strokeLinecap="round" />
        <g transform="translate(8,0.5) scale(0.92)">
          <path
            d="M8 9c0-2 1.5-3.5 3.5-3.7-.2-1.8 1.2-3.3 3-3.3.9 0 1.7.4 2.2 1 .5-.6 1.3-1 2.2-1 1.8 0 3.2 1.5 3 3.3 2 .2 3.5 1.7 3.5 3.7 0 1.3-.7 2.4-1.7 3 .3.5.4 1.1.2 1.7-.3 1-1.2 1.6-2.2 1.6-.1.9-.8 1.6-1.7 1.6-.6 0-1.1-.3-1.5-.7-.4.4-.9.7-1.5.7s-1.1-.3-1.5-.7c-.4.4-.9.7-1.5.7-.9 0-1.6-.7-1.7-1.6-1 0-1.9-.6-2.2-1.6-.2-.6-.1-1.2.2-1.7C8.7 11.4 8 10.3 8 9z"
            fill="#0F1F17"
          />
          <path
            d="M14 5.5v9.5M10.5 7.5l1.7 1.2M10.5 11.5l1.7-1.2M18 7.5l-1.7 1.2M18 11.5l-1.7-1.2"
            stroke="#4ADE80"
            strokeWidth="0.55"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
