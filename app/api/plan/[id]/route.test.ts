import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let role: string | null
let existing: ({ status: string } & Record<string, unknown>) | null
let updateError: { code: string } | null
let affectedCount = 1
let subscribers = 0
const findFirst = mock.fn(async (args: unknown) => { void args; return existing })
const update = mock.fn(async ({ data }: { where: unknown; data: Record<string, unknown> }) => {
  if (updateError) throw updateError
  return { id: "plan-1", ...data }
})
const updateMany = mock.fn(async (args: unknown) => { void args; return { count: affectedCount } })
const deleteMany = mock.fn(async (args: unknown) => { void args; return { count: 1 } })
mock.module("@/lib/auth", { namedExports: {
  getSession: async () => role ? { role, gymId: "gym-1" } : null,
} })
mock.module("@/lib/prisma", { namedExports: { prisma: {
  plan: { findFirst, update, updateMany, deleteMany },
  memberSubscription: { count: async () => subscribers },
} } })

const input = {
  name: "Updated Pro", shortDesc: "Updated description", longDesc: "Full details",
  sessionsPerWeek: null, sessionDurationMinutes: null,
  basePriceMinor: 123456, currency: "USD", maxHoursPerDay: 2.5, status: "INACTIVE",
  features: [{ label: "Locker room access" }, { label: "Monthly assessment" }],
  durations: [{ label: "Quarterly", durationMonths: 3, discountPercent: 10 }],
}
async function put(body: unknown = input) {
  const { PUT } = await import("./route")
  return PUT(new Request("http://localhost/api/plan/plan-1", { method: "PUT", body: JSON.stringify(body) }), {
    params: Promise.resolve({ id: "plan-1" }),
  })
}

beforeEach(() => {
  role = "ADMIN"
  existing = { status: "INACTIVE" }
  updateError = null
  affectedCount = 1
  subscribers = 0
  findFirst.mock.resetCalls()
  update.mock.resetCalls()
  updateMany.mock.resetCalls()
  deleteMany.mock.resetCalls()
})

async function patch(body: unknown) {
  const { PATCH } = await import("./route")
  return PATCH(new Request("http://localhost/api/plan/plan-1", { method: "PATCH", body: JSON.stringify(body) }), {
    params: Promise.resolve({ id: "plan-1" }),
  })
}

test("guidance settings can be updated or cleared and incomplete guidance cannot be activated", async () => {
  const features = [{ label: "Trainer guidance included" }]
  assert.equal((await put({ ...input, features, sessionsPerWeek: 4, sessionDurationMinutes: 45 })).status, 200)
  assert.equal(update.mock.calls[0].arguments[0].data.sessionsPerWeek, 4)
  assert.equal(update.mock.calls[0].arguments[0].data.sessionDurationMinutes, 45)
  assert.equal((await put({ ...input, features: [], sessionsPerWeek: 4, sessionDurationMinutes: 45 })).status, 200)
  assert.equal(update.mock.calls[1].arguments[0].data.sessionsPerWeek, null)
  assert.equal(update.mock.calls[1].arguments[0].data.sessionDurationMinutes, null)
  existing = { ...input, features, status: "DRAFT" }
  assert.equal((await patch({ status: "ACTIVE" })).status, 400)
  assert.equal(updateMany.mock.callCount(), 0)
})

test("saving a draft allows clearing its details and all features", async () => {
  existing = { status: "DRAFT" }
  assert.equal((await put({ status: "DRAFT" })).status, 200)
  const saved = update.mock.calls[0].arguments[0].data
  assert.equal(saved.basePriceMinor, 0)
  assert.equal(saved.shortDesc, "")
  assert.deepEqual(saved.features, { deleteMany: {}, create: [] })
  assert.deepEqual(saved.durations, { deleteMany: {}, create: [] })
})

test("activation rejects incomplete drafts and accepts complete plans without features", async () => {
  existing = { status: "DRAFT" }
  assert.equal((await patch({ status: "ACTIVE" })).status, 400)
  assert.equal(updateMany.mock.callCount(), 0)
  const updatedAt = new Date("2026-10-29T00:00:00Z")
  existing = { ...input, features: [], maxHoursPerDay: null, longDesc: null, status: "DRAFT", updatedAt }
  assert.equal((await patch({ status: "ACTIVE" })).status, 200)
  assert.deepEqual(updateMany.mock.calls[0].arguments[0], {
    where: { id: "plan-1", gymId: "gym-1", status: "DRAFT", updatedAt }, data: { status: "ACTIVE" },
  })
  affectedCount = 0
  assert.equal((await patch({ status: "ACTIVE" })).status, 409)
})

