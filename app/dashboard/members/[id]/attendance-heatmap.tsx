import { Fragment } from "react"
import { CalendarDays, Flame, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatProfileDate, sessionLength, type MemberAttendance } from "@/lib/member-profile"

const tones = ["bg-muted", "bg-accent/15", "bg-accent/35", "bg-accent/65", "bg-accent"]
const intensity = (minutes: number) => minutes === 0 ? 0 : minutes < 45 ? 1 : minutes < 60 ? 2 : minutes < 90 ? 3 : 4
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function AttendanceHeatmap({ attendance }: { attendance: MemberAttendance }) {
  const { weeks: attendanceWeeks, summary: attendanceSummary } = attendance
  return (
    <section aria-labelledby="attendance-heatmap-title" className="min-w-0 rounded-xl border border-border/80 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="attendance-heatmap-title" className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="size-4 text-accent" />Attendance Heatmap</h2>
          <p className="mt-1 text-xs text-muted-foreground">Each column is one week. Seven squares show Monday to Sunday; darker crimson means more time in the gym.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><Flame className="size-4 text-accent" /><span className="text-muted-foreground">Current streak:</span><strong>{attendanceSummary.currentStreak} days</strong></span>
          <span className="flex items-center gap-1.5"><Trophy className="size-4 text-amber-500" /><span className="text-muted-foreground">Best streak:</span><strong>{attendanceSummary.bestStreak} days</strong></span>
          <span className="rounded-lg border border-border px-3 py-1.5 text-[11px] text-muted-foreground">Last 52 weeks</span>
        </div>
      </div>

      <div tabIndex={0} role="region" aria-label={`Attendance calendar, ${formatProfileDate(attendance.firstDay)} to ${formatProfileDate(attendance.lastDay)}. Scroll horizontally to see all weeks.`} className="mt-5 overflow-x-auto rounded-lg pb-2 outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
        <div className="grid min-w-[1320px] grid-cols-[32px_repeat(52,minmax(0,1fr))] gap-1 pr-5">
          <div aria-hidden="true" />
          {attendanceWeeks.map((week, index) => {
            const month = new Date(`${week[0].date}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })
            const monthStart = index === 0 || week[0].date.slice(0, 7) !== attendanceWeeks[index - 1][0].date.slice(0, 7)
            return <div key={week[0].date} className="h-5 overflow-visible whitespace-nowrap text-[10px] font-medium text-muted-foreground">{monthStart ? month : ""}</div>
          })}
          {weekdays.map((weekday, dayIndex) => (
            <Fragment key={weekday}>
              <span aria-hidden="true" className="flex items-center text-[10px] text-muted-foreground">{weekday}</span>
              {attendanceWeeks.map((week) => {
                const day = week[dayIndex]
                const label = `${weekday}, ${formatProfileDate(day.date)}: ${day.future ? "Future date" : day.visited ? day.minutes == null ? "Visited; check-out not recorded" : `${sessionLength(day.minutes)} in the gym` : "No visit"}`
                return <div key={day.date} role="img" aria-label={label} title={label} className={cn("aspect-square w-full rounded-[4px] ring-1 ring-inset ring-black/[0.025] transition-[outline] hover:outline hover:outline-2 hover:outline-offset-1 hover:outline-accent", tones[day.visited ? Math.max(1, intensity(day.minutes ?? 0)) : 0], day.future && "opacity-30")} />
              })}
            </Fragment>
          ))}
          <div aria-hidden="true" />
          {attendanceWeeks.map((week) => (
            <div key={week[0].date} className="relative mt-2 h-14" aria-label={`Week starting ${formatProfileDate(week[0].date)}`}>
              <span className="absolute left-1/2 top-0 origin-top-left rotate-60 whitespace-nowrap text-[9px] tabular-nums text-muted-foreground">{formatProfileDate(week[0].date, true)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <p><span className="font-semibold text-foreground">{attendanceSummary.total} gym visits</span> · {formatProfileDate(attendance.firstDay)} – {formatProfileDate(attendance.today)}</p>
        <div className="flex flex-wrap items-center gap-3" aria-label="Heatmap legend">
          {["No visit", "Under 45m", "45–59m", "60–89m", "90m+"].map((label, index) => <span key={label} className="flex items-center gap-1.5"><span className={cn("size-3 rounded-[3px]", tones[index])} />{label}</span>)}
        </div>
      </div>
    </section>
  )
}
