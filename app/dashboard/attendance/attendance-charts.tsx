"use client"

import { useState } from "react"
import { BarChart3, Users } from "lucide-react"
import type { AttendanceData } from "@/lib/attendance"
import { cn } from "@/lib/utils"

export function AttendanceOverview({ data }: { data: AttendanceData }) {
  const [period, setPeriod] = useState<"Today" | "Weekly" | "Monthly">("Weekly")
  const points = period === "Today"
    ? data.hours.map((hour) => ({ label: `${hour.hour}:00`, checkIns: hour.checkIns, checkOuts: 0, rate: 0 }))
    : data.days.slice(period === "Weekly" ? -7 : -30).map((day) => ({ ...day, label: new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) }))
  const maximum = Math.max(5, ...points.map((point) => Math.max(point.checkIns, point.checkOuts)))
  const step = 520 / points.length
  const width = Math.min(19, step * .28)
  const rateLine = points.map((point, index) => `${48 + step * (index + .5)},${198 - point.rate * 1.55}`).join(" ")
  const hasData = points.some((point) => point.checkIns > 0)
  return (
    <section className="min-w-0 rounded-xl border border-border/80 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold"><BarChart3 className="size-4 text-rose-500" />Attendance Overview</h2>
          <p className="mt-1 text-xs text-muted-foreground">{period === "Today" ? "Check-ins by hour on the selected date." : `Daily check-ins and check-outs over the last ${period === "Weekly" ? 7 : 30} days.`}</p>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          {(["Today", "Weekly", "Monthly"] as const).map((value) => <button key={value} type="button" aria-pressed={value === period} onClick={() => setPeriod(value)} className={cn("rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors", value === period ? "bg-rose-600 text-white" : "text-muted-foreground hover:bg-muted")}>{value}</button>)}
        </div>
      </div>
      <div className="relative mt-4">
        <svg viewBox="0 0 610 240" role="img" aria-label={`${period} attendance chart: ${points.reduce((sum, point) => sum + point.checkIns, 0)} check-ins`} className="min-h-52 w-full">
          {[0, 1, 2, 3, 4].map((tick) => <g key={tick}>
            <line x1="48" x2="568" y1={198 - tick * 39} y2={198 - tick * 39} stroke="var(--border)" />
            <text x="35" y={202 - tick * 39} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{Math.round(maximum * tick / 4)}</text>
            {period !== "Today" ? <text x="578" y={202 - tick * 39} fontSize="10" fill="var(--muted-foreground)">{tick * 25}%</text> : null}
          </g>)}
          {points.map((point, index) => <g key={index}>
            <title>{point.label}: {point.checkIns} check-ins{period !== "Today" ? `, ${point.checkOuts} check-outs, ${point.rate}% attendance` : ""}</title>
            <rect x={48 + step * (index + .5) - width - 1} y={198 - point.checkIns / maximum * 156} width={width} height={point.checkIns / maximum * 156} rx="2" fill="#fecdd3" />
            {period !== "Today" ? <rect x={48 + step * (index + .5) + 1} y={198 - point.checkOuts / maximum * 156} width={width} height={point.checkOuts / maximum * 156} rx="2" fill="#bfdbfe" /> : null}
            {(period === "Weekly" || index % (period === "Today" ? 4 : 5) === 0) ? <text x={48 + step * (index + .5)} y="220" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{point.label}</text> : null}
          </g>)}
          {period !== "Today" && hasData ? <polyline points={rateLine} fill="none" stroke="#e11d48" strokeWidth="2" strokeLinejoin="round" /> : null}
          {period === "Weekly" && hasData ? points.map((point, index) => <circle key={index} cx={48 + step * (index + .5)} cy={198 - point.rate * 1.55} r="3" fill="#e11d48" />) : null}
        </svg>
        {!hasData ? <div className="pointer-events-none absolute inset-0 flex items-center justify-center"><span className="rounded-lg bg-card/95 px-4 py-2 text-xs text-muted-foreground">No check-ins in this period</span></div> : null}
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-300" />Check-ins</span>
        {period !== "Today" ? <><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-200 dark:bg-blue-950/50" />Check-outs</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-rose-600" />Attendance rate</span></> : null}
      </div>
    </section>
  )
}

export function PeakHours({ data }: { data: AttendanceData }) {
  const maximum = Math.max(1, ...data.hours.map((hour) => hour.checkIns))
  const peak = data.hours.reduce((best, hour) => hour.checkIns > best.checkIns ? hour : best, data.hours[0])
  const label = (hour: number) => `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`
  return (
    <section className="rounded-xl border border-border/80 bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div><h2 className="flex items-center gap-2 text-sm font-bold"><BarChart3 className="size-4 text-rose-500" />Peak Hours</h2><p className="mt-1 text-[11px] text-muted-foreground">Busiest check-in times during the day.</p></div>
        {peak.checkIns > 0 ? <span className="flex items-center gap-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 px-2 py-1 text-[10px] font-medium text-rose-600 dark:text-rose-400"><Users className="size-3" />{label(peak.hour)}</span> : null}
      </div>
      <div className="mt-4 flex h-12 items-end gap-1" role="img" aria-label={peak.checkIns ? `Peak check-in hour: ${label(peak.hour)}` : "No check-ins recorded"}>
        {data.hours.map((hour) => <div key={hour.hour} title={`${label(hour.hour)}: ${hour.checkIns} check-ins`} className={cn("flex-1 rounded-t-sm", hour.checkIns === peak.checkIns && peak.checkIns > 0 ? "bg-rose-600" : "bg-rose-200 dark:bg-rose-950/50")} style={{ height: `${Math.max(3, hour.checkIns / maximum * 100)}%` }} />)}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-muted-foreground">{[0, 6, 12, 18, 23].map((hour) => <span key={hour}>{label(hour)}</span>)}</div>
    </section>
  )
}
