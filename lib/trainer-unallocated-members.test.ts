import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

type Subscription = {
  status: "ACTIVE" | "INACTIVE"
  planNameSnapshot: string
  sessionsPerWeek: number | null
  sessionDurationMinutes: number | null
}
let records: { id: string; name: string; email: string | null; phone: string; subscriptions: Subscription[] }[]
const findMany = mock.fn(async (args: unknown) => { void args; return records })
mock.module("@/lib/prisma", { namedExports: { prisma: { member: { findMany } } } })

beforeEach(() => {
  records = []
  findMany.mock.resetCalls()
})

test("only reads current assignments in this gym without upcoming bookings for this trainer", async () => {
  const { getUnallocatedTrainerMembers } = await import("./trainer-unallocated-members")
  const now = new Date("2026-10-29T12:00:00Z")
  assert.deepEqual(await getUnallocatedTrainerMembers("gym-1", "trainer-1", now), [])
  const query = findMany.mock.calls[0].arguments[0] as {
    where: Record<string, unknown>
    select: { subscriptions: { where: unknown } }
  }
  assert.deepEqual(query.where, {
    gymId: "gym-1", deletedAt: null,
    assignments: { some: { gymId: "gym-1", trainerId: "trainer-1", endedAt: null } },
    trainingSessions: { none: { gymId: "gym-1", trainerId: "trainer-1", status: "SCHEDULED", endsAt: { gt: now } } },
  })
  assert.deepEqual(query.select.subscriptions.where, { gymId: "gym-1", status: { in: ["ACTIVE", "INACTIVE"] } })
})

test("shows the full purchased allowance from the active subscription, including member overrides", async () => {
  const { getUnallocatedTrainerMembers } = await import("./trainer-unallocated-members")
  records = [{
    id: "member-1", name: "Ali", email: "ali@example.test", phone: "1234567",
    subscriptions: [
      { status: "INACTIVE", planNameSnapshot: "Next plan", sessionsPerWeek: 2, sessionDurationMinutes: 30 },
      { status: "ACTIVE", planNameSnapshot: "Purchased plan", sessionsPerWeek: 5, sessionDurationMinutes: 45 },
    ],
  }]
  assert.deepEqual(await getUnallocatedTrainerMembers("gym-1", "trainer-1"), [{
    id: "member-1", name: "Ali", email: "ali@example.test", phone: "1234567",
    planName: "Purchased plan", sessionsPerWeek: 5, sessionDurationMinutes: 45,
  }])
})

test("supports upcoming memberships and never invents missing historical allowances", async () => {
  const { getUnallocatedTrainerMembers } = await import("./trainer-unallocated-members")
  const member = { id: "upcoming", name: "Member", email: null, phone: "1234567" }
  records = [
    { ...member, subscriptions: [{ status: "INACTIVE", planNameSnapshot: "Upcoming", sessionsPerWeek: 3, sessionDurationMinutes: 60 }] },
    { ...member, id: "legacy", subscriptions: [{ status: "ACTIVE", planNameSnapshot: "Legacy", sessionsPerWeek: null, sessionDurationMinutes: null }] },
    { ...member, id: "no-membership", subscriptions: [] },
  ]
  const results = await getUnallocatedTrainerMembers("gym-1", "trainer-1")
  assert.equal(results[0].sessionsPerWeek, 3)
  assert.equal(results[0].sessionDurationMinutes, 60)
  assert.equal(results[1].sessionsPerWeek, null)
  assert.equal(results[1].sessionDurationMinutes, null)
  assert.equal(results[2].planName, null)
  assert.equal(results[2].sessionsPerWeek, null)
})
