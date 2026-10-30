import assert from "node:assert/strict"
import { test } from "node:test"
import { buildPlanFeatures, splitPlanFeatures, hasTrainerGuidance, PLAN_FACILITIES } from "./plan-features"
import { createPlanSchema } from "./validators/plan"

const plan = { name: "Pro", shortDesc: "Full access", basePriceMinor: 100000 }

test("trainer guidance requires weekly sessions and session length, including for drafts", () => {
  const guided = { ...plan, features: [{ label: "Trainer guidance included" }], sessionsPerWeek: 3, sessionDurationMinutes: 60 }
  for (const status of ["DRAFT", "INACTIVE", "ACTIVE"]) {
    const candidate = { ...guided, status, durations: [{ durationMonths: 1 }] }
    assert.equal(createPlanSchema.safeParse(candidate).success, true)
    for (const missing of [{ sessionsPerWeek: undefined }, { sessionDurationMinutes: null }]) {
      assert.equal(createPlanSchema.safeParse({ ...candidate, ...missing }).success, false)
    }
  }
  for (const invalid of [{ sessionsPerWeek: 0 }, { sessionsPerWeek: 1.5 }, { sessionsPerWeek: 22 }, { sessionDurationMinutes: -1 }, { sessionDurationMinutes: 0.5 }, { sessionDurationMinutes: 1441 }]) {
    assert.equal(createPlanSchema.safeParse({ ...guided, ...invalid }).success, false)
  }
  assert.equal(hasTrainerGuidance([{ label: " Trainer GUIDANCE included " }]), true)
  const removed = createPlanSchema.parse({ ...guided, features: [] })
  assert.equal(removed.sessionsPerWeek, null)
  assert.equal(removed.sessionDurationMinutes, null)
})

test("restores saved facilities and custom features for editing without losing benefits", () => {
  const saved = [{ label: "Locker room access" }, { label: "Shower access" }, { label: "Monthly assessment" }, { label: "Guest pass" }]
  const fields = splitPlanFeatures(saved)
  assert.deepEqual(fields.facilities, ["locker-room", "shower"])
  assert.equal(fields.customFeatures, "Monthly assessment\nGuest pass")
  assert.deepEqual(buildPlanFeatures(fields.facilities, fields.customFeatures), saved)
  assert.deepEqual(splitPlanFeatures([]), { facilities: [], customFeatures: "" })
})

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
  assert.equal(createPlanSchema.safeParse({ ...plan, features: [], maxHoursPerDay: null }).success, true)
  assert.equal(createPlanSchema.safeParse({ ...plan, features: [{ label: "Shower access" }], maxHoursPerDay: null }).success, true)
})

test("drafts have no required fields while active plans require complete purchase details", () => {
  const draft = createPlanSchema.parse({ status: "DRAFT" })
  assert.equal(draft.name, "")
  assert.equal(draft.shortDesc, "")
  assert.equal(draft.basePriceMinor, 0)
  assert.deepEqual(draft.features, [])
  assert.deepEqual(draft.durations, [])
  assert.equal(createPlanSchema.safeParse({ ...draft, status: "ACTIVE" }).success, false)
  assert.equal(createPlanSchema.safeParse({ ...plan, status: "ACTIVE", durations: [{ durationMonths: 1 }] }).success, true)
  assert.equal(createPlanSchema.safeParse({ ...plan, status: "ACTIVE", durations: [] }).success, false)
  assert.equal(createPlanSchema.safeParse({ ...plan, status: "INACTIVE", features: [] }).success, true)
})

test("invalid hours and empty or overlong custom features are rejected", () => {
  for (const hours of [0, -1, 24.1, Infinity, NaN, "2"]) {
    assert.equal(createPlanSchema.safeParse({ ...plan, features: [{ label: "Spa access" }], maxHoursPerDay: hours }).success, false)
  }
  for (const label of ["   ", "x".repeat(101)]) {
    assert.equal(createPlanSchema.safeParse({ ...plan, features: [{ label }] }).success, false)
  }
})
