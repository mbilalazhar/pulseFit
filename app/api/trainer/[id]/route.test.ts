import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"
import type { ScheduleChangeReview, ScheduleConfirmation } from "@/lib/trainer-schedule-change"

let session: { gymId: string; role: string } | null
let exists: boolean
const booking = (id = "session-1", memberId = "member-1", hour = 7) => ({
  id, memberId, trainerId: "trainer-1", status: "SCHEDULED", gymId: "gym-1",
  startsAt: new Date(`2030-10-21T${String(hour).padStart(2, "0")}:00:00Z`),
  endsAt: new Date(`2030-10-21T${String(hour + 1).padStart(2, "0")}:00:00Z`),
  member: { name: "Sara", status: "ACTIVE", deletedAt: null,
    assignments: [{ id: `assignment-${memberId}`, trainerId: "trainer-1" }],
    subscriptions: [{ status: "ACTIVE", startDate: new Date("2030-10-01"), endDate: new Date("2030-11-01") }],
  },
})
let bookings: ReturnType<typeof booking>[]
let otherBookings: ReturnType<typeof booking>[]
let trainerUpdatedAt: Date
let failure: { code: string } | null
const oldHours = [{ dayOfWeek: 1, startMinute: 720, endMinute: 1200 }]
const findFirst = mock.fn(async (args: unknown) => { void args; return exists ? { id: "trainer-1", fullName: "Ali", status: "ACTIVE", updatedAt: trainerUpdatedAt, availability: oldHours, gym: { timeZone: "Asia/Karachi" } } : null })
const findMany = mock.fn(async (args: { where: { id?: unknown } }) => args.where.id ? otherBookings : bookings)
const findTrainers = mock.fn(async (args: unknown) => { void args; return [{ id: "trainer-2", fullName: "Hassan", availability: oldHours }] })
const updateSessions = mock.fn(async (args: unknown) => { void args; return { count: bookings.length } })
const updateSession = mock.fn(async (args: { where: unknown; data: Record<string, unknown> }) => args.data)
const endAssignment = mock.fn(async (args: unknown) => { void args; return { count: 1 } })
const createAssignment = mock.fn(async (args: unknown) => args)
const update = mock.fn(async (args: { where: unknown; data: Record<string, unknown> }) => { if (failure) throw failure; return { id: "trainer-1", ...args.data } })
const transaction = mock.fn(async (callback: (client: unknown) => Promise<unknown>, options: unknown) => { void options; return callback({
  trainer: { findFirst, update, findMany: findTrainers }, trainingSession: { findMany, updateMany: updateSessions, update: updateSession },
  memberTrainerAssignment: { updateMany: endAssignment, create: createAssignment },
}) })
mock.module("@/lib/auth", { namedExports: { getSession: async () => session } })
mock.module("@/lib/prisma", { namedExports: { prisma: { $transaction: transaction } } })
const staff = { trainerType: "STAFF", fullName: " Coach Ali ", email: "ali@example.com", contactNumber: "03001234567", joiningDate: "2026-10-01", monthlySalary: 50000.25, shift: "FLEXIBLE", availability: oldHours, specializations: ["Yoga"], certifications: ["Certified Coach"] }
const contractor = { trainerType: "CONTRACTOR", fullName: "Coach Ali", email: "ali@example.com", contactNumber: "03001234567", joiningDate: "2026-10-01", paymentType: "FIXED_FEE", amount: 1000.25, sessions: [{ dayOfWeek: 1, startMinute: 720, endMinute: 780 }, { dayOfWeek: 1, startMinute: 960, endMinute: 1020 }] }
async function put(body: unknown = staff) {
  const { PUT } = await import("./route")
  return PUT(new Request("http://localhost/api/trainer/trainer-1", { method: "PUT", body: JSON.stringify(body) }), { params: Promise.resolve({ id: "trainer-1" }) })
}
beforeEach(() => {
  session = { gymId: "gym-1", role: "ADMIN" }; exists = true; bookings = []; otherBookings = []; failure = null
  trainerUpdatedAt = new Date("2026-10-01")
  for (const fn of [findFirst, findMany, update, transaction, findTrainers, updateSessions, updateSession, endAssignment, createAssignment]) fn.mock.resetCalls()
})

