"use client"

import Link from "next/link"
import { Users, ShieldCheck, Dumbbell, CalendarCheck, Wallet, Download, Plus, CalendarClock, CreditCard } from "lucide-react"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { IconTile } from "../reports/report-ui"
import { Metric, Ring } from "./overview-ui"
import { OverviewRevenueChart } from "./revenue-chart"
import { TodayActivity, MemberPulse, TrainerWorkload, PlansOverview, CurrentMembership, FinancialSnapshot, MemberDirectory, Opportunities, UpcomingRenewals, Tasks } from "./overview-sections"
import { revenue } from "./data"

function exportSummary() {
  const csv = ["PulseFit Dashboard - Static Sample Data", "", "Metric,Value", "Total Members,312", "Active Memberships,287", "Trainers,14", "Currently Inside,48", "This Month Revenue PKR,1120000", "This Month Expenses PKR,740000", "Net Profit PKR,380000", "", "Month,Revenue PKR,Expenses PKR,Attendance Percent", ...revenue.map(row => `${row.month},${row.income},${row.expenses},${row.attendance}`)].join("\r\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "pulsefit-dashboard-sample.csv"
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DashboardContent() {
  return <div className="mx-auto max-w-[1600px] space-y-3">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Dashboard</h1><p className="mt-1 text-xs text-muted-foreground">Overview of your gym’s operations, members, attendance, finances, and growth.</p></div><div className="flex items-center gap-2.5"><DashboardHeaderButton icon={Download} text="Export Summary" bgColor="transparent" onClick={exportSummary} /><DashboardHeaderButton icon={Plus} text="Add Member" bgColor="primary" href="/dashboard/members/create" /></div></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Metric icon={Users} title="Total Members" value="312" detail="↑ 24 new members this month" />
      <Metric icon={ShieldCheck} title="Active Memberships" value="287" detail="92% of total memberships" tone="green" />
      <Metric icon={Dumbbell} title="Trainers" value="14" detail="↑ 2 trainers this month" />
      <Metric icon={CalendarCheck} title="Currently Inside" value="48" detail="Members at the gym now" tone="blue" />
      <Metric icon={Wallet} title="Net Profit This Month" value="PKR 380,000" detail="↑ 18% vs last month" tone="green" />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[{ label: "Member Retention Rate", value: 84, description: "Members who renewed", change: "↑ 4% vs last month" }, { label: "Attendance Rate", value: 79, description: "Members attending regularly", change: "↑ 6% vs last month" }, { label: "Payment Collection Rate", value: 82, description: "Payments received on time", change: "↑ 3% vs last month" }].map(item => <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3.5"><p className="mb-3 text-[11px] font-semibold">{item.label}</p><div className="flex items-center gap-3"><Ring value={item.value} label={item.label} /><div><p className="text-[9px] text-muted-foreground">{item.description}</p><p className="mt-1 text-[9px] text-emerald-600 dark:text-emerald-400">{item.change}</p></div></div></div>)}
      <div className="rounded-xl border border-border/70 bg-card p-3.5"><div className="flex gap-2"><IconTile icon={CalendarClock} tone="amber" /><div><p className="text-[11px] font-semibold">Expiring Soon</p><p className="mt-1 text-2xl font-bold">15</p><p className="text-[9px] text-muted-foreground">Members in the next 7 days</p><Link href="/dashboard/members" className="mt-1 block text-[9px] text-amber-600 hover:underline dark:text-amber-400">Review upcoming renewals</Link></div></div></div>
      <div className="rounded-xl border border-border/70 bg-card p-3.5"><div className="flex gap-2"><IconTile icon={CreditCard} tone="pink" /><div><p className="text-[11px] font-semibold">Overdue Members</p><p className="mt-1 text-2xl font-bold">18</p><p className="text-[9px] text-muted-foreground">Members with overdue payments</p><Link href="/dashboard/payments" className="mt-1 block text-[9px] text-accent hover:underline">View pending payments</Link></div></div></div>
    </div>
    <div className="grid items-stretch gap-3 xl:grid-cols-[1.85fr_1fr]"><OverviewRevenueChart /><TodayActivity /></div>
    <div className="grid gap-3 lg:grid-cols-2"><MemberPulse /><TrainerWorkload /></div>
    <div className="grid gap-3 lg:grid-cols-2"><PlansOverview /><CurrentMembership /></div>
    <FinancialSnapshot />
    <div className="grid items-start gap-3 xl:grid-cols-3"><MemberDirectory /><Opportunities /><UpcomingRenewals /></div>
    <Tasks />
    <p className="pt-1 text-right text-[10px] text-muted-foreground">Static dashboard preview · Sample data for October 2026</p>
  </div>
}
