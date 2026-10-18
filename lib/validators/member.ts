import { z } from "zod"

export const createMemberSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().regex(
    /^(?=(?:[^0-9]*[0-9]){7})[+0-9() .-]{7,20}$/,
    "Enter a valid phone number with at least 7 digits",
  ),
  email: z.union([z.email().max(254), z.literal(""), z.null()])
    .optional().transform((value) => value || null),
  planId: z.string().trim().min(1, "Select a subscription plan"),
  durationMonths: z.number().int().min(1).max(12),
  startDate: z.iso.date("Pick a valid membership start date")
    .refine((value) => value >= "0001-01-01", "Pick a valid membership start date"),
  trainerId: z.string().trim().min(1).nullable().optional(),
  specialDiscountMinor: z.number().int().min(0).max(2147483647).default(0),
  amountReceivedMinor: z.number().int().min(0).max(2147483647).default(0),
  paymentDate: z.iso.date().refine((value) => value >= "0001-01-01").optional(),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "upi", "mobile_wallet", "other"]).default("other"),
}).refine((value) => value.amountReceivedMinor === 0 || !!value.paymentDate, {
  message: "Payment date is required when an amount is received",
  path: ["paymentDate"],
})

export type CreateMemberInput = z.input<typeof createMemberSchema>
