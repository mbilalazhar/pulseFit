"use client"

import { useState } from "react"
import { ArrowLeftRight, ArrowRight, CalendarClock, Check, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { DEFAULT_WORKING_DAYS, SAMPLE_SESSIONS, SCHEDULE_DAYS, SESSION_TIMES, moveSession, sessionTime, swapSessionMembers, type PreviewSession } from "./schedule-preview"

const selectClass = "h-10 w-full rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"

export function WeeklySchedule({ trainerName }: { trainerName: string }) {
  const workingDays = DEFAULT_WORKING_DAYS
  const [sessions, setSessions] = useState<PreviewSession[]>(() => SAMPLE_SESSIONS.map((session) => ({ ...session })))
  const [dialog, setDialog] = useState<{ mode: "swap" | "move"; id: string } | null>(null)
  const [targetId, setTargetId] = useState("")
  const [newDay, setNewDay] = useState(0)
  const [newStart, setNewStart] = useState(960)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const source = sessions.find((session) => session.id === dialog?.id)
  const target = sessions.find((session) => session.id === targetId)
  const swapOptions = source ? sessions.filter((session) => session.memberId !== source.memberId && workingDays.includes(session.day)).sort((a, b) => a.day - b.day || a.start - b.start) : []

  function openDialog(mode: "swap" | "move", session: PreviewSession) {
    setDialog({ mode, id: session.id })
    setTargetId("")
    setNewDay(session.day)
    setNewStart(session.start)
    setError("")
  }

  function applyChange() {
    if (!dialog || !source) return
    try {
      if (dialog.mode === "swap") {
        setSessions(swapSessionMembers(sessions, source.id, targetId))
        setNotice(`${source.member} and ${target?.member} have switched session slots.`)
      } else {
        setSessions(moveSession(sessions, source.id, newDay, newStart, workingDays))
        setNotice(`${source.member}'s session moved to ${SCHEDULE_DAYS[newDay].name}, ${sessionTime(newStart)}.`)
      }
      setDialog(null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update the session.") }
  }

  function resetPreview() {
    setSessions(SAMPLE_SESSIONS.map((session) => ({ ...session })))
    setNotice("Sample schedule reset.")
  }

  return (
    <section aria-labelledby="weekly-schedule-title" className="min-w-0 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="weekly-schedule-title" className="font-heading text-base font-semibold">Weekly Schedule</h3>
          <p className="mt-1 text-xs text-muted-foreground">Trainer: {trainerName} · Evening shift</p>
        </div>
        <span className="rounded-full bg-accent/5 px-2.5 py-1 text-[10px] font-medium text-accent">Demo</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>Entire week · 19–25 Oct 2026</span>
        <span>Select a booking to edit</span>
      </div>
        <div className="mt-2 rounded-lg" role="region" aria-label="Entire week's trainer timetable">
          <table className="w-full table-fixed border-separate border-spacing-0.5 sm:border-spacing-1">
            <caption className="sr-only">Sample weekly sessions for {trainerName}, 19–25 October 2026. Select a booked session to change it.</caption>
            <thead>
              <tr>
                <th scope="col" className="w-[48px] bg-card pb-3 text-left text-[10px] font-medium text-muted-foreground sm:w-[66px] sm:px-2 sm:text-xs">Time</th>
                {SCHEDULE_DAYS.map((day, index) => (
                  <th key={index} scope="col" className={cn("px-1 pb-3 text-center text-xs font-medium", workingDays.includes(index) ? "text-foreground" : "text-muted-foreground")}>
                    {day.short}
                    <span className="mt-1 block text-[10px] font-normal text-muted-foreground">{workingDays.includes(index) ? day.date : "Off"}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SESSION_TIMES.map((start) => (
                <tr key={start}>
                  <th scope="row" className="bg-card text-left text-[10px] font-normal whitespace-nowrap text-muted-foreground sm:px-2 sm:text-[11px]">
                    {sessionTime(start).replace(":00 PM", "")}–{sessionTime(start + 60).replace(":00", "")}
                  </th>
                  {SCHEDULE_DAYS.map((_, index) => {
                    const session = sessions.find((item) => item.day === index && item.start === start)
                    return (
                      <td key={index} className="h-[56px] p-0 text-center align-middle">
                        {session ? (
                          <button
                            type="button"
                            onClick={() => openDialog("swap", session)}
                            aria-label={`Manage ${session.member}'s session on ${SCHEDULE_DAYS[index].name}, ${sessionTime(start)} to ${sessionTime(start + 60)}`}
                            className="group flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-accent/10 bg-accent/5 px-1.5 py-2 transition-colors hover:border-accent/30 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            <span className="min-w-0 text-[10px] leading-4 font-medium wrap-anywhere text-foreground sm:text-[11px]">{session.member}</span>
                          </button>
                        ) : <span className="text-sm text-muted-foreground"><span aria-hidden="true">—</span><span className="sr-only">{workingDays.includes(index) ? "Available" : "Day off"}</span></span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {notice ? <p role="status" className="mt-3 flex items-start gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><Check className="mt-0.5 size-3.5 shrink-0" />{notice}</p> : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3"><p className="text-[10px] text-muted-foreground">Sample sessions · Changes reset when you leave or refresh.</p><button type="button" onClick={resetPreview} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"><RotateCcw className="size-3" />Reset preview</button></div>

      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null) }}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle>{dialog?.mode === "swap" ? "Swap member sessions" : "Reschedule session"}</DialogTitle><DialogDescription>{dialog?.mode === "swap" ? "Choose another member to exchange session slots. Each member keeps their training focus." : "Choose a working day and an available one-hour slot."}</DialogDescription></DialogHeader>
          {source ? <>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" aria-label="Session action">
              {(["swap", "move"] as const).map((mode) => <button key={mode} type="button" aria-pressed={dialog?.mode === mode} onClick={() => openDialog(mode, source)} className={cn("rounded-md px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent", dialog?.mode === mode ? "bg-card text-accent shadow-sm" : "text-muted-foreground hover:text-foreground")}>{mode === "swap" ? "Swap members" : "Reschedule"}</button>)}
            </div>
            <div className="rounded-lg border border-accent/15 bg-accent/5 p-3"><p className="text-sm font-semibold">{source.member}</p><p className="mt-1 text-xs text-muted-foreground">{SCHEDULE_DAYS[source.day].name}, {SCHEDULE_DAYS[source.day].date} · {sessionTime(source.start)}–{sessionTime(source.start + 60)}</p><p className="mt-1 text-[11px] text-accent">{source.focus}</p></div>
            {dialog?.mode === "swap" ? <div className="space-y-3">
              <label className="block space-y-1.5 text-xs font-medium"><span>Switch with</span><select value={targetId} onChange={(event) => { setTargetId(event.target.value); setError("") }} className={selectClass}><option value="">Select a member&apos;s session</option>{swapOptions.map((session) => <option key={session.id} value={session.id}>{session.member} · {SCHEDULE_DAYS[session.day].short} · {sessionTime(session.start)}</option>)}</select></label>
              {target ? <div className="space-y-2 rounded-lg bg-muted p-3 text-xs"><p className="font-semibold text-foreground/80">After the swap</p><p className="flex flex-wrap items-center gap-1.5">{source.member}<ArrowRight className="size-3 text-accent" /><span className="text-muted-foreground">{SCHEDULE_DAYS[target.day].short}, {sessionTime(target.start)}</span></p><p className="flex flex-wrap items-center gap-1.5">{target.member}<ArrowRight className="size-3 text-accent" /><span className="text-muted-foreground">{SCHEDULE_DAYS[source.day].short}, {sessionTime(source.start)}</span></p></div> : null}
            </div> : <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs font-medium"><span>Working day</span><select value={newDay} onChange={(event) => { setNewDay(Number(event.target.value)); setError("") }} className={selectClass}>{workingDays.map((index) => <option key={index} value={index}>{SCHEDULE_DAYS[index].name}</option>)}</select></label>
              <label className="space-y-1.5 text-xs font-medium"><span>Session time</span><select value={newStart} onChange={(event) => { setNewStart(Number(event.target.value)); setError("") }} className={selectClass}>{SESSION_TIMES.map((time) => { const booked = sessions.some((session) => session.id !== source.id && session.day === newDay && session.start === time); return <option key={time} value={time} disabled={booked}>{sessionTime(time)}{booked ? " · Booked" : ""}</option> })}</select></label>
            </div>}
            {error ? <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="button" className="gap-1.5 bg-accent text-white hover:bg-accent-hover" disabled={dialog?.mode === "swap" ? !target : newDay === source.day && newStart === source.start} onClick={applyChange}>{dialog?.mode === "swap" ? <ArrowLeftRight className="size-3.5" /> : <CalendarClock className="size-3.5" />}{dialog?.mode === "swap" ? "Swap sessions" : "Move session"}</Button></DialogFooter>
          </> : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
