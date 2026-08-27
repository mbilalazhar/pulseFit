import { CalendarRange } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  isWorkingDay,
  SHIFT_LABEL,
  WEEKDAYS,
  workingDaysLabel,
  type TrainerDetail,
} from "./trainer-detail-logic"

export function WeeklySchedule({ trainer }: { trainer: TrainerDetail }) {
  const isStaff = trainer.trainerType === "STAFF"
  const workDays = isStaff ? trainer.workDaysPerWeek : null
  const shift = isStaff && trainer.shift ? SHIFT_LABEL[trainer.shift] : null

  return (
    <section className="flex flex-col rounded-2xl border bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-base font-semibold">Weekly Schedule</h3>
        {shift ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {shift} shift
          </span>
        ) : null}
      </div>

      {/* Which days a trainer works is derived from the stored day count; the
          hourly session slots need a booking model that does not exist yet. */}
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((day, index) => {
          const working = isWorkingDay(index, workDays)
          return (
            <div
              key={day}
              className={cn(
                "rounded-lg border px-1 py-2.5 text-center",
                working ? "border-accent/20 bg-accent/5" : "bg-muted/40",
              )}
            >
              <p
                className={cn(
                  "text-xs font-semibold",
                  working ? "text-accent" : "text-muted-foreground",
                )}
              >
                {day}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {working ? "Working" : "Off"}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center">
        <CalendarRange className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">No session slots to show</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Hour-by-hour bookings will appear here once session scheduling is available.
          {workDays ? ` Working days: ${workingDaysLabel(workDays)}.` : ""}
        </p>
      </div>
    </section>
  )
}
