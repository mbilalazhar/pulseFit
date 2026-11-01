import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"
import type { MemberEditInput } from "@/lib/member-edit"
import { memberEditData, type EditableMember } from "@/lib/member-edit-server"

const original = () => ({
  id: "member-1", gymId: "gym-1", name: "Ali", phone: "03001234567", email: "ali@example.com", status: "ACTIVE", deletedAt: null,
  gym: { timeZone: "Asia/Karachi" }, assignments: [{ id: "assignment-1", trainerId: "trainer-1", trainer: { fullName: "Coach A" } }],
  subscriptions: [{ id: "sub-1", planId: "plan-1", planNameSnapshot: "Saved Pro", durationMonths: 12,
    priceMinor: 100000, discountMinor: 10000, additionalChargeMinor: 0, finalMinor: 90000, currency: "PKR", paymentStatus: "PARTIAL",
    startDate: new Date("2035-01-01"), endDate: new Date("2035-12-31"), paymentDueDate: null, status: "ACTIVE",
    sessionsPerWeek: 3, sessionDurationMinutes: 60,
    payments: [{ id: "payment-1", amountMinor: 40000, currency: "PKR", kind: "PAYMENT", method: "CASH", paidAt: new Date("2000-01-01") }],
  }], trainingSessions: [] as { id: string; trainerId: string; memberId: string; startsAt: Date; endsAt: Date }[],
})
let member: ReturnType<typeof original> | null
let role: string | null
let plan: { id: string; name: string; status: string; basePriceMinor: number; currency: string; features: { label: string }[]; durations: { durationMonths: number; discountPercent: number }[]; sessionsPerWeek: number; sessionDurationMinutes: number } | null
let target: { id: string; fullName: string; availability: { dayOfWeek: number; startMinute: number; endMinute: number }[] } | null
let conflicts: { startsAt: Date; endsAt: Date }[]
let failWrite: boolean
const findMember = mock.fn(async (args: unknown) => { void args; return member })
const findPlan = mock.fn(async (args: unknown) => { void args; return plan })
const findTrainer = mock.fn(async (args: unknown) => { void args; return target })
const findSessions = mock.fn(async (args: unknown) => { void args; return conflicts })
const saveMember = mock.fn(async ({ data }: { where: unknown; data: Record<string, unknown> }) => { Object.assign(member!, data); return member })
const saveSubscription = mock.fn(async ({ data }: { where: unknown; data: Record<string, unknown> }) => { if (failWrite) throw { code: "P2034" }; Object.assign(member!.subscriptions[0], data); return data })
const savePayment = mock.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => { Object.assign(member!.subscriptions[0].payments.find((item) => item.id === where.id)!, data); return data })
const closeAssignments = mock.fn(async (args: unknown) => { void args; return { count: 1 } })
const createAssignment = mock.fn(async (args: unknown) => args)
const moveSessions = mock.fn(async (args: unknown) => { void args; return { count: 1 } })
const tx = { member: { findFirst: findMember, update: saveMember }, plan: { findFirst: findPlan }, trainer: { findFirst: findTrainer },
  memberSubscription: { update: saveSubscription }, payment: { update: savePayment }, memberTrainerAssignment: { updateMany: closeAssignments, create: createAssignment }, trainingSession: { findMany: findSessions, updateMany: moveSessions } }
const transaction = mock.fn(async (callback: (client: typeof tx) => Promise<unknown>, options: unknown) => {
  void options
  const snapshot = structuredClone(member)
  try { return await callback(tx) } catch (error) { member = snapshot; throw error }
})
mock.module("@/lib/auth", { namedExports: { getSession: async () => role ? { role, gymId: "gym-1", userId: "admin-1" } : null } })
mock.module("@/lib/prisma", { namedExports: { prisma: { $transaction: transaction } } })

