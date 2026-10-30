import { dateInTimeZone } from "@/lib/member-status"
import { shiftDate } from "@/lib/attendance"
import { fitsWorkHours, gymMinute } from "@/lib/trainer-scheduling"
import type { TrainerAvailability } from "@/lib/trainer-availability"

export function sameWorkingHours(before: TrainerAvailability[], after: TrainerAvailability[]) {
  const key = (hours: TrainerAvailability[]) => hours.map(({ dayOfWeek, startMinute, endMinute }) => `${dayOfWeek}:${startMinute}:${endMinute}`).sort().join("|")
  return key(before) === key(after)
}

export function bookingFitsWorkingHours(booking: { startsAt: Date; endsAt: Date }, hours: TrainerAvailability[], timeZone: string) {
  const date = dateInTimeZone(timeZone, booking.startsAt)
  const endDate = dateInTimeZone(timeZone, booking.endsAt)
  const startMinute = gymMinute(booking.startsAt, timeZone)
  let endMinute = gymMinute(booking.endsAt, timeZone) + booking.endsAt.getUTCSeconds() / 60
  if (endDate !== date) {
    if (endDate !== shiftDate(date, 1) || endMinute !== 0) return false
    endMinute = 1440
  }
  return endMinute > startMinute && fitsWorkHours(hours, date, startMinute, endMinute - startMinute)
}
