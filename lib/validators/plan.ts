// lib/validators/plan.ts
import { z } from "zod";

import { PLAN_FEATURE_MAX } from "../plan-features";
export { PLAN_FEATURE_MAX, TRAINER_FEATURE_LABEL } from "../plan-features";

export const createPlanSchema = z.object({
  name:           z.string().min(1, "Name is required").max(100),
  shortDesc:      z.string().min(1).max(200),
  longDesc:       z.string().max(2000).optional(),
  basePriceMinor: z.number().int().positive(),   // paisa, whole number
  currency:       z.string().length(3).default("PKR"),
  status:         z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
  maxHoursPerDay: z.number().positive("Gym hours must be greater than zero")
    .max(24, "Gym hours cannot exceed 24 per day").nullable().optional(),

  features: z.array(
    z.object({ label: z.string().trim().min(1).max(PLAN_FEATURE_MAX, "Each feature must be 100 characters or fewer") })
  ).max(50, "Add no more than 50 features").default([]),

  durations: z.array(
    z.object({
      label:           z.string().max(50).optional(),
      durationMonths:  z.number().int().positive(),
      discountPercent: z.number().int().min(0).max(100).default(0),
    })
  ).default([]),
}).refine((data) => data.features.length > 0 || data.maxHoursPerDay != null, {
  message: "Select a facility, add a custom feature, or set daily gym hours",
  path: ["features"],
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
