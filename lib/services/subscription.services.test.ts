import assert from "node:assert/strict"
import { afterEach, mock, test } from "node:test"
import { updatePlan } from "./subscription.services"

afterEach(() => mock.restoreAll())

const payload = {
  name: "Pro", shortDesc: "Full access", longDesc: "Updated details",
  basePriceMinor: 100000, currency: "PKR", maxHoursPerDay: null, status: "INACTIVE" as const,
  features: [{ label: "Locker room access" }], durations: [{ durationMonths: 1, discountPercent: 0 }],
}

test("saves edits to the selected plan using PUT with the complete form payload", async () => {
  const result = { message: "Plan updated", plan: { id: "plan-1", ...payload } }
  const fetch = mock.method(globalThis, "fetch", async () => Response.json(result))
  assert.deepEqual(await updatePlan("plan-1", payload), result)
  assert.equal(fetch.mock.calls[0].arguments[0], "/api/plan/plan-1")
  const options = fetch.mock.calls[0].arguments[1] as RequestInit
  assert.equal(options.method, "PUT")
  assert.deepEqual(JSON.parse(options.body as string), payload)
})

test("shows validation failures when an edit cannot be saved", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({
    message: "Invalid Data", error: { durations: ["Each billing duration must be unique"] },
  }, { status: 400 }))
  await assert.rejects(updatePlan("plan-1", payload), /Each billing duration must be unique/)
})
