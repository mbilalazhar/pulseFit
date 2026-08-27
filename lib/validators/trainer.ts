// lib/validators/trainer.ts
import { z } from "zod";

export const MAX_SPECIALIZATIONS = 3;

const baseTrainerSchema = {
  fullName:      z.string().min(1, "Name is required").max(100),
  email:         z.email("Enter a valid email address"),
  contactNumber: z.string().min(1, "Contact number is required").max(20),
  // Contract start date for contractors, joining date for staff.
  joiningDate:   z.iso.date("Pick a valid date"),
};

/* Staff are on payroll: salary, schedule, and what they are qualified to coach. */
const staffTrainerSchema = z.object({
  ...baseTrainerSchema,
  trainerType:     z.literal("STAFF"),
  monthlySalary:   z.number().positive("Salary must be greater than zero"),
  workHoursPerDay: z.number().positive().max(24),
  workDaysPerWeek: z.number().int().min(1).max(7),
  shift:           z.enum(["MORNING", "EVENING", "NIGHT", "FLEXIBLE"]),

  specializations: z
    .array(z.string().min(1).max(60))
    .min(1, "Add at least one specialization")
    .max(MAX_SPECIALIZATIONS, `Pick at most ${MAX_SPECIALIZATIONS} specializations`),
  certifications: z.array(z.string().min(1).max(120)).default([]),
});

/* Contractors pay the gym — either a flat monthly fee or a per-session rate. */
const contractorTrainerSchema = z.object({
  ...baseTrainerSchema,
  trainerType:     z.literal("CONTRACTOR"),
  paymentType:     z.enum(["FIXED_FEE", "SESSION_BASED"]),
  amount:          z.number().positive("Amount must be greater than zero"),
  sessionsPerWeek: z.number().int().positive("Sessions per week must be greater than zero").max(21),
});

export const createTrainerSchema = z.discriminatedUnion("trainerType", [
  staffTrainerSchema,
  contractorTrainerSchema,
]);

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;
