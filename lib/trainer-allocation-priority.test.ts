import assert from "node:assert/strict"
import { test } from "node:test"
import { prioritizeTrainers, unallocatedMemberCounts } from "./trainer-allocation-priority"

test("counts distinct pending members against bookings for their assigned trainer", () => {
  const counts = unallocatedMemberCounts([
    { trainerId: "a", memberId: "one" },
    { trainerId: "a", memberId: "two" },
    { trainerId: "a", memberId: "two" },
    { trainerId: "b", memberId: "one" },
    { trainerId: "b", memberId: "three" },
  ], [
    { trainerId: "a", memberId: "one" },
    { trainerId: "a", memberId: "one" },
    { trainerId: "other-trainer", memberId: "three" },
  ])
  assert.equal(counts.get("a"), 1)
  assert.equal(counts.get("b"), 2)
  assert.equal(counts.has("other-trainer"), false)
  assert.equal(unallocatedMemberCounts([], []).size, 0)
})

test("prioritizes pending counts before pagination, preserves ties and does not mutate cached rows", () => {
  const trainers = [
    { id: "none", unallocatedMemberCount: 0 },
    { id: "two", unallocatedMemberCount: 2 },
    { id: "five", unallocatedMemberCount: 5 },
    { id: "two-again", unallocatedMemberCount: 2 },
  ]
  const sorted = prioritizeTrainers(trainers)
  assert.deepEqual(sorted.map((trainer) => trainer.id), ["five", "two", "two-again", "none"])
  assert.equal(sorted.slice(0, 1)[0].id, "five")
  assert.equal(trainers[0].id, "none")
})
