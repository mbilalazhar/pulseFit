import { expenseCategories } from "@/lib/validators/expense"

export const categories = expenseCategories
export const money = (amountMinor: number, currency: string) => `${currency} ${(amountMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
export const dateLabel = (date: string | null) => date ? new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "Not set"
export function paymentStatus(date: string | null, today: string) {
  return !date ? "No due date" : date < today ? "Overdue" : date === today ? "Due Today" : "Upcoming"
}
