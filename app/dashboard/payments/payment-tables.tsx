"use client"

import { useState } from "react"
import { FileText, MoreVertical, ReceiptText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { categories, dateLabel, money, paymentStatus } from "./data"
import type { ExpenseSummary as Expense, OutstandingPayment as Payment, PaymentReceipt } from "@/lib/payments"
import { panelClass, PanelHeading, Select, StatusBadge } from "./payment-ui"

const tableClass = "w-full whitespace-nowrap text-left text-[10px] [&_th]:pb-2 [&_th]:pr-3 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-t [&_td]:border-border/60 [&_td]:py-2.5 [&_td]:pr-3 [&_td:last-child]:pr-0 [&_th:last-child]:pr-0"

function PaymentTable({ rows, payable, currency, today }: { rows: Payment[]; payable: boolean; currency: string; today: string }) {
  return <div className="overflow-x-auto"><table className={tableClass}>
    <caption className="sr-only">{payable ? "Upcoming payments to vendors" : "Pending payments from members"}</caption>
    <thead><tr><th scope="col">{payable ? "Vendor / Category" : "Member"}</th><th scope="col">Description</th><th scope="col">Amount</th><th scope="col">Due Date</th><th scope="col">Status</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={row.id} className="transition-colors hover:bg-muted/40"><td className="font-medium">{row.name}</td><td className="text-muted-foreground">{row.description}</td><td className="tabular-nums">{money(row.amountMinor, currency)}</td><td className={row.dueDate && row.dueDate <= today ? "text-rose-500" : "text-muted-foreground"}>{dateLabel(row.dueDate)}</td><td><StatusBadge status={paymentStatus(row.dueDate, today)} /></td></tr>)}</tbody>
  </table>{!rows.length && <p className="py-6 text-center text-xs text-muted-foreground">No outstanding {payable ? "expenses" : "membership balances"}.</p>}</div>
}

export function PaymentsTableCard({ rows, payable = false, currency, today }: { rows: Payment[]; payable?: boolean; currency: string; today: string }) {
  const [open, setOpen] = useState(false)
  const title = payable ? "Payables (To Pay)" : "Receivables (To Receive)"
  return <>
    <section className={panelClass}>
      <PanelHeading icon={ReceiptText} tone={payable ? "pink" : "green"} title={title} description={`${rows.length} ${payable ? "upcoming" : "pending"} payments`} action={<Button variant="outline" size="sm" onClick={() => setOpen(true)}>View All</Button>} />
      <div className="mt-4"><PaymentTable rows={rows.slice(0, 5)} payable={payable} currency={currency} today={today} /></div>
    </section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{rows.length} payments · Total {money(rows.reduce((sum, row) => sum + row.amountMinor, 0), currency)}</DialogDescription></DialogHeader><div className="max-h-[65vh] overflow-y-auto"><PaymentTable rows={rows} payable={payable} currency={currency} today={today} /></div></DialogContent></Dialog>
  </>
}

export function RecentExpenses({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [month, setMonth] = useState("")
  const [selected, setSelected] = useState<Expense | null>(null)
  const filtered = expenses.filter((row) => `${row.title} ${row.category} ${row.method}`.toLowerCase().includes(search.trim().toLowerCase()) && (!category || row.category === category) && (!status || row.status === status) && (!month || row.date.startsWith(month)))
  return <>
    <section className={panelClass}>
      <PanelHeading icon={FileText} title="Recent Expenses" description="Track and manage your business expenses." action={<div className="flex flex-wrap items-center gap-2">
        <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><input type="search" aria-label="Search expenses" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search expenses..." className="h-8 w-44 rounded-lg border bg-card pl-8 pr-3 text-xs outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20" /></div>
        <Select aria-label="Expense category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Category</option>{categories.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label="Expense status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Status</option><option>Paid</option><option>Pending</option></Select>
        <Select aria-label="Expense month" value={month} onChange={(event) => setMonth(event.target.value)}><option value="">All months</option>{[...new Set(expenses.map((expense) => expense.date.slice(0, 7)))].sort().reverse().map((value) => <option key={value} value={value}>{value}</option>)}</Select>
      </div>} />
      <div className="mt-4 overflow-x-auto"><table className={tableClass}>
        <caption className="sr-only">Recorded expenses</caption>
        <thead><tr>{["#", "Expense Title", "Category", "Amount", "Date", "Status", "Payment Method", "Actions"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{filtered.map((expense, index) => <tr key={expense.id} className="transition-colors hover:bg-muted/40"><td className="text-muted-foreground">{index + 1}</td><td className="font-medium">{expense.title}</td><td className="text-muted-foreground">{expense.category}</td><td className="tabular-nums">{money(expense.amountMinor, currency)}</td><td className="text-muted-foreground">{dateLabel(expense.date)}</td><td><StatusBadge status={expense.status} /></td><td className="text-muted-foreground">{expense.method}</td><td><Button variant="ghost" size="icon-xs" aria-label={`View ${expense.title} details`} onClick={() => setSelected(expense)}><MoreVertical className="size-4" /></Button></td></tr>)}</tbody>
      </table>{!filtered.length && <p role="status" className="py-10 text-center text-sm text-muted-foreground">No expenses match your filters.</p>}</div>
      <p className="mt-3 border-t pt-3 text-[11px] text-muted-foreground">Showing {filtered.length} of {expenses.length} expenses</p>
    </section>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null) }}><DialogContent><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>Recorded expense details</DialogDescription></DialogHeader>{selected && <dl className="space-y-3 text-sm">{[["Category", selected.category], ["Amount", money(selected.amountMinor, currency)], ["Date", dateLabel(selected.date)], ["Status", selected.status], ["Payment Method", selected.method]].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl>}</DialogContent></Dialog>
  </>
}

export function ReceivedPayments({ receipts, currency }: { receipts: PaymentReceipt[]; currency: string }) {
  const [search, setSearch] = useState("")
  const [showAll, setShowAll] = useState(false)
  const filtered = receipts.filter((row) => `${row.memberName} ${row.description}`.toLowerCase().includes(search.trim().toLowerCase()))
  const visible = showAll ? filtered : filtered.slice(0, 10)
  return <section className={panelClass}>
    <PanelHeading icon={ReceiptText} title="Member Payments" description="Payments received when adding members, including refunds." action={<input type="search" aria-label="Search member payments" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member payments…" className="h-8 rounded-lg border bg-card px-3 text-xs" />} />
    <div className="mt-4 overflow-x-auto"><table className={tableClass}>
      <thead><tr>{["Member", "Membership", "Amount", "Date", "Type", "Method"].map((label) => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{visible.map((row) => <tr key={row.id}><td className="font-medium">{row.memberName}</td><td>{row.description}</td><td className="tabular-nums">{money(row.kind === "Refund" ? -row.amountMinor : row.amountMinor, currency)}</td><td>{dateLabel(row.date)}</td><td>{row.kind}</td><td>{row.method}</td></tr>)}</tbody>
    </table>{!visible.length && <p className="py-8 text-center text-sm text-muted-foreground">No member payments found.</p>}</div>
    {filtered.length > 10 && <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setShowAll(!showAll)}>{showAll ? "Show recent payments" : `View all ${filtered.length} payments`}</Button>}
  </section>
}
