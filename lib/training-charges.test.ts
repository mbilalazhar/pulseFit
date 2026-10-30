import assert from "node:assert/strict"
import { test } from "node:test"
import { requiresAdditionalTrainingCharge } from "./training-charges"

const plan = { sessionsPerWeek: 3, sessionDurationMinutes: 60 }

test("manual training always asks for a charge while included training within either limit does not", () => {
  assert.equal(requiresAdditionalTrainingCharge(false, plan, plan), true)
  assert.equal(requiresAdditionalTrainingCharge(true, plan, plan), false)
  assert.equal(requiresAdditionalTrainingCharge(true, plan, { sessionsPerWeek: 2, sessionDurationMinutes: 30 }), false)
})

test("exceeding either limit asks for a charge even if the other limit decreases", () => {
  assert.equal(requiresAdditionalTrainingCharge(true, plan, { sessionsPerWeek: 4, sessionDurationMinutes: 30 }), true)
  assert.equal(requiresAdditionalTrainingCharge(true, plan, { sessionsPerWeek: 2, sessionDurationMinutes: 90 }), true)
  assert.equal(requiresAdditionalTrainingCharge(true, plan, { sessionsPerWeek: 4, sessionDurationMinutes: 90 }), true)
  assert.equal(requiresAdditionalTrainingCharge(true, { sessionsPerWeek: null, sessionDurationMinutes: null }, plan), true)
})
