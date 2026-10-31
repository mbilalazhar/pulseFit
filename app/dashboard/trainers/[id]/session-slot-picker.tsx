"use client"

import { Check, Plus } from "lucide-react"
import { shiftDate } from "@/lib/attendance"
import { WORKING_DAYS, formatWorkTime } from "@/lib/trainer-availability"
import { fitsWorkHours } from "@/lib/trainer-scheduling"
import { sameSlot, slotsOverlap, type SessionSlot } from "@/lib/trainer-session-slots"
import type { TrainerScheduleData } from "@/lib/services/trainer-schedule.services"
import { cn } from "@/lib/utils"

export function SessionSlotPicker({ data, available, selected, memberName, duration, limit, disabled, onToggle }: {
  data: TrainerScheduleData
  available: SessionSlot[]
  selected: SessionSlot[]
  memberName: string
  duration: number
  limit: number
  disabled: boolean
  onToggle: (slot: SessionSlot) => void
}) {
  // Keep selections visible (and removable) if a background refresh changes availability.
  const slots = [...available, ...selected.filter((slot) => !available.some((other) => sameSlot(slot, other)))]
  const ranges = [...data.availability, ...data.sessions]
  const start = ranges.length ? Math.floor(Math.min(...ranges.map((range) => range.startMinute)) / 60) * 60 : 480
  const end = ranges.length ? Math.ceil(Math.max(...ranges.map((range) => range.endMinute)) / 60) * 60 : 1080
  const times = Array.from({ length: (end - start) / 60 }, (_, index) => start + index * 60)

  return <div className="min-h-0 overflow-auto rounded-xl border" role="region" aria-label="Select sessions from the weekly schedule" tabIndex={0}>
    <table className="w-full min-w-[800px] table-fixed border-separate border-spacing-1 p-2">
      <caption className="sr-only">Weekly trainer schedule. Click an available session to select it for {memberName}. Click a selected session again to remove it. Existing bookings cannot be selected.</caption>
      <thead className="sticky top-0 z-10 bg-popover">
        <tr><th scope="col" className="w-20 py-3 text-left text-xs text-muted-foreground">Time</th>
          {WORKING_DAYS.map((day) => {
            const hours = data.availability.filter((range) => range.dayOfWeek === day.value)
            return <th key={day.value} scope="col" className="px-1 py-3 text-center text-xs font-medium">
              {day.label.slice(0, 3)}
              {!hours.length && <span className="mt-1 block text-[10px] font-normal text-muted-foreground">Off</span>}
            </th>
          })}
        </tr>
      </thead>
      <tbody>{times.map((time) => <tr key={time}>
        <th scope="row" className="py-3 text-left align-top text-[11px] font-normal text-muted-foreground">{formatWorkTime(time)}</th>
        {WORKING_DAYS.map((day, index) => {
          const date = shiftDate(data.weekStart, index)
          const working = data.availability.some((range) => range.dayOfWeek === day.value && range.startMinute < time + 60 && range.endMinute > time)
          const bookings = data.sessions.filter((session) => session.date === date && session.startMinute < time + 60 && session.endMinute > time)
          const daySlots = slots.filter((slot) => slot.date === date && slot.startMinute >= time && slot.startMinute < time + 60)
          return <td key={day.value} className={cn("h-16 rounded-lg p-1 align-top", working ? "bg-muted/20" : "bg-muted/60")}>
            <div className="space-y-1.5">
              {!working && <span className="block py-3 text-center text-xs font-medium text-muted-foreground" aria-label={`${day.label}, ${formatWorkTime(time)}: trainer off, unavailable`}>Off</span>}
              {bookings.map((booking) => <div key={booking.id} className="rounded-lg border bg-muted p-2 text-center text-[11px]">
                <p className="font-medium wrap-anywhere">{booking.memberName}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{formatWorkTime(booking.startMinute)}–{formatWorkTime(booking.endMinute)}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Booked</p>
              </div>)}
              {daySlots.map((slot) => {
                const isSelected = selected.some((other) => sameSlot(slot, other))
                const unavailable = !available.some((other) => sameSlot(slot, other))
                const blocked = !isSelected && (unavailable || !fitsWorkHours(data.availability, date, slot.startMinute, duration) || selected.length >= limit || selected.some((other) => slotsOverlap(slot, other, duration)))
                const label = `${day.label}, ${formatWorkTime(slot.startMinute)} to ${formatWorkTime(slot.startMinute + duration)}`
                return <button key={slot.startMinute} type="button" aria-pressed={isSelected} aria-label={isSelected ? `Remove ${memberName} from ${label}` : `Assign ${memberName} to ${label}`} disabled={disabled || blocked} onClick={() => onToggle(slot)}
                  className={cn("flex w-full flex-col items-center gap-1 rounded-lg border p-2 text-center text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50", isSelected ? "border-accent bg-accent/10 text-accent" : "border-dashed border-accent/30 bg-card hover:border-accent hover:bg-accent/5", unavailable && "border-destructive text-destructive")}>
                  {isSelected ? <Check className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
                  <span className="font-medium wrap-anywhere">{isSelected ? memberName : "Available"}</span>
                  <span className="text-[10px]">{formatWorkTime(slot.startMinute)}–{formatWorkTime(slot.startMinute + duration)}</span>
                  {!isSelected && <span className="text-[10px]">{duration} minutes</span>}
                  {isSelected && unavailable && <span className="text-[10px]">Unavailable</span>}
                </button>
              })}
              {working && !bookings.length && !daySlots.length && <span className="block py-3 text-center text-muted-foreground" aria-label="No available session">—</span>}
            </div>
          </td>
        })}
      </tr>)}</tbody>
    </table>
  </div>
}
