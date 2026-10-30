import assert from "node:assert/strict"
import { test } from "node:test"
import { contractorSessionsSchema, formatWorkTime, timeToMinutes, trainerAvailabilitySchema, weeklyWorkHours, workingDayNames } from "./trainer-availability"

test("keeps different daily hours and nonconsecutive working days, including Sunday", () => {
  const days = trainerAvailabilitySchema.parse([
    { dayOfWeek: 0, startMinute: 720, endMinute: 1200 },
    { dayOfWeek: 2, startMinute: 555, endMinute: 930 },
  ])
  assert.equal(weeklyWorkHours(days), 14.25)
  assert.equal(workingDayNames(days), "Tue, Sun")
})

test("time inputs and labels distinguish noon, midnight, and minute precision", () => {
  assert.equal(timeToMinutes("00:00"), 0)
  assert.equal(timeToMinutes("12:00"), 720)
  assert.equal(timeToMinutes("20:15"), 1215)
  assert.equal(formatWorkTime(0), "12:00 AM")
  assert.equal(formatWorkTime(720), "12:00 PM")
  assert.equal(formatWorkTime(1215), "8:15 PM")
  for (const value of ["", "24:00", "12:60", "12", "12:00 PM"]) {
    assert.equal(Number.isNaN(timeToMinutes(value)), true)
  }
})

test("allows all seven days with one range each and rejects fractional minutes", () => {
  const days = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, startMinute: 0, endMinute: 1440 }))
  assert.equal(trainerAvailabilitySchema.safeParse(days).success, true)
  assert.equal(trainerAvailabilitySchema.safeParse([{ dayOfWeek: 1, startMinute: 600.5, endMinute: 1200 }]).success, false)
})


test("contractors can have separate or adjacent sessions on a day while staff cannot", () => {
  const sessions = [
    { dayOfWeek: 1, startMinute: 600, endMinute: 660 },
    { dayOfWeek: 1, startMinute: 660, endMinute: 720 },
    { dayOfWeek: 1, startMinute: 960, endMinute: 1080 },
    { dayOfWeek: 3, startMinute: 600, endMinute: 660 },
  ]
  assert.equal(contractorSessionsSchema.safeParse(sessions).success, true)
  assert.equal(trainerAvailabilitySchema.safeParse(sessions).success, false)
  assert.equal(weeklyWorkHours(sessions), 5)
  assert.equal(workingDayNames(sessions), "Mon, Wed")
  assert.equal(contractorSessionsSchema.safeParse([...sessions, sessions[0]]).success, false)
})
