export default function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="bg-jade rounded-lg flex items-center justify-center flex-shrink-0"
    >
      <svg
        width={Math.round(size * 0.74)}
        height={Math.round(size * 0.74)}
        viewBox="0 0 38 38"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 28L15 8L22 22L27 14L34 28"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="10" r="3" fill="#5DCAA5" />
      </svg>
    </div>
  );
}
