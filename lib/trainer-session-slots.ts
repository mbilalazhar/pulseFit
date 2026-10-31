import { shiftDate } from "@/lib/attendance"
import { WORKING_DAYS, type TrainerAvailability } from "@/lib/trainer-availability"
import { gymInstant, mondayOf, type AllocationInput, type ScheduleSession } from "@/lib/trainer-scheduling"
import { dateInTimeZone } from "@/lib/member-status"

export type SessionSlot = AllocationInput["slots"][number]

export function sameSlot(a: SessionSlot, b: SessionSlot) {
  return a.date === b.date && a.startMinute === b.startMinute
}

export function slotsOverlap(a: SessionSlot, b: SessionSlot, duration: number) {
  return a.date === b.date && a.startMinute < b.startMinute + duration && b.startMinute < a.startMinute + duration
}

/** Divide each unbooked working-hours interval into complete member sessions. */
export function availableSessionSlots(options: {
  weekStart: string
  availability: TrainerAvailability[]
  sessions: ScheduleSession[]
  duration: number
  timeZone: string
  now: Date
}): SessionSlot[] {
  const { weekStart, availability, sessions, duration, timeZone, now } = options
  if (!Number.isInteger(duration) || duration <= 0) return []
  if (weekStart < mondayOf(dateInTimeZone(timeZone, now))) return []
  const slots: SessionSlot[] = []
  for (const [index, day] of WORKING_DAYS.entries()) {
    const date = shiftDate(weekStart, index)
    const bookings = sessions.filter((session) => session.date === date).sort((a, b) => a.startMinute - b.startMinute)
    for (const hours of availability.filter((range) => range.dayOfWeek === day.value)) {
      const gaps: { start: number; end: number }[] = []
      let cursor = hours.startMinute
      for (const booking of bookings) {
        if (booking.endMinute <= cursor || booking.startMinute >= hours.endMinute) continue
        if (booking.startMinute > cursor) gaps.push({ start: cursor, end: booking.startMinute })
        cursor = Math.max(cursor, booking.endMinute)
      }
      if (cursor < hours.endMinute) gaps.push({ start: cursor, end: hours.endMinute })
      for (const gap of gaps) {
        for (let startMinute = gap.start; startMinute + duration <= gap.end; startMinute += duration) {
          try {
            const start = gymInstant(date, startMinute, timeZone)
            const end = gymInstant(date, startMinute + duration, timeZone)
            if (end.getTime() - start.getTime() === duration * 60_000) slots.push({ date, startMinute })
          } catch {
            // Missing or ambiguous wall-clock times cannot be booked.
          }
        }
      }
    }
  }
  return slots.sort((a, b) => a.date.localeCompare(b.date) || a.startMinute - b.startMinute)
}
