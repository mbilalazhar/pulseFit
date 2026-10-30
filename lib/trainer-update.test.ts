import assert from "node:assert/strict"
import { test } from "node:test"
import { bookingFitsWorkingHours, sameWorkingHours } from "./trainer-update"
import { trainerScheduleFields } from "./trainer-form-data"
import { endTimeToMinutes } from "./trainer-availability"

const hours = [{ dayOfWeek: 1, startMinute: 720, endMinute: 1200 }, { dayOfWeek: 0, startMinute: 600, endMinute: 900 }]

test("edit prefilling preserves exact times, weekday order, and separate contractor sessions", () => {
  const saved = [...hours, { dayOfWeek: 1, startMinute: 1260, endMinute: 1440 }]
  const fields = trainerScheduleFields(saved)
  assert.deepEqual(fields, [
    { dayOfWeek: 1, startTime: "12:00", endTime: "20:00" },
    { dayOfWeek: 1, startTime: "21:00", endTime: "24:00" },
    { dayOfWeek: 0, startTime: "10:00", endTime: "15:00" },
  ])
  assert.equal(endTimeToMinutes(fields[1].endTime), 1440)
  assert.deepEqual(trainerScheduleFields([]), [])
  assert.equal(saved[1].dayOfWeek, 0)
})

test("working-hour comparison ignores ordering but detects changed days and time boundaries", () => {
  assert.equal(sameWorkingHours(hours, [...hours].reverse()), true)
  assert.equal(sameWorkingHours(hours, [{ ...hours[0], endMinute: 1199 }, hours[1]]), false)
  assert.equal(sameWorkingHours(hours, hours.slice(0, 1)), false)
})

test("schedule edits must contain the whole booking in gym-local time", () => {
  const booking = { startsAt: new Date("2026-10-19T07:00:00Z"), endsAt: new Date("2026-10-19T08:00:00Z") }
  assert.equal(bookingFitsWorkingHours(booking, hours, "Asia/Karachi"), true)
  assert.equal(bookingFitsWorkingHours(booking, [{ dayOfWeek: 1, startMinute: 720, endMinute: 750 }], "Asia/Karachi"), false)
  assert.equal(bookingFitsWorkingHours(booking, [{ dayOfWeek: 2, startMinute: 720, endMinute: 1200 }], "Asia/Karachi"), false)
  assert.equal(bookingFitsWorkingHours({ startsAt: new Date("2026-10-19T18:00:00Z"), endsAt: new Date("2026-10-19T19:00:00Z") }, [{ dayOfWeek: 1, startMinute: 1200, endMinute: 1440 }], "Asia/Karachi"), true)
})
