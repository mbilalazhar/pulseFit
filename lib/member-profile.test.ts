import assert from "node:assert/strict"
import { test } from "node:test"
import { buildMemberAttendance, membershipBalance, sessionLength } from "./member-profile"

const now = new Date("2026-10-31T18:00:00Z")
const timeZone = "Asia/Karachi"
function visit(date: string, minutes: number | null) {
  const checkInAt = new Date(`${date}T12:00:00Z`)
  return { id: date, attendanceDate: new Date(date), checkInAt, checkOutAt: minutes == null ? null : new Date(checkInAt.getTime() + minutes * 60_000), durationMinutes: minutes }
}

test("empty profiles have no invented attendance or average duration", () => {
  const result = buildMemberAttendance([], timeZone, "2026-10-20", now)
  assert.deepEqual(result.summary, { total: 0, currentStreak: 0, bestStreak: 0, monthVisits: 0, monthDays: 12, rate: 0, averageMinutes: null, lastVisit: null })
  assert.equal(result.weeks.length, 52)
  assert.equal(result.weeks.flat().length, 364)
  assert.equal(new Date(result.firstDay).getUTCDay(), 1)
  assert.ok(result.weeks.flat().every((day) => !day.visited))
})

test("counts incomplete check-ins as visits without inventing session durations", () => {
  const result = buildMemberAttendance([visit("2026-10-29", 45), visit("2026-10-30", 75), visit("2026-10-31", null)], timeZone, "2026-10-01", now)
  assert.equal(result.summary.currentStreak, 3)
  assert.equal(result.summary.bestStreak, 3)
  assert.equal(result.summary.monthVisits, 3)
  assert.equal(result.summary.averageMinutes, 60)
  assert.equal(result.recentVisits[0].minutes, null)
  assert.match(result.recentVisits[0].time, /Check-out not recorded/)
  assert.equal(result.weeks.flat().find((day) => day.date === "2026-10-31")?.visited, true)
})

test("keeps yesterday's streak until today ends and excludes future visits", () => {
  const result = buildMemberAttendance([visit("2026-10-29", 45), visit("2026-10-30", 0), visit("2026-11-01", 90)], timeZone, "2026-10-01", now)
  assert.equal(result.summary.currentStreak, 2)
  assert.equal(result.summary.lastVisit, "2026-10-30")
  assert.equal(result.summary.total, 2)
  assert.equal(result.weeks.flat().find((day) => day.date === "2026-11-01")?.future, true)
  assert.equal(result.summary.averageMinutes, 23)
})

test("uses gym-local dates at midnight and computes missing checkout durations", () => {
  const row = { ...visit("2026-11-01", 90), checkInAt: new Date("2026-10-31T19:00:00Z"), checkOutAt: new Date("2026-10-31T20:30:00Z"), durationMinutes: null }
  const result = buildMemberAttendance([row], timeZone, "2026-10-01", new Date("2026-10-31T21:00:00Z"))
  assert.equal(result.today, "2026-11-01")
  assert.equal(result.summary.monthDays, 1)
  assert.equal(result.summary.rate, 100)
  assert.equal(result.summary.averageMinutes, 90)
  assert.equal(sessionLength(60), "1h")
})

test("membership balances use linked payments and refunds in the subscription currency", () => {
  const subscription = { finalMinor: 10000, currency: "PKR", payments: [
    { amountMinor: 8000, currency: "PKR", kind: "PAYMENT" },
    { amountMinor: 2000, currency: "PKR", kind: "REFUND" },
    { amountMinor: 10000, currency: "USD", kind: "PAYMENT" },
  ] }
  assert.deepEqual(membershipBalance(subscription), { paidMinor: 6000, balanceMinor: 4000, status: "Partial" })
  assert.deepEqual(membershipBalance({ ...subscription, payments: [] }), { paidMinor: 0, balanceMinor: 10000, status: "Unpaid" })
  assert.deepEqual(membershipBalance({ ...subscription, finalMinor: 0, payments: [] }), { paidMinor: 0, balanceMinor: 0, status: "Paid" })
})
