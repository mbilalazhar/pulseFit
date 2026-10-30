import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let session: { gymId: string; userId: string; role: string } | null
let plan: { name: string; basePriceMinor: number; currency: string; features: { label: string }[]; sessionsPerWeek: number | null; sessionDurationMinutes: number | null; durations: { discountPercent: number }[] } | null
let trainer: { id: string } | null
let createError: { code: string } | null

const tx = {
  gym: { findUnique: mock.fn(async () => ({ timeZone: "Asia/Karachi" })) },
  plan: { findFirst: mock.fn(async (args: unknown) => { void args; return plan }) },
  trainer: { findFirst: mock.fn(async (args: unknown) => { void args; return trainer }) },
  memberSubscription: { create: mock.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "subscription-1", ...data })) },
  memberTrainerAssignment: { create: mock.fn(async ({ data }: { data: Record<string, unknown> }) => data) },
  payment: { create: mock.fn(async ({ data }: { data: Record<string, unknown> }) => data) },
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
  plan = { name: "Pro", basePriceMinor: 100000, currency: "PKR", features: [], sessionsPerWeek: null, sessionDurationMinutes: null, durations: [{ discountPercent: 10 }] }
  trainer = { id: "trainer-1" }
  createError = null
  transaction.mock.resetCalls()
  tx.member.create.mock.resetCalls()
  tx.memberSubscription.create.mock.resetCalls()
  tx.memberTrainerAssignment.create.mock.resetCalls()
  tx.payment.create.mock.resetCalls()
  tx.trainer.findFirst.mock.resetCalls()
  tx.plan.findFirst.mock.resetCalls()
})

