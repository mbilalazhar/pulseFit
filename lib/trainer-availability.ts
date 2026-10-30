import { z } from "zod"

export const WORKING_DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
] as const

const timeRangeSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
}).refine((day) => day.endMinute > day.startMinute, {
  message: "End time must be after start time on the same day.",
  path: ["endMinute"],
})

export const trainerAvailabilitySchema = z.array(timeRangeSchema).min(1, "Select at least one working day.").max(7).refine(
  (days) => new Set(days.map((day) => day.dayOfWeek)).size === days.length,
  "Each working day must have one continuous time range.",
)

export const contractorSessionsSchema = z.array(timeRangeSchema)
  .min(1, "Add at least one weekly session.")
  .max(21, "Add at most 21 weekly sessions.")
  .refine((sessions) => !sessions.some((session, index) => sessions.slice(index + 1).some((other) =>
    session.dayOfWeek === other.dayOfWeek && session.startMinute < other.endMinute && other.startMinute < session.endMinute)),
  "Sessions on the same day must not overlap.")

export type TrainerAvailability = z.infer<typeof trainerAvailabilitySchema>[number]

export function timeToMinutes(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export function endTimeToMinutes(time: string) {
  return time === "24:00" ? 1440 : timeToMinutes(time)
}

export function formatWorkTime(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`
}

export function weeklyWorkHours(days: TrainerAvailability[]) {
  return days.reduce((sum, day) => sum + day.endMinute - day.startMinute, 0) / 60
}

export function workingDayNames(days: TrainerAvailability[]) {
  return WORKING_DAYS.filter((day) => days.some((entry) => entry.dayOfWeek === day.value))
    .map((day) => day.label.slice(0, 3)).join(", ")
}
