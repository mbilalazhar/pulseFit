import assert from "node:assert/strict"
import { test } from "node:test"
import { calendarDays, dateInRange, localDateValue, parseDateValue, shiftCalendarMonth, timeParts, timeValue, displayTime } from "./date-time"

test("calendar dates remain local and reject invalid dates", () => {
  assert.equal(localDateValue(parseDateValue("2024-02-29")!), "2024-02-29")
  for (const value of ["2026-02-29", "2026-04-31", "2026-13-01", "", "2026-1-2"]) assert.equal(parseDateValue(value), null)
  assert.equal(dateInRange("2026-10-01", "2026-10-01", "2026-10-31"), true)
  assert.equal(dateInRange("2026-10-31", "2026-10-01", "2026-10-31"), true)
  assert.equal(dateInRange("2026-11-01", "2026-10-01", "2026-10-31"), false)
})

test("calendar aligns weeks to Monday and includes month boundaries", () => {
  const days = calendarDays(parseDateValue("2026-10-30")!)
  assert.equal(days.length, 42)
  assert.equal(localDateValue(days[0]), "2026-09-28")
  assert.equal(days[0].getDay(), 1)
  assert.equal(localDateValue(days[41]), "2026-11-08")
})

test("keyboard month navigation clamps long months and handles year changes", () => {
  assert.equal(localDateValue(shiftCalendarMonth(parseDateValue("2026-01-31")!, 1)), "2026-02-28")
  assert.equal(localDateValue(shiftCalendarMonth(parseDateValue("2024-01-31")!, 1)), "2024-02-29")
  assert.equal(localDateValue(shiftCalendarMonth(parseDateValue("2026-12-31")!, 1)), "2027-01-31")
})

test("12-hour time selection round trips every minute including noon and midnight", () => {
  for (let minute = 0; minute < 1440; minute++) {
    const value = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`
    const parts = timeParts(value)
    assert.equal(timeValue(parts.hour, parts.minute, parts.period), value)
  }
  assert.equal(displayTime("00:00"), "12:00 AM")
  assert.equal(displayTime("12:00"), "12:00 PM")
  assert.equal(displayTime("20:05"), "8:05 PM")
})
