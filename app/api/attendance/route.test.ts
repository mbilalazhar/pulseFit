import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let role: string | null
let member: { status: string; subscriptions: { status: string; startDate: Date }[] } | null
let count: number
let duplicate: boolean
let visit: { checkInAt: Date } | null
const closeOverdue = mock.fn(async (...args: unknown[]) => { void args; return 0 })
mock.module("@/lib/attendance-server", { namedExports: { closeOverdueAttendance: closeOverdue } })
const create = mock.fn(async (args: unknown) => { void args; if (duplicate) throw { code: "P2002" }; return { id: "visit-1" } })
const update = mock.fn(async (args: unknown) => { void args; return { count } })
const findMember = mock.fn(async (args: unknown) => { void args; return member })
mock.module("@/lib/auth", { namedExports: { getSession: async () => role ? { role, gymId: "gym-1" } : null } })
mock.module("@/lib/prisma", { namedExports: { prisma: {
  gym: { findUnique: async () => ({ timeZone: "Asia/Karachi" }) },
  member: { findFirst: findMember, findMany: async () => [] },
  attendance: { create, updateMany: update, findFirst: async () => visit, findMany: async () => [] },
} } })
async function post(body: unknown) {
  const { POST } = await import("./route")
  return POST(new Request("http://localhost/api/attendance", { method: "POST", body: JSON.stringify(body) }))
}
beforeEach(() => {
  role = "ADMIN"; member = { status: "ACTIVE", subscriptions: [{ status: "ACTIVE", startDate: new Date("2000-01-01") }] }; count = 1; duplicate = false
  visit = { checkInAt: new Date(Date.now() - 4 * 60 * 60 * 1000) }
  closeOverdue.mock.resetCalls()
  create.mock.resetCalls(); update.mock.resetCalls(); findMember.mock.resetCalls()
})
test("requires an admin and valid action", async () => {
  role = null
  assert.equal((await post({ action: "present", memberId: "member-1" })).status, 401)
  role = "MEMBER"
  assert.equal((await post({ action: "left", attendanceId: "visit-1" })).status, 401)
  role = "ADMIN"
  assert.equal((await post({ action: "present" })).status, 400)
  assert.equal(create.mock.callCount(), 0)
  assert.equal(closeOverdue.mock.callCount(), 0)
})
test("check-in uses the signed-in gym and server time", async () => {
  assert.equal((await post({ action: "present", memberId: "member-1", gymId: "other", checkInAt: "2000-01-01" })).status, 201)
  assert.deepEqual((findMember.mock.calls[0].arguments[0] as { where: unknown }).where, { id: "member-1", gymId: "gym-1", deletedAt: null })
  const data = (create.mock.calls[0].arguments[0] as { data: { gymId: string; checkInAt: Date } }).data
  assert.equal(data.gymId, "gym-1")
  assert.ok(Math.abs(Date.now() - data.checkInAt.getTime()) < 5000)
})
test("rejects other-gym, frozen and duplicate check-ins", async () => {
  member = null
  assert.equal((await post({ action: "present", memberId: "other-member" })).status, 404)
  member = { status: "FROZEN", subscriptions: [{ status: "ACTIVE", startDate: new Date("2000-01-01") }] }
  assert.equal((await post({ action: "present", memberId: "member-1" })).status, 400)
  member.status = "ACTIVE"; duplicate = true
  assert.equal((await post({ action: "present", memberId: "member-1" })).status, 409)
})
test("mark left only updates an open visit within the current gym", async () => {
  assert.equal((await post({ action: "left", attendanceId: "visit-1" })).status, 200)
  assert.deepEqual((update.mock.calls[0].arguments[0] as { where: unknown }).where, { id: "visit-1", gymId: "gym-1", checkOutAt: null })
  const data = (update.mock.calls[0].arguments[0] as { data: { checkOutAt: Date; durationMinutes: number } }).data
  assert.equal(data.durationMinutes, 240)
  assert.ok(Math.abs(Date.now() - data.checkOutAt.getTime()) < 5000)
  count = 0
  assert.equal((await post({ action: "left", attendanceId: "visit-1" })).status, 409)
})

test("leave as they are persists acknowledgement only for open overdue visits in the admin gym", async () => {
  assert.equal((await post({ action: "leave", attendanceId: "visit-1", gymId: "other" })).status, 200)
  const args = update.mock.calls[0].arguments[0] as { where: { id: string; gymId: string; checkOutAt: null; checkInAt: { lt: Date; gt: Date } }; data: { overdueAcknowledgedAt: Date } }
  assert.equal(args.where.gymId, "gym-1")
  assert.equal(args.where.id, "visit-1")
  assert.equal(args.where.checkOutAt, null)
  assert.equal(args.data.overdueAcknowledgedAt.getTime() - args.where.checkInAt.lt.getTime(), 3 * 60 * 60 * 1000)
  assert.equal(args.data.overdueAcknowledgedAt.getTime() - args.where.checkInAt.gt.getTime(), 6 * 60 * 60 * 1000)
  assert.deepEqual(Object.keys(args.data), ["overdueAcknowledgedAt"])
  count = 0
  assert.equal((await post({ action: "leave", attendanceId: "visit-1" })).status, 409)
})

test("checkout cannot extend a visit beyond six hours or update an unavailable visit", async () => {
  visit = { checkInAt: new Date(Date.now() - 7 * 60 * 60 * 1000) }
  assert.equal((await post({ action: "left", attendanceId: "visit-1" })).status, 200)
  const data = (update.mock.calls[0].arguments[0] as { data: { checkOutAt: Date; durationMinutes: number } }).data
  assert.equal(data.durationMinutes, 360)
  assert.equal(data.checkOutAt.getTime(), visit.checkInAt.getTime() + 6 * 60 * 60 * 1000)
  visit = null
  assert.equal((await post({ action: "left", attendanceId: "visit-1" })).status, 409)
  assert.equal(update.mock.callCount(), 1)
})

test("attendance reads reconcile overdue visits even when viewing history", async () => {
  const { GET } = await import("./route")
  const response = await GET(new Request("http://localhost/api/attendance?date=2020-01-01"))
  assert.equal(response.status, 200)
  assert.equal(closeOverdue.mock.calls[0].arguments[0], "gym-1")
  const data = await response.json()
  assert.deepEqual(data.overdue, [])
  assert.ok(data.serverNow)
})
