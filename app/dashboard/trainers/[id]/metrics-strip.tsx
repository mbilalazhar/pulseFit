import { Banknote, CalendarRange, ChartPie, Clock, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { workingDayNames } from "@/lib/trainer-availability"
import type { TrainerScheduleData } from "@/lib/services/trainer-schedule.services"
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

export function MetricsStrip({ trainer, data }: {
  trainer: Pick<TrainerDetail, "trainerType" | "monthlySalary" | "workDaysPerWeek">
  data: TrainerScheduleData
}) {
  const isStaff = trainer.trainerType === "STAFF"
  const hasAvailability = data.availability.length > 0

  return (
    <section aria-label="Trainer weekly workload" className="overflow-hidden rounded-2xl border bg-card">
      <p className="border-b px-6 py-3 text-xs text-muted-foreground">Week starting {data.weekStart} · {data.timeZone}</p>
      <div className="grid divide-x divide-y divide-border sm:grid-cols-2 xl:grid-cols-3">
      <Metric
        icon={<Banknote className="size-5 text-rose-600 dark:text-rose-400" />}
        iconClass="bg-rose-50 dark:bg-rose-950/50"
        label="Monthly Salary"
        value={isStaff ? formatPkr(trainer.monthlySalary) : NOT_TRACKED}
        note={isStaff ? undefined : "Contractor terms"}
      />
      <Metric
        icon={<Clock className="size-5 text-indigo-600 dark:text-indigo-400" />}
        iconClass="bg-indigo-50 dark:bg-indigo-950/50"
        label="Total Work Hours"
        value={formatHours(data.workload.totalWorkHours)}
        note="Configured weekly availability"
      />
      <Metric
        icon={<Clock className="size-5 text-violet-600 dark:text-violet-400" />}
        iconClass="bg-violet-50 dark:bg-violet-950/50"
        label="Actual Working Hours"
        value={formatHours(data.workload.actualWorkHours)}
        note="Assigned sessions in this week"
      />
      <Metric
        icon={<CalendarRange className="size-5 text-emerald-600 dark:text-emerald-400" />}
        iconClass="bg-emerald-50 dark:bg-emerald-950/50"
        label="Working Days"
        value={isStaff || hasAvailability ? (hasAvailability ? workingDayNames(data.availability) : workingDaysLabel(trainer.workDaysPerWeek)) : NOT_TRACKED}
      />
      <Metric
        icon={<Users className="size-5 text-orange-600 dark:text-orange-400" />}
        iconClass="bg-orange-50 dark:bg-orange-950/50"
        label="Total Members"
        value={String(data.memberCount)}
        note="Currently assigned members"
      />
      <Metric
        icon={<ChartPie className="size-5 text-sky-600 dark:text-sky-400" />}
        iconClass="bg-sky-50 dark:bg-sky-950/50"
        label="Workload"
        value={data.workload.workloadPercent == null ? NOT_TRACKED : `${data.workload.workloadPercent}%`}
        note={data.workload.workloadPercent == null ? "Configure working hours" : "Assigned hours ÷ total hours"}
      />
      </div>
    </section>
  )
}