beforeEach(() => {
  member = original(); role = "ADMIN"; conflicts = []; failWrite = false
  plan = { id: "plan-1", name: "Current Pro", status: "ACTIVE", basePriceMinor: 50000, currency: "PKR", features: [{ label: "Trainer guidance included" }], durations: [], sessionsPerWeek: 3, sessionDurationMinutes: 60 }
  target = { id: "trainer-2", fullName: "Coach B", availability: [{ dayOfWeek: 1, startMinute: 720, endMinute: 1200 }] }
  for (const fn of [transaction, findMember, findPlan, findTrainer, findSessions, saveMember, saveSubscription, savePayment, closeAssignments, createAssignment, moveSessions]) fn.mock.resetCalls()
})
function input(): MemberEditInput {
  const saved = memberEditData(member as unknown as EditableMember)
  return { revision: saved.revision, name: saved.name, email: saved.email, phone: saved.phone, trainerId: saved.trainerId,
    membership: saved.membership, payments: saved.payments }
}
async function put(body: unknown) {
  const { PUT } = await import("./route")
  return PUT(new Request("http://localhost/api/member/member-1", { method: "PUT", body: JSON.stringify(body) }), { params: Promise.resolve({ id: "member-1" }) })
}
async function review(values: MemberEditInput) {
  const response = await put(values)
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()))
  const body = await response.json()
  assert.equal(body.requiresConfirmation, true)
  return body as { reviewToken: string; changes: { field: string; before: string; after: string }[] }
}
const booking = { id: "session-1", trainerId: "trainer-1", memberId: "member-1", startsAt: new Date("2035-11-05T07:00:00Z"), endsAt: new Date("2035-11-05T08:00:00Z") }

test("prefills saved purchase prices and payments, including a nullable email", () => {
  member!.email = ""
  const saved = memberEditData(member as unknown as EditableMember)
  assert.equal(saved.membership!.priceMinor, 100000)
  assert.equal(saved.membership!.planName, "Saved Pro")
  assert.equal(saved.membership!.startDate, "2035-01-01")
  assert.equal(saved.payments[0].amountMinor, 40000)
  assert.equal(saved.trainerId, "trainer-1")
})

test("only admins may edit and invalid data never reaches the database", async () => {
  const values = input()
  for (const value of [null, "MEMBER", "TRAINER"]) { role = value; assert.equal((await put(values)).status, 401) }
  role = "ADMIN"
  for (const body of [null, { ...values, name: "" }, { ...values, phone: "bad" }, { ...values, email: "bad" }]) assert.equal((await put(body)).status, 400)
  assert.equal(transaction.mock.callCount(), 0)
})

test("review shows exact before/after values and makes no writes", async () => {
  const values = { ...input(), name: "Ali Raza", phone: "03007654321" }
  const result = await review(values)
  assert.deepEqual(result.changes, [
    { field: "Full name", before: "Ali", after: "Ali Raza" }, { field: "Phone", before: "03001234567", after: "03007654321" },
  ])
  assert.equal(saveMember.mock.callCount(), 0)
  assert.equal(saveSubscription.mock.callCount(), 0)
  assert.equal(savePayment.mock.callCount(), 0)
  assert.deepEqual((findMember.mock.calls[0].arguments[0] as { where: unknown }).where, { id: "member-1", gymId: "gym-1", deletedAt: null })
})

test("confirmed edits preserve bought prices and update the existing member atomically", async () => {
  const values = { ...input(), name: "Ali Raza" }
  const result = await review(values)
  const response = await put({ ...values, confirmed: true, reviewToken: result.reviewToken })
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { saved: true })
  assert.equal(member!.name, "Ali Raza")
  assert.equal(member!.subscriptions[0].priceMinor, 100000)
  assert.equal(savePayment.mock.callCount(), 0)
  assert.deepEqual(transaction.mock.calls.at(-1)!.arguments[1], { isolationLevel: "Serializable" })
})

test("cannot save without a valid confirmation or change values after reviewing", async () => {
  const values = { ...input(), name: "Ali Raza" }
  const result = await review(values)
  for (const attempt of [{ ...values, confirmed: true }, { ...values, confirmed: true, reviewToken: "forged" }, { ...values, name: "Changed again", confirmed: true, reviewToken: result.reviewToken }]) assert.equal((await put(attempt)).status, 409)
  assert.equal(saveMember.mock.callCount(), 0)
})

test("stale member and payment records cannot overwrite someone else's edits", async () => {
  const values = { ...input(), name: "Ali Raza" }
  const result = await review(values)
  member!.subscriptions[0].payments[0].amountMinor = 41000
  assert.equal((await put({ ...values, confirmed: true, reviewToken: result.reviewToken })).status, 409)
  assert.equal(saveMember.mock.callCount(), 0)
})

