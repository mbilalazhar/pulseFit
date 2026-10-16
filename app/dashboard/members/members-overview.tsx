"use client"

import { useState } from "react"
import { Activity, ArrowUpRight, CircleCheck, Clock3, UserPlus, Users, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MEMBERS } from "./data"

const total = MEMBERS.length
const active = MEMBERS.filter((member) => member.status === "Active").length
const activePercent = Math.round((active / total) * 100)
const newMembers = MEMBERS.filter((member) => member.joinedThisMonth).length
const expiring = MEMBERS.filter((member) => member.status === "Expiring Soon").length
const paid = MEMBERS.filter((member) => member.payment === "Paid" || member.payment === "Auto-pay").length

const stats = [
  { label: "Total Members", value: total, icon: Users, tone: "bg-rose-50 text-rose-500", bars: "text-rose-200", trend: "+2", hint: "from last month", heights: [12, 22, 20, 27, 34, 26, 48] },
  { label: "Active Members", value: active, icon: CircleCheck, tone: "bg-emerald-50 text-emerald-500", bars: "text-emerald-200", hint: `${activePercent}% of total members`, heights: [10, 20, 16, 24, 32, 22, 48] },
  { label: "New This Month", value: newMembers, icon: UserPlus, tone: "bg-rose-50 text-rose-500", bars: "text-rose-200", trend: "+1", hint: "from last month", heights: [15, 30, 22, 14, 24, 20, 34] },
  { label: "Expiring Soon", value: expiring, icon: Clock3, tone: "bg-orange-50 text-orange-500", bars: "text-orange-200", hint: "Memberships expire in 30 days", heights: [30, 24, 15, 25, 36] },
]

const pulse = [
  { label: "Active Members", percent: activePercent, note: `${active} of ${total} members`, trend: "+5%", color: "text-emerald-500" },
  { label: "Weekly Check-ins", percent: 75, note: "6 members this week", trend: "+8%", color: "text-emerald-500" },
  { label: "Payment Success", percent: Math.round((paid / total) * 100), note: `${paid} payments up to date`, trend: "+3%", color: "text-rose-500" },
  { label: "Member Retention", percent: 88, note: "6 month rate", trend: "+6%", color: "text-emerald-500" },
]

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center" aria-label={`${percent}%`}>
      <svg viewBox="0 0 40 40" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-100" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" pathLength="100" strokeDasharray={`${percent} 100`} strokeLinecap="round" className={color} />
      </svg>
      <span className="absolute text-xs font-bold">{percent}%</span>
    </div>
  )
}

export function MembersOverview() {
  const [showNotice, setShowNotice] = useState(true)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone, bars, trend, hint, heights }) => (
          <section key={label} className="relative flex min-h-28 items-start gap-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone)}>
              <Icon className="size-5" strokeWidth={1.8} />
            </span>
            <div className="relative z-10 min-w-0">
              <h2 className="pr-10 text-xs font-medium text-slate-500">{label}</h2>
              <p className="mt-1 text-2xl font-bold leading-none tracking-tight">{value}</p>
              <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                {trend ? <span className="inline-flex items-center font-medium text-emerald-600"><ArrowUpRight className="mr-0.5 size-3" />{trend}</span> : null}
                {hint}
              </p>
            </div>
            <svg viewBox="0 0 80 54" aria-hidden="true" className={cn("absolute right-3 top-5 h-10 w-12 opacity-70", bars)}>
              {heights.map((height, index) => (
                <rect key={index} x={index * 10 + 3} y={52 - height} width="5" height={height} rx="2.5" fill="currentColor" />
              ))}
            </svg>
          </section>
        ))}
      </div>

      <div className={cn("grid gap-3", showNotice && "xl:grid-cols-[minmax(0,3fr)_minmax(250px,1fr)]")}>
        <section className="rounded-xl border border-slate-200/80 bg-white px-4 py-4">
          <h2 className="text-sm font-bold">Member Pulse</h2>
          <p className="mt-0.5 text-xs text-slate-500">A quick view of your community&apos;s health and engagement.</p>
          <div className="mt-4 grid gap-x-4 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
            {pulse.map(({ label, percent, note, trend, color }) => (
              <div key={label} className="flex items-center gap-3">
                <ProgressRing percent={percent} color={color} />
                <div className="min-w-0">
                  <h3 className="text-[11px] font-semibold">{label}</h3>
                  <p className="mt-1 text-[11px] text-slate-500">{note}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600"><ArrowUpRight className="size-3" />{trend}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {showNotice ? (
          <aside className="relative rounded-xl bg-rose-50/75 p-4">
            <button type="button" aria-label="Dismiss member notice" onClick={() => setShowNotice(false)} className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-accent">
              <X className="size-3.5" />
            </button>
            <span className="flex size-9 items-center justify-center rounded-full bg-rose-100 text-rose-500"><Activity className="size-4" /></span>
            <h2 className="mt-2 text-xs font-semibold">Every member, in one place</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Keep membership plans, renewals, and payment details together for a clearer view of your gym.</p>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
