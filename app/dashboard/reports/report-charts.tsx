"use client"

import { useId, useState } from "react"
import { ArrowDown, ArrowUpRight, CalendarDays, ChartNoAxesColumnIncreasing, ChartPie, Clock3, TrendingUp } from "lucide-react"
import { attendance, money, plans, revenue } from "./data"
import { IconTile, panelClass, PanelHeading, Select } from "./report-ui"

export function RevenueChart() {
  const [period, setPeriod] = useState("6")
  const id = useId().replaceAll(":", "")
  const points = revenue.slice(-Number(period))
  const step = 570 / points.length
  return <section className={panelClass}>
    <PanelHeading icon={ChartNoAxesColumnIncreasing} title="Monthly Revenue vs Expenses" description="Track your gym’s financial performance over time." action={<div className="flex flex-wrap items-center gap-4"><div className="flex gap-4 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-600" />Revenue</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" />Expenses</span></div><Select aria-label="Revenue chart period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="6">Last 6 Months</option><option value="3">Last 3 Months</option></Select></div>} />
    <div className="mt-4">
      <svg viewBox="0 0 630 110" className="min-h-28 w-full" role="img" aria-label={`Monthly revenue and expenses in PKR, ${points[0].month} to October 2026`}>
        <defs><linearGradient id={`${id}-revenue`} x2="0" y2="1"><stop stopColor="var(--color-chart-report-income-start)" /><stop offset="1" stopColor="var(--color-chart-report-income-end)" /></linearGradient><linearGradient id={`${id}-expenses`} x2="0" y2="1"><stop stopColor="var(--color-chart-report-expense-start)" /><stop offset="1" stopColor="var(--color-chart-report-expense-end)" /></linearGradient></defs>
        {[0, 1, 2, 3].map((tick) => <g key={tick}><line x1="40" x2="610" y1={86 - tick * 24} y2={86 - tick * 24} stroke="var(--border)" strokeOpacity=".65" /><text x="32" y={90 - tick * 24} textAnchor="end" fontSize="9" fill="var(--muted-foreground)">{["0", "500K", "1.0M", "1.5M"][tick]}</text></g>)}
        {points.map((point, index) => <g key={point.month}>
          <title>{`${point.month}: revenue ${money(point.income)}, expenses ${money(point.expenses)}`}</title>
          <rect x={40 + step * (index + .5) - 26} y={86 - point.income / 1500000 * 72} width="23" height={point.income / 1500000 * 72} rx="2" fill={`url(#${id}-revenue)`} />
          <rect x={40 + step * (index + .5) + 2} y={86 - point.expenses / 1500000 * 72} width="23" height={point.expenses / 1500000 * 72} rx="2" fill={`url(#${id}-expenses)`} />
          <text x={40 + step * (index + .5)} y="102" textAnchor="middle" fontSize="9" fill="var(--muted-foreground)">{point.month}</text>
        </g>)}
      </svg>
    </div>
  </section>
}

export function MembershipDistribution() {
  const [scope, setScope] = useState("active")
  const distribution = plans.map((plan) => ({ ...plan, count: plan.members + (scope === "all" ? plan.inactive : 0) }))
  const total = distribution.reduce((sum, plan) => sum + plan.count, 0)
  const circumference = 2 * Math.PI * 45
  return <section className={panelClass}>
    <PanelHeading icon={ChartPie} title="Membership Distribution" description={`${scope === "active" ? "Active" : "All"} members by plan type.`} action={<Select aria-label="Membership distribution scope" value={scope} onChange={(event) => setScope(event.target.value)}><option value="active">Active Members</option><option value="all">All Members</option></Select>} />
    <div className="mt-2 flex flex-wrap items-center justify-around gap-x-5 gap-y-2">
      <div className="relative size-32 shrink-0"><svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={`${total} ${scope} members: ${distribution.map((plan) => `${plan.name} ${plan.count}`).join(", ")}`}>
        {distribution.map((plan, index) => {
          const length = plan.count / total * circumference
          const offset = distribution.slice(0, index).reduce((sum, entry) => sum + entry.count / total * circumference, 0)
          return <circle key={plan.name} cx="60" cy="60" r="45" fill="none" stroke={plan.color} strokeWidth="18" strokeDasharray={`${Math.max(0, length - 1)} ${circumference}`} strokeDashoffset={-offset}><title>{`${plan.name}: ${plan.count} members`}</title></circle>
        })}
      </svg><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold tracking-tight">{total}</span><span className="text-[9px] text-muted-foreground">Total Members</span></div></div>
      <table className="min-w-48 flex-1 text-left text-[11px]"><caption className="sr-only">Membership distribution by plan</caption><thead className="sr-only"><tr><th>Plan</th><th>Percentage</th><th>Members</th></tr></thead><tbody>{distribution.map((plan) => <tr key={plan.name} className="border-b border-border/50 last:border-0"><td className="py-1.5"><span className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: plan.color }} />{plan.name}</td><td className="px-3 text-right font-semibold">{Math.round(plan.count / total * 100)}%</td><td className="text-right text-muted-foreground">{plan.count}</td></tr>)}</tbody></table>
    </div>
  </section>
}

export function AttendanceInsights() {
  const [period, setPeriod] = useState<keyof typeof attendance>("30")
  const data = attendance[period]
  return <section className={panelClass}>
    <PanelHeading icon={ChartNoAxesColumnIncreasing} title="Attendance Insights" description="Member attendance patterns and engagement." action={<Select aria-label="Attendance insight period" value={period} onChange={(event) => setPeriod(event.target.value as keyof typeof attendance)}><option value="30">Last 30 Days</option><option value="7">Last 7 Days</option></Select>} />
    <div className="mt-3 grid grid-cols-1 gap-2 min-[450px]:grid-cols-3">
      <div className="flex items-start gap-2 rounded-lg border border-border/70 p-2"><IconTile icon={CalendarDays} tone="green" className="size-7 rounded-lg" /><div><p className="text-[9px] text-muted-foreground">Peak Day</p><p className="mt-0.5 text-xs font-semibold">Tuesday</p><p className="mt-0.5 text-[9px] text-emerald-600 dark:text-emerald-400">{data.peak} check-ins</p></div></div>
      <div className="flex items-start gap-2 rounded-lg border border-border/70 p-2"><IconTile icon={ArrowDown} tone="pink" className="size-7 rounded-lg" /><div><p className="text-[9px] text-muted-foreground">Lowest Day</p><p className="mt-0.5 text-xs font-semibold">Sunday</p><p className="mt-0.5 text-[9px] text-rose-500">{data.low} check-ins</p></div></div>
      <div className="flex items-start gap-2 rounded-lg border border-border/70 p-2"><IconTile icon={Clock3} tone="blue" className="size-7 rounded-lg" /><div><p className="text-[9px] text-muted-foreground">Avg. Session Time</p><p className="mt-0.5 text-xs font-semibold">{data.minutes} mins</p><p className="mt-0.5 flex flex-wrap items-center gap-1 text-[8px] text-muted-foreground"><span className="inline-flex items-center text-emerald-600 dark:text-emerald-400"><ArrowUpRight className="size-3" />{data.change}%</span>vs last period</p></div></div>
    </div>
    <div className="mt-2 flex items-start gap-2 rounded-lg bg-emerald-50/90 px-3 py-2.5 dark:bg-emerald-950/30"><TrendingUp className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" /><div><p className="text-[10px] leading-relaxed">Evening sessions (6–9 PM) have {data.uplift}% higher attendance</p><p className="text-[9px] leading-relaxed text-muted-foreground">Consider adding more classes during this time slot.</p></div></div>
  </section>
}
