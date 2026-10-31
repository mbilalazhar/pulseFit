import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let role: string | null = "ADMIN"
let includePriorityTrainer = false
const findGym = mock.fn(async () => ({ timeZone: "Asia/Karachi" }))
const findAssignments = mock.fn(async (args: unknown) => {
  void args
  return [
    { trainerId: "trainer", memberId: "one" },
    { trainerId: "trainer", memberId: "two" },
    { trainerId: "trainer", memberId: "three" },
    ...["one", "two", "three"].map((memberId) => ({ trainerId: "priority", memberId })),
  ]
})
const findUpcomingSessions = mock.fn(async (args: unknown) => {
  void args
  return [{ trainerId: "trainer", memberId: "one" }]
})
const findTrainers = mock.fn(async (args: unknown) => {
  void args
  const trainer = {
    id: "trainer", fullName: "Coach", availability: [{ dayOfWeek: 1, startMinute: 540, endMinute: 1020 }],
    specializations: [], _count: { packages: 2, assignments: 3 },
    sessions: [{ id: "session", startsAt: new Date("2030-10-21T04:00:00Z"), endsAt: new Date("2030-10-21T05:30:00Z"), status: "SCHEDULED" }],
  }
  return includePriorityTrainer ? [trainer, { ...trainer, id: "priority" }] : [trainer]
})
mock.module("@/lib/auth", { namedExports: { getSession: async () => role ? { role, gymId: "gym" } : null } })
mock.module("@/lib/prisma", { namedExports: { prisma: { gym: { findUniqueOrThrow: findGym }, trainer: { findMany: findTrainers }, memberTrainerAssignment: { findMany: findAssignments }, trainingSession: { findMany: findUpcomingSessions } } } })
const { GET } = await import("./route")

beforeEach(() => {
  role = "ADMIN"
  includePriorityTrainer = false
  findGym.mock.resetCalls()
  findTrainers.mock.resetCalls()
  findAssignments.mock.resetCalls()
  findUpcomingSessions.mock.resetCalls()
})

test("trainer directory requires admin access before reading metrics", async () => {
  for (const value of [null, "MEMBER", "TRAINER"]) {
    role = value
    assert.equal((await GET()).status, 401)
  }
  assert.equal(findGym.mock.callCount(), 0)
  assert.equal(findTrainers.mock.callCount(), 0)
  assert.equal(findAssignments.mock.callCount(), 0)
  assert.equal(findUpcomingSessions.mock.callCount(), 0)
})

test("directory returns current-week workload and member counts scoped to the gym", async () => {
  mock.timers.enable({ apis: ["Date"], now: new Date("2030-10-24T12:00:00Z") })
  try {
    const response = await GET()
    assert.equal(response.status, 200)
    const data = await response.json()
    assert.deepEqual(data.trainers[0].workload, { totalWorkHours: 8, actualWorkHours: 1.5, workloadPercent: 18.8 })
    assert.equal(data.trainers[0].memberCount, 3)
    assert.equal(data.trainers[0].unallocatedMemberCount, 2)
    assert.deepEqual((findAssignments.mock.calls[0].arguments[0] as { where: unknown }).where, { gymId: "gym", endedAt: null, member: { deletedAt: null } })
    assert.deepEqual((findUpcomingSessions.mock.calls[0].arguments[0] as { where: unknown }).where, { gymId: "gym", status: "SCHEDULED", endsAt: { gt: new Date("2030-10-24T12:00:00Z") } })
    const query = findTrainers.mock.calls[0].arguments[0] as { where: unknown; include: { sessions: { where: unknown }; _count: { select: { assignments: { where: unknown } } } } }
    assert.deepEqual(query.where, { gymId: "gym" })
    assert.deepEqual(query.include.sessions.where, {
      gymId: "gym", status: { not: "CANCELED" },
      startsAt: { lt: new Date("2030-10-27T19:00:00Z") }, endsAt: { gt: new Date("2030-10-20T19:00:00Z") },
    })
    assert.deepEqual(query.include._count.select.assignments.where, { gymId: "gym", endedAt: null, member: { deletedAt: null } })
  } finally {
    mock.timers.reset()
  }
})

test("directory puts trainers with the most unallocated members first", async () => {
  includePriorityTrainer = true
  const data = await (await GET()).json()
  assert.deepEqual(data.trainers.map((trainer: { id: string }) => trainer.id), ["priority", "trainer"])
  assert.deepEqual(data.trainers.map((trainer: { unallocatedMemberCount: number }) => trainer.unallocatedMemberCount), [3, 2])
})
