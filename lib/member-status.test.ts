import assert from "node:assert/strict"
import { test } from "node:test"
import { memberStatusFromStartDate } from "./member-status"

test("started memberships are active and future memberships are inactive", () => {
  const now = new Date("2026-10-17T08:00:00Z")
  assert.equal(memberStatusFromStartDate("2026-10-16", "Asia/Karachi", now), "ACTIVE")
  assert.equal(memberStatusFromStartDate("2026-10-17", "Asia/Karachi", now), "ACTIVE")
  assert.equal(memberStatusFromStartDate("2026-10-18", "Asia/Karachi", now), "INACTIVE")
})

test("activation follows midnight in the gym's timezone", () => {
  assert.equal(memberStatusFromStartDate("2026-10-18", "Asia/Karachi", new Date("2026-10-17T18:59:59Z")), "INACTIVE")
  assert.equal(memberStatusFromStartDate("2026-10-18", "Asia/Karachi", new Date("2026-10-17T19:00:00Z")), "ACTIVE")
  assert.equal(memberStatusFromStartDate("2026-10-18", "America/Los_Angeles", new Date("2026-10-18T01:00:00Z")), "INACTIVE")
})
