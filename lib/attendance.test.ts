import assert from "node:assert/strict"
import { test } from "node:test"
import { buildAttendance, eligibleForAttendance, type AttendanceMember, type AttendanceRecord } from "./attendance"

const now = new Date("2026-10-17T20:00:00Z")
const member = (id: string, overrides: Partial<AttendanceMember> = {}): AttendanceMember => ({ id, name: id, email: null, phone: "1234567", status: "ACTIVE", startDate: new Date("2026-10-01"), createdAt: new Date("2026-10-01"), plan: { name: "Gym plan" }, ...overrides })
const visit = (id: string, memberId: string, date: string, closed = false): AttendanceRecord => ({ id, memberId, attendanceDate: new Date(date), checkInAt: new Date(`${date}T00:00:00Z`), checkOutAt: closed ? new Date(`${date}T01:00:00Z`) : null })

test("counts present, checked out and absent members from actual records", () => {
  const result = buildAttendance([member("one"), member("two"), member("three")], [visit("1", "one", "2026-10-18"), visit("2", "two", "2026-10-18", true)], "Asia/Karachi", undefined, now)
  assert.equal(result.today, "2026-10-18")
  assert.deepEqual(result.summary, { present: 2, checkedOut: 1, inside: 1, rate: 67 })
  assert.equal(result.rows.find((row) => row.memberId === "one")?.status, "Present")
  assert.equal(result.rows.find((row) => row.memberId === "two")?.status, "Checked Out")
  assert.equal(result.rows.find((row) => row.memberId === "three")?.status, "Absent")
  assert.equal(result.hours[5].checkIns, 2)
})

test("future and frozen memberships cannot be checked in", () => {
  assert.equal(eligibleForAttendance(member("one", { startDate: new Date("2026-10-19") }), "2026-10-18"), false)
  assert.equal(eligibleForAttendance(member("two", { status: "FROZEN" }), "2026-10-18"), false)
  assert.equal(eligibleForAttendance(member("three", { status: "INACTIVE", startDate: new Date("2026-10-18") }), "2026-10-18"), true)
})

test("streaks stop at the first missed day and historical dates do not include future members", () => {
  const records = [visit("1", "one", "2026-10-18"), visit("2", "one", "2026-10-17", true), visit("3", "one", "2026-10-15", true)]
  const result = buildAttendance([member("one"), member("new", { createdAt: new Date("2026-10-18") })], records, "Asia/Karachi", undefined, now)
  assert.equal(result.rows[0].streak, 2)
  const historical = buildAttendance([member("one"), member("new", { createdAt: new Date("2026-10-18") })], records, "Asia/Karachi", "2026-10-17", now)
  assert.equal(historical.rows.length, 1)
  assert.equal(historical.rows[0].status, "Checked Out")
})

test("empty gyms show zero metrics and overnight visits remain marked present in search", () => {
  const empty = buildAttendance([], [], "Asia/Karachi", undefined, now)
  assert.deepEqual(empty.summary, { present: 0, checkedOut: 0, inside: 0, rate: 0 })
  const overnight = buildAttendance([member("one")], [visit("1", "one", "2026-10-17")], "Asia/Karachi", undefined, now)
  assert.equal(overnight.members[0].state, "Present")
  assert.equal(overnight.members[0].attendanceId, "1")
  assert.equal(overnight.rows[0].status, "Present")
  assert.equal(overnight.summary.inside, 1)
})
