const CRIMSON = "#DC143C";

/**
 * Dashed crimson filaments with glowing terminals at each end.
 * Drawn to radiate out of the top-left corner; mirror it via CSS to reuse
 * the same artwork in the other corners.
 */
export default function CornerPattern({
  id,
  className = "",
}: {
  id: string;
  className?: string;
}) {
  const glow = `glow-${id}`;

  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      aria-hidden
      className={`pointer-events-none absolute z-0 ${className}`}
    >
      <defs>
        <filter id={glow} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Filaments */}
      <g
        stroke={CRIMSON}
        strokeLinecap="round"
        strokeDasharray="5 7"
        fill="none"
      >
        <path d="M20 40C120 10 200 90 330 60" strokeWidth="1.6" opacity="0.75" />
        <path d="M10 112C110 142 210 62 300 150" strokeWidth="1.3" opacity="0.55" />
        <path d="M40 190C130 150 190 240 280 214" strokeWidth="1.5" opacity="0.65" />
        <path d="M15 250C90 272 150 200 240 268" strokeWidth="1.2" opacity="0.45" />
        <path d="M62 18C140 70 172 140 150 202" strokeWidth="1.4" opacity="0.6" />
      </g>

      {/* Terminals — deliberately mixed shapes so they read as organic */}
      <g filter={`url(#${glow})`} fill={CRIMSON}>
        <circle cx="20" cy="40" r="6.5" opacity="0.9" />
        <ellipse cx="330" cy="60" rx="5" ry="6.5" opacity="0.8" />

        <circle cx="10" cy="112" r="4.5" opacity="0.7" />
        <rect x="295" y="145" width="10" height="10" rx="3.5" opacity="0.75" transform="rotate(18 300 150)" />

        <ellipse cx="40" cy="190" rx="6.5" ry="5" opacity="0.85" />
        <circle cx="280" cy="214" r="5.5" opacity="0.7" />

        <circle cx="15" cy="250" r="3.5" opacity="0.6" />
        <ellipse cx="240" cy="268" rx="4.5" ry="6" opacity="0.65" />

        <rect x="56" y="12" width="12" height="12" rx="4.5" opacity="0.85" transform="rotate(-12 62 18)" />
        <circle cx="150" cy="202" r="7" opacity="0.75" />
      </g>

      {/* Hollow accents for depth */}
      <g stroke={CRIMSON} fill="none" strokeWidth="1.4">
        <circle cx="20" cy="40" r="11" opacity="0.35" />
        <circle cx="150" cy="202" r="12" opacity="0.28" />
        <circle cx="40" cy="190" r="10" opacity="0.3" />
      </g>
    </svg>
  );
}
