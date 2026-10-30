import assert from "node:assert/strict"
import { afterEach, mock, test } from "node:test"
import { createTrainer } from "./trainer.services"

afterEach(() => mock.restoreAll())

test("surfaces trainer field validation errors to the form", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({
    message: "Invalid Data", error: { specializations: ["Each specialization must be unique"] },
  }, { status: 400 }))
  await assert.rejects(createTrainer({
    trainerType: "STAFF", fullName: "Coach", email: "coach@example.com",
    contactNumber: "03001234567", joiningDate: "2026-01-01", monthlySalary: 50000,
    workHoursPerDay: 8, workDaysPerWeek: 5, shift: "MORNING",
    specializations: ["Yoga", "Yoga"], certifications: [],
  }), /Each specialization must be unique/)
})
