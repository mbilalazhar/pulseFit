"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarDays, CreditCard, Eye, ListFilter, Pencil, Search } from "lucide-react"
import defaultAvatar from "@/assets/User_Default.png"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MEMBER_TABS, PAYMENT_STYLES, STATUS_STYLES, matchesMemberTab, type MemberTab } from "./data"
import type { MemberSummary } from "@/lib/member-directory"

const money = (amount: number | null, currency: string | null) => amount === null || !currency ? "Not recorded" : `${currency} ${(amount / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`
const date = (value: string | null) => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Not recorded"
const statusLabel = (member: MemberSummary) => member.expiringSoon ? "Expiring Soon" : member.status
const paymentNote = (member: MemberSummary) => member.balanceMinor !== null && member.balanceMinor > 0
  ? `Balance: ${money(member.balanceMinor, member.currency)}`
  : member.lastPaymentDate ? `Last paid: ${date(member.lastPaymentDate)}` : member.endDate ? `Ends: ${date(member.endDate)}` : "No payment recorded"
const duration = (months: number | null) => months === null ? "Not recorded" : `${months} ${months === 1 ? "month" : "months"}`

export function MembersTable({ members, plans }: { members: MemberSummary[]; plans: { id: string; name: string }[] }) {
  const [tab, setTab] = useState<MemberTab>("All Members")
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [plan, setPlan] = useState("All plans")
  const [months, setMonths] = useState("Any duration")
  const durations = [...new Set(members.flatMap((member) => member.durationMonths ? [member.durationMonths] : []))].sort((a, b) => a - b)

  const search = query.trim().toLowerCase()
  const filtered = members.filter((member) =>
    matchesMemberTab(member, tab) &&
    (plan === "All plans" || member.planId === plan) &&
    (months === "Any duration" || member.durationMonths === Number(months)) &&
    `${member.name} ${member.email ?? ""} ${member.phone}`.toLowerCase().includes(search),
  )
  const filterCount = Number(plan !== "All plans") + Number(months !== "Any duration")
  const resetFilters = () => {
    setTab("All Members")
    setQuery("")
    setPlan("All plans")
    setMonths("Any duration")
  }

  return (
    <section aria-label="Member directory" className="min-w-0 space-y-3">
      <div className="flex flex-col gap-3 border-b border-border/80 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="flex min-w-0 gap-1 overflow-x-auto">
          {MEMBER_TABS.map((value) => {
            const count = value === "All Members" ? members.length : members.filter((member) => matchesMemberTab(member, value)).length
            return (
              <button
                key={value}
                type="button"
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
                className={cn("shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-accent", tab === value ? "border-rose-500 font-semibold text-rose-600 dark:text-rose-400" : "border-transparent text-muted-foreground hover:text-foreground")}
              >
                {value} <span>({count})</span>
              </button>
            )
          })}
        </div>
        <div className="flex min-w-0 gap-2 pb-3 xl:pb-1">
          <div className="relative min-w-0 flex-1 xl:w-64 2xl:w-80">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search members"
              placeholder="Search members by name, email or phone..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full rounded-full border border-border bg-muted/80 pl-9 pr-3 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
            />
          </div>
          <Button type="button" variant="outline" className="h-9 gap-2 bg-card px-3 text-xs" aria-expanded={showFilters} aria-controls="member-filters" onClick={() => setShowFilters((value) => !value)}>
            <ListFilter className="size-3.5" />
            Filter{filterCount > 0 ? ` (${filterCount})` : ""}
          </Button>
        </div>
      </div>

      {showFilters ? (
        <div id="member-filters" className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-muted/60 p-3">
          <label className="space-y-1 text-xs font-medium">
            <span className="block">Membership plan</span>
            <select value={plan} onChange={(event) => setPlan(event.target.value)} className="h-9 min-w-36 rounded-lg border bg-card px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
              <option value="All plans">All plans</option>
              {plans.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span className="block">Package duration</span>
            <select value={months} onChange={(event) => setMonths(event.target.value)} className="h-9 min-w-36 rounded-lg border bg-card px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
              <option>Any duration</option>
              {durations.map((value) => <option key={value} value={value}>{duration(value)}</option>)}
            </select>
          </label>
          <Button type="button" variant="ghost" className="h-9 text-xs text-muted-foreground" onClick={resetFilters}>Clear filters</Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[860px] border-separate border-spacing-x-0 border-spacing-y-1 text-left">
          <caption className="sr-only">Members, current membership packages, package duration, and payment details</caption>
          <thead>
            <tr className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 pb-1.5 font-medium">Member</th>
              <th scope="col" className="px-3 pb-1.5 font-medium">Plan</th>
              <th scope="col" className="px-3 pb-1.5 font-medium">Status</th>
              <th scope="col" className="px-3 pb-1.5 font-medium">Package Duration</th>
              <th scope="col" className="px-3 pb-1.5 font-medium">Payment</th>
              <th scope="col" className="px-3 pb-1.5 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>

            {filtered.map((member) => (
              <tr
                key={member.id}
                className="group relative border-b border-border transition-colors duration-200 ease-out hover:z-10 hover:translate-y-0.75 hover:bg-muted hover:shadow-[0_5px_18px_rgba(0,0,0,0.07)]"
              >
                {/* Member */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={defaultAvatar}
                      alt=""
                      width={38}
                      height={38}
                      className="size-[38px] shrink-0 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">
                        {member.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">
                        {member.email || member.phone}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td className="px-4 py-4">
                  <p className="text-[13px] font-semibold text-foreground">
                    {member.plan ?? "No plan assigned"}
                  </p>
                  <p className="mt-0.5 whitespace-nowrap text-[12px] text-muted-foreground">
                    {money(member.priceMinor, member.currency)}{member.priceMinor !== null ? " total" : ""}
                  </p>
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium",
                      STATUS_STYLES[statusLabel(member)]
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {statusLabel(member)}
                  </span>
                </td>

                {/* Duration */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium text-foreground">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    {duration(member.durationMonths)}
                  </span>
                </td>

                {/* Payment */}
                <td className="px-4 py-4">
                  <div className="flex items-start gap-2">
                    <CreditCard
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        member.payment === "Pending"
                          ? "text-rose-500"
                          : member.payment === "Partial"
                          ? "text-blue-500"
                          : "text-emerald-500"
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-[12px] font-semibold",
                          PAYMENT_STYLES[member.payment]
                        )}
                      >
                        {member.payment}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 whitespace-nowrap text-[11px]",
                          member.payment === "Pending"
                            ? "text-rose-500"
                            : member.expiringSoon
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {paymentNote(member)}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      aria-label={`View ${member.name}`}
                      className={cn(buttonVariants({ size: "icon-sm", variant: "ghost" }), "text-muted-foreground hover:text-foreground")}
                    >
                      <Eye className="size-4" />
                    </Link>

                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Edit ${member.name}`}
                      disabled
                      className="text-muted-foreground disabled:opacity-40"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="rounded-xl border border-dashed py-12 text-center">
                <p className="text-sm font-medium">{members.length === 0 ? "No members added yet" : "No members found"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{members.length === 0 ? "Add your first member to get started." : "Try a different search or clear your filters."}</p>
                {members.length > 0 ? <Button type="button" variant="link" className="mt-2 text-xs text-accent" onClick={resetFilters}>Clear filters</Button> : null}
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p aria-live="polite" className="px-1 text-xs text-muted-foreground">Showing {filtered.length} of {members.length} members</p>

    </section>
  )
}
