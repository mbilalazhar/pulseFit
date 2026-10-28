interface WorkloadRingProps {
  percent: number
  label: string
}

export function WorkloadRing({ percent, label }: WorkloadRingProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  let color = "var(--color-workload-light)"
  if (label === "Moderate") color = "var(--color-workload-moderate)"
  if (label === "Heavy") color = "var(--color-workload-heavy)"
  if (label === "Overloaded") color = "var(--color-workload-overloaded)"

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex size-14 items-center justify-center">
        <svg
          className="absolute inset-0 size-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--muted)"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-xs font-bold text-foreground">{percent}%</span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
