// lib/validators/plan.ts
import { z } from "zod";

import { PLAN_FEATURE_MAX, hasTrainerGuidance } from "../plan-features";
import { trainerGuidanceSchema } from "./trainer-guidance";
export { PLAN_FEATURE_MAX, TRAINER_FEATURE_LABEL } from "../plan-features";

export const createPlanSchema = z.object({
  name:           z.string().trim().max(100).default(""),
  shortDesc:      z.string().trim().max(200).default(""),
  longDesc:       z.string().max(2000).optional(),
  basePriceMinor: z.number().int().min(0).max(2147483647).default(0),   // paisa, whole number
  currency:       z.string().length(3).default("PKR"),
  status:         z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
  maxHoursPerDay: z.number().positive("Gym hours must be greater than zero")
    .max(24, "Gym hours cannot exceed 24 per day").nullable().optional(),
  sessionsPerWeek: trainerGuidanceSchema.shape.sessionsPerWeek.nullable().optional(),
  sessionDurationMinutes: trainerGuidanceSchema.shape.sessionDurationMinutes.nullable().optional(),

  features: z.array(
    z.object({ label: z.string().trim().min(1).max(PLAN_FEATURE_MAX, "Each feature must be 100 characters or fewer") })
  ).max(50, "Add no more than 50 features").default([]),

  durations: z.array(
    z.object({
      label:           z.string().max(50).optional(),
      durationMonths:  z.number().int().positive(),
      discountPercent: z.number().int().min(0).max(100).default(0),
    })
  ).default([]).refine((durations) => new Set(durations.map((duration) => duration.durationMonths)).size === durations.length,
    "Each billing duration must be unique"),
}).superRefine((data, ctx) => {
  if (hasTrainerGuidance(data.features)) {
    if (data.sessionsPerWeek == null) ctx.addIssue({ code: "custom", path: ["sessionsPerWeek"], message: "Set the number of weekly sessions included with trainer guidance" });
    if (data.sessionDurationMinutes == null) ctx.addIssue({ code: "custom", path: ["sessionDurationMinutes"], message: "Set the length of each trainer guidance session" });
  }
  if (data.status === "DRAFT") return;
  if (!data.name) ctx.addIssue({ code: "custom", path: ["name"], message: "Enter a plan name" });
  if (!data.shortDesc) ctx.addIssue({ code: "custom", path: ["shortDesc"], message: "Enter a short description" });
  if (data.basePriceMinor <= 0) ctx.addIssue({ code: "custom", path: ["basePriceMinor"], message: "Enter a base price greater than zero" });
  if (data.status === "ACTIVE" && data.durations.length === 0) {
    ctx.addIssue({ code: "custom", path: ["durations"], message: "Add at least one billing duration before activating this plan" });
  }
}).transform((data) => ({
  ...data,
  sessionsPerWeek: hasTrainerGuidance(data.features) ? data.sessionsPerWeek ?? null : null,
  sessionDurationMinutes: hasTrainerGuidance(data.features) ? data.sessionDurationMinutes ?? null : null,
}));

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
