import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let role: string | null
let member: { status: string; subscriptions: { status: string; startDate: Date }[] } | null
let count: number
let duplicate: boolean
const create = mock.fn(async (args: unknown) => { void args; if (duplicate) throw { code: "P2002" }; return { id: "visit-1" } })
const update = mock.fn(async (args: unknown) => { void args; return { count } })
const findMember = mock.fn(async (args: unknown) => { void args; return member })
mock.module("@/lib/auth", { namedExports: { getSession: async () => role ? { role, gymId: "gym-1" } : null } })
mock.module("@/lib/prisma", { namedExports: { prisma: {
  gym: { findUnique: async () => ({ timeZone: "Asia/Karachi" }) },
  member: { findFirst: findMember },
  attendance: { create, updateMany: update },
} } })
async function post(body: unknown) {
  const { POST } = await import("./route")
  return POST(new Request("http://localhost/api/attendance", { method: "POST", body: JSON.stringify(body) }))
}
beforeEach(() => {
  role = "ADMIN"; member = { status: "ACTIVE", subscriptions: [{ status: "ACTIVE", startDate: new Date("2000-01-01") }] }; count = 1; duplicate = false
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
  count = 0
  assert.equal((await post({ action: "left", attendanceId: "visit-1" })).status, 409)
})
