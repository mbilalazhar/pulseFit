"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WORKING_DAYS, timeToMinutes } from "@/lib/trainer-availability"
import { fitsWorkHours, mondayOf } from "@/lib/trainer-scheduling"
import { shiftDate } from "@/lib/attendance"
import type { ScheduleChangeReview, ScheduleConfirmation } from "@/lib/trainer-schedule-change"

const minutesToTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

export function ScheduleReassignmentDialog({ review, saving, error, onClose, onConfirm }: {
  review: ScheduleChangeReview
  saving: boolean
  error: string
  onClose: () => void
  onConfirm: (confirmation: ScheduleConfirmation) => void
}) {
  const [choices, setChoices] = useState(() => review.sessions.map((session) => ({
    sessionId: session.id, trainerId: review.trainerId, date: session.date,
    time: session.needsNewTime ? "" : minutesToTime(session.startMinute),
  })))
  const members = [...new Map(review.sessions.map((session) => [session.memberId, session])).values()]
  const invalid = choices.some((choice) => {
    const session = review.sessions.find((item) => item.id === choice.sessionId)!
    const trainer = review.trainers.find((item) => item.id === choice.trainerId)
    return !choice.date || !choice.time || !trainer || mondayOf(choice.date) !== mondayOf(session.date)
      || !fitsWorkHours(trainer.availability, choice.date, timeToMinutes(choice.time), session.duration)
  })
  function selectTrainer(memberId: string, trainerId: string) {
    const trainer = review.trainers.find((item) => item.id === trainerId)!
    setChoices((current) => current.map((choice) => {
      const session = review.sessions.find((item) => item.id === choice.sessionId)!
      if (session.memberId !== memberId) return choice
      return { ...choice, trainerId, time: choice.time || (fitsWorkHours(trainer.availability, choice.date, session.startMinute, session.duration) ? minutesToTime(session.startMinute) : "") }
    }))
  }
  function updateTime(sessionId: string, changes: { date?: string; time?: string }) {
    setChoices((current) => current.map((choice) => choice.sessionId === sessionId ? { ...choice, ...changes } : choice))
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose() }}>
    <DialogContent className="max-h-[90svh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl" showCloseButton={!saving}>
      <DialogHeader className="pr-7">
        <DialogTitle>Review and reassign member sessions</DialogTitle>
        <DialogDescription>Your trainer changes have not been saved. Choose a new time for sessions outside the updated working hours, or assign the member and all their upcoming sessions to another trainer. Times use {review.timeZone}.</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 space-y-4 overflow-y-auto">
        <p className="text-sm text-muted-foreground">Sessions that still fit can keep their times. Keep each session in its original week; its duration stays the same. Confirming saves the trainer changes and all reassignments together.</p>
        {members.map((member) => {
          const sessions = review.sessions.filter((session) => session.memberId === member.memberId)
          const trainerId = choices.find((choice) => choice.sessionId === member.id)!.trainerId
          const trainer = review.trainers.find((item) => item.id === trainerId)!
          return <section key={member.memberId} className="space-y-3 rounded-lg border p-4">
            <h3 className="font-medium">{member.memberName}</h3>
            <label className="block space-y-1.5 text-sm">
              <span>Assigned trainer</span>
              <select className="h-10 w-full rounded-md border border-input bg-background px-3" value={trainerId} disabled={saving || !member.canTransfer} onChange={(event) => selectTrainer(member.memberId, event.target.value)}>
                {review.trainers.map((item) => <option key={item.id} value={item.id}>{item.fullName}{item.id === review.trainerId ? " (updated hours)" : ""}</option>)}
              </select>
            </label>
            {!member.canTransfer && <p className="text-xs text-muted-foreground">This member is no longer assigned to this trainer. You can update session times here; update their member assignment before transferring them.</p>}
            <p className="text-xs text-muted-foreground">Working hours: {trainer.availability.length ? trainer.availability.map((hours) => `${WORKING_DAYS.find((day) => day.value === hours.dayOfWeek)?.label} ${minutesToTime(hours.startMinute)}–${minutesToTime(hours.endMinute)}`).join(", ") : "No available hours"}</p>
            {trainerId !== review.trainerId && <p className="text-xs font-medium">The member&apos;s trainer assignment and all {sessions.length} upcoming sessions will move to {trainer.fullName}.</p>}
            {sessions.map((session) => {
              const choice = choices.find((item) => item.sessionId === session.id)!
              const fits = !!choice.time && fitsWorkHours(trainer.availability, choice.date, timeToMinutes(choice.time), session.duration)
              return <div key={session.id} className="space-y-2 border-t pt-3">
                <p className="text-xs text-muted-foreground">Current: {session.date} at {minutesToTime(session.startMinute)} · {session.duration} minutes{session.needsNewTime ? " · Reassignment required" : ""}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm"><span>Session date</span><Input type="date" value={choice.date} min={mondayOf(session.date)} max={shiftDate(mondayOf(session.date), 6)} disabled={saving} onChange={(event) => updateTime(session.id, { date: event.target.value })} /></label>
                  <label className="space-y-1.5 text-sm"><span>Start time</span><Input type="time" value={choice.time} disabled={saving} onChange={(event) => updateTime(session.id, { time: event.target.value })} /></label>
                </div>
                {!fits && <p className="text-xs text-destructive">Choose a time that fits the selected trainer&apos;s working hours.</p>}
              </div>
            })}
          </section>
        })}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Back to edit</Button>
        <Button type="button" disabled={saving || invalid} onClick={() => onConfirm({
          confirmed: true, revision: review.revision,
          sessions: choices.map(({ time, ...choice }) => ({ ...choice, startMinute: timeToMinutes(time) })),
        })}>{saving && <Loader2 className="size-4 animate-spin" />}{saving ? "Saving…" : "Confirm reassignments and save"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
}