test("guided plans require a trainer and default to the plan's session allowance", async () => {
  plan = { ...plan!, features: [{ label: "Trainer guidance included" }], sessionsPerWeek: 3, sessionDurationMinutes: 60 }
  assert.equal((await post(input)).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
  const response = await post({ ...input, trainerId: "trainer-1" })
  assert.equal(response.status, 201)
  const subscription = tx.memberSubscription.create.mock.calls[0].arguments[0].data
  assert.equal(subscription.sessionsPerWeek, 3)
  assert.equal(subscription.sessionDurationMinutes, 60)
  assert.equal(tx.memberTrainerAssignment.create.mock.calls[0].arguments[0].data.trainerId, "trainer-1")
  const { member } = await response.json()
  assert.equal(member.sessionsPerWeek, 3)
  assert.equal(member.sessionDurationMinutes, 60)
})

test("manual training requires session settings and an explicitly entered charge", async () => {
  for (const missing of [
    { trainerId: "trainer-1" },
    { trainerId: "trainer-1", sessionsPerWeek: 3 },
    { trainerId: "trainer-1", sessionsPerWeek: 3, sessionDurationMinutes: 60 },
  ]) assert.equal((await post({ ...input, ...missing })).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
  const response = await post({ ...input, trainerId: "trainer-1", sessionsPerWeek: 3, sessionDurationMinutes: 60,
    additionalChargeMinor: 100000, specialDiscountMinor: 40000, amountReceivedMinor: 550000, paymentDate: "2000-01-01" })
  assert.equal(response.status, 201)
  const saved = tx.memberSubscription.create.mock.calls[0].arguments[0].data
  assert.equal(saved.sessionsPerWeek, 3)
  assert.equal(saved.sessionDurationMinutes, 60)
  assert.equal(saved.priceMinor, 540000)
  assert.equal(saved.additionalChargeMinor, 100000)
  assert.equal(saved.finalMinor, 600000)
  assert.equal(saved.paymentStatus, "PARTIAL")
  assert.equal(tx.payment.create.mock.calls[0].arguments[0].data.amountMinor, 550000)
  assert.equal((await response.json()).member.additionalChargeMinor, 100000)
})

test("more sessions or longer sessions require explicit charges, including a waived charge of zero", async () => {
  plan = { ...plan!, features: [{ label: "Trainer guidance included" }], sessionsPerWeek: 3, sessionDurationMinutes: 60 }
  for (const upgraded of [
    { sessionsPerWeek: 4, sessionDurationMinutes: 30 },
    { sessionsPerWeek: 2, sessionDurationMinutes: 90 },
  ]) {
    assert.equal((await post({ ...input, trainerId: "trainer-1", ...upgraded })).status, 400)
    assert.equal((await post({ ...input, trainerId: "trainer-1", ...upgraded, additionalChargeMinor: 0 })).status, 201)
  }
  assert.equal(tx.member.create.mock.callCount(), 2)
  assert.equal(tx.memberSubscription.create.mock.calls[0].arguments[0].data.additionalChargeMinor, 0)
})

test("rejects negative, fractional, missing-context, overflowing charges and overpayments before writes", async () => {
  const training = { ...input, trainerId: "trainer-1", sessionsPerWeek: 3, sessionDurationMinutes: 60 }
  for (const additionalChargeMinor of [-1, 0.5, null, "100", 2147483648, 2147483647]) {
    assert.equal((await post({ ...training, additionalChargeMinor })).status, 400)
  }
  assert.equal((await post({ ...input, additionalChargeMinor: 10000 })).status, 400)
  assert.equal((await post({ ...training, additionalChargeMinor: 10000, amountReceivedMinor: 550001, paymentDate: "2000-01-01" })).status, 400)
  plan = { ...plan!, features: [{ label: "Trainer guidance included" }], sessionsPerWeek: 3, sessionDurationMinutes: 60 }
  assert.equal((await post({ ...training, additionalChargeMinor: 10000 })).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
})

test("saves member-specific session overrides without changing plan defaults", async () => {
  plan = { ...plan!, features: [{ label: "Trainer guidance included" }], sessionsPerWeek: 3, sessionDurationMinutes: 60 }
  assert.equal((await post({ ...input, trainerId: "trainer-1", sessionsPerWeek: 5, sessionDurationMinutes: 45, additionalChargeMinor: 10000 })).status, 201)
  const subscription = tx.memberSubscription.create.mock.calls[0].arguments[0].data
  assert.equal(subscription.sessionsPerWeek, 5)
  assert.equal(subscription.sessionDurationMinutes, 45)
  assert.equal(plan.sessionsPerWeek, 3)
  assert.equal(plan.sessionDurationMinutes, 60)
})

test("guided plans reject invalid session overrides and unavailable trainers before creating records", async () => {
  plan = { ...plan!, features: [{ label: "Trainer guidance included" }], sessionsPerWeek: 3, sessionDurationMinutes: 60 }
  for (const invalid of [
    { sessionsPerWeek: 0 }, { sessionsPerWeek: 1.5 }, { sessionsPerWeek: 22 },
    { sessionDurationMinutes: 0 }, { sessionDurationMinutes: 1441 }, { sessionDurationMinutes: null },
  ]) assert.equal((await post({ ...input, trainerId: "trainer-1", ...invalid })).status, 400)
  trainer = null
  assert.equal((await post({ ...input, trainerId: "missing-trainer" })).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
})

test("legacy guidance without defaults requires explicit session settings", async () => {
  plan = { ...plan!, features: [{ label: "Trainer guidance included" }] }
  assert.equal((await post({ ...input, trainerId: "trainer-1" })).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
  assert.equal((await post({ ...input, trainerId: "trainer-1", sessionsPerWeek: 2, sessionDurationMinutes: 30, additionalChargeMinor: 0 })).status, 201)
})

test("training sessions require an assigned trainer even without guidance in the plan", async () => {
  assert.equal((await post({ ...input, sessionsPerWeek: 3, sessionDurationMinutes: 60 })).status, 400)
  assert.equal(tx.member.create.mock.callCount(), 0)
})

test("creates a member with server-owned gym, selected duration, and active status", async () => {
  const response = await post({ ...input, startDate: "2000-01-01", trainerId: "trainer-1", sessionsPerWeek: 3, sessionDurationMinutes: 60, additionalChargeMinor: 0, gymId: "other-gym", status: "INACTIVE" })
  assert.equal(response.status, 201)
  const { member } = await response.json()
  assert.equal(member.gymId, "gym-1")
  assert.equal(member.planId, "plan-1")
  assert.equal(member.durationMonths, 6)
  assert.equal(member.startDate, "2000-01-01T00:00:00.000Z")
  assert.equal(member.trainerId, "trainer-1")
  assert.equal(tx.memberSubscription.create.mock.calls[0].arguments[0].data.durationMonths, 6)
  assert.equal(member.status, "ACTIVE")
  assert.deepEqual(tx.memberSubscription.create.mock.calls[0].arguments[0].data.startDate, new Date("2000-01-01"))
  assert.equal(tx.memberTrainerAssignment.create.mock.calls[0].arguments[0].data.trainerId, "trainer-1")
  assert.deepEqual(tx.plan.findFirst.mock.calls[0].arguments[0], {
    where: { id: "plan-1", gymId: "gym-1", status: "ACTIVE" },
    select: { name: true, basePriceMinor: true, currency: true, features: { select: { label: true } }, sessionsPerWeek: true, sessionDurationMinutes: true, durations: { where: { durationMonths: 6 }, select: { discountPercent: true } } },
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
  assert.equal(tx.memberTrainerAssignment.create.mock.callCount(), 0)
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
  assert.equal((await post({ ...input, trainerId: "other-trainer", sessionsPerWeek: 3, sessionDurationMinutes: 60, additionalChargeMinor: 0 })).status, 400)
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
  const data = tx.memberSubscription.create.mock.calls[0].arguments[0].data
  assert.deepEqual(data, {
    gymId: "gym-1", memberId: "member-1", planId: "plan-1", planNameSnapshot: "Pro",
    durationMonths: 6, sessionsPerWeek: null, sessionDurationMinutes: null, priceMinor: 540000, discountMinor: 40000, additionalChargeMinor: 0, finalMinor: 500000,
    paymentStatus: "PARTIAL", currency: "PKR", startDate: new Date("2026-01-01"), endDate: new Date("2026-06-30"), status: "ACTIVE",
  })
  assert.deepEqual(tx.payment.create.mock.calls[0].arguments[0].data, {
    gymId: "gym-1", memberId: "member-1", memberSubscriptionId: "subscription-1",
    amountMinor: 200000, currency: "PKR", method: "CASH", recordedByUserId: "admin-1", paidAt: new Date("2000-01-01"),
  })
})

test("allows plans without predefined duration options and skips zero payments", async () => {
  plan = { name: "Pro", basePriceMinor: 100000, currency: "USD", features: [], sessionsPerWeek: null, sessionDurationMinutes: null, durations: [] }
  const response = await post({ ...input, durationMonths: 2 })
  assert.equal(response.status, 201)
  const subscription = tx.memberSubscription.create.mock.calls[0].arguments[0].data
  assert.equal(subscription.durationMonths, 2)
  assert.equal(subscription.finalMinor, 200000)
  assert.equal(subscription.currency, "USD")
  assert.equal(tx.payment.create.mock.callCount(), 0)
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
