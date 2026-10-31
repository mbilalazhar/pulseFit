import assert from "node:assert/strict"
import { test } from "node:test"
import { calculateTrainerWorkload, workloadLevel } from "./trainer-workload"

const hours = [{ dayOfWeek: 1, startMinute: 540, endMinute: 1020 }, { dayOfWeek: 3, startMinute: 600, endMinute: 720 }]
const week = "2026-10-19"
const timeZone = "Asia/Karachi"
const session = (id: string, startsAt: string, endsAt: string, status = "SCHEDULED") => ({ id, startsAt, endsAt, status })

test("workload bands use the requested inclusive boundaries and distinguish missing capacity", () => {
  for (const value of [0, 29.9]) {
    assert.equal(workloadLevel(value).label, "Low")
    assert.match(workloadLevel(value).colorClass, /yellow/)
  }
  for (const value of [30, 60]) {
    assert.equal(workloadLevel(value).label, "Moderate")
    assert.match(workloadLevel(value).colorClass, /blue/)
  }
  for (const value of [60.1, 80]) {
    assert.equal(workloadLevel(value).label, "High")
    assert.match(workloadLevel(value).colorClass, /green/)
  }
  for (const value of [80.1, 100, 150]) {
    assert.equal(workloadLevel(value).label, "Heavy")
    assert.match(workloadLevel(value).colorClass, /red/)
  }
  assert.equal(workloadLevel(null).label, "Not configured")
})

test("uses exact assigned duration against weekly availability, excluding cancellations", () => {
  const metrics = calculateTrainerWorkload(hours, [
    session("one", "2026-10-19T04:00:00Z", "2026-10-19T04:45:00Z"),
    session("two", "2026-10-19T05:00:00Z", "2026-10-19T06:30:00Z", "COMPLETED"),
    session("three", "2026-10-21T05:00:00Z", "2026-10-21T05:30:00Z", "NO_SHOW"),
    session("cancelled", "2026-10-21T06:00:00Z", "2026-10-21T07:00:00Z", "CANCELED"),
  ], week, timeZone)
  assert.deepEqual(metrics, { totalWorkHours: 10, actualWorkHours: 2.75, workloadPercent: 27.5 })
})

test("clips sessions at gym-local week boundaries and counts split timetable sessions once", () => {
  const overnight = session("overnight", "2026-10-19T18:30:00Z", "2026-10-19T20:00:00Z")
  const metrics = calculateTrainerWorkload(hours, [
    session("start", "2026-10-18T18:30:00Z", "2026-10-18T19:30:00Z"),
    session("end", "2026-10-25T18:30:00Z", "2026-10-25T19:30:00Z"),
    overnight, overnight,
    session("outside", "2026-10-26T04:00:00Z", "2026-10-26T05:00:00Z"),
  ], week, timeZone)
  assert.deepEqual(metrics, { totalWorkHours: 10, actualWorkHours: 2.5, workloadPercent: 25 })
})

test("handles empty schedules, no configured capacity, and workload above capacity", () => {
  assert.deepEqual(calculateTrainerWorkload(hours, [], week, timeZone), { totalWorkHours: 10, actualWorkHours: 0, workloadPercent: 0 })
  const sessions = [session("one", "2026-10-19T04:00:00Z", "2026-10-19T06:00:00Z")]
  assert.deepEqual(calculateTrainerWorkload([], sessions, week, timeZone), { totalWorkHours: 0, actualWorkHours: 2, workloadPercent: null })
  assert.deepEqual(calculateTrainerWorkload([{ dayOfWeek: 1, startMinute: 540, endMinute: 600 }], sessions, week, timeZone), { totalWorkHours: 1, actualWorkHours: 2, workloadPercent: 200 })
})
