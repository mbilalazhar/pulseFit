"use client"

import { useState } from "react"
import { Activity, ArrowUpRight, CircleCheck, Clock3, UserPlus, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MemberStats } from "@/lib/member-directory"

const pulse = [
  { label: "Active Members", percent: 63, note: "5 of 8 members", trend: "+5%", color: "text-emerald-500" },
  { label: "Weekly Check-ins", percent: 75, note: "6 members this week", trend: "+8%", color: "text-emerald-500" },
  { label: "Payment Success", percent: 75, note: "6 payments up to date", trend: "+3%", color: "text-rose-500" },
  { label: "Member Retention", percent: 88, note: "6 month rate", trend: "+6%", color: "text-emerald-500" },
]

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center" aria-label={`${percent}%`}>
      <svg viewBox="0 0 40 40" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" pathLength="100" strokeDasharray={`${percent} 100`} strokeLinecap="round" className={color} />
      </svg>
      <span className="absolute text-xs font-bold">{percent}%</span>
    </div>
  )
}

export function MembersOverview({ stats }: { stats?: MemberStats }) {
  const [showNotice, setShowNotice] = useState(true)
  const monthChange = stats ? stats.newThisMonth - stats.newLastMonth : 0
  const cards = [
    { label: "Total Members", value: stats?.total, icon: Users, tone: "bg-rose-50 dark:bg-rose-950/50 text-rose-500", hint: stats ? `${stats.newThisMonth} added this month` : "" },
    { label: "Active Members", value: stats?.active, icon: CircleCheck, tone: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500", hint: stats ? `${stats.activePercent}% of total members` : "" },
    { label: "New This Month", value: stats?.newThisMonth, icon: UserPlus, tone: "bg-rose-50 dark:bg-rose-950/50 text-rose-500", hint: stats ? `${monthChange > 0 ? "+" : ""}${monthChange} compared with last month` : "" },
    { label: "Expiring Soon", value: stats?.expiring, icon: Clock3, tone: "bg-orange-50 dark:bg-orange-950/50 text-orange-500", hint: "Memberships expire in 30 days" },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone, hint }) => (
          <section key={label} className="relative flex min-h-28 items-start gap-3 overflow-hidden rounded-xl border border-border/80 bg-card p-4">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone)}>
              <Icon className="size-5" strokeWidth={1.8} />
            </span>
            <div className="relative z-10 min-w-0">
              <h2 className="pr-10 text-xs font-medium text-muted-foreground">{label}</h2>
              <p className="mt-1 text-2xl font-bold leading-none tracking-tight">{value ?? "—"}</p>
              <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                {hint}
              </p>
            </div>
          </section>
        ))}
      </div>

      <div className={cn("grid gap-3", showNotice && "xl:grid-cols-[minmax(0,3fr)_minmax(250px,1fr)]")}>
        <section className="rounded-xl border border-border/80 bg-card px-4 py-4">
          <h2 className="text-sm font-bold">Member Pulse</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">A quick view of your community&apos;s health and engagement.</p>
          <div className="mt-4 grid gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
            {pulse.map(({ label, percent, note, trend, color }) => (
              <div key={label} className="flex items-center gap-3">
                <ProgressRing percent={percent} color={color} />
                <div className="min-w-0">
                  <h3 className="text-[11px] font-semibold">{label}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"><ArrowUpRight className="size-3" />{trend}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {showNotice ? (
          <aside className="relative rounded-xl bg-rose-50/75 dark:bg-rose-950/50 p-4">
            <button type="button" aria-label="Dismiss member notice" onClick={() => setShowNotice(false)} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-rose-100 dark:hover:bg-rose-950/50 hover:text-foreground/80 focus-visible:outline-2 focus-visible:outline-accent">
              <X className="size-3.5" />
            </button>
            <span className="flex size-9 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-500"><Activity className="size-4" /></span>
            <h2 className="mt-2 text-xs font-semibold">Every member, in one place</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Keep membership plans, renewals, and payment details together for a clearer view of your gym.</p>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
