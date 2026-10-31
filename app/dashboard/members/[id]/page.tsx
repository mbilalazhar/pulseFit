import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, ChartNoAxesColumnIncreasing, CircleCheck, Clock3, CreditCard, FileText, Flame, Mail, Phone, Target, Users } from "lucide-react"
import defaultAvatar from "@/assets/User_Default.png"
import { cn } from "@/lib/utils"
import { getSession } from "@/lib/auth"
import { getMemberDetail } from "@/lib/member-detail"
import { dateInTimeZone } from "@/lib/member-status"
import { buildMemberAttendance, formatProfileDate, membershipBalance, sessionLength } from "@/lib/member-profile"
import { AttendanceHeatmap } from "./attendance-heatmap"

const panel = "rounded-xl border border-border/80 bg-card p-4"
const goalLabels = { FAT_LOSS: "Fat Loss", LEAN_MUSCLE: "Build Lean Muscle", ENDURANCE: "Improve Endurance", CONSISTENCY: "Consistency", CUSTOM: "Custom Goal" }

export default async function MemberDetailsPage({ params }: PageProps<"/dashboard/members/[id]">) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")
  const { id } = await params
  const now = new Date()
  const member = await getMemberDetail(session.gymId, id, now)
  if (!member) notFound()
  const timeZone = member.gym.timeZone
  const today = dateInTimeZone(timeZone, now)
  const subscription = member.subscriptions.find((item) => item.status === "ACTIVE") ?? member.subscriptions[0]
  const billing = subscription ? membershipBalance(subscription) : null
  const calendarDate = (date: Date | null | undefined) => date?.toISOString().slice(0, 10) ?? null
  const localDate = (date: Date) => formatProfileDate(dateInTimeZone(timeZone, date))
  const clock = (date: Date) => date.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone })
  const money = (minor: number | null | undefined) => minor == null || !subscription ? "—" : new Intl.NumberFormat("en-PK", { style: "currency", currency: subscription.currency }).format(minor / 100)
  const plan = subscription ? `${subscription.planNameSnapshot} · ${subscription.durationMonths} ${subscription.durationMonths === 1 ? "Month" : "Months"}` : "No membership recorded"
  const status = member.status === "FROZEN" ? "Frozen" : subscription ? (calendarDate(subscription.startDate)! <= today ? "Active" : "Inactive") : member.status === "ACTIVE" ? "Active" : "Inactive"
  const attendance = buildMemberAttendance(member.attendance, timeZone, dateInTimeZone(timeZone, member.joinedAt), now)
  const metrics = [
    { label: "Current Streak", value: `${attendance.summary.currentStreak} days`, icon: Flame },
    { label: "Attendance This Month", value: `${attendance.summary.monthVisits} / ${attendance.summary.monthDays}`, icon: CalendarDays },
    { label: "Attendance Rate", value: `${attendance.summary.rate}%`, icon: ChartNoAxesColumnIncreasing },
    { label: "Average Visit", value: attendance.summary.averageMinutes == null ? "—" : sessionLength(attendance.summary.averageMinutes), icon: Clock3 },
    { label: "Last Visit", value: formatProfileDate(attendance.summary.lastVisit), icon: CalendarDays },
  ]
  const latestMeasurement = member.measurements[0]
  const previousMeasurement = member.measurements[1]
  const bodyMetrics = [
    { label: "Weight", field: "weightKg", unit: "kg" },
    { label: "Body Fat", field: "bodyFatPct", unit: "%" },
    { label: "Muscle Mass", field: "muscleMassKg", unit: "kg" },
  ] as const
  const lastPayment = subscription?.payments[0]

  return <div className="mx-auto w-full max-w-[1600px] space-y-5">
    <header className="flex items-start gap-3">
      <Link href="/dashboard/members" aria-label="Back to members" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent"><ArrowLeft className="size-4" /></Link>
      <div><h1 className="font-heading text-2xl font-bold tracking-tight">Member Details</h1><p className="mt-1 text-sm text-muted-foreground">View member information, attendance, progress and more.</p></div>
    </header>

    <section aria-label="Member profile" className={cn(panel, "grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.3fr)_1fr_1fr_minmax(230px,1.05fr)]")}>
      <div className="flex items-center gap-4">
        <Image src={defaultAvatar} alt={`${member.name}'s profile`} width={88} height={88} className="size-[88px] rounded-full bg-muted object-cover ring-4 ring-card" />
        <div className="min-w-0"><h2 className="text-xl font-bold tracking-tight">{member.name}</h2><p className="mt-1 break-all text-xs text-muted-foreground">#{member.id}</p><span className={cn("mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium", status === "Active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-muted text-muted-foreground")}><span className="size-1.5 rounded-full bg-current" />{status}</span></div>
      </div>
      <div className="flex flex-col justify-center gap-3 text-xs xl:border-l xl:border-border xl:pl-5">
        <p className="flex items-center gap-2.5"><Phone className="size-3.5 shrink-0 text-muted-foreground" />{member.phone}</p>
        <p className="flex items-center gap-2.5"><Mail className="size-3.5 shrink-0 text-muted-foreground" /><span className="break-all">{member.email || "No email recorded"}</span></p>
        <div className="flex items-start gap-2.5"><Users className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" /><div>{member.assignments.length ? member.assignments.map((assignment) => <Link key={assignment.id} className="block hover:underline" href={`/dashboard/trainers/${assignment.trainer.id}`}>{assignment.trainer.fullName}</Link>) : <p>No trainer assigned</p>}<p className="mt-1 text-[11px] text-muted-foreground">Assigned Trainer</p></div></div>
      </div>
      <div className="flex flex-col justify-center gap-4 text-xs xl:border-l xl:border-border xl:pl-5">
        {[["Joined", localDate(member.joinedAt)], ["Membership Start", formatProfileDate(calendarDate(subscription?.startDate))], ["Expires", formatProfileDate(calendarDate(subscription?.endDate))]].map(([label, value]) => <p key={label} className="flex items-center gap-2"><CalendarDays className="size-3.5 shrink-0 text-muted-foreground" /><span className="text-muted-foreground">{label}</span><span className="ml-auto whitespace-nowrap font-medium">{value}</span></p>)}
      </div>
      <div className="space-y-3 xl:border-l xl:border-border xl:pl-5">
        <div className="rounded-lg border border-border bg-muted/80 px-3 py-2.5"><p className="text-[11px] text-muted-foreground">{subscription?.status === "EXPIRED" ? "Latest Membership" : "Current Membership"}</p><p className="mt-1 text-[13px] font-semibold">{plan}</p></div>
        <div className="flex justify-between gap-2 text-[11px]"><span className="text-muted-foreground">Payment Status</span><span className="font-semibold">{billing?.status ?? "Not recorded"}</span></div>
        <div className="flex justify-between gap-2 text-[11px]"><span className="text-muted-foreground">Outstanding Balance</span><span className="font-semibold">{money(billing?.balanceMinor)}</span></div>
        {subscription?.paymentDueDate && !!billing?.balanceMinor && <p className="text-[11px] text-muted-foreground">Payment due {formatProfileDate(calendarDate(subscription.paymentDueDate))}</p>}
      </div>
    </section>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map(({ label, value, icon: Icon }) => <section key={label} className={cn(panel, "flex min-h-24 items-center gap-3")}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/5 text-accent"><Icon className="size-5" strokeWidth={1.8} /></span><div><p className="text-lg font-bold tracking-tight">{value}</p><h2 className="mt-1 text-[11px] text-muted-foreground">{label}</h2></div></section>)}
    </div>

    <AttendanceHeatmap attendance={attendance} />

    <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-[.9fr_1fr_1.2fr_1.1fr]">
      <section className={panel}>
        <h2 className="flex items-center gap-2 text-sm font-bold"><Target className="size-4" />Goals &amp; Focus Areas</h2>
        <div className="mt-4 space-y-2">{member.goals.length ? member.goals.map((goal) => <div key={goal.id} className="rounded-lg bg-muted px-3 py-2.5 text-xs"><p className="flex items-center gap-2"><Target className="size-4 shrink-0 text-accent" />{goalLabels[goal.type]}</p>{goal.description && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{goal.description}</p>}{goal.achievedAt && <p className="mt-2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CircleCheck className="size-3" />Achieved {localDate(goal.achievedAt)}</p>}</div>) : <p className="text-xs text-muted-foreground">No goals recorded.</p>}</div>
      </section>

      <section className={panel}>
        <h2 className="flex items-center gap-2 text-sm font-bold"><ChartNoAxesColumnIncreasing className="size-4" />Body Metrics</h2>
        {latestMeasurement ? <><p className="mt-1 text-[10px] text-muted-foreground">Latest measurement · {localDate(latestMeasurement.measuredAt)}</p><div className="mt-3 grid grid-cols-2 gap-2">{bodyMetrics.map(({ label, field, unit }) => {
          const value = latestMeasurement[field] == null ? null : Number(latestMeasurement[field])
          const previous = previousMeasurement?.[field] == null ? null : Number(previousMeasurement[field])
          const change = value != null && previous != null ? Number((value - previous).toFixed(2)) : null
          return <div key={field} className="rounded-lg bg-muted p-3"><p className="text-[10px] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value ?? "—"}{value != null && <span className="ml-1 text-[11px] font-medium">{unit}</span>}</p>{change != null && <p className="mt-1 flex items-center text-[10px] text-muted-foreground">{change < 0 ? <ArrowDown className="size-3" /> : change > 0 ? <ArrowUp className="size-3" /> : null}{Math.abs(change)} {unit} vs previous</p>}</div>
        })}</div></> : <p className="mt-4 text-xs text-muted-foreground">No body measurements recorded.</p>}
      </section>

      <section className={panel}>
        <h2 className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="size-4" />Recent Attendance</h2>
        <p className="mt-1 text-[10px] text-muted-foreground">{timeZone}</p>
        <div className="mt-3 space-y-1">{attendance.recentVisits.length ? attendance.recentVisits.map((visit) => <div key={visit.id} className="flex flex-wrap items-center gap-2 border-b border-border py-2 last:border-0"><time dateTime={visit.date} className="flex-1 whitespace-nowrap text-[11px] font-medium">{formatProfileDate(visit.date, true)}</time><span className="text-[10px] text-muted-foreground">{visit.time}</span>{visit.minutes != null && <span className="rounded-full bg-accent/5 px-2 py-1 text-[10px] font-medium text-accent">{sessionLength(visit.minutes)}</span>}</div>) : <p className="text-xs text-muted-foreground">No attendance recorded.</p>}</div>
      </section>

      <section className={panel}>
        <h2 className="flex items-center gap-2 text-sm font-bold"><CreditCard className="size-4" />Membership &amp; Billing</h2>
        {subscription ? <dl className="mt-3 divide-y divide-border text-[11px]">{[
          ["Plan", plan], ["Membership Status", subscription.status.toLowerCase()],
          ["Start Date", formatProfileDate(calendarDate(subscription.startDate))], ["Expiry Date", formatProfileDate(calendarDate(subscription.endDate))],
          ["Sessions / Week", String(subscription.sessionsPerWeek ?? "Not configured")], ["Session Length", subscription.sessionDurationMinutes == null ? "Not configured" : `${subscription.sessionDurationMinutes} minutes`],
          ["Amount", money(subscription.finalMinor)], ["Net Paid", money(billing?.paidMinor)], ["Balance", money(billing?.balanceMinor)], ["Payment Status", billing?.status ?? "Not recorded"],
          ["Last Transaction", lastPayment ? `${lastPayment.kind === "REFUND" ? "Refund" : "Payment"} · ${localDate(lastPayment.paidAt)} · ${lastPayment.method.toLowerCase().replaceAll("_", " ")}` : "Not recorded"],
        ].map(([label, value]) => <div key={label} className="flex justify-between gap-2 py-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl> : <p className="mt-4 text-xs text-muted-foreground">No membership or billing records.</p>}
      </section>
    </div>

    <section className={panel}>
      <h2 className="flex items-center gap-2 text-sm font-bold"><CalendarDays className="size-4" />Upcoming Assigned Sessions</h2>
      <p className="mt-1 text-xs text-muted-foreground">Next saved sessions · {timeZone}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{member.trainingSessions.length ? member.trainingSessions.map((booking) => <div key={booking.id} className="rounded-lg bg-muted p-3 text-xs"><p className="font-medium">{localDate(booking.startsAt)}</p><p className="mt-1">{clock(booking.startsAt)} – {clock(booking.endsAt)}</p><p className="mt-1 text-muted-foreground">{booking.trainer.fullName} · {sessionLength(Math.round((booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000))}</p></div>) : <p className="text-xs text-muted-foreground">No upcoming sessions assigned.</p>}</div>
    </section>

    <section className={panel}>
      <h2 className="flex items-center gap-2 text-sm font-bold"><FileText className="size-4" />Internal Notes</h2>
      <div className="mt-3 space-y-3">{member.notes.length ? member.notes.map((note) => <div key={note.id} className="border-b pb-3 last:border-0 last:pb-0"><p className="whitespace-pre-wrap text-xs leading-relaxed">{note.body}</p><p className="mt-1 text-[10px] text-muted-foreground">{localDate(note.createdAt)}</p></div>) : <p className="text-xs text-muted-foreground">No internal notes recorded.</p>}</div>
    </section>
  </div>
}
