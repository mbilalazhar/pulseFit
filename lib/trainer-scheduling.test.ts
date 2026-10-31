import assert from "node:assert/strict"
import { test } from "node:test"
import { fitsWorkHours, gymInstant, mondayOf, overlaps, prepareAllocation, scheduleSegments } from "./trainer-scheduling"

const options = {
  availability: [{ dayOfWeek: 1, startMinute: 720, endMinute: 1200 }, { dayOfWeek: 3, startMinute: 600, endMinute: 900 }],
  timeZone: "Asia/Karachi", sessionsPerWeek: 2, sessionDurationMinutes: 45,
  membershipStart: "2026-10-01", membershipEnd: "2026-11-01", now: new Date("2026-10-18T00:00:00Z"),
}
const input = { memberId: "member", weekStart: "2026-10-19", slots: [{ date: "2026-10-19", startMinute: 720 }, { date: "2026-10-21", startMinute: 600 }] }

test("allocates the full allowance with exact purchased duration in gym time", () => {
  const sessions = prepareAllocation(input, options)
  assert.equal(sessions.length, 2)
  assert.equal(sessions[0].startsAt.toISOString(), "2026-10-19T07:00:00.000Z")
  assert.equal(sessions[0].endsAt.toISOString(), "2026-10-19T07:45:00.000Z")
  assert.equal(sessions[1].startsAt.toISOString(), "2026-10-21T05:00:00.000Z")
})

test("rejects partial allocations, times outside work hours, expired dates, and duplicates", () => {
  assert.throws(() => prepareAllocation({ ...input, slots: input.slots.slice(0, 1) }, options), /all 2/)
  assert.throws(() => prepareAllocation({ ...input, weekStart: "2026-10-20" }, options), /Monday/)
  for (const slot of [
    { date: "2026-10-20", startMinute: 720 },
    { date: "2026-10-19", startMinute: 700 },
    { date: "2026-10-19", startMinute: 1170 },
    { date: "2026-10-26", startMinute: 720 },
  ]) assert.throws(() => prepareAllocation({ ...input, slots: [slot, input.slots[1]] }, options))
  assert.throws(() => prepareAllocation(input, { ...options, membershipEnd: "2026-10-21" }), /membership/)
  assert.throws(() => prepareAllocation(input, { ...options, membershipStart: "2026-10-26" }), /membership/)
  assert.throws(() => prepareAllocation(input, { ...options, now: new Date("2026-10-26T07:00:00Z") }), /current week/)
  assert.throws(() => prepareAllocation({ ...input, slots: [input.slots[0], input.slots[0]] }, options), /overlap/)
})

test("allows all working days in the membership-start week, including before today and the start date", () => {
  const sessions = prepareAllocation(input, { ...options, membershipStart: "2026-10-23", now: new Date("2026-10-23T07:00:00Z") })
  assert.equal(sessions.length, 2)
  assert.equal(sessions[0].startsAt.toISOString(), "2026-10-19T07:00:00.000Z")
  for (const session of sessions) assert.equal(session.endsAt.getTime() - session.startsAt.getTime(), 45 * 60_000)
})

test("rejects off days and invalid session lengths", () => {
  assert.throws(() => prepareAllocation({ ...input, slots: [{ date: "2026-10-20", startMinute: 720 }, input.slots[1]] }, options), /working hours/)
  for (const duration of [0, -30, 45.5]) assert.throws(() => prepareAllocation(input, { ...options, sessionDurationMinutes: duration }), /session length/)
})

test("sessions cannot span a gap in contractor hours and adjacent bookings are allowed", () => {
  const hours = [{ dayOfWeek: 1, startMinute: 600, endMinute: 660 }, { dayOfWeek: 1, startMinute: 720, endMinute: 780 }]
  assert.equal(fitsWorkHours(hours, "2026-10-19", 630, 60), false)
  assert.equal(fitsWorkHours(hours, "2026-10-19", 600, 60), true)
  const interval = (start: number, end: number) => ({ startsAt: new Date(start), endsAt: new Date(end) })
  assert.equal(overlaps(interval(100, 200), interval(200, 300)), false)
  assert.equal(overlaps(interval(100, 201), interval(200, 300)), true)
  assert.equal(overlaps(interval(100, 400), interval(200, 300)), true)
})

test("timezone conversion handles DST offsets and rejects missing or ambiguous times", () => {
  assert.equal(gymInstant("2026-07-01", 720, "America/New_York").toISOString(), "2026-07-01T16:00:00.000Z")
  assert.equal(gymInstant("2026-01-01", 720, "America/New_York").toISOString(), "2026-01-01T17:00:00.000Z")
  assert.throws(() => gymInstant("2026-03-08", 150, "America/New_York"), /clock change/)
  assert.throws(() => gymInstant("2026-11-01", 90, "America/New_York"), /clock change/)
  assert.equal(gymInstant("2026-10-19", 1440, "Asia/Karachi").toISOString(), "2026-10-19T19:00:00.000Z")
})

test("week boundaries and graph segments use gym dates, including overnight existing sessions", () => {
  assert.equal(mondayOf("2026-10-25"), "2026-10-19")
  const segments = scheduleSegments({ id: "session", memberId: "member", member: { name: "Ali" }, status: "SCHEDULED", startsAt: new Date("2026-10-19T18:30:00Z"), endsAt: new Date("2026-10-19T20:00:00Z") }, "2026-10-19", "Asia/Karachi")
  assert.equal(segments.length, 2)
  assert.deepEqual(segments.map(({ date, startMinute, endMinute }) => ({ date, startMinute, endMinute })), [
    { date: "2026-10-19", startMinute: 1410, endMinute: 1440 }, { date: "2026-10-20", startMinute: 0, endMinute: 60 },
  ])
  assert.equal(segments[0].memberName, "Ali")
})
