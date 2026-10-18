import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let session: { gymId: string; userId: string; role: string } | null
let plan: { basePriceMinor: number; currency: string; durations: { discountPercent: number }[] } | null
let trainer: { id: string } | null
let createError: { code: string } | null

const tx = {
  gym: { findUnique: mock.fn(async () => ({ timeZone: "Asia/Karachi" })) },
  plan: { findFirst: mock.fn(async (args: unknown) => { void args; return plan }) },
  trainer: { findFirst: mock.fn(async (args: unknown) => { void args; return trainer }) },
  member: { create: mock.fn(async ({ data }: { data: Record<string, unknown> }) => {
    if (createError) throw createError
    return { id: "member-1", ...data }
  }) },
}
const transaction = mock.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx))
mock.module("@/lib/auth", { namedExports: { getSession: async () => session } })
mock.module("@/lib/prisma", { namedExports: { prisma: { $transaction: transaction } } })

const input = {
  name: "Ali Raza", phone: "+92 300 1234567", email: "ali@example.com",
  planId: "plan-1", durationMonths: 6, startDate: "2026-01-01",
}
async function post(body: unknown = input) {
  const { POST } = await import("./route")
  return POST(new Request("http://localhost/api/member/create", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  }))
}

beforeEach(() => {
  session = { gymId: "gym-1", userId: "admin-1", role: "ADMIN" }
  plan = { basePriceMinor: 100000, currency: "PKR", durations: [{ discountPercent: 10 }] }
  trainer = { id: "trainer-1" }
  createError = null
  transaction.mock.resetCalls()
  tx.member.create.mock.resetCalls()
  tx.trainer.findFirst.mock.resetCalls()
  tx.plan.findFirst.mock.resetCalls()
})

test("creates a member with server-owned gym, selected duration, and active status", async () => {
  const response = await post({ ...input, startDate: "2000-01-01", trainerId: "trainer-1", gymId: "other-gym", status: "INACTIVE" })
  assert.equal(response.status, 201)
  const { member } = await response.json()
  assert.equal(member.gymId, "gym-1")
  assert.equal(member.durationMonths, 6)
  assert.equal(member.status, "ACTIVE")
  assert.equal(member.startDate, "2000-01-01T00:00:00.000Z")
  assert.equal(member.trainerId, "trainer-1")
  assert.deepEqual(tx.plan.findFirst.mock.calls[0].arguments[0], {
    where: { id: "plan-1", gymId: "gym-1", status: "ACTIVE" },
    select: { basePriceMinor: true, currency: true, durations: { where: { durationMonths: 6 }, select: { discountPercent: true } } },
  })
  assert.deepEqual(tx.trainer.findFirst.mock.calls[0].arguments[0], {
    where: { id: "trainer-1", gymId: "gym-1", status: "ACTIVE" }, select: { id: true },
  })
})

test("future memberships are inactive and a trainer is optional", async () => {
  const response = await post({ ...input, startDate: "9999-01-01" })
  assert.equal(response.status, 201)
  const { member } = await response.json()
  assert.equal(member.status, "INACTIVE")
  assert.equal(member.trainerId, null)
  assert.equal(tx.trainer.findFirst.mock.callCount(), 0)
})

test("rejects unauthenticated and non-admin requests before database access", async () => {
  for (const value of [null, { gymId: "gym-1", userId: "user-1", role: "MEMBER" }]) {
    session = value
    assert.equal((await post()).status, 401)
  }
  assert.equal(transaction.mock.callCount(), 0)
})

test("rejects malformed JSON and invalid dates before database access", async () => {
  const { POST } = await import("./route")
  assert.equal((await POST(new Request("http://localhost/api/member/create", { method: "POST", body: "{" }))).status, 400)
  assert.equal((await post({ ...input, startDate: "2026-02-30" })).status, 400)
  assert.equal(transaction.mock.callCount(), 0)
})

test("rejects unavailable, inactive or other-gym plans", async () => {
  plan = null
  assert.equal((await post()).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
})

test("rejects unavailable, inactive or other-gym trainers", async () => {
  trainer = null
  assert.equal((await post({ ...input, trainerId: "other-trainer" })).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
})

test("returns conflicts for duplicate emails and deleted related records", async () => {
  for (const code of ["P2002", "P2003"]) {
    createError = { code }
    assert.equal((await post()).status, 409)
  }
})

test("stores membership pricing and a partial payment together with the member", async () => {
  const response = await post({ ...input, specialDiscountMinor: 40000, amountReceivedMinor: 200000, paymentDate: "2000-01-01", paymentMethod: "cash", priceMinor: 1 })
  assert.equal(response.status, 201)
  const data = tx.member.create.mock.calls[0].arguments[0].data
  assert.deepEqual(data.subscriptions, { create: {
    gymId: "gym-1", planId: "plan-1", priceMinor: 500000, discountMinor: 40000,
    currency: "PKR", startDate: new Date("2026-01-01"), endDate: new Date("2026-06-30"), status: "ACTIVE",
  } })
  assert.deepEqual(data.payments, { create: {
    gymId: "gym-1", amountMinor: 200000, method: "cash", paidAt: new Date("2000-01-01"),
  } })
})

test("allows plans without predefined duration options and skips zero payments", async () => {
  plan = { basePriceMinor: 100000, currency: "USD", durations: [] }
  const response = await post({ ...input, durationMonths: 2 })
  assert.equal(response.status, 201)
  const { member } = await response.json()
  assert.equal(member.durationMonths, 2)
  assert.equal(member.subscriptions.create.priceMinor, 200000)
  assert.equal(member.subscriptions.create.currency, "USD")
  assert.equal(tx.member.create.mock.calls[0].arguments[0].data.payments, undefined)
})

test("rejects excessive discounts, overpayments, invalid durations, and future payments", async () => {
  for (const invalid of [
    { specialDiscountMinor: 540001 },
    { amountReceivedMinor: 540001, paymentDate: "2000-01-01" },
    { specialDiscountMinor: 540000, amountReceivedMinor: 1, paymentDate: "2000-01-01" },
    { amountReceivedMinor: 100, paymentDate: "9999-01-01" },
    { durationMonths: 13 },
    { startDate: "9999-12-01", durationMonths: 12 },
  ]) assert.equal((await post({ ...input, ...invalid })).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
})
