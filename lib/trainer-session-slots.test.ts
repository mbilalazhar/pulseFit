import assert from "node:assert/strict"
import { test } from "node:test"
import { availableSessionSlots, slotsOverlap } from "./trainer-session-slots"
import { gymInstant, prepareAllocation, type ScheduleSession } from "./trainer-scheduling"

const options = {
  weekStart: "2026-10-19", timeZone: "Asia/Karachi", duration: 45,
  now: new Date("2026-10-18T00:00:00Z"),
  availability: [{ dayOfWeek: 1, startMinute: 540, endMinute: 720 }],
  sessions: [] as ScheduleSession[],
}

function booking(startMinute: number, endMinute: number): ScheduleSession {
  return {
    id: `booking-${startMinute}`, memberId: "other", memberName: "Existing member", status: "SCHEDULED",
    date: options.weekStart, startMinute, endMinute,
    startsAt: gymInstant(options.weekStart, startMinute, options.timeZone).toISOString(),
    endsAt: gymInstant(options.weekStart, endMinute, options.timeZone).toISOString(),
  }
}

test("offers complete purchased-duration sessions and every offered slot passes allocation validation", () => {
  const slots = availableSessionSlots(options)
  assert.deepEqual(slots.map((slot) => slot.startMinute), [540, 585, 630, 675])
  for (const slot of slots) assert.equal(prepareAllocation({ memberId: "member", weekStart: options.weekStart, slots: [slot] }, {
    ...options, sessionsPerWeek: 1, sessionDurationMinutes: options.duration,
    membershipStart: "2026-10-01", membershipEnd: "2026-11-01",
  }).length, 1)
})

test("uses free gaps around partial-hour and overlapping existing bookings without losing space after them", () => {
  const sessions = [booking(615, 635), booking(580, 620)]
  const slots = availableSessionSlots({ ...options, sessions })
  assert.deepEqual(slots.map((slot) => slot.startMinute), [635])
  assert.deepEqual(availableSessionSlots({ ...options, sessions: [booking(500, 560), booking(700, 750)] }).map((slot) => slot.startMinute), [560, 605, 650])
  assert.deepEqual(availableSessionSlots({ ...options, sessions: [booking(500, 750)] }), [])
})

test("preserves separate contractor ranges and does not offer sessions crossing their gaps", () => {
  const slots = availableSessionSlots({ ...options, availability: [
    { dayOfWeek: 1, startMinute: 555, endMinute: 615 },
    { dayOfWeek: 1, startMinute: 630, endMinute: 660 },
    { dayOfWeek: 0, startMinute: 600, endMinute: 645 },
  ] })
  assert.deepEqual(slots, [{ date: "2026-10-19", startMinute: 555 }, { date: "2026-10-25", startMinute: 600 }])
  assert.deepEqual(availableSessionSlots({ ...options, duration: 0 }), [])
})

test("offers the entire current week, including sessions before today and exactly now", () => {
  const slots = availableSessionSlots({ ...options, now: new Date("2026-10-19T04:45:00Z") })
  assert.deepEqual(slots.map((slot) => slot.startMinute), [540, 585, 630, 675])
  assert.deepEqual(availableSessionSlots({ ...options, now: new Date("2026-10-23T12:00:00Z") }), slots)
  assert.deepEqual(availableSessionSlots({ ...options, now: new Date("2026-10-26T00:00:00Z") }), [])
})

test("every slot has exactly the purchased length and off days never offer slots", () => {
  for (const duration of [30, 45, 60, 90]) {
    const slots = availableSessionSlots({ ...options, duration })
    assert.equal(slots.length, Math.floor(180 / duration))
    assert.ok(slots.every((slot) => slot.date === "2026-10-19"))
    assert.ok(slots.every((slot) => slot.startMinute + duration <= 720))
    for (const slot of slots) {
      const [session] = prepareAllocation({ memberId: "member", weekStart: options.weekStart, slots: [slot] }, {
        ...options, sessionsPerWeek: 1, sessionDurationMinutes: duration,
        membershipStart: "2026-10-21", membershipEnd: "2026-11-01",
      })
      assert.equal(session.endsAt.getTime() - session.startsAt.getTime(), duration * 60_000)
    }
  }
})

test("skips ambiguous DST sessions and sessions crossing the clock change", () => {
  const slots = availableSessionSlots({ ...options, weekStart: "2026-10-26", timeZone: "America/New_York", duration: 60,
    availability: [{ dayOfWeek: 0, startMinute: 0, endMinute: 240 }],
  })
  assert.deepEqual(slots.map((slot) => slot.startMinute), [120, 180])
})

test("selection conflicts respect the full duration and allow adjacent sessions", () => {
  const slot = { date: "2026-10-19", startMinute: 540 }
  assert.equal(slotsOverlap(slot, { ...slot, startMinute: 570 }, 45), true)
  assert.equal(slotsOverlap(slot, { ...slot, startMinute: 585 }, 45), false)
  assert.equal(slotsOverlap(slot, { ...slot, date: "2026-10-20" }, 45), false)
})
