"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-time-picker"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { shiftDate } from "@/lib/attendance"
import { WORKING_DAYS, formatWorkTime } from "@/lib/trainer-availability"
import { mondayOf, type ScheduleSession } from "@/lib/trainer-scheduling"
import type { TrainerScheduleData } from "@/lib/services/trainer-schedule.services"
import { cn } from "@/lib/utils"

export function WeeklySchedule({ trainerName, data, onWeekChange, loading }: {
  trainerName: string
  data: TrainerScheduleData
  onWeekChange: (week: string) => void
  loading: boolean
}) {
  const [selected, setSelected] = useState<ScheduleSession | null>(null)
  const ranges = [...data.availability, ...data.sessions]
  const start = ranges.length ? Math.floor(Math.min(...ranges.map((range) => range.startMinute)) / 60) * 60 : 480
  const end = ranges.length ? Math.ceil(Math.max(...ranges.map((range) => range.endMinute)) / 60) * 60 : 1080
  const times = Array.from({ length: Math.ceil((end - start) / 60) }, (_, index) => start + index * 60)
  const displayDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })

  return (
    <section aria-labelledby="weekly-schedule-title" aria-busy={loading} className="min-w-0 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="weekly-schedule-title" className="font-heading text-base font-semibold">Weekly Schedule</h3>
          <p className="mt-1 text-xs text-muted-foreground">{trainerName} · {data.timeZone}</p>
        </div>
        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{new Set(data.sessions.map((session) => session.id)).size} bookings</span>
      </div>
      <div className="my-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium">{displayDate(data.weekStart)} – {displayDate(shiftDate(data.weekStart, 6))}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous week" disabled={loading} onClick={() => onWeekChange(shiftDate(data.weekStart, -7))}><ChevronLeft /></Button>
          <DatePicker aria-label="Choose schedule week" value={data.weekStart} onValueChange={(date) => onWeekChange(mondayOf(date || data.today))} className="h-9 w-40 text-xs" />
          <Button variant="ghost" size="icon" aria-label="Next week" disabled={loading} onClick={() => onWeekChange(shiftDate(data.weekStart, 7))}><ChevronRight /></Button>
        </div>
      </div>
      {!data.availability.length && <p className="mb-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">No working hours are saved for this trainer. Session allocation requires configured working hours.</p>}
      <div className="mt-2 rounded-lg" role="region" aria-label={`Entire week's trainer timetable for ${trainerName}`}>
        <table className="w-full table-fixed border-separate border-spacing-0.5 sm:border-spacing-1">
          <caption className="sr-only">Weekly work hours and saved member sessions for {trainerName}. Select a booking to view its details.</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[48px] bg-card pb-3 text-left text-[10px] font-medium text-muted-foreground sm:w-[66px] sm:px-2 sm:text-xs">Time</th>
              {WORKING_DAYS.map((day, index) => {
                const date = shiftDate(data.weekStart, index)
                const hours = data.availability.filter((range) => range.dayOfWeek === day.value)
                return (
                  <th key={day.value} scope="col" className={cn("px-1 pb-3 text-center text-xs font-medium", hours.length ? "text-foreground" : "text-muted-foreground")}>
                    {day.label.slice(0, 3)}
                    <span className="mt-1 block text-[10px] font-normal text-muted-foreground">{hours.length ? displayDate(date) : "Off"}</span>
                    {hours.map((range, index) => (
                      <span key={index} className="mt-1 block text-[9px] font-normal text-muted-foreground">
                        {formatWorkTime(range.startMinute).replace(":00", "")}–{formatWorkTime(range.endMinute).replace(":00", "")}
                      </span>
                    ))}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {times.map((time) => (
              <tr key={time}>
                <th scope="row" aria-label={`${formatWorkTime(time)} to ${formatWorkTime(time + 60)}`} className="bg-card text-left text-[10px] font-normal whitespace-nowrap text-muted-foreground sm:px-2 sm:text-[11px]">
                  {formatWorkTime(time).replace(":00", "").replace(/ (AM|PM)$/, "")}–{formatWorkTime(time + 60).replace(":00", "")}
                </th>
                {WORKING_DAYS.map((day, index) => {
                  const date = shiftDate(data.weekStart, index)
                  const sessions = data.sessions.filter((session) => session.date === date && session.startMinute < time + 60 && session.endMinute > time)
                  const working = data.availability.some((range) => range.dayOfWeek === day.value && range.startMinute < time + 60 && range.endMinute > time)
                  return (
                    <td key={day.value} className="h-[56px] p-0 text-center align-middle">
                      {sessions.length ? (
                        <div className="space-y-1">
                          {sessions.map((session) => (
                            <button
                              key={session.id}
                              type="button"
                              onClick={() => setSelected(session)}
                              aria-label={`${session.memberName}, ${day.label}, ${formatWorkTime(session.startMinute)} to ${formatWorkTime(session.endMinute)}, ${session.status.toLowerCase().replaceAll("_", " ")}`}
                              title={`${session.memberName} · ${formatWorkTime(session.startMinute)}–${formatWorkTime(session.endMinute)}`}
                              className={cn("group flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-lg border border-accent/10 bg-accent/5 px-1.5 py-2 transition-colors hover:border-accent/30 hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", session.status !== "SCHEDULED" && "opacity-70")}
                            >
                              <span className="min-w-0 text-[10px] leading-4 font-medium wrap-anywhere text-foreground sm:text-[11px]">{session.memberName}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground"><span aria-hidden="true">—</span><span className="sr-only">{working ? "Available during working hours" : "Outside working hours"}</span></span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.sessions.length && <p className="mt-3 text-xs text-muted-foreground">No member sessions allocated for this week.</p>}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent><DialogHeader><DialogTitle>{selected?.memberName}</DialogTitle><DialogDescription>Saved training session · {data.timeZone}</DialogDescription></DialogHeader>
          {selected && <dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">Date</dt><dd>{displayDate(selected.date)}</dd></div><div><dt className="text-muted-foreground">Time</dt><dd>{formatWorkTime(selected.startMinute)} – {formatWorkTime(selected.endMinute)}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd className="capitalize">{selected.status.toLowerCase().replaceAll("_", " ")}</dd></div></dl>}
        </DialogContent>
      </Dialog>
    </section>
  )
}
