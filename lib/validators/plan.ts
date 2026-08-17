// lib/validators/plan.ts
import { z } from "zod";

export const createPlanSchema = z.object({
  name:           z.string().min(1, "Name is required").max(100),
  shortDesc:      z.string().min(1).max(200),
  longDesc:       z.string().max(2000).optional(),
  basePriceMinor: z.number().int().positive(),   // paisa, whole number
  currency:       z.string().length(3).default("PKR"),
  status:         z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),

  features: z.array(
    z.object({ label: z.string().min(1).max(100) })
  ).min(1, "Add at least one feature"),

  durations: z.array(
    z.object({
      label:           z.string().max(50).optional(),
      durationMonths:  z.number().int().positive(),
      discountPercent: z.number().int().min(0).max(100).default(0),
    })
  ).default([]),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;