export function ZikoraLogo({
  size = 24,
  className = 'text-ink',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Clean geometric aperture + stylized Z ribbon (Notion / Linear monochrome aesthetic) */}
      <circle
        cx="14"
        cy="14"
        r="11.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeOpacity="0.18"
      />
      <path
        d="M9 9.75H18.5L9.5 18.25H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21.2 5.2L21.9 7.1L23.8 7.8L21.9 8.5L21.2 10.4L20.5 8.5L18.6 7.8L20.5 7.1L21.2 5.2Z"
        fill="#1E7A46"
      />
    </svg>
  );
}
