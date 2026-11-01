"use client"

import { useId, useState } from "react"
import { Bell, ChartColumnIncreasing, ChartNoAxesColumnIncreasing, ChartPie, CreditCard, FileText, Lightbulb, Users, Wallet } from "lucide-react"
import type { PaymentsOverview } from "@/lib/payments"
import { money } from "./data"
import { IconTile, panelClass, PanelHeading, Select } from "./payment-ui"

type Props = { data: PaymentsOverview }

export function SummaryCards({ data }: Props) {
  const { totals, currency } = data
  const cards = [
    { label: "Total Revenue", amount: totals.revenueMinor, icon: ChartNoAxesColumnIncreasing, tone: "green" as const, detail: "All received payments, less refunds" },
    { label: "Total Expenses", amount: totals.expensesMinor, icon: FileText, tone: "pink" as const, detail: "All paid expenses" },
    { label: "Net Profit / Loss", amount: totals.netMinor, icon: ChartPie, tone: "green" as const, detail: "Received revenue less paid expenses" },
    { label: "Pending Receivables", amount: totals.receivablesMinor, icon: Users, tone: "amber" as const, detail: "Unpaid membership balances" },
    { label: "Upcoming Payables", amount: totals.payablesMinor, icon: CreditCard, tone: "pink" as const, detail: "Expenses awaiting payment" },
  ]
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
    {cards.map((card) => <section key={card.label} className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4">
      <IconTile icon={card.icon} tone={card.tone} large />
      <div className="min-w-0"><h2 className="text-xs font-medium leading-5">{card.label}</h2><p className="mt-1 break-words text-lg font-bold tracking-tight 2xl:text-xl">{money(card.amount, currency)}</p><p className="mt-2 text-[10px] text-muted-foreground">{card.detail}</p></div>
    </section>)}
  </div>
}

export function IncomeExpenses({ data }: Props) {
  const [period, setPeriod] = useState("6")
  const id = useId().replaceAll(":", "")
  const points = data.cashFlow.slice(-Number(period))
  const maximum = Math.max(100, ...points.flatMap((point) => [point.incomeMinor, point.expensesMinor]))
  const minimum = Math.min(0, ...points.map((point) => point.incomeMinor))
  const y = (amount: number) => 155 - (amount - minimum) / (maximum - minimum) * 140
  const zero = y(0)
  const step = 540 / points.length
  const current = data.cashFlow.at(-1)!
  const profit = current.incomeMinor - current.expensesMinor
  return <section className={panelClass}>
    <PanelHeading icon={ChartColumnIncreasing} title="Income vs Expenses" description={`Recorded monthly cash flow in ${data.currency}.`} action={<Select aria-label="Cash flow period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="6">Last 6 Months</option><option value="3">Last 3 Months</option></Select>} />
    <div className="mt-4 grid items-center gap-5 min-[1440px]:grid-cols-[minmax(0,1fr)_230px]">
      <div className="min-w-0">
        <div className="mb-2 flex justify-end gap-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Income</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" />Expenses</span></div>
        <svg viewBox="0 0 610 190" role="img" aria-label={`Income and expenses from ${points[0].label} to ${current.label}, in ${data.currency}`} className="w-full">
          <defs>
            <linearGradient id={`${id}-income`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-chart-payment-income-start)" /><stop offset="100%" stopColor="var(--color-chart-payment-income-end)" /></linearGradient>
            <linearGradient id={`${id}-expense`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-chart-payment-expense-start)" /><stop offset="100%" stopColor="var(--color-chart-payment-expense-end)" /></linearGradient>
          </defs>
          {[0, 1, 2, 3, 4, 5].map((tick) => <g key={tick}>
            <line x1="50" x2="590" y1={155 - tick * 28} y2={155 - tick * 28} stroke="var(--border)" strokeOpacity="0.65" />
            <text x="40" y={159 - tick * 28} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format((minimum + (maximum - minimum) * tick / 5) / 100)}</text>
          </g>)}
          <line x1="50" x2="590" y1={zero} y2={zero} stroke="var(--muted-foreground)" strokeOpacity="0.5" />
          {points.map((point, index) => <g key={point.month}>
            <title>{`${point.label}: income ${money(point.incomeMinor, data.currency)}, expenses ${money(point.expensesMinor, data.currency)}`}</title>
            <rect x={50 + step * (index + .5) - 25} y={Math.min(zero, y(point.incomeMinor))} width="22" height={Math.abs(y(point.incomeMinor) - zero)} rx="3" fill={`url(#${id}-income)`} />
            <rect x={50 + step * (index + .5) + 2} y={y(point.expensesMinor)} width="22" height={zero - y(point.expensesMinor)} rx="3" fill={`url(#${id}-expense)`} />
            <text x={50 + step * (index + .5)} y="176" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{point.label}</text>
          </g>)}
        </svg>
      </div>
      <div className="space-y-2 rounded-xl bg-muted/50 p-4"><p className="text-sm font-semibold">{current.label}</p><p className="text-2xl font-bold tracking-tight">{money(profit, data.currency)}</p><p className="text-xs text-muted-foreground">Net received income less paid expenses this month.</p></div>
    </div>
  </section>
}

export function Reminder({ data }: Props) {
  return <section aria-label="Payment reminder" className="flex gap-3 rounded-xl border border-accent/10 bg-accent/10 p-4"><Bell className="mt-0.5 size-5 shrink-0 text-accent" /><div><h2 className="text-sm font-semibold text-accent">Reminder</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">You have <strong>{data.reminder.dueToday}</strong> payments due today and <strong>{data.reminder.overdue}</strong> overdue receivables. Balances without a due date remain listed under receivables.</p></div></section>
}

export function CashOutlook({ data }: Props) {
  return <section className={panelClass}>
    <PanelHeading icon={Wallet} title="Cash Outlook" description="Based on recorded payments and outstanding balances." />
    <dl className="mt-4 space-y-3 text-xs">{[
      ["Revenue less paid expenses", data.totals.netMinor], ["Outstanding incoming", data.totals.receivablesMinor], ["Outstanding outgoing", data.totals.payablesMinor],
    ].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{money(Number(value), data.currency)}</dd></div>)}</dl>
    <div className="mt-4 rounded-lg bg-muted/50 p-3"><p className="text-xs font-medium">After all outstanding amounts are settled</p><p className="mt-1 text-lg font-bold">{money(data.insights.projectedMinor, data.currency)}</p><p className="mt-2 text-[11px] text-muted-foreground">Estimate assuming all receivables are collected and pending expenses are paid. Excludes opening bank balances.</p></div>
  </section>
}

export function PaymentInsights({ data }: Props) {
  const rate = data.insights.collectionRate
  return <section className={panelClass}>
    <PanelHeading icon={Lightbulb} tone="amber" title="Payment Insights" description="Calculated from your saved records." />
    <div className="mt-4 grid gap-3 min-[400px]:grid-cols-2">
      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Membership collection rate</p><p className="mt-2 text-2xl font-bold">{rate === null ? "—" : `${rate}%`}</p><p className="mt-1 text-[11px] text-muted-foreground">{rate === null ? "No membership charges yet" : "Amount collected against membership charges, after refunds"}</p></div>
      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Top Expense Category</p><p className="mt-2 text-sm font-semibold">{data.insights.topCategory.name}</p><p className="mt-1 text-sm">{money(data.insights.topCategory.amountMinor, data.currency)}</p></div>
    </div>
  </section>
}
