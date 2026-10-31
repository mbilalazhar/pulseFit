"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-time-picker"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { mondayOf, overlaps, prepareAllocation } from "@/lib/trainer-scheduling"
import { availableSessionSlots, sameSlot, slotsOverlap, type SessionSlot } from "@/lib/trainer-session-slots"
import { allocateTrainerSessions, type TrainerScheduleData } from "@/lib/services/trainer-schedule.services"
import type { UnallocatedTrainerMember } from "@/lib/trainer-unallocated-members"
import { SessionSlotPicker } from "./session-slot-picker"

export function AllocateSessionsDialog({ trainerId, member, data, loading, onWeekChange, onClose }: {
  trainerId: string
  member: UnallocatedTrainerMember
  data: TrainerScheduleData
  loading: boolean
  onWeekChange: (week: string) => void
  onClose: () => void
}) {
  const [slots, setSlots] = useState<SessionSlot[]>([])
  const [error, setError] = useState("")
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])
  const queryClient = useQueryClient()
  const duration = member.sessionDurationMinutes ?? 0
  const allowance = member.sessionsPerWeek ?? 0
  const configured = allowance > 0 && duration > 0
  const available = useMemo(() => availableSessionSlots({
    weekStart: data.weekStart, availability: data.availability, sessions: data.sessions,
    duration, timeZone: data.timeZone, now,
  }), [data.weekStart, data.availability, data.sessions, duration, data.timeZone, now])
  const invalidSelection = slots.some((slot) => !available.some((other) => sameSlot(slot, other)))
  const mutation = useMutation({
    mutationFn: () => allocateTrainerSessions(trainerId, { memberId: member.id, weekStart: data.weekStart, slots }),
    onSuccess: async () => {
      toast.success(`Allocated ${slots.length} sessions to ${member.name}.`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trainer-schedule", trainerId] }),
        queryClient.invalidateQueries({ queryKey: ["trainers"] }),
      ])
      onClose()
    },
    onError: (cause: Error) => { setError(cause.message); void queryClient.invalidateQueries({ queryKey: ["trainer-schedule", trainerId] }) },
  })
  const disabledReason = !configured ? "This member's purchased membership needs a weekly session count and session length before allocation."
    : data.trainerStatus !== "ACTIVE" ? "This trainer must be active before allocating sessions."
    : !data.availability.length ? "This trainer has no saved working hours. Configure working hours before allocating sessions." : ""

  function toggleSlot(slot: SessionSlot) {
    if (loading || mutation.isPending || disabledReason) return
    setSlots((current) => {
      if (current.some((other) => sameSlot(slot, other))) return current.filter((other) => !sameSlot(slot, other))
      if (current.length >= allowance || current.some((other) => slotsOverlap(slot, other, duration))) return current
      return [...current, slot]
    })
    setError("")
  }

  function save() {
    if (disabledReason || loading || mutation.isPending || invalidSelection || slots.length !== allowance) return
    try {
      const prepared = prepareAllocation({ memberId: member.id, weekStart: data.weekStart, slots }, {
        availability: data.availability, timeZone: data.timeZone, sessionsPerWeek: allowance, sessionDurationMinutes: duration,
        membershipStart: "1900-01-01", membershipEnd: "9999-12-31", now: new Date(),
      })
      if (prepared.some((slot) => data.sessions.some((booking) => overlaps(slot, { startsAt: new Date(booking.startsAt), endsAt: new Date(booking.endsAt) })))) {
        setError("A selected time is already booked. Choose another time.")
        return
      }
      mutation.mutate()
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check the selected session times.") }
  }

  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose() }}>
    <DialogContent className="max-h-[90svh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-6xl" showCloseButton={!mutation.isPending}>
      <DialogHeader className="pr-7"><DialogTitle>Assign sessions to {member.name}</DialogTitle><DialogDescription>Click empty sessions in the trainer&apos;s weekly schedule. Select {allowance || "the configured"} sessions of {duration || "the configured"} minutes, then save. Times use {data.timeZone}. Bookings apply to this week only.</DialogDescription></DialogHeader>
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1.5"><label htmlFor="allocation-week" className="text-xs font-medium">Week starting</label><DatePicker id="allocation-week" value={data.weekStart} min={mondayOf(data.today)} disabled={mutation.isPending || loading} onValueChange={(date) => { if (date) onWeekChange(mondayOf(date)) }} /></div>
          <p role="status" className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">{slots.length} of {allowance} sessions selected</p>
        </div>
        {loading && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />Updating schedule…</p>}
        {disabledReason ? <p role="status" className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{disabledReason}</p> : <>
          <p className="text-xs text-muted-foreground">Choose any working day in this week, including days before today or the membership start day. Each session is exactly {duration} minutes. Off periods cannot be selected. Click a selected session again to remove it.</p>
          {!available.length && !loading && <p role="status" className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">No available {duration}-minute sessions in this week. Choose another week.</p>}
          <SessionSlotPicker data={data} available={available} selected={slots} memberName={member.name} duration={duration} limit={allowance} disabled={loading || mutation.isPending} onToggle={toggleSlot} />
        </>}
        {invalidSelection && <p role="alert" className="text-sm text-destructive">A selected session is no longer available. Remove it and choose another empty session.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button><Button type="button" disabled={!!disabledReason || loading || mutation.isPending || invalidSelection || slots.length !== allowance} onClick={save}>{mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" />}{mutation.isPending ? "Saving sessions…" : "Save assigned sessions"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
