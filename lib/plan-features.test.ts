import assert from "node:assert/strict"
import { test } from "node:test"
import { buildPlanFeatures, PLAN_FACILITIES } from "./plan-features"
import { createPlanSchema } from "./validators/plan"

const plan = { name: "Pro", shortDesc: "Full access", basePriceMinor: 100000 }

test("selected facilities and unsaved custom lines are included once", () => {
  assert.deepEqual(buildPlanFeatures(["trainer", "locker-room", "spa"], "  Nutrition consultation \r\n\nlocker ROOM access\nNutrition consultation"), [
    { label: "Trainer guidance included" }, { label: "Locker room access" },
    { label: "Spa room access" }, { label: "Nutrition consultation" },
  ])
  assert.deepEqual(buildPlanFeatures([], "Guest pass"), [{ label: "Guest pass" }])
  assert.equal(buildPlanFeatures(PLAN_FACILITIES.map((item) => item.id), "").length, PLAN_FACILITIES.length)
})

test("daily hours can be the plan's feature and accept fractional limits", () => {
  for (const hours of [0.5, 2, 24]) {
    assert.equal(createPlanSchema.parse({ ...plan, features: [], maxHoursPerDay: hours }).maxHoursPerDay, hours)
  }
  assert.equal(createPlanSchema.safeParse({ ...plan, features: [], maxHoursPerDay: null }).success, false)
  assert.equal(createPlanSchema.safeParse({ ...plan, features: [{ label: "Shower access" }], maxHoursPerDay: null }).success, true)
})

test("invalid hours and empty or overlong custom features are rejected", () => {
  for (const hours of [0, -1, 24.1, Infinity, NaN, "2"]) {
    assert.equal(createPlanSchema.safeParse({ ...plan, features: [{ label: "Spa access" }], maxHoursPerDay: hours }).success, false)
  }
  for (const label of ["   ", "x".repeat(101)]) {
    assert.equal(createPlanSchema.safeParse({ ...plan, features: [{ label }] }).success, false)
  }
})
