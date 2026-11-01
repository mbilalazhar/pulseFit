import assert from "node:assert/strict"
import { test } from "node:test"
import { buildPaymentsOverview } from "./payments"

const base = { timeZone: "Asia/Karachi", now: new Date("2026-10-31T12:00:00Z"), payments: [], subscriptions: [], expenses: [] }
const subscription = { id: "sub-1", finalMinor: 100000, currency: "PKR", status: "ACTIVE", paymentDueDate: null, member: { name: "Ali" }, planNameSnapshot: "Monthly" }
const payment = { id: "payment-1", memberSubscriptionId: "sub-1", amountMinor: 40000, currency: "PKR", kind: "PAYMENT", method: "CASH", paidAt: new Date("2026-10-31"), member: { name: "Ali" }, subscription: { planNameSnapshot: "Monthly" } }
const expense = { id: "expense-1", title: "Rent", category: "Rent", amountMinor: 10000, currency: "PKR", date: new Date("2026-10-31"), status: "PAID", method: "Cash" }

test("empty gyms show zero totals without invented payments or collection rates", () => {
  const data = buildPaymentsOverview(base)
  assert.deepEqual(data.totals, { revenueMinor: 0, expensesMinor: 0, netMinor: 0, receivablesMinor: 0, payablesMinor: 0 })
  assert.equal(data.insights.collectionRate, null)
  assert.equal(data.cashFlow.length, 6)
  assert.equal(data.cashFlow.every((month) => month.incomeMinor === 0 && month.expensesMinor === 0), true)
})

test("a new member's amount received increases revenue once and leaves the rest as receivable", () => {
  const before = buildPaymentsOverview({ ...base, subscriptions: [subscription] })
  assert.equal(before.totals.revenueMinor, 0)
  assert.equal(before.totals.receivablesMinor, 100000)
  const input = { ...base, subscriptions: [subscription], payments: [payment] }
  const after = buildPaymentsOverview(input)
  assert.equal(after.totals.revenueMinor, 40000)
  assert.equal(after.totals.receivablesMinor, 60000)
  assert.equal(after.insights.collectionRate, 40)
  assert.equal(after.receipts[0].memberName, "Ali")
  assert.equal(after.cashFlow.at(-1)!.incomeMinor, 40000)
  assert.deepEqual(buildPaymentsOverview(input).totals, after.totals)
})

test("fully paid and free memberships have no receivable", () => {
  const data = buildPaymentsOverview({ ...base, subscriptions: [subscription, { ...subscription, id: "free", finalMinor: 0 }], payments: [{ ...payment, amountMinor: 100000 }] })
  assert.equal(data.receivables.length, 0)
  assert.equal(data.insights.collectionRate, 100)
})

test("refunds reduce revenue and restore the unpaid balance without losing payment history", () => {
  const data = buildPaymentsOverview({ ...base, subscriptions: [subscription], payments: [payment, { ...payment, id: "refund", kind: "REFUND", amountMinor: 15000 }] })
  assert.equal(data.totals.revenueMinor, 25000)
  assert.equal(data.totals.receivablesMinor, 75000)
  assert.equal(data.insights.collectionRate, 25)
  assert.equal(data.receipts.length, 2)
})

test("currencies are never added together and archived membership receipts remain revenue", () => {
  const input = { ...base, subscriptions: [{ ...subscription, status: "CANCELLED" }], payments: [payment, { ...payment, id: "usd", currency: "USD", amountMinor: 9900 }], expenses: [{ ...expense, currency: "USD" }] }
  const pkr = buildPaymentsOverview(input)
  assert.equal(pkr.totals.revenueMinor, 40000)
  assert.equal(pkr.totals.receivablesMinor, 0)
  assert.deepEqual(pkr.currencies, ["PKR", "USD"])
  assert.equal(pkr.totals.expensesMinor, 0)
  const usd = buildPaymentsOverview({ ...input, currency: "USD" })
  assert.equal(usd.totals.revenueMinor, 9900)
  assert.equal(usd.totals.expensesMinor, 10000)
})

test("only paid expenses reduce net revenue; pending expenses become payables", () => {
  const data = buildPaymentsOverview({ ...base, payments: [payment], expenses: [expense, { ...expense, id: "pending", status: "PENDING", amountMinor: 5000 }] })
  assert.equal(data.totals.expensesMinor, 10000)
  assert.equal(data.totals.netMinor, 30000)
  assert.equal(data.totals.payablesMinor, 5000)
  assert.equal(data.payables[0].id, "pending")
  assert.equal(data.insights.projectedMinor, 25000)
  assert.equal(data.cashFlow.at(-1)!.expensesMinor, 10000)
})

test("due reminders use the gym's current date and do not invent missing due dates", () => {
  const data = buildPaymentsOverview({ ...base, now: new Date("2026-10-30T21:00:00Z"), subscriptions: [subscription, { ...subscription, id: "due", paymentDueDate: new Date("2026-10-31") }, { ...subscription, id: "late", paymentDueDate: new Date("2026-10-30") }], expenses: [{ ...expense, status: "PENDING" }] })
  assert.equal(data.today, "2026-10-31")
  assert.deepEqual(data.reminder, { dueToday: 2, overdue: 1 })
  assert.equal(data.receivables.at(-1)!.dueDate, null)
})

test("monthly charts span year boundaries, retain historical revenue, and exclude future receipts", () => {
  const data = buildPaymentsOverview({ ...base, now: new Date("2027-01-31T12:00:00Z"), payments: [payment, { ...payment, id: "old", paidAt: new Date("2020-01-01") }, { ...payment, id: "future", paidAt: new Date("2027-02-01") }] })
  assert.deepEqual(data.cashFlow.map((month) => month.month), ["2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01"])
  assert.equal(data.totals.revenueMinor, 80000)
  assert.equal(data.cashFlow.reduce((sum, month) => sum + month.incomeMinor, 0), 40000)
})
