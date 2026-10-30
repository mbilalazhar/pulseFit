import assert from "node:assert/strict"
import { beforeEach, mock, test } from "node:test"

let session: { gymId: string; role: string } | null
let createError: { code: string } | null
const create = mock.fn(async ({ data }: { data: Record<string, unknown> }) => {
  if (createError) throw createError
  return { id: "trainer-1", ...data }
})
mock.module("@/lib/auth", { namedExports: { getSession: async () => session } })
mock.module("@/lib/prisma", { namedExports: { prisma: { trainer: { create } } } })

const staff = {
  trainerType: "STAFF", fullName: "Coach Ali", email: "coach@example.com",
  contactNumber: "03001234567", joiningDate: "2026-01-01",
  monthlySalary: 50000.25, workHoursPerDay: 8, workDaysPerWeek: 5,
  shift: "MORNING", specializations: ["Yoga"], certifications: ["Certified Coach"],
}
const contractor = {
  trainerType: "CONTRACTOR", fullName: "Coach Ali", email: "coach@example.com",
  contactNumber: "03001234567", joiningDate: "2026-01-01",
  paymentType: "FIXED_FEE", amount: 1000.25, sessionsPerWeek: 3,
}

async function post(body: unknown) {
  const { POST } = await import("./route")
  return POST(new Request("http://localhost/api/trainer/create", {
    method: "POST", body: JSON.stringify(body),
  }))
}

beforeEach(() => {
  session = { gymId: "gym-1", role: "ADMIN" }
  createError = null
  create.mock.resetCalls()
})

test("requires an admin before accessing the database", async () => {
  for (const value of [null, { gymId: "gym-1", role: "TRAINER" }, { gymId: "gym-1", role: "MEMBER" }]) {
    session = value
    assert.equal((await post(staff)).status, 401)
  }
  assert.equal(create.mock.callCount(), 0)
})

test("malformed JSON is a validation error rather than a server error", async () => {
  const { POST } = await import("./route")
  const response = await POST(new Request("http://localhost/api/trainer/create", { method: "POST", body: "{" }))
  assert.equal(response.status, 400)
  assert.equal(create.mock.callCount(), 0)
})

test("rejects blank fields and duplicate specializations before nested inserts", async () => {
  for (const invalid of [
    { fullName: "   " }, { contactNumber: "  " },
    { specializations: [" "] }, { certifications: [" "] },
    { specializations: ["Yoga", "Yoga"] },
    { specializations: ["Yoga", " yoga "] },
  ]) assert.equal((await post({ ...staff, ...invalid })).status, 400)
  assert.equal(create.mock.callCount(), 0)
})

test("creates staff with trimmed details, minor-unit salary, and the session's gym", async () => {
  assert.equal((await post({ ...staff, gymId: "other-gym", fullName: " Coach Ali ", email: " coach@example.com " })).status, 201)
  const data = create.mock.calls[0].arguments[0].data
  assert.equal(data.gymId, "gym-1")
  assert.equal(data.fullName, "Coach Ali")
  assert.equal(data.email, "coach@example.com")
  assert.equal(data.monthlySalaryMinor, 5000025)
  assert.deepEqual(data.joiningDate, new Date("2026-01-01"))
  assert.deepEqual(data.specializations, {
    create: [{ specialization: { connectOrCreate: { where: { name: "Yoga" }, create: { name: "Yoga" } } } }],
  })
  assert.equal(data.contractorPaymentType, undefined)
})

test("creates both contractor types with minor-unit rates and an empty certifications list", async () => {
  for (const paymentType of ["FIXED_FEE", "SESSION_BASED"]) {
    assert.equal((await post({ ...contractor, paymentType })).status, 201)
    const data = create.mock.calls.at(-1)!.arguments[0].data
    assert.equal(data.fixedFeeAmount, paymentType === "FIXED_FEE" ? 100025 : null)
    assert.equal(data.sessionRate, paymentType === "SESSION_BASED" ? 100025 : null)
    assert.deepEqual(data.certifications, [])
    assert.equal(data.monthlySalaryMinor, undefined)
  }
})

test("returns conflicts for duplicate details and a removed gym", async () => {
  for (const code of ["P2002", "P2003"]) {
    createError = { code }
    assert.equal((await post(staff)).status, 409)
  }
})
