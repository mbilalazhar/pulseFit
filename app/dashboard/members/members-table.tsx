"use client"

import { useState } from "react"
import Image from "next/image"
import { CalendarDays, CreditCard, Eye, ListFilter, Pencil, Search } from "lucide-react"
import defaultAvatar from "@/assets/User_Default.png"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { MEMBERS, MEMBER_TABS, PAYMENT_STYLES, STATUS_STYLES, type Member, type MemberTab } from "./data"

const price = (amount: number) => `PKR ${amount.toLocaleString("en-US")}/month`
const duration = (months: number) => `${months} ${months === 1 ? "month" : "months"}`

export function MembersTable() {
  const [tab, setTab] = useState<MemberTab>("All Members")
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [plan, setPlan] = useState("All plans")
  const [months, setMonths] = useState("Any duration")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const search = query.trim().toLowerCase()
  const filtered = MEMBERS.filter((member) =>
    (tab === "All Members" || member.status === tab) &&
    (plan === "All plans" || member.plan === plan) &&
    (months === "Any duration" || member.durationMonths === Number(months)) &&
    `${member.name} ${member.email} ${member.phone}`.toLowerCase().includes(search),
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
      <div className="flex flex-col gap-3 border-b border-slate-200/80 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="flex min-w-0 gap-1 overflow-x-auto">
          {MEMBER_TABS.map((value) => {
            const count = value === "All Members" ? MEMBERS.length : MEMBERS.filter((member) => member.status === value).length
            return (
              <button
                key={value}
                type="button"
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
                className={cn("shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-accent", tab === value ? "border-rose-500 font-semibold text-rose-600" : "border-transparent text-slate-500 hover:text-slate-900")}
              >
                {value} <span>({count})</span>
              </button>
            )
          })}
        </div>
        <div className="flex min-w-0 gap-2 pb-3 xl:pb-1">
          <div className="relative min-w-0 flex-1 xl:w-64 2xl:w-80">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              aria-label="Search members"
              placeholder="Search members by name, email or phone..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-9 w-full rounded-full border border-slate-100 bg-slate-50/80 pl-9 pr-3 text-xs outline-none placeholder:text-slate-400 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/15"
            />
          </div>
          <Button type="button" variant="outline" className="h-9 gap-2 bg-white px-3 text-xs" aria-expanded={showFilters} aria-controls="member-filters" onClick={() => setShowFilters((value) => !value)}>
            <ListFilter className="size-3.5" />
            Filter{filterCount > 0 ? ` (${filterCount})` : ""}
          </Button>
        </div>
      </div>

      {showFilters ? (
        <div id="member-filters" className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
          <label className="space-y-1 text-xs font-medium">
            <span className="block">Membership plan</span>
            <select value={plan} onChange={(event) => setPlan(event.target.value)} className="h-9 min-w-36 rounded-lg border bg-white px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
              {["All plans", "Premium", "Pro", "Basic", "Student Plan"].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            <span className="block">Package duration</span>
            <select value={months} onChange={(event) => setMonths(event.target.value)} className="h-9 min-w-36 rounded-lg border bg-white px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
              <option>Any duration</option>
              {[1, 3, 6, 12].map((value) => <option key={value} value={value}>{duration(value)}</option>)}
            </select>
          </label>
          <Button type="button" variant="ghost" className="h-9 text-xs text-slate-500" onClick={resetFilters}>Clear filters</Button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full min-w-[860px] border-separate border-spacing-x-0 border-spacing-y-1 text-left">
          <caption className="sr-only">Members, current membership packages, package duration, and payment details</caption>
          <thead>
            <tr className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
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
    className="group relative border-b border-main transition-colors duration-200 ease-out hover:z-10 hover:translate-y-0.75 hover:bg-[#FAFAFA] hover:shadow-[0_5px_18px_rgba(0,0,0,0.07)]"
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
          <p className="text-[13px] font-semibold text-black">
            {member.name}
          </p>
          <p className="mt-0.5 text-[12px] text-gray-500">
            {member.email}
          </p>
        </div>
      </div>
    </td>

    {/* Plan */}
    <td className="px-4 py-4">
      <p className="text-[13px] font-semibold text-black">
        {member.plan}
      </p>
      <p className="mt-0.5 whitespace-nowrap text-[12px] text-gray-500">
        {price(member.monthlyPrice)}
      </p>
    </td>

    {/* Status */}
    <td className="px-4 py-4">
      <span
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium",
          STATUS_STYLES[member.status]
        )}
      >
        <span className="size-1.5 rounded-full bg-current" />
        {member.status}
      </span>
    </td>

    {/* Duration */}
    <td className="px-4 py-4">
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium text-gray-800">
        <CalendarDays className="size-4 text-gray-400" />
        {duration(member.durationMonths)}
      </span>
    </td>

    {/* Payment */}
    <td className="px-4 py-4">
      <div className="flex items-start gap-2">
        <CreditCard
          className={cn(
            "mt-0.5 size-4 shrink-0",
            member.payment === "Payment due"
              ? "text-rose-500"
              : member.payment === "Payment paused"
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
              member.payment === "Payment due"
                ? "text-rose-500"
                : member.status === "Expiring Soon"
                ? "text-amber-600"
                : "text-gray-500"
            )}
          >
            {member.paymentNote}
          </p>
        </div>
      </div>
    </td>

    {/* Actions */}
    <td className="px-4 py-4">
      <div className="flex items-center justify-center gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`View ${member.name}`}
          onClick={() => setSelectedMember(member)}
          className="text-gray-500 hover:text-black"
        >
          <Eye className="size-4" />
        </Button>

        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Edit ${member.name}`}
          disabled
          className="text-gray-500 disabled:opacity-40"
        >
          <Pencil className="size-4" />
        </Button>
      </div>
    </td>
  </tr>
))}

            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="rounded-xl border border-dashed py-12 text-center">
                <p className="text-sm font-medium">No members found</p>
                <p className="mt-1 text-xs text-slate-500">Try a different search or clear your filters.</p>
                <Button type="button" variant="link" className="mt-2 text-xs text-accent" onClick={resetFilters}>Clear filters</Button>
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p aria-live="polite" className="px-1 text-xs text-slate-400">Showing {filtered.length} of {MEMBERS.length} members</p>

      <Dialog open={selectedMember !== null} onOpenChange={(open) => { if (!open) setSelectedMember(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMember?.name}</DialogTitle>
            <DialogDescription>Current membership and contact details.</DialogDescription>
          </DialogHeader>
          {selectedMember ? (
            <dl className="space-y-3 text-sm">
              {[
                ["Email", selectedMember.email],
                ["Phone", selectedMember.phone],
                ["Plan", `${selectedMember.plan} · ${price(selectedMember.monthlyPrice)}`],
                ["Package duration", duration(selectedMember.durationMonths)],
                ["Status", selectedMember.status],
                ["Payment", selectedMember.payment],
              ].map(([label, value]) => <div key={label} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2"><dt className="text-slate-500">{label}</dt><dd className="font-medium">{value}</dd></div>)}
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
