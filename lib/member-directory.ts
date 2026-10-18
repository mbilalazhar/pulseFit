import { dateInTimeZone } from "./member-status"
import { membershipExpiry } from "./membership"

type Plan = { id: string; name: string; basePriceMinor: number; currency: string }
export type MemberDirectoryRecord = {
  id: string
  name: string
  email: string | null
  phone: string
  status: "ACTIVE" | "INACTIVE" | "FROZEN"
  startDate: Date | null
  durationMonths: number | null
  createdAt: Date
  plan: Plan | null
  trainer: { id: string; fullName: string } | null
  subscriptions: {
    plan: Plan
    priceMinor: number
    currency: string
    startDate: Date
    endDate: Date
    status: "ACTIVE" | "INACTIVE" | "EXPIRED" | "CANCELLED"
  }[]
  payments: { amountMinor: number; paidAt: Date; method: string }[]
}

export type MemberSummary = {
  id: string
  name: string
  email: string | null
  phone: string
  planId: string | null
  plan: string | null
  priceMinor: number | null
  currency: string | null
  durationMonths: number | null
  startDate: string | null
  endDate: string | null
  trainer: string | null
  status: "Active" | "Inactive" | "Frozen"
  expiringSoon: boolean
  payment: "Paid" | "Partial" | "Pending" | "Not recorded"
  amountPaidMinor: number | null
  balanceMinor: number | null
  lastPaymentDate: string | null
  lastPaymentMethod: string | null
  createdDate: string
}

export type MemberStats = {
  total: number
  active: number
  activePercent: number
  newThisMonth: number
  newLastMonth: number
  expiring: number
}

/** Subscriptions and payments arrive newest first. Amounts are account totals. */
export function buildMemberDirectory(records: MemberDirectoryRecord[], timeZone: string, now = new Date()) {
  const today = dateInTimeZone(timeZone, now)
  const horizon = new Date(`${today}T00:00:00Z`)
  horizon.setUTCDate(horizon.getUTCDate() + 30)
  const endOfWindow = horizon.toISOString().slice(0, 10)
  const thisMonth = today.slice(0, 7)
  const previousMonth = new Date(`${thisMonth}-01T00:00:00Z`)
  previousMonth.setUTCMonth(previousMonth.getUTCMonth() - 1)
  const lastMonth = previousMonth.toISOString().slice(0, 7)

  const members: MemberSummary[] = records.map((record) => {
    const subscriptions = record.subscriptions.filter((subscription) => subscription.status !== "CANCELLED")
    const current = subscriptions.find((subscription) => !record.plan || subscription.plan.id === record.plan.id)
    const plan = record.plan ?? current?.plan
    const startDate = (record.startDate ?? current?.startDate)?.toISOString().slice(0, 10) ?? null
    const endDate = current?.endDate.toISOString().slice(0, 10)
      ?? (startDate && record.durationMonths ? membershipExpiry(startDate, record.durationMonths) || null : null)
    // Keep the requested start-date rule; frozen members retain their status.
    const status = record.status === "FROZEN" ? "Frozen"
      : startDate ? (startDate <= today ? "Active" : "Inactive")
      : record.status === "ACTIVE" ? "Active" : "Inactive"
    const currency = current?.currency ?? plan?.currency ?? null
    // Payment records have no currency column. Do not combine mixed-currency charges.
    const hasBilling = subscriptions.length > 0 && subscriptions.every((subscription) => subscription.currency === currency)
    const amountPaidMinor = hasBilling ? record.payments.reduce((sum, payment) => sum + payment.amountMinor, 0) : null
    const charged = subscriptions.reduce((sum, subscription) => sum + subscription.priceMinor, 0)
    const balanceMinor = amountPaidMinor === null ? null : Math.max(0, charged - amountPaidMinor)
    const payment = balanceMinor === null ? "Not recorded" : balanceMinor === 0 ? "Paid" : amountPaidMinor! > 0 ? "Partial" : "Pending"
    return {
      id: record.id, name: record.name, email: record.email, phone: record.phone,
      planId: plan?.id ?? null, plan: plan?.name ?? null,
      priceMinor: current?.priceMinor ?? null, currency,
      durationMonths: record.durationMonths, startDate, endDate,
      trainer: record.trainer?.fullName ?? null, status,
      expiringSoon: status === "Active" && !!endDate && endDate >= today && endDate <= endOfWindow,
      payment, amountPaidMinor, balanceMinor,
      lastPaymentDate: record.payments[0]?.paidAt.toISOString().slice(0, 10) ?? null,
      lastPaymentMethod: record.payments[0]?.method ?? null,
      createdDate: dateInTimeZone(timeZone, record.createdAt),
    }
  })
  const active = members.filter((member) => member.status === "Active").length
  const stats: MemberStats = {
    total: members.length,
    active,
    activePercent: members.length ? Math.round(active / members.length * 100) : 0,
    newThisMonth: members.filter((member) => member.createdDate.startsWith(thisMonth)).length,
    newLastMonth: members.filter((member) => member.createdDate.startsWith(lastMonth)).length,
    expiring: members.filter((member) => member.expiringSoon).length,
  }
  return { members, stats }
}
