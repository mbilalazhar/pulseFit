import assert from "node:assert/strict"
import { afterEach, mock, test } from "node:test"
import { createMember } from "./member.services"

afterEach(() => mock.restoreAll())

test("posts member, duration, trainer and payment details to the creation API", async () => {
  const payload = {
    name: "Ali", phone: "+92 300 1234567", planId: "plan-1", durationMonths: 2,
    startDate: "2026-10-17", trainerId: "trainer-1", amountReceivedMinor: 10000,
    sessionsPerWeek: 4, sessionDurationMinutes: 45, additionalChargeMinor: 15000,
    paymentDate: "2026-10-17", paymentMethod: "cash" as const,
  }
  const saved = { message: "Member Created", member: { id: "generated-id", name: "Ali" } }
  const fetch = mock.method(globalThis, "fetch", async () => Response.json(saved, { status: 201 }))
  assert.deepEqual(await createMember(payload), saved)
  assert.equal(fetch.mock.calls[0].arguments[0], "/api/member/create")
  const options = fetch.mock.calls[0].arguments[1] as RequestInit
  assert.equal(options.method, "POST")
  assert.deepEqual(JSON.parse(options.body as string), payload)
})

test("surfaces API validation errors to the form", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ message: "Invalid Data", error: { durationMonths: ["Choose 1–12 months"] } }, { status: 400 }))
  await assert.rejects(createMember({ name: "Ali", phone: "1234567", planId: "plan-1", durationMonths: 13, startDate: "2026-10-17" }), /Choose 1–12 months/)
})
