import assert from "node:assert/strict"
import { test } from "node:test"
import { createMemberSchema } from "./member"

const input = {
  name: "  Ali Raza  ", phone: "+92 300 1234567", email: "ali@example.com",
  planId: "plan-1", durationMonths: 6, startDate: "2026-10-17",
}

test("validates member details and allows an optional email and trainer", () => {
  assert.equal(createMemberSchema.parse(input).name, "Ali Raza")
  for (const email of [undefined, null, ""]) {
    assert.equal(createMemberSchema.parse({ ...input, email, trainerId: null }).email, null)
  }
  assert.equal(createMemberSchema.parse({ ...input, trainerId: "trainer-1" }).trainerId, "trainer-1")
})

test("rejects missing membership fields, invalid contacts, and impossible dates", () => {
  for (const invalid of [
    { name: " " }, { phone: "123" }, { phone: "not a phone" }, { email: "invalid" },
    { planId: "" }, { durationMonths: 0 }, { durationMonths: 13 }, { durationMonths: 1.5 }, { durationMonths: "6" }, { startDate: "2026-02-30" },
    { startDate: "2025-02-29" }, { startDate: "0000-01-01" },
    { startDate: "2026-10-17T00:00:00Z" },
  ]) {
    assert.equal(createMemberSchema.safeParse({ ...input, ...invalid }).success, false)
  }
  assert.equal(createMemberSchema.safeParse({ ...input, startDate: "2024-02-29" }).success, true)
})

test("client-supplied ownership and status cannot override server values", () => {
  const parsed = createMemberSchema.parse({ ...input, gymId: "other-gym", status: "ACTIVE" })
  assert.equal("gymId" in parsed, false)
  assert.equal("status" in parsed, false)
})

test("accepts every fixed duration from 1 through 12 months", () => {
  for (let durationMonths = 1; durationMonths <= 12; durationMonths++) {
    assert.equal(createMemberSchema.safeParse({ ...input, durationMonths }).success, true)
  }
})

test("validates received amounts and requires a date for payments", () => {
  for (const invalid of [
    { amountReceivedMinor: -1 }, { specialDiscountMinor: -1 },
    { amountReceivedMinor: 0.5 }, { specialDiscountMinor: 2147483648 },
    { amountReceivedMinor: 100 }, { paymentDate: "2026-02-30" },
    { paymentMethod: "invalid" },
  ]) assert.equal(createMemberSchema.safeParse({ ...input, ...invalid }).success, false)
  assert.equal(createMemberSchema.safeParse({ ...input, amountReceivedMinor: 100, paymentDate: "2026-10-17", paymentMethod: "cash" }).success, true)
})
