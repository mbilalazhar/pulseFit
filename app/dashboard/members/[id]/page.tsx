import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, ChartNoAxesColumnIncreasing, CircleCheck, Clock3, CreditCard, Crown, Dumbbell, FileText, Flame, Heart, Mail, Phone, RefreshCw, Target, Users } from "lucide-react"
import defaultAvatar from "@/assets/User_Default.png"
import { cn } from "@/lib/utils"
import { AttendanceHeatmap } from "./attendance-heatmap"
import { attendanceSummary, formatSampleDate, recentVisits, sessionLength } from "./sample-profile"

const panel = "rounded-xl border border-border/80 bg-card p-4"
const metrics = [
  { label: "Current Streak", value: `${attendanceSummary.currentStreak} days`, icon: Flame, tone: "bg-accent/5 text-accent" },
  { label: "Attendance This Month", value: `${attendanceSummary.monthVisits} / ${attendanceSummary.monthDays}`, icon: CalendarDays, tone: "bg-accent/5 text-accent" },
  { label: "Attendance Rate", value: `${attendanceSummary.rate}%`, icon: ChartNoAxesColumnIncreasing, tone: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500" },
  { label: "Average Session", value: `${attendanceSummary.averageMinutes} mins`, icon: Clock3, tone: "bg-accent/5 text-accent" },
  { label: "Last Visit", value: formatSampleDate(attendanceSummary.lastVisit), icon: CalendarDays, tone: "bg-accent/5 text-accent" },
]
const bodyMetrics = [
  { label: "Weight", value: "72.4", unit: "kg", change: "3.2 kg", down: true, points: "0,32 8,25 16,27 24,19 32,22 40,13 48,16 56,7" },
  { label: "Body Fat", value: "16.8", unit: "%", change: "2.4%", down: true, points: "0,32 8,27 16,25 24,27 32,18 40,16 48,18 56,10" },
  { label: "Muscle Mass", value: "60.1", unit: "kg", change: "1.8 kg", down: false, points: "0,31 8,23 16,26 24,19 32,20 40,13 48,15 56,8" },
  { label: "BMI", value: "22.1", unit: "", change: "1.1", down: true, points: "0,31 8,27 16,28 24,20 32,19 40,22 48,18 56,11" },
]

export default function MemberDetailsPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <header className="flex items-start gap-3">
        <Link href="/dashboard/members" aria-label="Back to members" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent"><ArrowLeft className="size-4" /></Link>
        <div><div className="flex flex-wrap items-center gap-3"><h1 className="font-heading text-2xl font-bold tracking-tight">Member Details</h1><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">Sample profile</span></div><p className="mt-1 text-sm text-muted-foreground">View member information, attendance, progress and more.</p></div>
      </header>

      <section aria-label="Member profile" className={cn(panel, "grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.3fr)_1fr_1fr_minmax(230px,1.05fr)]")}>
        <div className="flex items-center gap-4">
          <div className="relative shrink-0"><Image src={defaultAvatar} alt="Ali Raza sample profile" width={88} height={88} className="size-[88px] rounded-full bg-muted object-cover ring-4 ring-card" /><span className="absolute bottom-0.5 right-1 size-4 rounded-full border-[3px] border-card bg-emerald-500" /></div>
          <div className="min-w-0"><h2 className="text-xl font-bold tracking-tight">Ali Raza</h2><p className="mt-1 text-xs text-muted-foreground">#PFM-2024-0187</p><div className="mt-3 flex flex-wrap items-center gap-1.5"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"><span className="size-1.5 rounded-full bg-current" />Active</span><span className="inline-flex items-center gap-1 rounded-full bg-accent/5 px-2 py-1 text-[10px] font-medium text-accent"><Crown className="size-3" />Premium</span><span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"><RefreshCw className="size-3" />Auto-pay</span></div></div>
        </div>
        <div className="flex flex-col justify-center gap-3 text-xs xl:border-l xl:border-border xl:pl-5">
          <p className="flex items-center gap-2.5"><Phone className="size-3.5 shrink-0 text-muted-foreground" />+92 300 1234567</p>
          <p className="flex items-center gap-2.5"><Mail className="size-3.5 shrink-0 text-muted-foreground" /><span className="break-all">ali.raza@example.com</span></p>
          <div className="flex items-start gap-2.5"><Users className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /><div><p>Ahmad Raza</p><p className="mt-1 text-[11px] text-muted-foreground">Personal Trainer</p></div></div>
        </div>
        <div className="flex flex-col justify-center gap-4 text-xs xl:border-l xl:border-border xl:pl-5">
          {[["Joined", "12 Jan 2024"], ["Membership Start", "12 Jan 2026"], ["Expires", "11 Jan 2027"]].map(([label, value]) => <p key={label} className="flex items-center gap-2"><CalendarDays className="size-3.5 shrink-0 text-muted-foreground" /><span className="text-muted-foreground">{label}</span><span className="ml-auto whitespace-nowrap font-medium">{value}</span></p>)}
        </div>
        <div className="space-y-3 xl:border-l xl:border-border xl:pl-5">
          <div className="rounded-lg border border-border bg-muted/80 px-3 py-2.5"><p className="text-[11px] text-muted-foreground">Current Plan</p><p className="mt-1 text-[13px] font-semibold">Premium · 12 Months</p></div>
          <div className="flex items-center justify-between gap-2 text-[11px]"><span className="text-muted-foreground">Payment Status</span><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 font-medium text-emerald-600 dark:text-emerald-400"><span className="size-1.5 rounded-full bg-current" />Up to date</span></div>
          <div className="flex flex-wrap justify-between gap-2 text-[11px]"><span className="text-muted-foreground">Next payment on 12 Jan 2027</span><span className="font-semibold">PKR 24,000</span></div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, icon: Icon, tone }) => <section key={label} className={cn(panel, "flex min-h-24 items-center gap-3")}><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="size-5" strokeWidth={1.8} /></span><div><p className="text-lg font-bold tracking-tight">{value}</p><h2 className="mt-1 text-[11px] text-muted-foreground">{label}</h2></div></section>)}
      </div>

      <AttendanceHeatmap />

      <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-[.9fr_1fr_1.2fr_1.1fr]">
        <section className={panel}>
          <h2 className="flex items-center gap-2 text-sm font-bold"><Target className="size-4 text-foreground" />Goals &amp; Focus Areas</h2>
          <div className="mt-4 space-y-2">{[{ label: "Fat Loss", icon: Target }, { label: "Build Lean Muscle", icon: Dumbbell }, { label: "Improve Endurance", icon: Heart }, { label: "Consistency", icon: ChartNoAxesColumnIncreasing }].map(({ label, icon: Icon }) => <div key={label} className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-xs"><Icon className="size-4 text-accent" />{label}</div>)}</div>
        </section>

        <section className={panel}>
          <h2 className="flex items-center gap-2 text-sm font-bold"><TrendingIcon />Body Metrics</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">Latest measurement · 16 Oct 2026</p>
          <div className="mt-3 grid grid-cols-2 gap-2">{bodyMetrics.map((metric) => <div key={metric.label} className="relative overflow-hidden rounded-lg bg-muted p-3"><p className="text-[10px] text-muted-foreground">{metric.label}</p><p className="relative z-10 mt-1 text-sm font-semibold">{metric.value}<span className="ml-0.5 text-[11px] font-medium">{metric.unit}</span></p><p className="relative z-10 mt-1 flex items-center text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{metric.down ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}{metric.change}</p><svg viewBox="0 0 60 40" aria-hidden="true" className="absolute bottom-2 right-1 h-9 w-12 text-accent/70"><polyline points={metric.points} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>)}</div>
        </section>

        <section className={panel}>
          <h2 className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="size-4 text-foreground" />Recent Attendance</h2>
          <div className="mt-3 space-y-1">{recentVisits.map((visit) => <div key={visit.date} className="flex items-center gap-2 border-b border-border py-2 last:border-0"><span className="size-1.5 shrink-0 rounded-full bg-accent" /><time dateTime={visit.date} className="min-w-0 flex-1 whitespace-nowrap text-[11px] font-medium">{formatSampleDate(visit.date, true)}</time><span className="whitespace-nowrap text-[10px] text-muted-foreground">{visit.time}</span><span className="shrink-0 rounded-full bg-accent/5 px-2 py-1 text-[10px] font-medium text-accent">{sessionLength(visit.minutes)}</span></div>)}</div>
        </section>

        <section className={panel}>
          <h2 className="flex items-center gap-2 text-sm font-bold"><CreditCard className="size-4 text-foreground" />Membership &amp; Billing</h2>
          <dl className="mt-3 divide-y divide-border text-[11px]">{[["Plan", "Premium · 12 Months"], ["Start Date", "12 Jan 2026"], ["Expiry Date", "11 Jan 2027"], ["Amount", "PKR 24,000"]].map(([label, value]) => <div key={label} className="flex justify-between gap-2 py-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}<div className="flex items-center justify-between gap-2 py-2"><dt className="text-muted-foreground">Payment Status</dt><dd className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CircleCheck className="size-3" />Up to date</dd></div><div className="flex items-center justify-between gap-2 pt-2"><dt className="text-muted-foreground">Auto-pay</dt><dd className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CircleCheck className="size-3" />Enabled</dd></div></dl>
        </section>
      </div>

      <section className={cn(panel, "flex flex-col gap-3 sm:flex-row sm:items-start")}>
        <h2 className="flex shrink-0 items-center gap-2 text-sm font-bold"><FileText className="size-4 text-foreground" />Internal Notes</h2>
        <p className="text-xs leading-relaxed text-muted-foreground sm:border-l sm:border-border sm:pl-4">Consistent and motivated. Follows the training plan well, with steady progress in strength and body composition. Keep focusing on recovery, form, and a regular weekly routine.</p>
      </section>
    </div>
  )
}

function TrendingIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-4 text-foreground"><path d="m2 15 5-7 4 3 6-8M12 3h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
