import { z } from "zod"
import { dateInTimeZone } from "@/lib/member-status"
import { shiftDate } from "@/lib/attendance"
import type { TrainerAvailability } from "@/lib/trainer-availability"

export const allocationSchema = z.object({
  memberId: z.string().min(1).max(100),
  weekStart: z.iso.date(),
  slots: z.array(z.object({
    date: z.iso.date(),
    startMinute: z.number().int().min(0).max(1439),
  })).min(1).max(21),
})
export type AllocationInput = z.infer<typeof allocationSchema>

export function mondayOf(date: string) {
  return shiftDate(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7))
}

export function gymMinute(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instant)
  return Number(parts.find((part) => part.type === "hour")!.value) * 60 + Number(parts.find((part) => part.type === "minute")!.value)
}

/** Resolve gym wall-clock time without using the server/browser timezone. */
export function gymInstant(date: string, minute: number, timeZone: string, rejectAmbiguous = true): Date {
  if (minute === 1440) return gymInstant(shiftDate(date, 1), 0, timeZone, rejectAmbiguous)
  const wall = new Date(`${date}T00:00:00Z`).getTime() + minute * 60_000
  const offsets = new Set<number>()
  for (const hours of [-36, -12, 0, 12, 36]) {
    const sample = new Date(wall + hours * 3_600_000)
    const local = new Date(`${dateInTimeZone(timeZone, sample)}T00:00:00Z`).getTime() + gymMinute(sample, timeZone) * 60_000
    offsets.add(local - sample.getTime())
  }
  const matches = [...offsets].map((offset) => new Date(wall - offset))
    .filter((instant) => dateInTimeZone(timeZone, instant) === date && gymMinute(instant, timeZone) === minute)
    .sort((a, b) => a.getTime() - b.getTime())
  if (!matches.length || (rejectAmbiguous && matches.length > 1)) throw new Error("This time falls in a daylight-saving clock change. Choose another time.")
  return matches[0]
}

export function fitsWorkHours(availability: TrainerAvailability[], date: string, startMinute: number, duration: number) {
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay()
  return availability.some((hours) => hours.dayOfWeek === dayOfWeek && startMinute >= hours.startMinute && startMinute + duration <= hours.endMinute)
}

export function overlaps(a: { startsAt: Date; endsAt: Date }, b: { startsAt: Date; endsAt: Date }) {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt
}

export function prepareAllocation(input: AllocationInput, options: {
  availability: TrainerAvailability[]
  timeZone: string
  sessionsPerWeek: number
  sessionDurationMinutes: number
  membershipStart: string
  membershipEnd: string
  now: Date
}) {
  if (mondayOf(input.weekStart) !== input.weekStart) throw new Error("Select a week starting on Monday.")
  if (input.weekStart < mondayOf(dateInTimeZone(options.timeZone, options.now))) throw new Error("Select the current week or a later week.")
  if (!Number.isInteger(options.sessionDurationMinutes) || options.sessionDurationMinutes <= 0) throw new Error("Configure a valid session length for this member.")
  if (input.slots.length !== options.sessionsPerWeek) throw new Error(`Allocate all ${options.sessionsPerWeek} weekly sessions together.`)
  const weekEnd = shiftDate(input.weekStart, 7)
  const sessions = input.slots.map((slot) => {
    if (slot.date < input.weekStart || slot.date >= weekEnd) throw new Error("All sessions must be in the selected week.")
    // The first allocation covers the whole membership-start week, including
    // working days before the member's start date or the current day.
    if (slot.date < mondayOf(options.membershipStart) || slot.date >= options.membershipEnd) throw new Error("Session dates must fall within the member's purchased membership weeks and before expiry.")
    if (!fitsWorkHours(options.availability, slot.date, slot.startMinute, options.sessionDurationMinutes)) throw new Error("Each session must fit entirely within the trainer's working hours.")
    const startsAt = gymInstant(slot.date, slot.startMinute, options.timeZone)
    const endsAt = gymInstant(slot.date, slot.startMinute + options.sessionDurationMinutes, options.timeZone)
    if (endsAt.getTime() - startsAt.getTime() !== options.sessionDurationMinutes * 60_000) throw new Error("A session cannot cross a daylight-saving clock change.")
    return { startsAt, endsAt }
  })
  if (sessions.some((session, index) => sessions.slice(index + 1).some((other) => overlaps(session, other)))) throw new Error("The selected sessions overlap. Choose separate time slots.")
  return sessions
}

export type ScheduleSession = {
  id: string
  memberId: string
  memberName: string
  startsAt: string
  endsAt: string
  status: "SCHEDULED" | "COMPLETED" | "NO_SHOW"
  date: string
  startMinute: number
  endMinute: number
}

export function scheduleSegments(session: { id: string; memberId: string; member: { name: string }; startsAt: Date; endsAt: Date; status: string }, weekStart: string, timeZone: string): ScheduleSession[] {
  const result: ScheduleSession[] = []
  const startDate = dateInTimeZone(timeZone, session.startsAt)
  const endDate = dateInTimeZone(timeZone, session.endsAt)
  for (let index = 0; index < 7; index++) {
    const date = shiftDate(weekStart, index)
    if (date < startDate || date > endDate) continue
    const startMinute = date === startDate ? gymMinute(session.startsAt, timeZone) : 0
    const endMinute = date === endDate ? gymMinute(session.endsAt, timeZone) : 1440
    if (endMinute <= startMinute) continue
    result.push({ id: session.id, memberId: session.memberId, memberName: session.member.name, startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString(), status: session.status as ScheduleSession["status"], date, startMinute, endMinute })
  }
  return result
}