test("active plans allow only deactivation and reject deletion or edits through PATCH", async () => {
  existing = { ...input, status: "ACTIVE" }
  assert.equal((await patch({ status: "DRAFT" })).status, 409)
  assert.equal((await patch({ status: "ACTIVE", name: "Changed" })).status, 400)
  assert.equal(updateMany.mock.callCount(), 0)
  const { DELETE } = await import("./route")
  assert.equal((await DELETE(new Request("http://localhost/api/plan/plan-1"), {
    params: Promise.resolve({ id: "plan-1" }),
  })).status, 409)
  assert.equal(deleteMany.mock.callCount(), 0)
  assert.equal((await patch({ status: "INACTIVE" })).status, 200)
})

test("inactive plans can add and remove all features", async () => {
  assert.equal((await put({ ...input, features: [], maxHoursPerDay: null })).status, 200)
  assert.deepEqual(update.mock.calls[0].arguments[0].data.features, { deleteMany: {}, create: [] })
})

test("updates the selected plan and replaces features and durations in one nested write", async () => {
  const response = await put({ ...input, id: "other-plan", gymId: "other-gym" })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).plan.id, "plan-1")
  assert.deepEqual(findFirst.mock.calls[0].arguments[0], {
    where: { id: "plan-1", gymId: "gym-1" }, select: { status: true },
  })
  const saved = update.mock.calls[0].arguments[0]
  assert.deepEqual(saved.where, { id: "plan-1", gymId: "gym-1", status: { in: ["DRAFT", "INACTIVE"] } })
  assert.deepEqual(saved.data, {
    ...input,
    features: { deleteMany: {}, create: input.features },
    durations: { deleteMany: {}, create: input.durations },
  })
})

test("allows a draft to be edited and activated", async () => {
  existing = { status: "DRAFT" }
  assert.equal((await put({ ...input, status: "ACTIVE" })).status, 200)
  assert.equal(update.mock.calls[0].arguments[0].data.status, "ACTIVE")
})

test("clears removed optional details instead of keeping their old values", async () => {
  assert.equal((await put({ ...input, longDesc: "", maxHoursPerDay: null, durations: [] })).status, 200)
  const data = update.mock.calls[0].arguments[0].data
  assert.equal(data.longDesc, null)
  assert.equal(data.maxHoursPerDay, null)
  assert.deepEqual(data.durations, { deleteMany: {}, create: [] })
})

test("rejects unauthenticated and non-admin edits without querying plans", async () => {
  for (const value of [null, "MEMBER", "TRAINER"]) {
    role = value
    assert.equal((await put()).status, 401)
  }
  assert.equal(findFirst.mock.callCount(), 0)
  assert.equal(update.mock.callCount(), 0)
})

test("does not write missing, other-gym, or active plans", async () => {
  existing = null
  assert.equal((await put()).status, 404)
  existing = { status: "ACTIVE" }
  assert.equal((await put()).status, 409)
  assert.equal(update.mock.callCount(), 0)
})

test("rejects malformed JSON, invalid prices, and duplicate durations before database access", async () => {
  const { PUT } = await import("./route")
  assert.equal((await PUT(new Request("http://localhost/api/plan/plan-1", { method: "PUT", body: "{" }), {
    params: Promise.resolve({ id: "plan-1" }),
  })).status, 400)
  for (const invalid of [
    { basePriceMinor: 0 }, { basePriceMinor: 2147483648 },
    { durations: [...input.durations, ...input.durations] },
    { features: [{ label: " " }] },
  ]) assert.equal((await put({ ...input, ...invalid })).status, 400)
  assert.equal(findFirst.mock.callCount(), 0)
  assert.equal(update.mock.callCount(), 0)
})

test("reports a conflict for duplicate names or plans activated/deleted during editing", async () => {
  for (const code of ["P2002", "P2025"]) {
    updateError = { code }
    assert.equal((await put()).status, 409)
  }
})
