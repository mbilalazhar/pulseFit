"use client"

import { CalendarDays, Clock3, ClipboardList, Dumbbell, Layers, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { expiringMembers, money, plans, riskMembers } from "./data"
import { Badge, IconTile, panelClass, PanelHeading, tableClass, tones } from "./report-ui"

const reasons = {
  attendance: { icon: Dumbbell, tone: "pink" as const },
  payment: { icon: ClipboardList, tone: "amber" as const },
  expiry: { icon: CalendarDays, tone: "violet" as const },
  trainer: { icon: UserRound, tone: "violet" as const },
  inactive: { icon: Clock3, tone: "pink" as const },
}
const avatarTones = ["bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300", "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300", "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300", "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300", "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"]

export function RiskTable({ full = false }: { full?: boolean }) {
  return <div className="overflow-x-auto"><table className={tableClass}>
    <caption className="sr-only">Sample members at risk of discontinuing their membership</caption>
    <thead className="bg-muted/50"><tr>{["Member", "Current Plan", "Risk Score", "Key Reason", "Last Active"].map((label) => <th key={label} scope="col" className="first:rounded-l-lg last:rounded-r-lg">{label}</th>)}</tr></thead>
    <tbody>{riskMembers.slice(0, full ? undefined : 5).map((member, index) => <tr key={member.name} className="transition-colors hover:bg-muted/30">
      <td><span className="flex items-center gap-2.5"><span aria-hidden="true" className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", avatarTones[index % avatarTones.length])}>{member.name.split(" ").map((part) => part[0]).join("")}</span><span className="font-medium">{member.name}</span></span></td>
      <td className="text-muted-foreground">{member.plan}</td><td><Badge tone={member.score >= 65 ? "pink" : "amber"}>{member.score}%</Badge></td>
      <td><span className="flex items-center gap-2 text-muted-foreground"><IconTile icon={reasons[member.type].icon} tone={reasons[member.type].tone} className="size-6 rounded-lg [&_svg]:size-3.5" />{member.reason}</span></td><td className="text-muted-foreground">{member.active} days ago</td>
    </tr>)}</tbody>
  </table></div>
}

export function ExpiryTable({ full = false }: { full?: boolean }) {
  return <div className="overflow-x-auto"><table className={cn(tableClass, "text-[10px] [&_td]:py-1.5 [&_th]:py-1.5")}>
    <caption className="sr-only">Sample memberships expiring in October, as of 9 October 2026</caption>
    <thead className="bg-muted/50"><tr>{["Member", "Plan", "Expiry Date", "Days Left"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{expiringMembers.slice(0, full ? undefined : 5).map((member) => <tr key={member.name} className="hover:bg-muted/30"><td className="font-medium">{member.name}</td><td className="text-muted-foreground">{member.plan}</td><td className="text-muted-foreground">{member.date}</td><td><span className={cn("rounded-md px-1.5 py-0.5 text-[9px]", member.days <= 3 ? tones.pink : member.days <= 7 ? tones.amber : "bg-muted text-muted-foreground")}>{member.days} days</span></td></tr>)}</tbody>
  </table></div>
}

export function PlanPerformance() {
  return <section className={panelClass}>
    <PanelHeading icon={Layers} tone="pink" title="Plan Performance Comparison" description="Compare plan performance and revenue contribution." />
    <div className="mt-3 overflow-x-auto"><table className={cn(tableClass, "text-[10px] [&_td]:py-1.5 [&_th]:py-1.5")}>
      <caption className="sr-only">Sample plan performance comparison</caption>
      <thead className="bg-muted/50"><tr>{["Plan", "Active Members", "Renewal Rate", "Monthly Revenue"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{plans.map((plan) => <tr key={plan.name} className="hover:bg-muted/30"><td className="font-medium">{plan.name}</td><td className="text-muted-foreground">{plan.members}</td><td><span className={cn("rounded-md px-1.5 py-0.5 text-[9px]", plan.renewal >= 80 ? tones.green : plan.renewal < 50 ? tones.pink : "bg-muted text-muted-foreground")}>{plan.renewal}%</span></td><td className="tabular-nums text-muted-foreground">{money(plan.revenue)}</td></tr>)}</tbody>
    </table></div>
  </section>
}
