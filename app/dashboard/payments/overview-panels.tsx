"use client"

import { useId, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpRight, Bell, ChartColumnIncreasing, ChartNoAxesColumnIncreasing, ChartPie, Clock3, Coins, CreditCard, FileText, Lightbulb, ReceiptText, Target, Users, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { budgetMonths, cashFlow, money, payables, previewDate, receivables } from "./data"
import { IconTile, panelClass, PanelHeading, Select } from "./payment-ui"

export function SummaryCards({ spent }: { spent: number }) {
  const cards = [
    { label: "Total Revenue", amount: 1245000, icon: ChartNoAxesColumnIncreasing, tone: "green" as const, change: "+12%", positive: true },
    { label: "Total Expenses", amount: spent, icon: FileText, tone: "pink" as const, change: `+${Math.round((spent / 630000 - 1) * 100)}%`, positive: false },
    { label: "Net Profit / Loss", amount: 1245000 - spent, icon: ChartPie, tone: "green" as const, change: `${1245000 - spent >= 482000 ? "+" : ""}${Math.round(((1245000 - spent) / 482000 - 1) * 100)}%`, positive: 1245000 - spent >= 482000 },
    { label: "Pending Receivables", amount: 220000, icon: Users, tone: "amber" as const, change: "+5%", positive: false },
    { label: "Upcoming Payables", amount: 195000, icon: CreditCard, tone: "pink" as const, change: "+15%", positive: false },
  ]
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
    {cards.map((card) => <section key={card.label} className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4">
      <IconTile icon={card.icon} tone={card.tone} large />
      <div className="min-w-0">
        <h2 className="text-xs font-medium leading-5">{card.label}</h2>
        <p className="mt-1 whitespace-nowrap text-lg font-bold tracking-tight 2xl:text-xl">{money(card.amount)}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground"><span className={cn("flex items-center gap-1 font-semibold", card.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}><ArrowUpRight className="size-3.5" />{card.change}</span>vs last month</p>
      </div>
    </section>)}
  </div>
}

export function IncomeExpenses({ spent }: { spent: number }) {
  const [period, setPeriod] = useState("6")
  const id = useId().replaceAll(":", "")
  const points = cashFlow.slice(-Number(period)).map((point) => point.month === "Oct 2026" ? { ...point, expenses: spent } : point)
  const maximum = Math.max(1500000, Math.ceil(spent / 300000) * 300000)
  const profit = 1245000 - spent
  const step = 540 / points.length
  const growth = Math.round((profit / 482000 - 1) * 100)
  return <section className={panelClass}>
    <PanelHeading icon={ChartColumnIncreasing} title="Income vs Expenses" description={`Monthly cash flow overview for the last ${period} months.`} action={<Select aria-label="Cash flow period" value={period} onChange={(event) => setPeriod(event.target.value)}><option value="6">Last 6 Months</option><option value="3">Last 3 Months</option></Select>} />
    <div className="mt-4 grid items-center gap-5 min-[1440px]:grid-cols-[minmax(0,1fr)_230px]">
      <div className="min-w-0">
        <div className="mb-2 flex justify-end gap-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />Income</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose-500" />Expenses</span></div>
        <svg viewBox="0 0 610 190" role="img" aria-label={`Income and expenses from ${points[0].month} to October 2026, in PKR`} className="w-full">
          <defs>
            <linearGradient id={`${id}-income`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-chart-payment-income-start)" /><stop offset="100%" stopColor="var(--color-chart-payment-income-end)" /></linearGradient>
            <linearGradient id={`${id}-expense`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-chart-payment-expense-start)" /><stop offset="100%" stopColor="var(--color-chart-payment-expense-end)" /></linearGradient>
          </defs>
          {[0, 1, 2, 3, 4, 5].map((tick) => <g key={tick}>
            <line x1="50" x2="590" y1={155 - tick * 28} y2={155 - tick * 28} stroke="var(--border)" strokeOpacity="0.65" />
            <text x="40" y={159 - tick * 28} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">{tick === 0 ? "0" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(maximum * tick / 5)}</text>
          </g>)}
          {points.map((point, index) => <g key={point.month}>
            <title>{`${point.month}: income ${money(point.income)}, expenses ${money(point.expenses)}`}</title>
            <rect x={50 + step * (index + .5) - 25} y={155 - point.income / maximum * 140} width="22" height={point.income / maximum * 140} rx="3" fill={`url(#${id}-income)`} />
            <rect x={50 + step * (index + .5) + 2} y={155 - point.expenses / maximum * 140} width="22" height={point.expenses / maximum * 140} rx="3" fill={`url(#${id}-expense)`} />
            <text x={50 + step * (index + .5)} y="176" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{point.month}</text>
          </g>)}
        </svg>
      </div>
      <div className={cn("flex items-start gap-3 rounded-xl p-4 min-[1440px]:min-h-40", profit >= 0 ? "bg-emerald-50/80 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30")}>
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-white", profit >= 0 ? "bg-emerald-600" : "bg-rose-500")}><ArrowUp className={cn("size-6", profit < 0 && "rotate-180")} /></span>
        <div><p className={cn("text-sm font-semibold", profit >= 0 ? "text-emerald-800 dark:text-emerald-400" : "text-rose-600")}>{profit >= 0 ? "Currently in Profit" : "Currently in Loss"}</p><p className="mt-1 text-2xl font-bold tracking-tight">{money(Math.abs(profit))}</p><p className="mt-1 text-[11px] text-muted-foreground">Net {profit >= 0 ? "profit" : "loss"} for Oct 2026</p><p className="mt-5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><span className={cn("flex items-center gap-1 text-xs font-semibold", growth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}><ArrowUpRight className="size-4" />{growth >= 0 ? "+" : ""}{growth}%</span>vs previous month</p></div>
      </div>
    </div>
  </section>
}

export function Reminder() {
  const due = [...receivables, ...payables].filter((payment) => payment.dueDate === previewDate).length
  const overdue = receivables.filter((payment) => payment.dueDate < previewDate).length
  return <section aria-label="Payment reminder" className="flex gap-3 rounded-xl border border-accent/10 bg-accent/10 p-4">
    <Bell className="mt-0.5 size-5 shrink-0 text-accent" />
    <div><h2 className="text-sm font-semibold text-accent">Reminder</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">You have <strong className="font-medium text-accent">{due}</strong> payments due today and <strong className="font-medium text-accent">{overdue}</strong> overdue receivables. Follow up to maintain healthy cash flow.</p></div>
  </section>
}

function BudgetMetric({ icon, label, amount, tone }: { icon: typeof Wallet; label: string; amount: number; tone: "green" | "pink" | "amber" | "blue" }) {
  return <div className="flex items-center gap-2.5 rounded-lg border border-border/70 p-2.5"><IconTile icon={icon} tone={tone} /><div className="min-w-0"><p className="text-[10px] leading-relaxed text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-semibold tracking-tight">{money(amount)}</p></div></div>
}

export function BudgetPlanner({ spent }: { spent: number }) {
  const [month, setMonth] = useState("October 2026")
  const selected = budgetMonths.find((item) => item.label === month) ?? budgetMonths[0]
  const delta = month === "October 2026" ? spent - selected.spent : 0
  const used = selected.spent + delta
  const percent = Math.round(used / selected.budget * 100)
  const projected = selected.balance - delta + selected.incoming - selected.outgoing
  const growth = Math.round(((projected / (selected.balance - delta || 1)) - 1) * 100)
  return <section className={panelClass}>
    <PanelHeading icon={Target} title="Budget Planner" description="Track your monthly budget and forecast." action={<Select aria-label="Budget month" value={month} onChange={(event) => setMonth(event.target.value)}>{budgetMonths.map((item) => <option key={item.label}>{item.label}</option>)}</Select>} />
    <div className="mt-5 flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">Monthly Budget</span><span className="font-semibold">{money(selected.budget)}</span></div>
    <div className="mt-2 flex items-center gap-3"><div role="progressbar" aria-label="Monthly budget spent" aria-valuenow={Math.min(100, percent)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${percent}% of monthly budget spent`} className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full transition-all", percent > 100 ? "bg-rose-500" : "bg-emerald-600")} style={{ width: `${Math.min(100, percent)}%` }} /></div><span className="text-[11px] font-medium">{percent}%</span></div>
    <div className="mt-4 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
      <BudgetMetric icon={ReceiptText} label="Spent Amount" amount={used} tone="pink" />
      <BudgetMetric icon={Wallet} label="Remaining Budget" amount={selected.budget - used} tone="green" />
      <BudgetMetric icon={ArrowDown} label="Expected Incoming" amount={selected.incoming} tone="blue" />
      <BudgetMetric icon={ArrowUp} label="Expected Outgoing" amount={selected.outgoing} tone="amber" />
    </div>
    <div className="mt-3 flex items-center gap-3 rounded-lg bg-emerald-50/80 p-3 dark:bg-emerald-950/30"><IconTile icon={Coins} tone="green" /><div className="flex-1"><p className="text-[11px] font-medium">Projected End of Month Balance</p><p className="mt-1 text-base font-bold text-emerald-800 dark:text-emerald-400">{money(projected)}</p></div><div className="text-right"><p className="flex items-center justify-end gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"><ArrowUpRight className="size-3.5" />{growth >= 0 ? "+" : ""}{growth}%</p><p className="mt-1 text-[9px] text-muted-foreground">vs this month</p></div></div>
  </section>
}

export function PaymentInsights({ spent, topCategory }: { spent: number; topCategory: { name: string; amount: number } }) {
  return <section className={panelClass}>
    <PanelHeading icon={Lightbulb} tone="amber" title="Payment Insights" description="Key insights for your business." />
    <div className="mt-4 grid gap-3 min-[400px]:grid-cols-2">
      <div className="flex items-center gap-3">
        <div className="relative size-20 shrink-0"><svg viewBox="0 0 80 80" role="img" aria-label="Collection rate: 78 percent" className="size-full -rotate-90"><circle cx="40" cy="40" r="33" fill="none" stroke="var(--muted)" strokeWidth="10" /><circle cx="40" cy="40" r="33" fill="none" stroke="var(--color-chart-collection)" strokeWidth="10" strokeLinecap="round" strokeDasharray="161.73 207.35" /></svg><span className="absolute inset-0 flex items-center justify-center text-base font-bold">78%</span></div>
        <div><h3 className="text-xs font-semibold">Collection Rate</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Members who paid this month</p></div>
      </div>
      <div className="flex items-start gap-3 rounded-lg border border-border/70 p-3"><IconTile icon={Users} tone="pink" /><div><p className="text-[10px] text-muted-foreground">Top Expense Category</p><p className="mt-1 text-xs font-medium">{topCategory.name}</p><p className="mt-1 text-sm font-semibold">{money(topCategory.amount)}</p></div></div>
      <BudgetMetric icon={ChartNoAxesColumnIncreasing} label="Expected Cash Balance" amount={1400000 - spent} tone="green" />
      <BudgetMetric icon={Clock3} label="Total Outstanding" amount={415000} tone="amber" />
    </div>
  </section>
}
