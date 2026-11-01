import { z } from "zod"

const dateSchema = z.iso.date().refine((value) => value >= "1900-01-01" && value <= "9998-12-31")
export const memberEditSchema = z.object({
  revision: z.string().min(1),
  name: z.string().trim().min(1, "Enter the member's name").max(120),
  phone: z.string().trim().regex(/^(?=(?:[^0-9]*[0-9]){7})[+0-9() .-]{7,20}$/, "Enter a valid phone number"),
  email: z.union([z.email().max(254), z.literal("")]).transform((value) => value || null),
  trainerId: z.string().min(1).nullable(),
  membership: z.object({
    planId: z.string().min(1), durationMonths: z.number().int().min(1).max(12), startDate: dateSchema,
    discountMinor: z.number().int().min(0).max(2147483647), additionalChargeMinor: z.number().int().min(0).max(2147483647),
    sessionsPerWeek: z.number().int().min(1).max(21).nullable(),
    sessionDurationMinutes: z.number().int().min(1).max(1440).nullable(), paymentDueDate: dateSchema.nullable(),
  }).nullable(),
  payments: z.array(z.object({
    id: z.string().min(1), amountMinor: z.number().int().positive().max(2147483647),
    date: dateSchema, method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "OTHER"]),
  })),
  confirmed: z.literal(true).optional(),
  reviewToken: z.string().min(1).optional(),
})
export type MemberEditInput = z.input<typeof memberEditSchema>
export type MemberEditValues = z.output<typeof memberEditSchema>
export type MemberEditData = {
  id: string; revision: string; name: string; phone: string; email: string; status: string; today: string
  trainerId: string | null; trainerName: string | null
  membership: (NonNullable<MemberEditInput["membership"]> & {
    id: string; planName: string; priceMinor: number; finalMinor: number; currency: string; endDate: string
  }) | null
  payments: (MemberEditInput["payments"][number] & { kind: string; currency: string })[]
}
export type MemberChange = { field: string; before: string; after: string }
export type MemberEditResult = { requiresConfirmation: true; reviewToken: string; changes: MemberChange[] } | { saved: true } | { unchanged: true }