test("only admins can update trainers", async () => {
  for (const role of [null, "TRAINER", "MEMBER"]) {
    session = role ? { gymId: "gym-1", role } : null
    assert.equal((await put()).status, 401)
  }
  assert.equal(transaction.mock.callCount(), 0)
})

test("validates the complete form before making changes", async () => {
  for (const value of [null, { ...staff, email: "invalid" }, { ...staff, availability: [] }, { ...staff, specializations: ["Yoga", "yoga"] }, { ...contractor, sessions: [contractor.sessions[0], contractor.sessions[0]] }]) assert.equal((await put(value)).status, 400)
  assert.equal(transaction.mock.callCount(), 0)
})

test("scopes reads and writes to the session gym and leaves unrelated profile and bookings intact", async () => {
  assert.equal((await put({ ...staff, gymId: "other", status: "INACTIVE", bio: "replace", userId: "other" })).status, 200)
  assert.deepEqual((findFirst.mock.calls[0].arguments[0] as { where: unknown }).where, { id: "trainer-1", gymId: "gym-1" })
  const args = update.mock.calls[0].arguments[0]
  assert.deepEqual(args.where, { id_gymId: { id: "trainer-1", gymId: "gym-1" } })
  assert.equal(args.data.fullName, "Coach Ali")
  assert.equal(args.data.monthlySalaryMinor, 5000025)
  assert.equal(args.data.contractorPaymentType, null)
  assert.equal(args.data.sessionRate, null)
  for (const key of ["gymId", "status", "bio", "userId", "sessions", "assignments", "packages", "availability"]) assert.equal(key in args.data, false)
  assert.deepEqual(args.data.specializations, { deleteMany: {}, create: [{ specialization: { connectOrCreate: { where: { name: "Yoga" }, create: { name: "Yoga" } } } }] })
  assert.deepEqual(transaction.mock.calls[0].arguments[1], { isolationLevel: "Serializable" })
})

test("returns not found for trainers unavailable in this gym", async () => {
  exists = false
  assert.equal((await put()).status, 404)
  assert.equal(update.mock.callCount(), 0)
})

test("updates contractor sessions and payment model while clearing staff-only compensation", async () => {
  for (const paymentType of ["FIXED_FEE", "SESSION_BASED"]) {
    assert.equal((await put({ ...contractor, paymentType })).status, 200)
    const data = update.mock.calls.at(-1)!.arguments[0].data
    assert.equal(data.fixedFeeAmount, paymentType === "FIXED_FEE" ? 100025 : null)
    assert.equal(data.sessionRate, paymentType === "SESSION_BASED" ? 100025 : null)
    assert.equal(data.monthlySalaryMinor, null)
    assert.equal(data.workDaysPerWeek, null)
    assert.equal(data.sessionsPerWeek, 2)
    assert.deepEqual(data.availability, { deleteMany: {}, create: contractor.sessions })
    assert.equal("certifications" in data, false)
    assert.equal("specializations" in data, false)
  }
})

test("requires review before saving any working-hour change with upcoming sessions", async () => {
  bookings = [booking()]
  for (const startMinute of [780, 600]) {
    const response = await put({ ...staff, availability: [{ dayOfWeek: 1, startMinute, endMinute: 1200 }] })
    assert.equal(response.status, 409)
    const body = await response.json()
    assert.equal(body.code, "SCHEDULE_REVIEW_REQUIRED")
    assert.equal(body.review.sessions[0].memberName, "Sara")
    assert.equal(body.review.sessions[0].needsNewTime, startMinute === 780)
    assert.equal(body.review.timeZone, "Asia/Karachi")
  }
  assert.equal(update.mock.callCount(), 0)
  assert.equal(updateSessions.mock.callCount(), 0)
  assert.equal(endAssignment.mock.callCount(), 0)
})

const changedStaff = { ...staff, availability: [{ dayOfWeek: 1, startMinute: 780, endMinute: 1200 }] }
async function confirmation(payload = changedStaff): Promise<ScheduleConfirmation> {
  const response = await put(payload)
  assert.equal(response.status, 409)
  const { review } = await response.json() as { review: ScheduleChangeReview }
  return { confirmed: true, revision: review.revision, sessions: review.sessions.map((item) => ({
    sessionId: item.id, trainerId: "trainer-1", date: item.date, startMinute: 780,
  })) }
}

