"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TimePicker } from "@/components/ui/date-time-picker"
import { WORKING_DAYS, timeToMinutes, endTimeToMinutes } from "@/lib/trainer-availability"
import { cn } from "@/lib/utils"
import { areaClass, useTrainerForm } from "./trainer-form-context"
import { FieldLabel } from "./form-fields"

export function ContractorSessionsFields() {
  const { contractorSessions, addContractorSession, removeContractorSession, updateContractorSession } = useTrainerForm()
  return (
    <section aria-labelledby="contractor-sessions-title" className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="contractor-sessions-title" className="text-sm font-medium">Weekly Sessions</h3>
          <p className="mt-1 text-xs text-muted-foreground">Add a weekday and time range for each session, in gym local time.</p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={contractorSessions.length >= 21} onClick={addContractorSession}><Plus className="size-3.5" />Add session</Button>
      </div>
      {contractorSessions.map((session, index) => {
        const start = timeToMinutes(session.startTime)
        const end = endTimeToMinutes(session.endTime)
        const invalid = !Number.isFinite(start) || !Number.isFinite(end) || end <= start
        const overlap = contractorSessions.some((other) => other.id !== session.id && other.dayOfWeek === session.dayOfWeek && start < endTimeToMinutes(other.endTime) && timeToMinutes(other.startTime) < end)
        const error = invalid ? "Set an end time after the start time on the same day." : overlap ? "This session overlaps another session on the same day." : ""
        return (
          <div key={session.id} className="space-y-3 rounded-xl border bg-muted/20 p-3">
            <div className="flex items-center justify-between"><h4 className="text-xs font-semibold">Session {index + 1}</h4><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove session ${index + 1}`} onClick={() => removeContractorSession(session.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></Button></div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><FieldLabel htmlFor={`${session.id}-day`}>Weekday</FieldLabel><select id={`${session.id}-day`} value={session.dayOfWeek} onChange={(event) => updateContractorSession(session.id, { dayOfWeek: Number(event.target.value) })} className={cn(areaClass, "h-11 py-0")}>{WORKING_DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</select></div>
              {(["startTime", "endTime"] as const).map((field) => <div key={field} className="space-y-1.5"><FieldLabel htmlFor={`${session.id}-${field}`}>{field === "startTime" ? "From" : "To"}</FieldLabel><TimePicker allowEndOfDay={field === "endTime"} id={`${session.id}-${field}`} aria-label={`Session ${index + 1} ${field === "startTime" ? "start" : "end"} time`} value={session[field]} onValueChange={(value) => updateContractorSession(session.id, { [field]: value })} required aria-invalid={!!error} aria-describedby={error ? `${session.id}-error` : undefined} /></div>)}
            </div>
            {error ? <p id={`${session.id}-error`} className="text-xs text-destructive">{error}</p> : <p className="text-xs text-muted-foreground">{Number(((end - start) / 60).toFixed(2))} hours per session</p>}
          </div>
        )
      })}
      {contractorSessions.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Add at least one weekly session to continue.</p>}
      <p className="text-xs text-muted-foreground">{contractorSessions.length} / 21 weekly sessions</p>
    </section>
  )
}
