import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let session: { gymId: string; role: string } | null
const findMembers = mock.fn(async (args: unknown) => { void args; return [] })
const findPlans = mock.fn(async (args: unknown) => { void args; return [{ id: "plan-1", name: "Gym plan" }] })
mock.module("@/lib/auth", { namedExports: { getSession: async () => session } })
mock.module("@/lib/prisma", { namedExports: { prisma: {
  gym: { findUnique: async () => ({ timeZone: "Asia/Karachi" }) },
  member: { findMany: findMembers }, plan: { findMany: findPlans },
} } })

beforeEach(() => {
  session = { gymId: "gym-1", role: "ADMIN" }
  findMembers.mock.resetCalls()
  findPlans.mock.resetCalls()
})

test("member directory requires an authenticated gym admin", async () => {
  const { GET } = await import("./route")
  for (const value of [null, { gymId: "gym-1", role: "MEMBER" }]) {
    session = value
    assert.equal((await GET()).status, 401)
  }
  assert.equal(findMembers.mock.callCount(), 0)
})

test("scopes members, related billing and filter plans to the signed-in gym", async () => {
  const { GET } = await import("./route")
  const response = await GET()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("Cache-Control"), "private, no-store")
  const body = await response.json()
  assert.deepEqual(body.members, [])
  assert.equal(body.stats.total, 0)
  assert.deepEqual(body.plans, [{ id: "plan-1", name: "Gym plan" }])
  const query = findMembers.mock.calls[0].arguments[0] as {
    where: unknown; select: { subscriptions: { where: unknown }; payments: { where: unknown } }
  }
  assert.deepEqual(query.where, { gymId: "gym-1", deletedAt: null })
  assert.deepEqual(query.select.subscriptions.where, { gymId: "gym-1" })
  assert.deepEqual(query.select.payments.where, { gymId: "gym-1" })
  assert.deepEqual((findPlans.mock.calls[0].arguments[0] as { where: unknown }).where, { gymId: "gym-1" })
})
