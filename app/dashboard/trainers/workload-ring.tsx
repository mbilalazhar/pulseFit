import { workloadLevel } from "@/lib/trainer-workload"
import { cn } from "@/lib/utils"

export function WorkloadRing({ percent }: { percent: number | null }) {
  const level = workloadLevel(percent)
  const known = percent != null && Number.isFinite(percent)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const fill = known ? Math.max(0, Math.min(100, percent)) : 0
  const description = known ? `${percent}% · ${level.label} workload` : "Workload unavailable: configure working hours"

  return (
    <div role="img" aria-label={description} title={level.label} className={cn("w-fit justify-self-center", level.colorClass)}>
      <div className="relative flex size-14 items-center justify-center" aria-hidden="true">
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="10" />
          {fill > 0 && <circle
            cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - fill / 100 * circumference}
            strokeLinecap="round"
          />}
        </svg>
        <span className="text-[11px] font-bold text-foreground">{known ? `${percent}%` : "—"}</span>
      </div>
    </div>
  )
}
