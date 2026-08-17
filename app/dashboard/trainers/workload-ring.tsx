interface WorkloadRingProps {
  percent: number
  label: string
}

export function WorkloadRing({ percent, label }: WorkloadRingProps) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  let color = "#2ED573"
  if (label === "Moderate") color = "#FFA502"
  if (label === "Heavy") color = "#FF4757"
  if (label === "Overloaded") color = "#E74C3C"

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
            stroke="#E5E7EB"
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