test("saves confirmed new session times and trainer hours together, preserving duration and IDs", async () => {
  bookings = [booking()]
  const scheduleConfirmation = await confirmation()
  const result = await put({ ...changedStaff, scheduleConfirmation })
  assert.equal(result.status, 200)
  assert.equal(update.mock.callCount(), 1)
  assert.deepEqual(updateSession.mock.calls[0].arguments[0], {
    where: { id: "session-1", gymId: "gym-1" },
    data: { trainerId: "trainer-1", startsAt: new Date("2030-10-21T08:00:00Z"), endsAt: new Date("2030-10-21T09:00:00Z"), status: "SCHEDULED" },
  })
  assert.equal(endAssignment.mock.callCount(), 0)
})

test("transfers all upcoming sessions and the member assignment to another gym trainer", async () => {
  bookings = [booking(), booking("session-2", "member-1", 9)]
  const scheduleConfirmation = await confirmation()
  scheduleConfirmation.sessions.forEach((choice, index) => { choice.trainerId = "trainer-2"; choice.startMinute = 720 + index * 120 })
  assert.equal((await put({ ...changedStaff, scheduleConfirmation })).status, 200)
  assert.equal(updateSession.mock.callCount(), 2)
  assert.equal(endAssignment.mock.callCount(), 1)
  assert.deepEqual((endAssignment.mock.calls[0].arguments[0] as { where: unknown }).where, { gymId: "gym-1", memberId: "member-1", trainerId: "trainer-1", endedAt: null })
  const assignment = createAssignment.mock.calls[0].arguments[0] as { data: { trainerId: string; gymId: string; memberId: string } }
  assert.equal(assignment.data.trainerId, "trainer-2")
  assert.equal(assignment.data.memberId, "member-1")
  assert.equal(assignment.data.gymId, "gym-1")
  assert.deepEqual((findTrainers.mock.calls[0].arguments[0] as { where: unknown }).where, { gymId: "gym-1", id: { not: "trainer-1" }, status: "ACTIVE" })
})

test("rejects missing, duplicated, foreign, out-of-hours, and cross-week resolutions without writing", async () => {
  bookings = [booking()]
  const valid = await confirmation()
  const choice = valid.sessions[0]
  for (const sessions of [[], [choice, choice], [{ ...choice, sessionId: "foreign" }], [{ ...choice, trainerId: "foreign-gym-trainer" }], [{ ...choice, startMinute: 720 }], [{ ...choice, date: "2030-10-28" }]]) {
    assert.equal((await put({ ...changedStaff, scheduleConfirmation: { ...valid, sessions } })).status, 409)
  }
  assert.equal((await put({ ...changedStaff, scheduleConfirmation: { ...valid, confirmed: false } })).status, 400)
  assert.equal(update.mock.callCount(), 0)
  assert.equal(updateSessions.mock.callCount(), 0)
})

test("rejects double booking the destination trainer or member", async () => {
  bookings = [booking()]
  const scheduleConfirmation = await confirmation()
  for (const other of [
    { ...booking("other", "other-member", 8), trainerId: "trainer-1" },
    { ...booking("other", "member-1", 8), trainerId: "trainer-2" },
  ]) {
    otherBookings = [other]
    const result = await put({ ...changedStaff, scheduleConfirmation })
    assert.equal(result.status, 409)
    assert.match((await result.json()).message, /overlaps/)
  }
  assert.equal(updateSessions.mock.callCount(), 0)
})

test("rejects overlapping proposed times and splitting a member across trainers", async () => {
  bookings = [booking(), booking("session-2", "member-1", 9)]
  const scheduleConfirmation = await confirmation()
  assert.equal((await put({ ...changedStaff, scheduleConfirmation })).status, 409)
  scheduleConfirmation.sessions[1].trainerId = "trainer-2"
  assert.equal((await put({ ...changedStaff, scheduleConfirmation })).status, 409)
  assert.equal(updateSessions.mock.callCount(), 0)
})

