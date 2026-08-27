import { Banknote, CalendarRange, ChartPie, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatHours,
  formatPkr,
  NOT_TRACKED,
  workingDaysLabel,
  type TrainerDetail,
} from "./trainer-detail-logic"

function Metric({
  icon,
  iconClass,
  label,
  value,
  note,
}: {
  icon: React.ReactNode
  iconClass: string
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="flex flex-1 items-center gap-3 px-6 py-5">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", iconClass)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
        {note ? <p className="text-[11px] text-muted-foreground">{note}</p> : null}
      </div>
    </div>
  )
}

export function MetricsStrip({ trainer }: { trainer: TrainerDetail }) {
  /* Contractors carry no salary or work-hour fields — they render as untracked
     until the contractor view is defined. */
  const isStaff = trainer.trainerType === "STAFF"

  return (
    <div className="flex flex-wrap divide-x divide-y divide-border overflow-hidden rounded-2xl border bg-white sm:divide-y-0">
      <Metric
        icon={<Banknote className="size-5 text-rose-600" />}
        iconClass="bg-rose-50"
        label="Monthly Salary"
        value={isStaff ? formatPkr(trainer.monthlySalary) : NOT_TRACKED}
        note={isStaff ? undefined : "Contractor terms"}
      />
      <Metric
        icon={<Clock className="size-5 text-indigo-600" />}
        iconClass="bg-indigo-50"
        label="Work Hours / Day"
        value={isStaff ? formatHours(trainer.workHoursPerDay) : NOT_TRACKED}
      />
      <Metric
        icon={<CalendarRange className="size-5 text-emerald-600" />}
        iconClass="bg-emerald-50"
        label="Working Days"
        value={isStaff ? workingDaysLabel(trainer.workDaysPerWeek) : NOT_TRACKED}
      />
      {/* No trainer-to-member relation exists yet. */}
      <Metric
        icon={<Users className="size-5 text-orange-600" />}
        iconClass="bg-orange-50"
        label="Total Members"
        value={NOT_TRACKED}
        note="Not tracked yet"
      />
      {/* Workload is derived from members, so it is unavailable too. */}
      <Metric
        icon={<ChartPie className="size-5 text-sky-600" />}
        iconClass="bg-sky-50"
        label="Workload"
        value={NOT_TRACKED}
        note="Not tracked yet"
      />
    </div>
  )
}
