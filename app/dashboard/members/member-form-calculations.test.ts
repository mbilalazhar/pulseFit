import assert from "node:assert/strict"
import { test } from "node:test"
import { membershipAmounts, membershipExpiry } from "./member-form-calculations"

test("expiry uses the last included day of the selected membership", () => {
  assert.equal(membershipExpiry("2025-04-01", 12), "2026-03-31")
  assert.equal(membershipExpiry("2026-12-15", 3), "2027-03-14")
  assert.equal(membershipExpiry("2026-01-31", 1), "2026-02-27")
  assert.equal(membershipExpiry("2024-01-31", 1), "2024-02-28")
  assert.equal(membershipExpiry("2024-02-29", 12), "2025-02-27")
})

test("incomplete or invalid dates and durations produce no expiry", () => {
  for (const value of ["", "invalid", "2026-02-30", "2026-13-01"]) {
    assert.equal(membershipExpiry(value, 12), "")
  }
  assert.equal(membershipExpiry("2026-04-01", 0), "")
})

test("prices include duration discounts and use integer minor units", () => {
  assert.deepEqual(membershipAmounts(200000, 12, 25, "2000", "16000"), {
    planAmount: 1800000, discount: 200000, finalAmount: 1600000,
    amountReceived: 1600000, balance: 0, status: "Paid",
  })
  assert.equal(membershipAmounts(9999, 3, 10, "0.29", "").finalAmount, 26968)
})

test("payment status reflects pending, partial, paid, and fully discounted memberships", () => {
  assert.equal(membershipAmounts(10000, 1, 0, "", "").status, "Pending")
  const partial = membershipAmounts(10000, 1, 0, "", "25.50")
  assert.equal(partial.status, "Partial")
  assert.equal(partial.balance, 7450)
  assert.equal(membershipAmounts(10000, 1, 0, "", "100").status, "Paid")
  assert.equal(membershipAmounts(10000, 1, 0, "100", "").status, "Paid")
  assert.equal(membershipAmounts(10000, 1, 0, "101", "").finalAmount, 0)
})
