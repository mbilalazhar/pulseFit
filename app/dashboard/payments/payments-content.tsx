"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Download, Loader2, Plus } from "lucide-react"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Button } from "@/components/ui/button"
import { getPayments } from "@/lib/services/payment.services"
import { ExpenseDialog } from "./expense-dialog"
import { CashOutlook, IncomeExpenses, PaymentInsights, Reminder, SummaryCards } from "./overview-panels"
import { PaymentsTableCard, ReceivedPayments, RecentExpenses } from "./payment-tables"
import { Select } from "./payment-ui"

export function PaymentsContent() {
  const [currency, setCurrency] = useState("PKR")
  const [addingExpense, setAddingExpense] = useState(false)
  const query = useQuery({
    queryKey: ["payments", currency], queryFn: () => getPayments(currency),
    refetchOnMount: "always", refetchOnWindowFocus: true, refetchInterval: 30_000,
  })
  const data = query.data

  function exportReport() {
    if (!data) return
    const rows: (string | number)[][] = [
      ["PulseFit Payments Report", `As of ${data.today}`, data.currency],
      ["Total Revenue", data.totals.revenueMinor / 100], ["Total Expenses Paid", data.totals.expensesMinor / 100], ["Net Profit / Loss", data.totals.netMinor / 100],
      ["Pending Receivables", data.totals.receivablesMinor / 100], ["Upcoming Payables", data.totals.payablesMinor / 100], [],
      ["Member", "Membership", "Amount", "Date", "Type", "Method"],
      ...data.receipts.map((row) => [row.memberName, row.description, (row.kind === "Refund" ? -row.amountMinor : row.amountMinor) / 100, row.date, row.kind, row.method]), [],
      ["Receivable", "Description", "Amount", "Due Date"], ...data.receivables.map((row) => [row.name, row.description, row.amountMinor / 100, row.dueDate ?? "Not set"]), [],
      ["Payable", "Description", "Amount", "Due Date"], ...data.payables.map((row) => [row.name, row.description, row.amountMinor / 100, row.dueDate ?? "Not set"]), [],
      ["Expense Title", "Category", "Amount", "Date", "Status", "Payment Method"],
      ...data.expenses.map((expense) => [expense.title, expense.category, expense.amountMinor / 100, expense.date, expense.status, expense.method]),
    ]
    const csv = rows.map((row) => row.map((value) => {
      const cell = typeof value === "string" && /^[=+@\-\t\r\n]/.test(value) ? `'${value}` : String(value)
      return `"${cell.replaceAll('"', '""')}"`
    }).join(",")).join("\r\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `pulsefit-payments-${data.currency}-${data.today}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="mx-auto w-full max-w-[1800px] space-y-4">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><h1 className="font-heading text-2xl font-bold tracking-tight">Payments</h1><p className="mt-1 text-sm text-muted-foreground">Manage revenue, expenses, and cash flow for your gym.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <Select aria-label="Payment currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>{(data?.currencies ?? [currency]).map((value) => <option key={value}>{value}</option>)}</Select>
        <DashboardHeaderButton icon={Download} text="Export Report" bgColor="transparent" disabled={!data || query.isError} onClick={exportReport} />
        <DashboardHeaderButton icon={Plus} text="Add Expense" bgColor="primary" disabled={!data} aria-haspopup="dialog" onClick={() => setAddingExpense(true)} />
      </div>
    </header>
    {query.isPending && <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading payment records…</p>}
    {query.isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"><p>{data ? "Could not refresh payments. Showing the last loaded records." : query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Try again</Button></div>}
    {data && <>
      <SummaryCards data={data} />
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,2.2fr)_minmax(340px,1fr)]">
        <div className="min-w-0 space-y-3">
          <IncomeExpenses data={data} />
          <ReceivedPayments receipts={data.receipts} currency={currency} />
          <div className="grid gap-3 min-[1440px]:grid-cols-2">
            <PaymentsTableCard rows={data.receivables} currency={currency} today={data.today} />
            <PaymentsTableCard rows={data.payables} currency={currency} today={data.today} payable />
          </div>
          <RecentExpenses expenses={data.expenses} currency={currency} />
        </div>
        <aside className="min-w-0 space-y-3"><Reminder data={data} /><CashOutlook data={data} /><PaymentInsights data={data} /></aside>
      </div>
      {addingExpense && <ExpenseDialog open onOpenChange={setAddingExpense} currency={currency} today={data.today} />}
    </>}
  </div>
}
