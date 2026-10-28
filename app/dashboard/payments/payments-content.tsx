"use client"

import { useState } from "react"
import { Download, Plus } from "lucide-react"
import { toast } from "sonner"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { initialExpenses, payables, receivables, type Expense } from "./data"
import { ExpenseDialog } from "./expense-dialog"
import { BudgetPlanner, IncomeExpenses, PaymentInsights, Reminder, SummaryCards } from "./overview-panels"
import { PaymentsTableCard, RecentExpenses } from "./payment-tables"

export function PaymentsContent() {
  const [expenses, setExpenses] = useState(initialExpenses)
  const [addingExpense, setAddingExpense] = useState(false)
  const spent = expenses.filter((expense) => expense.status === "Paid").reduce((sum, expense) => sum + expense.amount, 0)
  const categoryTotals = expenses.filter((expense) => expense.status === "Paid").reduce<Record<string, number>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
    return totals
  }, {})
  const [topName, topAmount] = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] ?? ["None", 0]

  function addExpense(expense: Expense) {
    setExpenses((current) => [expense, ...current])
    toast.success("Expense added to this preview.")
  }

  function exportReport() {
    const rows: (string | number)[][] = [
      ["PulseFit Payments — Sample Report", "October 2026"],
      ["Total Revenue (PKR)", 1245000], ["Total Expenses Paid (PKR)", spent], ["Net Profit (PKR)", 1245000 - spent],
      ["Pending Receivables (PKR)", 220000], ["Upcoming Payables (PKR)", 195000], [],
      ["Expense Title", "Category", "Amount (PKR)", "Date", "Status", "Payment Method"],
      ...expenses.map((expense) => [expense.title, expense.category, expense.amount, expense.date, expense.status, expense.method]),
    ]
    const csv = rows.map((row) => row.map((value) => {
      const cell = typeof value === "string" && /^[=+@\-\t\r\n]/.test(value) ? `'${value}` : String(value)
      return `"${cell.replaceAll('"', '""')}"`
    }).join(",")).join("\r\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "pulsefit-payments-sample-october-2026.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="mx-auto w-full max-w-[1800px] space-y-4">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div><div className="flex items-center gap-3"><h1 className="font-heading text-2xl font-bold tracking-tight">Payments</h1><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">Sample data</span></div><p className="mt-1 text-sm text-muted-foreground">Manage revenue, expenses, and cash flow for your gym.</p></div>
      <div className="flex flex-wrap gap-3"><DashboardHeaderButton icon={Download} text="Export Report" bgColor="transparent" onClick={exportReport} /><DashboardHeaderButton icon={Plus} text="Add Expense" bgColor="primary" aria-haspopup="dialog" onClick={() => setAddingExpense(true)} /></div>
    </header>

    <SummaryCards spent={spent} />

    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,2.2fr)_minmax(340px,1fr)]">
      <div className="min-w-0 space-y-3">
        <IncomeExpenses spent={spent} />
        <div className="grid gap-3 min-[1440px]:grid-cols-2">
          <PaymentsTableCard rows={receivables} />
          <PaymentsTableCard rows={payables} payable />
        </div>
        <RecentExpenses expenses={expenses} />
      </div>
      <aside className="min-w-0 space-y-3">
        <Reminder />
        <BudgetPlanner spent={spent} />
        <PaymentInsights spent={spent} topCategory={{ name: topName, amount: topAmount }} />
      </aside>
    </div>

    <ExpenseDialog open={addingExpense} onOpenChange={setAddingExpense} onAdd={addExpense} />
  </div>
}
