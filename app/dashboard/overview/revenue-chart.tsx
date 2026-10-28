"use client"

import { useState } from "react"
import { ChartNoAxesCombined } from "lucide-react"
import { Panel } from "./overview-ui"
import { Select } from "../reports/report-ui"
import { revenue, money } from "./data"

export function OverviewRevenueChart() {
  const [period, setPeriod] = useState("6")
  const points = revenue.slice(-Number(period))
  const step = 560 / points.length
  return <Panel title="Revenue, Expenses & Members" description="Monthly overview for the last six months." icon={ChartNoAxesCombined} action={<Select aria-label="Chart period" value={period} onChange={event => setPeriod(event.target.value)}><option value="6">Last 6 Months</option><option value="3">Last 3 Months</option></Select>}>
    <div className="mb-4 flex flex-wrap justify-center gap-4 text-[10px] text-muted-foreground">{[["Revenue", "bg-emerald-500"], ["Expenses", "bg-rose-300"], ["Active attendance", "bg-accent"]].map(([label, color]) => <span key={label} className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${color}`} />{label}</span>)}</div>
    <svg viewBox="0 0 660 240" className="w-full" role="img" aria-label="Monthly revenue and expenses in PKR, with active attendance as a percentage">
      {[0, 1, 2, 3, 4].map(tick => <g key={tick}><line x1="50" x2="610" y1={205 - tick * 42} y2={205 - tick * 42} stroke="var(--border)" strokeDasharray="3 4" /><text x="40" y={209 - tick * 42} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{["0", "300K", "600K", "900K", "1.2M"][tick]}</text><text x="620" y={209 - tick * 42} fontSize="10" fill="var(--muted-foreground)">{tick * 25}%</text></g>)}
      {points.map((point, index) => <g key={point.month}><title>{`${point.month}: revenue ${money(point.income)}, expenses ${money(point.expenses)}, active attendance ${point.attendance}%`}</title><rect x={50 + step * (index + 0.5) - 26} y={205 - point.income / 1200000 * 168} width="23" height={point.income / 1200000 * 168} rx="3" fill="var(--color-chart-revenue)" /><rect x={50 + step * (index + 0.5) + 3} y={205 - point.expenses / 1200000 * 168} width="23" height={point.expenses / 1200000 * 168} rx="3" fill="var(--color-chart-expenses)" /><text x={50 + step * (index + 0.5)} y="227" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{point.month}</text></g>)}
      <polyline points={points.map((point, index) => `${50 + step * (index + 0.5)},${205 - point.attendance / 100 * 168}`).join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      {points.map((point, index) => <circle key={point.month} cx={50 + step * (index + 0.5)} cy={205 - point.attendance / 100 * 168} r="3.5" fill="var(--accent)"><title>{`${point.month}: ${point.attendance}% active attendance`}</title></circle>)}
    </svg>
  </Panel>
}
