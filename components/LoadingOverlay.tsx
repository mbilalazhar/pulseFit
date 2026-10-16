export default function LoadingOverlay() {
  return (
    <div
      role="status"
      aria-label="Loading"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="size-28"
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
  );
}