import assert from "node:assert/strict"
import { test } from "node:test"
import { buildMemberDirectory, type MemberDirectoryRecord } from "./member-directory"

const plan = { id: "plan-1", name: "Custom gym plan", basePriceMinor: 100000, currency: "PKR" }
const now = new Date("2026-10-17T19:00:00Z") // October 18 in Karachi.
const record = (overrides: Partial<MemberDirectoryRecord> = {}): MemberDirectoryRecord => ({
  id: "member-1", name: "Ali", email: "ali@example.test", phone: "1234567", status: "ACTIVE",
  startDate: new Date("2026-10-01"), durationMonths: 1, createdAt: new Date("2026-10-10"),
  plan, trainer: { id: "trainer-1", fullName: "Trainer One" },
  subscriptions: [{ plan, priceMinor: 90000, currency: "PKR", startDate: new Date("2026-10-01"), endDate: new Date("2026-10-31"), status: "ACTIVE" }],
  payments: [{ amountMinor: 40000, paidAt: new Date("2026-10-10"), method: "cash" }],
  ...overrides,
})

test("builds live names, purchased price, trainer, dates and payment balance", () => {
  const { members, stats } = buildMemberDirectory([record()], "Asia/Karachi", now)
  assert.equal(members[0].plan, "Custom gym plan")
  assert.equal(members[0].priceMinor, 90000)
  assert.equal(members[0].trainer, "Trainer One")
  assert.equal(members[0].payment, "Partial")
  assert.equal(members[0].balanceMinor, 50000)
  assert.equal(members[0].endDate, "2026-10-31")
  assert.equal(members[0].expiringSoon, true)
  assert.deepEqual(stats, { total: 1, active: 1, activePercent: 100, newThisMonth: 1, newLastMonth: 0, expiring: 1 })
})

test("activates a scheduled member on the gym's current date and preserves frozen status", () => {
  const { members } = buildMemberDirectory([
    record({ status: "INACTIVE", startDate: new Date("2026-10-18") }),
    record({ startDate: new Date("2026-10-19") }),
    record({ status: "FROZEN" }),
  ], "Asia/Karachi", now)
  assert.deepEqual(members.map((member) => member.status), ["Active", "Inactive", "Frozen"])
  assert.deepEqual(members.map((member) => member.expiringSoon), [true, false, false])
})

test("empty gyms return zero stats and legacy records do not invent prices or payment status", () => {
  assert.deepEqual(buildMemberDirectory([], "Asia/Karachi", now).stats, { total: 0, active: 0, activePercent: 0, newThisMonth: 0, newLastMonth: 0, expiring: 0 })
  const legacy = record({ plan: null, trainer: null, email: null, startDate: null, durationMonths: null, subscriptions: [], payments: [] })
  const member = buildMemberDirectory([legacy], "Asia/Karachi", now).members[0]
  assert.equal(member.plan, null)
  assert.equal(member.priceMinor, null)
  assert.equal(member.payment, "Not recorded")
  assert.equal(member.balanceMinor, null)
})

test("calculates paid, pending and free memberships from saved charges and payments", () => {
  const base = record()
  const { members } = buildMemberDirectory([
    record({ payments: [{ amountMinor: 90000, paidAt: now, method: "cash" }] }),
    record({ payments: [] }),
    record({ subscriptions: [{ ...base.subscriptions[0], priceMinor: 0 }], payments: [] }),
  ], "Asia/Karachi", now)
  assert.deepEqual(members.map((member) => member.payment), ["Paid", "Pending", "Paid"])
})

test("uses calendar-month boundaries and an inclusive 30-day expiry window", () => {
  const base = record()
  const { stats } = buildMemberDirectory([
    record({ createdAt: new Date("2026-09-30T19:00:00Z"), subscriptions: [{ ...base.subscriptions[0], endDate: new Date("2026-11-17") }] }),
    record({ createdAt: new Date("2026-09-30T18:59:59Z"), subscriptions: [{ ...base.subscriptions[0], endDate: new Date("2026-11-18") }] }),
    record({ createdAt: new Date("2026-08-01"), subscriptions: [{ ...base.subscriptions[0], endDate: new Date("2026-10-17") }] }),
  ], "Asia/Karachi", now)
  assert.equal(stats.newThisMonth, 1)
  assert.equal(stats.newLastMonth, 1)
  assert.equal(stats.expiring, 1)
  assert.equal(stats.active, 3) // The existing rule depends on start date only.
})

test("does not combine charges denominated in different currencies", () => {
  const base = record()
  const member = buildMemberDirectory([record({ subscriptions: [...base.subscriptions, { ...base.subscriptions[0], currency: "USD" }] })], "Asia/Karachi", now).members[0]
  assert.equal(member.payment, "Not recorded")
  assert.equal(member.balanceMinor, null)
})
