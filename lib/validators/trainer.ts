// lib/validators/trainer.ts
import { z } from "zod";
import { contractorSessionsSchema, trainerAvailabilitySchema } from "@/lib/trainer-availability";

export const MAX_SPECIALIZATIONS = 3;

const baseTrainerSchema = {
  fullName:      z.string().trim().min(1, "Name is required").max(100),
  email:         z.string().trim().pipe(z.email("Enter a valid email address").max(254)),
  contactNumber: z.string().trim().min(1, "Contact number is required").max(20),
  // Contract start date for contractors, joining date for staff.
  joiningDate:   z.iso.date("Pick a valid date"),
};

/* Staff are on payroll: salary, schedule, and what they are qualified to coach. */
const staffTrainerSchema = z.object({
  ...baseTrainerSchema,
  trainerType:     z.literal("STAFF"),
  monthlySalary:   z.number().positive("Salary must be greater than zero").max(21474836.47),
  availability:   trainerAvailabilitySchema,
  shift:           z.enum(["MORNING", "EVENING", "NIGHT", "FLEXIBLE"]),

  specializations: z
    .array(z.string().trim().min(1).max(60))
    .min(1, "Add at least one specialization")
    .max(MAX_SPECIALIZATIONS, `Pick at most ${MAX_SPECIALIZATIONS} specializations`)
    .refine((values) => new Set(values.map((value) => value.toLowerCase())).size === values.length,
      "Each specialization must be unique"),
  certifications: z.array(z.string().trim().min(1).max(120)).default([]),
});

/* Contractors pay the gym — either a flat monthly fee or a per-session rate. */
const contractorTrainerSchema = z.object({
  ...baseTrainerSchema,
  trainerType:     z.literal("CONTRACTOR"),
  paymentType:     z.enum(["FIXED_FEE", "SESSION_BASED"]),
  amount:          z.number().positive("Amount must be greater than zero").max(21474836.47),
  sessions:       contractorSessionsSchema,
});

export const createTrainerSchema = z.discriminatedUnion("trainerType", [
  staffTrainerSchema,
  contractorTrainerSchema,
]);

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;

// Editing uses the same complete form and validation as creation.
export const updateTrainerSchema = createTrainerSchema;
