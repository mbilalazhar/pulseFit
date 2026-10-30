import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let role: string | null = "ADMIN"
const create = mock.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "plan-1", ...data }))
mock.module("@/lib/auth", { namedExports: { getSession: async () => role ? { role, gymId: "gym-1" } : null } })
mock.module("@/lib/prisma", { namedExports: { prisma: { plan: { create } } } })

const input = {
  name: "Pro", shortDesc: "All facilities", basePriceMinor: 100000, maxHoursPerDay: 2.5,
  features: [{ label: "Locker room access" }, { label: "Shower access" }, { label: "Monthly assessment" }],
  durations: [{ durationMonths: 1, discountPercent: 0 }],
}

async function post(body: unknown) {
  const { POST } = await import("./route")
  return POST(new Request("http://localhost/api/plan/create", { method: "POST", body: JSON.stringify(body) }))
}

beforeEach(() => { role = "ADMIN"; create.mock.resetCalls() })

test("persists guidance session defaults and rejects incomplete guidance", async () => {
  const features = [{ label: "Trainer guidance included" }]
  assert.equal((await post({ ...input, features })).status, 400)
  assert.equal(create.mock.callCount(), 0)
  assert.equal((await post({ ...input, features, sessionsPerWeek: 3, sessionDurationMinutes: 60 })).status, 201)
  assert.equal(create.mock.calls[0].arguments[0].data.sessionsPerWeek, 3)
  assert.equal(create.mock.calls[0].arguments[0].data.sessionDurationMinutes, 60)
})

test("saves multiple completely blank drafts with distinct temporary names", async () => {
  assert.equal((await post({ status: "DRAFT" })).status, 201)
  assert.equal((await post({})).status, 201)
  const first = create.mock.calls[0].arguments[0].data
  const second = create.mock.calls[1].arguments[0].data
  assert.match(first.name as string, /^Untitled draft /)
  assert.notEqual(first.name, second.name)
  assert.equal(first.basePriceMinor, 0)
  assert.equal(first.shortDesc, "")
  assert.deepEqual(first.features, { create: [] })
  assert.deepEqual(first.durations, { create: [] })
})

test("requires basic details for activation but does not require features", async () => {
  assert.equal((await post({ status: "ACTIVE" })).status, 400)
  assert.equal(create.mock.callCount(), 0)
  assert.equal((await post({ ...input, status: "ACTIVE", features: [], maxHoursPerDay: null })).status, 201)
})

test("saves facilities, custom benefits and daily hours under the signed-in gym", async () => {
  assert.equal((await post({ ...input, gymId: "other-gym" })).status, 201)
  const data = create.mock.calls[0].arguments[0].data
  assert.equal(data.gymId, "gym-1")
  assert.equal(data.maxHoursPerDay, 2.5)
  assert.deepEqual(data.features, { create: input.features })
})

test("rejects non-admin users and invalid feature limits before writing", async () => {
  role = null
  assert.equal((await post(input)).status, 401)
  role = "MEMBER"
  assert.equal((await post(input)).status, 401)
  role = "ADMIN"
  assert.equal((await post({ ...input, maxHoursPerDay: 25 })).status, 400)
  assert.equal((await post({ ...input, features: [{ label: " " }] })).status, 400)
  assert.equal(create.mock.callCount(), 0)
})
