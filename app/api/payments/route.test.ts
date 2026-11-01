import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"
import type { CreateExpenseInput } from "@/lib/validators/expense"

let session: { gymId: string; userId: string; role: string } | null
const payment = { id: "payment-1", memberSubscriptionId: "sub-1", amountMinor: 40000, currency: "PKR", kind: "PAYMENT", method: "CASH", paidAt: new Date("2000-01-01"), member: { name: "Ali" }, subscription: { planNameSnapshot: "Monthly" } }
let payments: typeof payment[]
type StoredExpense = Omit<CreateExpenseInput, "date"> & { id: string; date: Date; gymId: string; recordedByUserId: string }
let expenses: StoredExpense[]
const findPayments = mock.fn(async (args: unknown) => { void args; return payments })
const findSubscriptions = mock.fn(async (args: unknown) => { void args; return [{ id: "sub-1", finalMinor: 100000, currency: "PKR", status: "ACTIVE", paymentDueDate: null, member: { name: "Ali" }, planNameSnapshot: "Monthly" }] })
const findExpenses = mock.fn(async (args: unknown) => { void args; return expenses })
const createExpense = mock.fn(async ({ data }: { data: Omit<StoredExpense, "id"> }) => { const item = { ...data, id: "expense-1" }; expenses.push(item); return { id: item.id } })
const tx = { gym: { findUnique: async () => ({ timeZone: "Asia/Karachi" }) }, payment: { findMany: findPayments }, memberSubscription: { findMany: findSubscriptions }, expense: { findMany: findExpenses, create: createExpense } }
const transaction = mock.fn(async (callback: (client: typeof tx) => Promise<unknown>, options: unknown) => { void options; return callback(tx) })
mock.module("@/lib/auth", { namedExports: { getSession: async () => session } })
mock.module("@/lib/prisma", { namedExports: { prisma: { ...tx, $transaction: transaction } } })

beforeEach(() => {
  session = { gymId: "gym-1", userId: "admin-1", role: "ADMIN" }; payments = []; expenses = []
  for (const fn of [findPayments, findSubscriptions, findExpenses, createExpense, transaction]) fn.mock.resetCalls()
})
async function get(currency = "PKR") {
  const { GET } = await import("./route")
  return GET(new Request(`http://localhost/api/payments?currency=${currency}`))
}
const expense: CreateExpenseInput = { title: "Rent", category: "Rent", amountMinor: 15000, currency: "PKR", date: "2000-01-01", status: "PAID", method: "Cash" }
async function post(body: unknown = expense) {
  const { POST } = await import("./expenses/route")
  return POST(new Request("http://localhost/api/payments/expenses", { method: "POST", body: JSON.stringify(body) }))
}

test("only authenticated admins can read payments or create expenses", async () => {
  for (const role of [null, "TRAINER", "MEMBER"]) {
    session = role ? { gymId: "gym-1", userId: "user", role } : null
    assert.equal((await get()).status, 401)
    assert.equal((await post()).status, 401)
  }
  assert.equal(transaction.mock.callCount(), 0)
  assert.equal(createExpense.mock.callCount(), 0)
})

test("all ledger queries are scoped to the admin gym and the response is not cached", async () => {
  const response = await get()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("Cache-Control"), "private, no-store")
  for (const fn of [findPayments, findSubscriptions, findExpenses]) assert.deepEqual((fn.mock.calls[0].arguments[0] as { where: unknown }).where, { gymId: "gym-1" })
  assert.deepEqual(transaction.mock.calls[0].arguments[1], { isolationLevel: "RepeatableRead" })
})

test("newly recorded member payments immediately change revenue on the next read", async () => {
  assert.equal((await (await get()).json()).totals.revenueMinor, 0)
  payments.push(payment)
  const body = await (await get()).json()
  assert.equal(body.totals.revenueMinor, 40000)
  assert.equal(body.totals.receivablesMinor, 60000)
  assert.equal(body.receipts.length, 1)
  assert.equal((await (await get()).json()).totals.revenueMinor, 40000)
})

test("saved expenses survive subsequent reads and ignore client-provided gym and recorder", async () => {
  payments = [payment]
  assert.equal((await post({ ...expense, gymId: "foreign", recordedByUserId: "foreign", id: "chosen-id" })).status, 201)
  const saved = createExpense.mock.calls[0].arguments[0].data
  assert.equal(saved.gymId, "gym-1")
  assert.equal(saved.recordedByUserId, "admin-1")
  assert.equal(saved.amountMinor, 15000)
  assert.equal("id" in saved, false)
  const body = await (await get()).json()
  assert.equal(body.expenses.length, 1)
  assert.equal(body.totals.expensesMinor, 15000)
  assert.equal(body.totals.netMinor, 25000)
})

test("pending future expenses become payables without inflating paid expenses", async () => {
  assert.equal((await post({ ...expense, status: "PENDING", date: "2099-01-01" })).status, 201)
  const body = await (await get()).json()
  assert.equal(body.totals.expensesMinor, 0)
  assert.equal(body.totals.payablesMinor, 15000)
})

test("invalid amounts, dates, currencies and future paid expenses are rejected", async () => {
  for (const body of [null, { ...expense, amountMinor: 0 }, { ...expense, amountMinor: 1.5 }, { ...expense, amountMinor: 2147483648 }, { ...expense, currency: "wrong" }, { ...expense, date: "2026-02-30" }, { ...expense, date: "2099-01-01" }, { ...expense, title: "  " }]) assert.equal((await post(body)).status, 400)
  assert.equal((await get("bad")).status, 400)
  assert.equal(createExpense.mock.callCount(), 0)
})
