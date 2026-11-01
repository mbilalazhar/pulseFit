import type { PaymentsOverview } from "@/lib/payments"
import type { CreateExpenseInput } from "@/lib/validators/expense"

async function responseData<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message ?? "Could not update payments. Please try again.")
  return data as T
}
export async function getPayments(currency: string): Promise<PaymentsOverview> {
  return responseData(await fetch(`/api/payments?currency=${encodeURIComponent(currency)}`, { cache: "no-store" }))
}
export async function createExpense(input: CreateExpenseInput): Promise<{ expense: { id: string } }> {
  return responseData(await fetch("/api/payments/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }))
}