test("requires a fresh review if sessions or trainer details changed since confirmation", async () => {
  bookings = [booking()]
  const scheduleConfirmation = await confirmation()
  bookings.push(booking("new-session", "new-member", 10))
  let result = await put({ ...changedStaff, scheduleConfirmation })
  assert.equal(result.status, 409)
  assert.equal((await result.json()).review.sessions.length, 2)
  bookings.pop()
  trainerUpdatedAt = new Date("2026-10-02")
  result = await put({ ...changedStaff, scheduleConfirmation })
  assert.equal(result.status, 409)
  assert.equal((await result.json()).code, "SCHEDULE_REVIEW_REQUIRED")
  assert.equal(update.mock.callCount(), 0)
  assert.equal(updateSessions.mock.callCount(), 0)
})

test("removing a working day requires moving sessions to another working day in the same week", async () => {
  bookings = [booking()]
  const payload = { ...staff, availability: [{ dayOfWeek: 2, startMinute: 780, endMinute: 1200 }] }
  const scheduleConfirmation = await confirmation(payload)
  assert.equal((await put({ ...payload, scheduleConfirmation })).status, 409)
  scheduleConfirmation.sessions[0].date = "2030-10-22"
  assert.equal((await put({ ...payload, scheduleConfirmation })).status, 200)
})

test("contractor schedule edits also require confirmed member session reassignment", async () => {
  bookings = [booking()]
  const response = await put(contractor)
  assert.equal(response.status, 409)
  const { review } = await response.json()
  assert.equal((await put({ ...contractor, scheduleConfirmation: { confirmed: true, revision: review.revision, sessions: [{ sessionId: "session-1", trainerId: "trainer-1", date: "2030-10-21", startMinute: 960 }] } })).status, 200)
})

test("confirmation can retain sessions still covered by the edited hours without rewriting bookings", async () => {
  bookings = [booking()]
  const payload = { ...staff, availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 1200 }] }
  const scheduleConfirmation = await confirmation(payload)
  scheduleConfirmation.sessions[0].startMinute = 720
  assert.equal((await put({ ...payload, scheduleConfirmation })).status, 200)
  assert.equal(updateSessions.mock.callCount(), 0)
  assert.equal(updateSession.mock.callCount(), 0)
  assert.equal(update.mock.callCount(), 1)
})

test("does not move in-progress sessions or schedule a new time after membership expiry", async () => {
  bookings = [{ ...booking(), startsAt: new Date(Date.now() - 30 * 60_000), endsAt: new Date(Date.now() + 30 * 60_000) }]
  let scheduleConfirmation = await confirmation()
  let response = await put({ ...changedStaff, scheduleConfirmation })
  assert.equal(response.status, 409)
  assert.match((await response.json()).message, /in progress/)
  bookings = [booking()]
  bookings[0].member.subscriptions[0].endDate = new Date("2030-10-21")
  scheduleConfirmation = await confirmation()
  response = await put({ ...changedStaff, scheduleConfirmation })
  assert.equal(response.status, 409)
  assert.match((await response.json()).message, /expiry/)
  assert.equal(updateSessions.mock.callCount(), 0)
  assert.equal(update.mock.callCount(), 0)
})

test("cannot transfer a member whose current assignment belongs to another trainer", async () => {
  bookings = [booking()]
  bookings[0].member.assignments[0].trainerId = "trainer-3"
  const scheduleConfirmation = await confirmation()
  scheduleConfirmation.sessions[0].trainerId = "trainer-2"
  assert.equal((await put({ ...changedStaff, scheduleConfirmation })).status, 409)
  assert.equal(updateSessions.mock.callCount(), 0)
  assert.equal(endAssignment.mock.callCount(), 0)
})

test("permits swapping session times while preserving separate member bookings", async () => {
  bookings = [booking("session-1", "member-1", 8), booking("session-2", "member-2", 9)]
  const scheduleConfirmation = await confirmation()
  scheduleConfirmation.sessions[0].startMinute = 840
  scheduleConfirmation.sessions[1].startMinute = 780
  assert.equal((await put({ ...changedStaff, scheduleConfirmation })).status, 200)
  assert.equal(updateSession.mock.callCount(), 2)
})

test("returns useful conflicts for duplicate email and concurrent changes", async () => {
  for (const code of ["P2002", "P2034"]) { failure = { code }; assert.equal((await put()).status, 409) }
})
