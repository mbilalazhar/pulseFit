import { dateInTimeZone } from "@/lib/member-status"

type ReceiptRecord = {
  id: string; memberSubscriptionId: string; amountMinor: number; currency: string; kind: string
  method: string; paidAt: Date; member: { name: string }; subscription: { planNameSnapshot: string }
}
type SubscriptionRecord = {
  id: string; finalMinor: number; currency: string; status: string; paymentDueDate: Date | null
  member: { name: string }; planNameSnapshot: string
}
type ExpenseRecord = {
  id: string; title: string; category: string; amountMinor: number; currency: string
  date: Date; status: string; method: string
}
export type OutstandingPayment = { id: string; name: string; description: string; amountMinor: number; dueDate: string | null }
export type ExpenseSummary = Omit<ExpenseRecord, "date" | "status"> & { date: string; status: "Paid" | "Pending" }
export type PaymentReceipt = { id: string; memberName: string; description: string; amountMinor: number; date: string; method: string; kind: "Payment" | "Refund" }
export type CashFlowMonth = { month: string; label: string; incomeMinor: number; expensesMinor: number }
const calendarDate = (date: Date) => date.toISOString().slice(0, 10)

/** Derive financial totals from the ledger, keeping all arithmetic in minor units. */
export function buildPaymentsOverview(input: {
  payments: ReceiptRecord[]; subscriptions: SubscriptionRecord[]; expenses: ExpenseRecord[]
  timeZone: string; currency?: string; now?: Date
}) {
  const today = dateInTimeZone(input.timeZone, input.now ?? new Date())
  const currencies = [...new Set(["PKR", ...input.payments.map((item) => item.currency), ...input.subscriptions.map((item) => item.currency), ...input.expenses.map((item) => item.currency)])].sort()
  const currency = input.currency ?? "PKR"
  if (!currencies.includes(currency)) currencies.push(currency)
  // Payment entry stores the selected calendar date at UTC midnight, as membership dates do.
  const payments = input.payments.filter((item) => item.currency === currency && calendarDate(item.paidAt) <= today)
  const expenses = input.expenses.filter((item) => item.currency === currency).map<ExpenseSummary>((item) => ({
    ...item, date: calendarDate(item.date), status: item.status === "PAID" ? "Paid" : "Pending",
  })).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
  const signedAmount = (item: ReceiptRecord) => item.kind === "REFUND" ? -item.amountMinor : item.amountMinor
  const paidBySubscription = new Map<string, number>()
  for (const payment of payments) paidBySubscription.set(payment.memberSubscriptionId, (paidBySubscription.get(payment.memberSubscriptionId) ?? 0) + signedAmount(payment))
  const subscriptions = input.subscriptions.filter((item) => item.currency === currency && item.status !== "CANCELLED")
  const receivables: OutstandingPayment[] = subscriptions.flatMap((item) => {
    const amountMinor = Math.max(0, item.finalMinor - (paidBySubscription.get(item.id) ?? 0))
    return amountMinor ? [{ id: item.id, name: item.member.name, description: item.planNameSnapshot, amountMinor, dueDate: item.paymentDueDate ? calendarDate(item.paymentDueDate) : null }] : []
  }).sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.name.localeCompare(b.name))
  const payables: OutstandingPayment[] = expenses.filter((item) => item.status === "Pending").map((item) => ({
    id: item.id, name: item.title, description: item.category, amountMinor: item.amountMinor, dueDate: item.date,
  })).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
  const paidExpenses = expenses.filter((item) => item.status === "Paid" && item.date <= today)
  const revenueMinor = payments.reduce((sum, item) => sum + signedAmount(item), 0)
  const expensesMinor = paidExpenses.reduce((sum, item) => sum + item.amountMinor, 0)
  const receivablesMinor = receivables.reduce((sum, item) => sum + item.amountMinor, 0)
  const payablesMinor = payables.reduce((sum, item) => sum + item.amountMinor, 0)
  const cashFlow: CashFlowMonth[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${today.slice(0, 7)}-01T00:00:00Z`)
    date.setUTCMonth(date.getUTCMonth() - 5 + index)
    const month = calendarDate(date).slice(0, 7)
    return { month, label: date.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }),
      incomeMinor: payments.filter((item) => calendarDate(item.paidAt).startsWith(month)).reduce((sum, item) => sum + signedAmount(item), 0),
      expensesMinor: paidExpenses.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amountMinor, 0),
    }
  })
  const categoryTotals = paidExpenses.reduce<Record<string, number>>((totals, item) => {
    totals[item.category] = (totals[item.category] ?? 0) + item.amountMinor
    return totals
  }, {})
  const [category, amountMinor] = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] ?? ["No paid expenses", 0]
  const invoicedMinor = subscriptions.reduce((sum, item) => sum + item.finalMinor, 0)
  const collectedMinor = subscriptions.reduce((sum, item) => sum + Math.min(item.finalMinor, Math.max(0, paidBySubscription.get(item.id) ?? 0)), 0)
  const receipts = payments.map<PaymentReceipt>((item) => ({
    id: item.id, memberName: item.member.name, description: item.subscription.planNameSnapshot,
    amountMinor: item.amountMinor, date: calendarDate(item.paidAt), method: item.method.replaceAll("_", " "), kind: item.kind === "REFUND" ? "Refund" : "Payment",
  })).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id))
  return {
    today, timeZone: input.timeZone, currency, currencies, receipts, receivables, payables, expenses, cashFlow,
    totals: { revenueMinor, expensesMinor, netMinor: revenueMinor - expensesMinor, receivablesMinor, payablesMinor },
    insights: { collectionRate: invoicedMinor ? Math.round(collectedMinor / invoicedMinor * 100) : null,
      topCategory: { name: category, amountMinor }, projectedMinor: revenueMinor - expensesMinor + receivablesMinor - payablesMinor },
    reminder: { dueToday: [...receivables, ...payables].filter((item) => item.dueDate === today).length,
      overdue: receivables.filter((item) => item.dueDate && item.dueDate < today).length },
  }
}
export type PaymentsOverview = ReturnType<typeof buildPaymentsOverview>
