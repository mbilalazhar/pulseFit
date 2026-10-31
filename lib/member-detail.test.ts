import assert from "node:assert/strict"
import { mock, test } from "node:test"

const findMember = mock.fn(async (query: unknown) => { void query; return null })
mock.module("@/lib/prisma", { namedExports: { prisma: { member: { findFirst: findMember } } } })
const { getMemberDetail } = await import("./member-detail")

test("member details are scoped to the requested member and admin gym, excluding deleted members", async () => {
  const now = new Date("2026-10-31T12:00:00Z")
  assert.equal(await getMemberDetail("gym-1", "member-1", now), null)
  const query = findMember.mock.calls[0].arguments[0] as {
    where: unknown
    select: Record<string, { where: Record<string, unknown>; select?: Record<string, unknown> }>
  }
  assert.deepEqual(query.where, { id: "member-1", gymId: "gym-1", deletedAt: null })
  for (const relation of ["assignments", "subscriptions", "attendance", "measurements", "goals", "notes", "trainingSessions"]) {
    assert.equal(query.select[relation].where.gymId, "gym-1")
  }
  assert.equal(query.select.assignments.where.endedAt, null)
  assert.deepEqual(query.select.subscriptions.where.status, { not: "CANCELLED" })
  assert.deepEqual(query.select.trainingSessions.where, { gymId: "gym-1", status: "SCHEDULED", endsAt: { gt: now } })
  assert.equal("user" in query.select, false)
})
