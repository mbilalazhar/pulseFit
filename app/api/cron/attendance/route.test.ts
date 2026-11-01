import assert from "node:assert/strict"
import { mock, test } from "node:test"

const closeOverdue = mock.fn(async () => 2)
mock.module("@/lib/attendance-server", { namedExports: { closeOverdueAttendance: closeOverdue } })
const { GET } = await import("./route")

test("the scheduler requires its secret before performing cross-gym checkouts", async () => {
  const previous = process.env.CRON_SECRET
  try {
    delete process.env.CRON_SECRET
    assert.equal((await GET(new Request("http://localhost/api/cron/attendance"))).status, 503)
    process.env.CRON_SECRET = "test-attendance-secret"
    assert.equal((await GET(new Request("http://localhost/api/cron/attendance"))).status, 401)
    assert.equal((await GET(new Request("http://localhost/api/cron/attendance", { headers: { authorization: "Bearer wrong" } }))).status, 401)
    assert.equal(closeOverdue.mock.callCount(), 0)
    const response = await GET(new Request("http://localhost/api/cron/attendance", { headers: { authorization: "Bearer test-attendance-secret" } }))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { checkedOut: 2 })
    assert.equal(closeOverdue.mock.callCount(), 1)
  } finally {
    if (previous === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previous
  }
})
