export default function LoadingOverlay() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-xl"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Logo Animation */}
        <div className="relative h-28 w-28">
          {/* Expanding Pulse Rings */}
          <span className="pulse-ring absolute inset-0 rounded-full" />
          <span className="pulse-ring delay-1000 absolute inset-0 rounded-full" />

          {/* Circle */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full"
          >
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#000"
              strokeWidth="3"
              opacity=".15"
            />

            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#000"
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-circle"
            />
          </svg>

          {/* Heartbeat */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d="M20 50 H35 L43 35 L52 65 L60 45 H80"
              fill="none"
              stroke="#CB2957"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-heartbeat"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-black">
            PulseFit
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Initializing AI...
          </p>
        </div>

        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}