import assert from "node:assert/strict"
import { afterEach, mock, test } from "node:test"
import { createTrainer, updateTrainer, ScheduleReviewRequiredError } from "./trainer.services"
import type { ScheduleChangeReview } from "@/lib/trainer-schedule-change"

afterEach(() => mock.restoreAll())

test("surfaces trainer field validation errors to the form", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({
    message: "Invalid Data", error: { specializations: ["Each specialization must be unique"] },
  }, { status: 400 }))
  await assert.rejects(createTrainer({
    trainerType: "STAFF", fullName: "Coach", email: "coach@example.com",
    contactNumber: "03001234567", joiningDate: "2026-01-01", monthlySalary: 50000,
    availability: [{ dayOfWeek: 1, startMinute: 720, endMinute: 1200 }], shift: "FLEXIBLE",
    specializations: ["Yoga", "Yoga"], certifications: [],
  }), /Each specialization must be unique/)
})

test("passes schedule review details to the edit form and sends explicit confirmation on save", async () => {
  const review: ScheduleChangeReview = { revision: "revision-1", trainerId: "trainer-1", timeZone: "Asia/Karachi", trainers: [], sessions: [] }
  const payload = {
    trainerType: "STAFF" as const, fullName: "Coach", email: "coach@example.com",
    contactNumber: "03001234567", joiningDate: "2026-01-01", monthlySalary: 50000,
    availability: [{ dayOfWeek: 1, startMinute: 720, endMinute: 1200 }], shift: "FLEXIBLE" as const,
    specializations: ["Yoga"], certifications: [],
  }
  mock.method(globalThis, "fetch", async () => Response.json({ message: "Review sessions", code: "SCHEDULE_REVIEW_REQUIRED", review }, { status: 409 }))
  await assert.rejects(updateTrainer("trainer-1", payload), (error) => {
    assert.ok(error instanceof ScheduleReviewRequiredError)
    assert.deepEqual(error.review, review)
    return true
  })
  mock.restoreAll()
  const scheduleConfirmation = { confirmed: true as const, revision: review.revision, sessions: [] }
  mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "/api/trainer/trainer-1")
    assert.equal(options.method, "PUT")
    assert.deepEqual(JSON.parse(options.body as string).scheduleConfirmation, scheduleConfirmation)
    return Response.json({ message: "Trainer updated", trainer: { id: "trainer-1" } })
  })
  await updateTrainer("trainer-1", { ...payload, scheduleConfirmation })
})
