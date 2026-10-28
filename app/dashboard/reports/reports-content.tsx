"use client"

import { useState } from "react"
import { ArrowRight, ArrowUp, ArrowUpRight, BellRing, CalendarDays, ChartNoAxesColumnIncreasing, ChevronRight, CircleDollarSign, ClipboardCheck, Download, Dumbbell, FileChartColumnIncreasing, Info, Layers, Lightbulb, Sparkles, TriangleAlert, TrendingUp, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { expiringMembers, opportunities, plans, revenue, riskMembers } from "./data"
import { AttendanceInsights, MembershipDistribution, RevenueChart } from "./report-charts"
import { ExpiryTable, PlanPerformance, RiskTable } from "./report-tables"
import { Badge, IconTile, panelClass, PanelHeading, type Tone } from "./report-ui"

const summary = [
  { title: "Member Retention", value: "84%", change: "6%", note: "vs last month", icon: UserRound, tone: "green", info: "Percentage of members who renewed or continued their membership in this sample reporting period." },
  { title: "Churn Risk Members", value: "18", change: "28%", note: "vs last month", icon: TriangleAlert, tone: "amber", info: "Sample members flagged by attendance, payment, and engagement patterns. These are illustrative risk scores." },
  { title: "Revenue Forecast", value: "PKR 1,480,000", change: "12%", note: "next month", icon: CircleDollarSign, tone: "green", info: "Illustrative forecast for next month, based on the sample membership and renewal figures." },
  { title: "Membership Growth", value: "+9%", change: "9%", note: "this month", icon: ChartNoAxesColumnIncreasing, tone: "green", info: "Sample growth in the active member count compared with the previous reporting period." },
  { title: "Plan Conversion Rate", value: "32%", change: "4%", note: "vs last month", icon: Layers, tone: "pink", info: "Percentage of sample trial members who converted to a paid plan." },
] as const
const opportunityIcons = { basic: ClipboardCheck, trainer: Dumbbell, premium: FileChartColumnIncreasing, growth: TrendingUp, perks: BellRing }

function exportReport() {
  const rows: (string | number)[][] = [
    ["PulseFit Reports — Static Sample Data", "October 2026"], ["Sample snapshot", "9 October 2026"], [],
    ["Metric", "Value", "Change", "Period"], ...summary.map((item) => [item.title, item.value, item.change, item.note]), [],
    ["Member", "Current Plan", "Risk Score (%)", "Key Reason", "Last Active (days)"],
    ...riskMembers.map((member) => [member.name, member.plan, member.score, member.reason, member.active]), [],
    ["Month", "Revenue (PKR)", "Expenses (PKR)"], ...revenue.map((point) => [point.month, point.income, point.expenses]), [],
    ["Plan", "Active Members", "Renewal Rate (%)", "Monthly Revenue (PKR)"], ...plans.map((plan) => [plan.name, plan.members, plan.renewal, plan.revenue]), [],
    ["Expiring Member", "Plan", "Expiry Date", "Days Left"], ...expiringMembers.map((member) => [member.name, member.plan, member.date, member.days]), [],
    ["Opportunity", "Description", "Impact"], ...opportunities.map((item) => [item.title, item.description, item.impact]), [],
    ["Attendance (last 30 days)", "Value"], ["Peak day", "Tuesday, 128 check-ins"], ["Lowest day", "Sunday, 42 check-ins"], ["Average session (minutes)", 56],
  ]
  const csv = rows.map((row) => row.map((value) => {
    const cell = typeof value === "string" && /^[=+@\-\t\r\n]/.test(value) ? `'${value}` : String(value)
    return `"${cell.replaceAll('"', '""')}"`
  }).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "pulsefit-reports-sample-october-2026.csv"
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

type ReportDialog = { type: "risk" } | { type: "expiry" } | { type: "opportunity"; index: number } | { type: "metric"; index: number } | null

export function ReportsContent() {
  const [dialog, setDialog] = useState<ReportDialog>(null)
  const opportunity = dialog?.type === "opportunity" ? opportunities[dialog.index] : null
  const metric = dialog?.type === "metric" ? summary[dialog.index] : null

  return <div className="mx-auto w-full max-w-[1800px] space-y-3">
    <header className="flex flex-col justify-between gap-4 pb-1 sm:flex-row sm:items-center">
      <div><div className="flex items-center gap-3"><h1 className="font-heading text-2xl font-bold tracking-tight">Reports</h1><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">Sample data</span></div><p className="mt-1 text-sm text-muted-foreground">AI-powered insights and business reports for your gym.</p></div>
      <div className="flex items-center gap-3"><div className="flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-xs" aria-label="Report period: October 2026"><CalendarDays className="size-4" />Oct 2026</div><DashboardHeaderButton icon={Download} text="Export Report" bgColor="primary" onClick={exportReport} /></div>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 min-[1400px]:grid-cols-5">
      {summary.map((item, index) => <section key={item.title} className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5">
        <IconTile icon={item.icon} tone={item.tone} className="size-11 rounded-2xl [&_svg]:size-6" />
        <div className="min-w-0"><h2 className="flex items-center gap-1 text-[10px] font-medium">{item.title}<button type="button" aria-label={`About ${item.title}`} onClick={() => setDialog({ type: "metric", index })} className="shrink-0 rounded-full p-0.5 text-muted-foreground outline-none hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"><Info className="size-3" /></button></h2><p className="mt-1 whitespace-nowrap text-lg font-bold tracking-tight 2xl:text-xl">{item.value}</p><p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground"><span className={cn("flex items-center gap-1 font-semibold", index === 1 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400")}>{index === 1 ? <ArrowUp className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}{item.change}</span>{item.note}</p></div>
      </section>)}
    </div>

    <div className="grid items-stretch gap-3 xl:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)]">
      <section className={panelClass}>
        <PanelHeading icon={Sparkles} tone="pink" title="Members Likely to Discontinue Next Month" description="AI analysis based on attendance, payments, and engagement patterns." action={<Button size="sm" className="h-8 bg-rose-50 px-3 text-[11px] text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70" onClick={() => setDialog({ type: "risk" })}>View Full Risk Report<ArrowRight className="ml-1 size-3.5" /></Button>} />
        <div className="mt-3"><RiskTable /></div>
      </section>
      <section className={panelClass}>
        <PanelHeading icon={Lightbulb} tone="amber" title="Plan Improvement Opportunities" description="AI recommendations to improve member retention and grow revenue." />
        <div className="mt-3 space-y-1.5">{opportunities.map((item, index) => <button type="button" key={item.type} onClick={() => setDialog({ type: "opportunity", index })} className="group flex w-full items-center gap-2.5 rounded-lg border border-border/70 px-2 py-2 text-left transition-colors hover:border-accent/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
          <IconTile icon={opportunityIcons[item.type]} tone={index % 2 === 0 ? "green" : "amber"} className="size-8 rounded-lg" />
          <span className="min-w-0 flex-1"><span className="block text-[11px] font-medium leading-snug">{item.title}</span><span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">{item.description}</span></span>
          <Badge tone={({ High: "pink", Medium: "amber", Low: "green" } as Record<string, Tone>)[item.impact]}>{item.impact} Impact</Badge><ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>)}</div>
      </section>
    </div>

    <div className="grid items-stretch gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"><RevenueChart /><MembershipDistribution /></div>

    <div className="grid items-stretch gap-3 xl:grid-cols-3">
      <AttendanceInsights />
      <section className={panelClass}><PanelHeading icon={CalendarDays} tone="pink" title="Expiring Memberships This Month" description="12 memberships expiring in October 2026." action={<Button variant="outline" size="xs" onClick={() => setDialog({ type: "expiry" })}>View All</Button>} /><div className="mt-3"><ExpiryTable /></div></section>
      <PlanPerformance />
    </div>
    <p className="pt-1 text-[10px] text-muted-foreground">Static preview · Sample snapshot: 9 October 2026 · Insights and forecasts are illustrative.</p>

    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null) }}>
      <DialogContent className={dialog?.type === "risk" || dialog?.type === "expiry" ? "sm:max-w-3xl" : "sm:max-w-lg"}>
        <DialogHeader><DialogTitle>{dialog?.type === "risk" ? "Member Churn Risk Report" : dialog?.type === "expiry" ? "Expiring Memberships — October 2026" : opportunity ? "Plan Improvement Opportunity" : metric?.title}</DialogTitle><DialogDescription>{dialog?.type === "risk" ? "18 sample members flagged for follow-up. Scores are illustrative, not live predictions." : dialog?.type === "expiry" ? "12 sample memberships · Days remaining as of 9 October 2026." : "Static preview based on illustrative gym data."}</DialogDescription></DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto">
          {dialog?.type === "risk" && <RiskTable full />}
          {dialog?.type === "expiry" && <ExpiryTable full />}
          {opportunity && <div className="space-y-3"><h3 className="font-semibold">{opportunity.title}</h3><Badge tone={opportunity.impact === "High" ? "pink" : opportunity.impact === "Medium" ? "amber" : "green"}>{opportunity.impact} Impact</Badge><p className="text-sm leading-relaxed text-muted-foreground">{opportunity.detail}</p></div>}
          {metric && <div className="space-y-3"><p className="text-3xl font-bold">{metric.value}</p><p className="text-sm leading-relaxed text-muted-foreground">{metric.info}</p></div>}
        </div>
      </DialogContent>
    </Dialog>
  </div>
}