test("payment corrections update a receipt without adding or duplicating revenue", async () => {
  const values = input()
  values.payments[0] = { ...values.payments[0], amountMinor: 50000, method: "CARD" }
  const result = await review(values)
  assert.ok(result.changes.some((change) => change.field === "Outstanding balance" && change.before === "PKR 500.00" && change.after === "PKR 400.00"))
  assert.equal((await put({ ...values, confirmed: true, reviewToken: result.reviewToken })).status, 200)
  assert.equal(savePayment.mock.callCount(), 1)
  assert.equal(member!.subscriptions[0].payments.length, 1)
  assert.equal(member!.subscriptions[0].payments[0].amountMinor, 50000)
})

test("rejects overpayments, removed payments, foreign receipts and future payment dates", async () => {
  const values = input()
  for (const payments of [[], [{ ...values.payments[0], id: "foreign" }], [values.payments[0], values.payments[0]], [{ ...values.payments[0], amountMinor: 90001 }], [{ ...values.payments[0], date: "2099-01-01" }]]) assert.equal((await put({ ...values, payments })).status, 400)
  assert.equal(savePayment.mock.callCount(), 0)
})

test("a changed plan is repriced, reviewed, and cannot change the currency of existing receipts", async () => {
  const values = input()
  values.membership = { ...values.membership!, planId: "plan-2" }
  plan = { ...plan!, id: "plan-2", name: "Premium", basePriceMinor: 20000 }
  const result = await review(values)
  assert.ok(result.changes.some((change) => change.field === "Membership price" && change.after === "PKR 2400.00"))
  plan.currency = "USD"
  assert.equal((await put(values)).status, 400)
})

test("trainer changes move existing sessions and preserve assignment history only after confirmation", async () => {
  member!.trainingSessions.push(booking)
  const values = { ...input(), trainerId: "trainer-2" }
  const result = await review(values)
  assert.equal(closeAssignments.mock.callCount(), 0)
  assert.equal(moveSessions.mock.callCount(), 0)
  assert.ok(result.changes.some((change) => change.field === "1 upcoming sessions"))
  assert.equal((await put({ ...values, confirmed: true, reviewToken: result.reviewToken })).status, 200)
  assert.equal(closeAssignments.mock.callCount(), 1)
  assert.equal(createAssignment.mock.callCount(), 1)
  assert.equal(moveSessions.mock.callCount(), 1)
  assert.deepEqual((findTrainer.mock.calls[0].arguments[0] as { where: unknown }).where, { id: "trainer-2", gymId: "gym-1", status: "ACTIVE" })
})

test("rejects trainer conflicts and membership edits that would invalidate future sessions", async () => {
  member!.trainingSessions.push(booking)
  const values = input()
  conflicts = [{ startsAt: booking.startsAt, endsAt: booking.endsAt }]
  assert.equal((await put({ ...values, trainerId: "trainer-2" })).status, 409)
  conflicts = []
  target!.availability = []
  assert.equal((await put({ ...values, trainerId: "trainer-2" })).status, 409)
  assert.equal((await put({ ...values, membership: { ...values.membership, startDate: "2036-01-01" } })).status, 409)
  assert.equal((await put({ ...values, membership: { ...values.membership, sessionsPerWeek: 4 } })).status, 409)
  assert.equal(saveMember.mock.callCount(), 0)
})

test("failed confirmed updates roll back member changes and keep payments untouched", async () => {
  const values = { ...input(), name: "New Name" }
  const result = await review(values)
  failWrite = true
  assert.equal((await put({ ...values, confirmed: true, reviewToken: result.reviewToken })).status, 409)
  assert.equal(member!.name, "Ali")
  assert.equal(savePayment.mock.callCount(), 0)
})

test("unchanged edits make no writes and unavailable members return not found", async () => {
  const values = input()
  assert.deepEqual(await (await put(values)).json(), { unchanged: true })
  assert.equal(saveMember.mock.callCount(), 0)
  member = null
  assert.equal((await put(values)).status, 404)
})
