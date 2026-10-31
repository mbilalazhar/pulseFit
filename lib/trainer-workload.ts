import { shiftDate } from "@/lib/attendance"
import { weeklyWorkHours, type TrainerAvailability } from "@/lib/trainer-availability"
import { gymInstant } from "@/lib/trainer-scheduling"

export type TrainerWorkload = {
  totalWorkHours: number
  actualWorkHours: number
  workloadPercent: number | null
}

export function workloadLevel(percent: number | null) {
  if (percent == null || !Number.isFinite(percent)) return { label: "Not configured", colorClass: "text-muted-foreground" }
  if (percent < 30) return { label: "Low", colorClass: "text-yellow-600 dark:text-yellow-400" }
  if (percent <= 60) return { label: "Moderate", colorClass: "text-blue-600 dark:text-blue-400" }
  if (percent <= 80) return { label: "High", colorClass: "text-green-600 dark:text-green-400" }
  return { label: "Heavy", colorClass: "text-red-600 dark:text-red-400" }
}

/** Assigned hours include all reserved sessions except cancellations, within this week only. */
export function calculateTrainerWorkload(
  availability: TrainerAvailability[],
  sessions: { id: string; startsAt: Date | string; endsAt: Date | string; status: string }[],
  weekStart: string,
  timeZone: string,
): TrainerWorkload {
  const start = gymInstant(weekStart, 0, timeZone, false).getTime()
  const end = gymInstant(shiftDate(weekStart, 7), 0, timeZone, false).getTime()
  const seen = new Set<string>()
  const milliseconds = sessions.reduce((total, session) => {
    if (session.status === "CANCELED" || seen.has(session.id)) return total
    seen.add(session.id)
    return total + Math.max(0, Math.min(end, new Date(session.endsAt).getTime()) - Math.max(start, new Date(session.startsAt).getTime()))
  }, 0)
  const totalWorkHours = weeklyWorkHours(availability)
  const actualWorkHours = milliseconds / 3_600_000
  return {
    totalWorkHours: Number(totalWorkHours.toFixed(2)),
    actualWorkHours: Number(actualWorkHours.toFixed(2)),
    workloadPercent: totalWorkHours > 0 ? Number((actualWorkHours / totalWorkHours * 100).toFixed(1)) : null,
  }
}
