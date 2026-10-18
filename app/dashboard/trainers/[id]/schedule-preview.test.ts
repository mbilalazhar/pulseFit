import assert from "node:assert/strict"
import test from "node:test"
import { DEFAULT_WORKING_DAYS, SAMPLE_SESSIONS, moveSession, swapSessionMembers } from "./schedule-preview"

test("swapping members across days preserves slots and training focus", () => {
  const original = structuredClone(SAMPLE_SESSIONS)
  const result = swapSessionMembers(original, "mon-1", "tue-1")
  const source = result.find((session) => session.id === "mon-1")!
  const target = result.find((session) => session.id === "tue-1")!
  assert.deepEqual([source.day, source.start, source.memberId, source.focus], [0, 960, "ayesha", "Strength & conditioning"])
  assert.deepEqual([target.day, target.start, target.memberId], [1, 960, "ali"])
  assert.equal(result.length, original.length)
  assert.deepEqual(original, SAMPLE_SESSIONS)
})

test("swapping keeps each member's individual training focus", () => {
  const result = swapSessionMembers(SAMPLE_SESSIONS, "mon-1", "mon-2")
  assert.equal(result.find((session) => session.id === "mon-1")!.focus, "Mobility & core")
  assert.equal(result.find((session) => session.id === "mon-2")!.focus, "Strength & conditioning")
})

test("swapping rejects missing sessions, identical slots and the same member", () => {
  for (const target of ["missing", "mon-1", "wed-2"]) {
    assert.throws(() => swapSessionMembers(SAMPLE_SESSIONS, "mon-1", target), /different member/)
  }
})

test("moving to an enabled weekend preserves the member and other bookings", () => {
  const original = structuredClone(SAMPLE_SESSIONS)
  const result = moveSession(original, "mon-1", 5, 1080, [...DEFAULT_WORKING_DAYS, 5])
  assert.deepEqual(result[0], { ...original[0], day: 5, start: 1080 })
  assert.deepEqual(result.slice(1), original.slice(1))
  assert.deepEqual(original, SAMPLE_SESSIONS)
})

test("moving rejects occupied slots, days off and times outside the schedule", () => {
  assert.throws(() => moveSession(SAMPLE_SESSIONS, "mon-1", 0, 1020, DEFAULT_WORKING_DAYS), /already booked/)
  assert.throws(() => moveSession(SAMPLE_SESSIONS, "mon-1", 6, 960, DEFAULT_WORKING_DAYS), /working day/)
  assert.throws(() => moveSession(SAMPLE_SESSIONS, "mon-1", 0, 1200, DEFAULT_WORKING_DAYS), /Choose a time/)
  assert.throws(() => moveSession(SAMPLE_SESSIONS, "missing", 0, 1080, DEFAULT_WORKING_DAYS), /no longer available/)
})
