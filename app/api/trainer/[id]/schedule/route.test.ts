import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let session: { gymId: string; role: string } | null
let trainer: Record<string, unknown> | null
let member: Record<string, unknown> | null
let existingAllocation: object | null
let bookings: { memberId: string; startsAt: Date; endsAt: Date; id?: string; member?: { name: string }; status?: string }[]
let transactionError: { code: string } | null
const trainerFind = mock.fn(async (args: unknown) => { void args; return trainer })
const memberFind = mock.fn(async (args: unknown) => { void args; return member })
const findAllocation = mock.fn(async (args: unknown) => { void args; return existingAllocation })
const findBookings = mock.fn(async (args: unknown) => { void args; return bookings })
const createMany = mock.fn(async ({ data }: { data: unknown[] }) => ({ count: data.length }))
const tx = { trainer: { findFirst: trainerFind }, member: { findFirst: memberFind }, trainingSession: { findFirst: findAllocation, findMany: findBookings, createMany } }
const transaction = mock.fn(async (callback: (client: typeof tx) => Promise<unknown>, _options: unknown) => {
  void _options
  if (transactionError) throw transactionError
  return callback(tx)
})
mock.module("@/lib/auth", { namedExports: { getSession: async () => session } })
mock.module("@/lib/prisma", { namedExports: { prisma: { $transaction: transaction, trainer: { findFirst: trainerFind }, trainingSession: { findMany: findBookings } } } })
const unallocated = mock.fn(async (...args: [string, string, Date]) => { void args; return [{ id: "member-1", name: "Ali" }] })
mock.module("@/lib/trainer-unallocated-members", { namedExports: { getUnallocatedTrainerMembers: unallocated } })
const input = { memberId: "member-1", weekStart: "2030-10-21", slots: [{ date: "2030-10-21", startMinute: 720 }, { date: "2030-10-23", startMinute: 600 }] }
const context = { params: Promise.resolve({ id: "trainer-1" }) }
const subscription = { status: "ACTIVE", sessionsPerWeek: 2, sessionDurationMinutes: 45, startDate: new Date("2030-10-01"), endDate: new Date("2030-11-01") }

beforeEach(() => {
  session = { gymId: "gym-1", role: "ADMIN" }
  trainer = { status: "ACTIVE", gym: { timeZone: "Asia/Karachi" }, _count: { assignments: 3 }, availability: [{ dayOfWeek: 1, startMinute: 720, endMinute: 1200 }, { dayOfWeek: 3, startMinute: 600, endMinute: 900 }] }
  member = { id: "member-1", status: "ACTIVE", subscriptions: [subscription] }
  bookings = []
  existingAllocation = null
  transactionError = null
  for (const fn of [trainerFind, memberFind, findAllocation, findBookings, createMany, transaction, unallocated]) fn.mock.resetCalls()
})
async function post(body: unknown = input) {
  const { POST } = await import("./route")
  return POST(new Request("http://localhost/api/trainer/trainer-1/schedule", { method: "POST", body: JSON.stringify(body) }), context)
}

test("requires admin access for reads and writes before querying data", async () => {
  const { GET } = await import("./route")
  for (const role of [null, "TRAINER", "MEMBER"]) {
    session = role ? { gymId: "gym-1", role } : null
    assert.equal((await post()).status, 401)
    assert.equal((await GET(new Request("http://localhost/api/trainer/trainer-1/schedule"), context)).status, 401)
  }
  assert.equal(transaction.mock.callCount(), 0)
  assert.equal(trainerFind.mock.callCount(), 0)
})

test("persists all purchased sessions atomically with server ownership and duration", async () => {
  assert.equal((await post({ ...input, gymId: "other-gym", duration: 120 })).status, 201)
  assert.deepEqual(transaction.mock.calls[0].arguments[1], { isolationLevel: "Serializable" })
  const data = createMany.mock.calls[0].arguments[0].data as { gymId: string; trainerId: string; memberId: string; startsAt: Date; endsAt: Date }[]
  assert.equal(data.length, 2)
  for (const row of data) {
    assert.equal(row.gymId, "gym-1")
    assert.equal(row.trainerId, "trainer-1")
    assert.equal(row.memberId, "member-1")
    assert.equal(row.endsAt.getTime() - row.startsAt.getTime(), 45 * 60_000)
  }
  assert.equal(data[0].startsAt.toISOString(), "2030-10-21T07:00:00.000Z")
  assert.deepEqual((memberFind.mock.calls[0].arguments[0] as { where: unknown }).where, { id: "member-1", gymId: "gym-1", deletedAt: null, assignments: { some: { gymId: "gym-1", trainerId: "trainer-1", endedAt: null } } })
})

