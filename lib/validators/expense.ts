import { z } from "zod"

export const expenseCategories = ["Rent", "Salaries", "Utilities", "Marketing", "Maintenance", "Equipment", "Other"] as const
export const expenseMethods = ["Bank Transfer", "Cash", "JazzCash", "Easypaisa", "Card", "Other"] as const
export const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Enter an expense title").max(100),
  category: z.enum(expenseCategories),
  amountMinor: z.number().int().positive().max(2147483647),
  currency: z.string().regex(/^[A-Z]{3}$/),
  date: z.iso.date().refine((date) => date >= "1900-01-01" && date <= "9998-12-31"),
  status: z.enum(["PAID", "PENDING"]),
  method: z.enum(expenseMethods),
})
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
