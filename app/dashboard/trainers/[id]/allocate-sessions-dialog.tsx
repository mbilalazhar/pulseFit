"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DatePicker, TimePicker } from "@/components/ui/date-time-picker"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { shiftDate } from "@/lib/attendance"
import { formatWorkTime, timeToMinutes, WORKING_DAYS } from "@/lib/trainer-availability"
import { mondayOf, overlaps, prepareAllocation } from "@/lib/trainer-scheduling"
import { allocateTrainerSessions, type TrainerScheduleData } from "@/lib/services/trainer-schedule.services"
import type { UnallocatedTrainerMember } from "@/lib/trainer-unallocated-members"

export function AllocateSessionsDialog({ trainerId, member, data, loading, onWeekChange, onClose }: {
  trainerId: string
  member: UnallocatedTrainerMember
  data: TrainerScheduleData
  loading: boolean
  onWeekChange: (week: string) => void
  onClose: () => void
}) {
  const days = WORKING_DAYS.map((day, index) => ({ ...day, date: shiftDate(data.weekStart, index), hours: data.availability.filter((range) => range.dayOfWeek === day.value) }))
    .filter((day) => day.hours.length && day.date >= data.today)
  const [slots, setSlots] = useState(() => Array.from({ length: member.sessionsPerWeek ?? 0 }, (_, index) => ({ date: days[index % Math.max(1, days.length)]?.date ?? "", time: "" })))
  const [error, setError] = useState("")
  const queryClient = useQueryClient()
  const duration = member.sessionDurationMinutes ?? 0
  const configured = !!member.sessionsPerWeek && !!duration
  const mutation = useMutation({
    mutationFn: () => allocateTrainerSessions(trainerId, { memberId: member.id, weekStart: data.weekStart, slots: slots.map((slot) => ({ date: slot.date, startMinute: timeToMinutes(slot.time) })) }),
    onSuccess: async () => {
      toast.success(`Allocated ${slots.length} sessions to ${member.name}.`)
      await queryClient.invalidateQueries({ queryKey: ["trainer-schedule", trainerId] })
      onClose()
    },
    onError: (cause: Error) => { setError(cause.message); void queryClient.invalidateQueries({ queryKey: ["trainer-schedule", trainerId] }) },
  })
  const updateSlot = (index: number, changes: Partial<{ date: string; time: string }>) => {
    setSlots((current) => current.map((slot, position) => position === index ? { ...slot, ...changes } : slot))
    setError("")
  }

  function save() {
    if (!configured || loading || mutation.isPending) return
    if (slots.some((slot) => !slot.date || !slot.time)) { setError("Choose a working day and start time for every session."); return }
    try {
      const prepared = prepareAllocation({ memberId: member.id, weekStart: data.weekStart, slots: slots.map((slot) => ({ date: slot.date, startMinute: timeToMinutes(slot.time) })) }, {
        availability: data.availability, timeZone: data.timeZone, sessionsPerWeek: member.sessionsPerWeek!, sessionDurationMinutes: duration,
        membershipStart: "1900-01-01", membershipEnd: "9999-12-31", now: new Date(),
      })
      if (prepared.some((slot) => data.sessions.some((booking) => overlaps(slot, { startsAt: new Date(booking.startsAt), endsAt: new Date(booking.endsAt) })))) {
        setError("A selected time is already booked. Choose another time.")
        return
      }
      mutation.mutate()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check the selected session times.") }
  }

  const disabledReason = !configured ? "This member's purchased membership needs a weekly session count and session length before allocation."
    : data.trainerStatus !== "ACTIVE" ? "This trainer must be active before allocating sessions."
    : !data.availability.length ? "This trainer has no saved working hours. Configure working hours before allocating sessions."
    : !days.length ? "No working days remain in this week. Select a later week." : ""

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose() }}>
    <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl" showCloseButton={!mutation.isPending}>
      <DialogHeader><DialogTitle>Assign sessions to {member.name}</DialogTitle><DialogDescription>Allocate {member.sessionsPerWeek ?? "the configured"} sessions of {duration || "the configured"} minutes for the selected week. Times use {data.timeZone}. These bookings are saved for this week only.</DialogDescription></DialogHeader>
      <div className="space-y-1.5"><label htmlFor="allocation-week" className="text-xs font-medium">Week starting</label><DatePicker id="allocation-week" value={data.weekStart} min={mondayOf(data.today)} disabled={mutation.isPending} onValueChange={(date) => { if (date) onWeekChange(mondayOf(date)) }} /></div>
      {disabledReason ? <p role="status" className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{disabledReason}</p> : (
        <div className="space-y-3">
          {slots.map((slot, index) => {
            const day = days.find((entry) => entry.date === slot.date)
            const start = timeToMinutes(slot.time)
            return <fieldset key={index} disabled={mutation.isPending || loading} className="space-y-2 rounded-xl border p-3 disabled:opacity-60">
              <legend className="px-1 text-xs font-semibold">Session {index + 1} · {duration} minutes</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1"><label htmlFor={`allocation-date-${index}`} className="text-xs font-medium">Working day</label><select id={`allocation-date-${index}`} value={slot.date} onChange={(event) => updateSlot(index, { date: event.target.value })} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Select a day</option>{days.map((entry) => <option key={entry.date} value={entry.date}>{entry.label} · {entry.date}</option>)}</select></div>
                <div className="space-y-1"><label htmlFor={`allocation-time-${index}`} className="text-xs font-medium">Start time</label><TimePicker id={`allocation-time-${index}`} value={slot.time} disabled={mutation.isPending || loading} onValueChange={(time) => updateSlot(index, { time })} /></div>
              </div>
              <p className="text-[11px] text-muted-foreground">Working hours: {day?.hours.map((range) => `${formatWorkTime(range.startMinute)}–${formatWorkTime(range.endMinute)}`).join(" · ") || "Select a day"}{Number.isFinite(start) && start + duration <= 1440 ? ` · Ends ${formatWorkTime(start + duration)}` : ""}</p>
            </fieldset>
          })}
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button type="button" disabled={!!disabledReason || loading || mutation.isPending} onClick={save}>{mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}{mutation.isPending ? "Saving sessions…" : "Assign all sessions"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