test("rejects malformed, partial, and out-of-hours allocations without inserting", async () => {
  for (const body of [null, { ...input, slots: [] }, { ...input, slots: input.slots.slice(0, 1) }, { ...input, slots: [{ date: "2030-10-21", startMinute: 1190 }, input.slots[1]] }]) assert.equal((await post(body)).status, 400)
  assert.equal(createMany.mock.callCount(), 0)
})

test("saves earlier working days in the selected week before today and the membership start", async () => {
  mock.timers.enable({ apis: ["Date"], now: new Date("2030-10-24T12:00:00Z") })
  try {
    member = { id: "member-1", status: "ACTIVE", subscriptions: [{ ...subscription, startDate: new Date("2030-10-24") }] }
    assert.equal((await post()).status, 201)
    const data = createMany.mock.calls[0].arguments[0].data as { startsAt: Date; endsAt: Date }[]
    assert.equal(data[0].startsAt.toISOString(), "2030-10-21T07:00:00.000Z")
    assert.equal(data[1].startsAt.toISOString(), "2030-10-23T05:00:00.000Z")
    for (const row of data) assert.equal(row.endsAt.getTime() - row.startsAt.getTime(), 45 * 60_000)
  } finally {
    mock.timers.reset()
  }
})

test("rejects unavailable trainers, unassigned members, frozen memberships and missing allowances", async () => {
  trainer = null
  assert.equal((await post()).status, 404)
  trainer = { status: "ON_LEAVE", gym: { timeZone: "Asia/Karachi" }, availability: [] }
  assert.equal((await post()).status, 400)
  trainer.status = "ACTIVE"
  member = null
  assert.equal((await post()).status, 404)
  member = { id: "member-1", status: "FROZEN", subscriptions: [subscription] }
  assert.equal((await post()).status, 400)
  member = { id: "member-1", status: "ACTIVE", subscriptions: [] }
  assert.equal((await post()).status, 400)
  assert.equal(createMany.mock.callCount(), 0)
})

test("rejects duplicate allocation, occupied trainer slots and member bookings in the week", async () => {
  existingAllocation = { id: "allocated" }
  assert.equal((await post()).status, 409)
  existingAllocation = null
  bookings = [{ memberId: "other-member", startsAt: new Date("2030-10-21T07:15:00Z"), endsAt: new Date("2030-10-21T08:00:00Z") }]
  assert.equal((await post()).status, 409)
  bookings = [{ memberId: "member-1", startsAt: new Date("2030-10-22T07:00:00Z"), endsAt: new Date("2030-10-22T08:00:00Z") }]
  assert.equal((await post()).status, 409)
  assert.equal(createMany.mock.callCount(), 0)
})

test("returns a retryable conflict when a concurrent allocation wins", async () => {
  transactionError = { code: "P2034" }
  assert.equal((await post()).status, 409)
  assert.equal(createMany.mock.callCount(), 0)
})

test("loads only real bookings for this gym, trainer, and selected local week", async () => {
  const { GET } = await import("./route")
  const response = await GET(new Request("http://localhost/api/trainer/trainer-1/schedule?week=2030-10-23"), context)
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.equal(data.weekStart, "2030-10-21")
  assert.deepEqual(data.sessions, [])
  assert.equal(data.memberCount, 3)
  assert.deepEqual(data.workload, { totalWorkHours: 13, actualWorkHours: 0, workloadPercent: 0 })
  assert.equal(data.members[0].name, "Ali")
  assert.equal(unallocated.mock.calls[0].arguments[0], "gym-1")
  assert.equal(unallocated.mock.calls[0].arguments[1], "trainer-1")
  const where = (findBookings.mock.calls[0].arguments[0] as { where: Record<string, unknown> }).where
  assert.equal(where.gymId, "gym-1")
  assert.equal(where.trainerId, "trainer-1")
  assert.deepEqual(where.startsAt, { lt: new Date("2030-10-27T19:00:00Z") })
  assert.deepEqual(where.endsAt, { gt: new Date("2030-10-20T19:00:00Z") })
  assert.deepEqual(where.status, { not: "CANCELED" })
})


test("returns saved member names and local time ranges for the timetable", async () => {
  const { GET } = await import("./route")
  bookings = [{ id: "session-1", memberId: "member-1", member: { name: "Ali" }, status: "SCHEDULED", startsAt: new Date("2030-10-21T07:00:00Z"), endsAt: new Date("2030-10-21T07:45:00Z") }]
  const response = await GET(new Request("http://localhost/api/trainer/trainer-1/schedule?week=2030-10-21"), context)
  const data = await response.json()
  assert.equal(data.sessions.length, 1)
  assert.equal(data.sessions[0].memberName, "Ali")
  assert.equal(data.sessions[0].date, "2030-10-21")
  assert.equal(data.sessions[0].startMinute, 720)
  assert.equal(data.sessions[0].endMinute, 765)
  assert.deepEqual(data.workload, { totalWorkHours: 13, actualWorkHours: 0.75, workloadPercent: 5.8 })
})
