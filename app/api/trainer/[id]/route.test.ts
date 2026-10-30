import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let session: { gymId: string; role: string } | null
let exists: boolean
let bookings: { startsAt: Date; endsAt: Date }[]
let failure: { code: string } | null
const oldHours = [{ dayOfWeek: 1, startMinute: 720, endMinute: 1200 }]
const findFirst = mock.fn(async (args: unknown) => { void args; return exists ? { availability: oldHours, gym: { timeZone: "Asia/Karachi" } } : null })
const findMany = mock.fn(async (args: unknown) => { void args; return bookings })
const update = mock.fn(async (args: { where: unknown; data: Record<string, unknown> }) => { if (failure) throw failure; return { id: "trainer-1", ...args.data } })
const transaction = mock.fn(async (callback: (client: unknown) => Promise<unknown>, options: unknown) => { void options; return callback({ trainer: { findFirst, update }, trainingSession: { findMany } }) })
mock.module("@/lib/auth", { namedExports: { getSession: async () => session } })
mock.module("@/lib/prisma", { namedExports: { prisma: { $transaction: transaction } } })
const staff = { trainerType: "STAFF", fullName: " Coach Ali ", email: "ali@example.com", contactNumber: "03001234567", joiningDate: "2026-10-01", monthlySalary: 50000.25, shift: "FLEXIBLE", availability: oldHours, specializations: ["Yoga"], certifications: ["Certified Coach"] }
const contractor = { trainerType: "CONTRACTOR", fullName: "Coach Ali", email: "ali@example.com", contactNumber: "03001234567", joiningDate: "2026-10-01", paymentType: "FIXED_FEE", amount: 1000.25, sessions: [{ dayOfWeek: 1, startMinute: 720, endMinute: 780 }, { dayOfWeek: 1, startMinute: 960, endMinute: 1020 }] }
async function put(body: unknown = staff) {
  const { PUT } = await import("./route")
  return PUT(new Request("http://localhost/api/trainer/trainer-1", { method: "PUT", body: JSON.stringify(body) }), { params: Promise.resolve({ id: "trainer-1" }) })
}
beforeEach(() => {
  session = { gymId: "gym-1", role: "ADMIN" }; exists = true; bookings = []; failure = null
  for (const fn of [findFirst, findMany, update, transaction]) fn.mock.resetCalls()
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

test("rejects schedule changes excluding upcoming bookings and accepts changes containing them", async () => {
  bookings = [{ startsAt: new Date("2030-10-21T07:00:00Z"), endsAt: new Date("2030-10-21T08:00:00Z") }]
  assert.equal((await put({ ...staff, availability: [{ dayOfWeek: 1, startMinute: 780, endMinute: 1200 }] })).status, 409)
  assert.equal(update.mock.callCount(), 0)
  assert.equal((await put({ ...staff, availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 1200 }] })).status, 200)
  assert.equal(update.mock.callCount(), 1)
})

test("returns useful conflicts for duplicate email and concurrent changes", async () => {
  for (const code of ["P2002", "P2034"]) { failure = { code }; assert.equal((await put()).status, 409) }
})
