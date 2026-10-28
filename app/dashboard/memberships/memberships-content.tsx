"use client"

import { useState } from "react"
import {
  CreditCard, CalendarDays, ArrowUp, ArrowRight, RefreshCw, Wallet,
  Crown, Users, UserRound, ShieldCheck, Building2, ChartNoAxesColumnIncreasing,
  Star, Layers, Box, Gem, FileText, Download, Puzzle, Smartphone,
  Lightbulb, TrendingUp, Sparkles, CircleAlert, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { plans, invoices, addons, money } from "./data"
import { Features, Panel, Status } from "./membership-ui"

const accentButton = "bg-accent text-white hover:bg-accent/90"
const usage = [
  { label: "Members", used: 312, limit: 400, percent: 78, icon: Users },
  { label: "Trainers", used: 14, limit: 20, percent: 70, icon: UserRound },
  { label: "Admin accounts", used: 3, limit: 5, percent: 60, icon: ShieldCheck },
  { label: "Branches", used: 1, limit: 2, percent: 50, icon: Building2 },
]
const addonIcons = [Users, Building2, Smartphone, ChartNoAxesColumnIncreasing]
const planIcons = [Box, Crown, Gem]
const recommendedFeatures = ["Up to 1,000 members", "Multiple branches", "10 admin accounts", "Advanced analytics & AI insights", "Priority support", "White-label mobile app (optional)"]

function downloadInvoice(invoice: typeof invoices[number]) {
  const content = `PULSEFIT — SAMPLE INVOICE\n\nInvoice: ${invoice.number}\nDate: ${invoice.date}\nPlan: Pro Plan (monthly)\nAmount: ${money(invoice.amount)}\nStatus: ${invoice.status}\n\nStatic demonstration data. This is not a payment receipt.`
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = `sample-${invoice.number}.txt`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function InvoiceTable() {
  return <div className="overflow-x-auto rounded-lg border border-border/60">
    <table className="w-full whitespace-nowrap text-left text-[10px]">
      <thead className="bg-muted/60"><tr>{["Date", "Invoice #", "Amount", "Status", "Receipt"].map(label => <th key={label} className="px-2 py-2.5 font-semibold">{label}</th>)}</tr></thead>
      <tbody>{invoices.map(invoice => <tr key={invoice.number} className="border-t border-border/50">
        <td className="px-2 py-1.5 text-foreground/80">{invoice.date}</td><td className="px-2 py-1.5">{invoice.number}</td><td className="px-2 py-1.5 tabular-nums">{money(invoice.amount)}</td><td className="px-2 py-1.5"><Status overdue={invoice.status === "Overdue"}>{invoice.status}</Status></td><td className="px-2 py-1.5 text-center"><Button variant="outline" size="icon-xs" aria-label={`Download sample invoice ${invoice.number}`} onClick={() => downloadInvoice(invoice)}><Download className="size-3.5" /></Button></td>
      </tr>)}</tbody>
    </table>
  </div>
}

export function MembershipsContent() {
  const [yearly, setYearly] = useState(false)
  const [renewal, setRenewal] = useState(true)
  const [dialog, setDialog] = useState<"billing" | "addons" | "plan" | null>(null)
  const [selectedPlan, setSelectedPlan] = useState("Premium")
  const [selectedAddons, setSelectedAddons] = useState<string[]>([])
  const [previewConfirmed, setPreviewConfirmed] = useState(false)
  const choosePlan = (name: string) => { setSelectedPlan(name); setPreviewConfirmed(false); setDialog("plan") }
  const toggleAddon = (name: string) => setSelectedAddons(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name])
  const selected = plans.find(plan => plan.name === selectedPlan) ?? plans[2]

  const addonList = <div className="space-y-2.5">{addons.map((addon, index) => {
    const Icon = addonIcons[index]
    const added = selectedAddons.includes(addon.name)
    return <div key={addon.name} className="flex flex-wrap items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-foreground/70" />
      <div className="min-w-32 flex-1"><p className="text-[11px] font-medium">{addon.name}</p><p className="text-[10px] leading-4 text-muted-foreground">{addon.description}</p></div>
      <span className="text-[10px] text-muted-foreground">{money(addon.price)} / month</span>
      <Button variant="outline" size="xs" className={cn("min-w-12 text-[10px]", added && "border-accent/30 bg-accent/5 text-accent")} aria-pressed={added} aria-label={`${added ? "Remove" : "Add"} ${addon.name}`} onClick={() => toggleAddon(addon.name)}>{added ? <><Check className="size-3" />Added</> : "Add"}</Button>
    </div>
  })}</div>

  return <div className="mx-auto max-w-[1600px] space-y-3">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight">Memberships</h1><p className="mt-1 text-xs text-muted-foreground">Manage your PulseFit subscription, billing, and upgrade options.</p></div>
      <div className="flex gap-2.5"><DashboardHeaderButton icon={CalendarDays} text="Billing History" bgColor="transparent" aria-haspopup="dialog" onClick={() => setDialog("billing")} /><DashboardHeaderButton icon={ArrowUp} text="Upgrade Plan" bgColor="primary" aria-haspopup="dialog" onClick={() => choosePlan("Premium")} /></div>
    </header>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.65fr_0.95fr_1fr]">
      <Panel icon={CreditCard} title="Current Membership" description="Your active PulseFit subscription details." action={<Status>Active</Status>} className="md:col-span-2 xl:col-span-1">
        <div className="grid gap-5 pt-2 sm:grid-cols-[1.15fr_1fr]">
          <div className="sm:pr-1">
            <div className="flex items-center gap-4"><div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Crown className="size-8 fill-accent/15" /></div><div><h3 className="text-xl font-semibold tracking-tight">Pro Plan</h3><p className="mt-1 max-w-44 text-xs leading-4 text-muted-foreground">Ideal for growing gyms with multiple staff and members.</p></div></div>
            <p className="mt-5 text-2xl font-bold tracking-tight">PKR 18,000<span className="text-sm font-normal tracking-normal text-muted-foreground"> / month</span></p>
            <div className="mt-4 flex gap-3 border-t border-border/60 pt-4"><CalendarDays className="mt-0.5 size-4 shrink-0 text-foreground/70" /><div><p className="text-[11px] text-muted-foreground">Membership active since</p><p className="mt-1 text-xs">Jan 15, 2024</p></div></div>
          </div>
          <div className="space-y-4 sm:border-l sm:border-border/60 sm:pl-5">
            <div className="flex gap-3"><CalendarDays className="size-4 shrink-0 text-foreground/70" /><div><p className="text-[11px] text-muted-foreground">Next payment due</p><p className="mt-1 text-xs">Feb 15, 2025 <span className="text-muted-foreground">(in 12 days)</span></p></div></div>
            <div className="flex gap-3"><RefreshCw className="size-4 shrink-0 text-foreground/70" /><div><p className="text-[11px] font-medium">Billing cycle</p><p className="mt-1 text-xs">Monthly</p></div></div>
            <div className="flex gap-3"><Wallet className="size-4 shrink-0 text-foreground/70" /><div><p className="text-[11px] text-muted-foreground">Payment method</p><p className="mt-1 text-xs">Bank Transfer (•••• 7890)</p></div></div>
            <div className="flex gap-3"><button type="button" role="switch" aria-label="Auto-renewal" aria-checked={renewal} onClick={() => setRenewal(!renewal)} className={cn("relative mt-0.5 h-3.5 w-6 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", renewal ? "bg-accent" : "bg-muted-foreground/40")}><span className={cn("absolute top-0.5 left-0.5 size-2.5 rounded-full bg-white transition-transform", renewal && "translate-x-2.5")} /></button><div><p className="text-[11px] font-medium">Auto-renewal</p><p className="mt-1 text-xs">{renewal ? "Enabled" : "Disabled"}</p><p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{renewal ? "Your plan will automatically renew on Feb 15, 2025." : "Your plan will end after the current billing period."}</p></div></div>
          </div>
        </div>
      </Panel>

      <Panel icon={ChartNoAxesColumnIncreasing} title="Usage Overview" description="Your current usage against plan limits.">
        <div className="space-y-4">{usage.map(({ icon: Icon, ...item }) => <div key={item.label} className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-foreground/75" /><div className="flex-1"><div className="mb-1.5 flex justify-between gap-2 text-[11px]"><span className="font-medium">{item.label}</span><span className="tabular-nums">{item.used} <span className="text-muted-foreground">/ {item.limit}</span></span></div><div className="flex items-center gap-2"><div role="progressbar" aria-label={`${item.label} usage`} aria-valuenow={item.used} aria-valuemin={0} aria-valuemax={item.limit} className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${item.percent}%` }} /></div><span className="w-7 text-right text-[10px] tabular-nums text-muted-foreground">{item.percent}%</span></div></div></div>)}</div>
        <div className="mt-4 flex gap-2 rounded-lg bg-amber-500/10 p-2.5"><CircleAlert className="size-4 shrink-0 text-amber-500" /><div><p className="text-[10px] font-medium text-amber-800 dark:text-amber-300">You are approaching your member limit (78% used).</p><p className="mt-0.5 text-[9px] text-muted-foreground">Consider upgrading to avoid any disruption.</p></div></div>
      </Panel>

      <section className="flex min-w-0 flex-col rounded-xl border border-accent/10 bg-accent/5 p-4">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-accent"><Star className="size-5" /><h2 className="flex-1 text-xs font-semibold">Recommended Plan</h2><span className="rounded-md bg-accent/10 px-2 py-1 text-[9px] font-semibold">Best for your growth</span></div>
        <div className="mb-4 flex gap-4"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-white"><Crown className="size-6 fill-white/20" /></div><div><h3 className="text-base font-semibold">Premium Plan</h3><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Get higher member limits, multi-branch support, advanced analytics, priority support, and AI insights to scale your gym.</p></div></div>
        <Features items={recommendedFeatures} />
        <Button className={cn("mt-4 w-full text-xs", accentButton)} onClick={() => choosePlan("Premium")}><ArrowUp className="size-4" />Upgrade to Premium</Button>
      </section>
    </div>

    <div className="grid items-start gap-3 xl:grid-cols-[1.85fr_1fr]">
      <div className="min-w-0 space-y-3">
        <Panel icon={Layers} title="Compare Plans" description="Choose the plan that best fits your gym’s needs." action={<div className="flex items-center rounded-lg border border-border p-0.5"><button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)} className={cn("rounded-md px-3 py-2 text-[11px] transition-colors", !yearly ? "bg-accent text-white" : "text-muted-foreground")}>Monthly</button><button type="button" aria-pressed={yearly} onClick={() => setYearly(true)} className={cn("rounded-md px-3 py-2 text-[11px] transition-colors", yearly ? "bg-accent text-white" : "text-muted-foreground")}>Yearly</button><span className="mr-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Save 20%</span></div>}>
          <div className="grid gap-3 sm:grid-cols-3">{plans.map((plan, index) => {
            const Icon = planIcons[index]
            const current = plan.name === "Pro"
            const monthlyPrice = plan.price * (yearly ? 0.8 : 1)
            return <div key={plan.name} className={cn("relative flex flex-col rounded-xl border p-3", current ? "border-accent bg-accent/5 ring-1 ring-accent/10" : "border-border/70")}>
              {current && <span className="absolute -top-2.5 right-2 rounded-md bg-accent px-2 py-1 text-[9px] font-medium text-white">Current Plan</span>}
              <div className="mb-4 flex items-start gap-3 pt-1"><div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", current ? "bg-accent/10 text-accent" : "text-foreground/75")}><Icon className="size-6" /></div><div><h3 className="text-sm font-semibold">{plan.name} Plan</h3><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{plan.description}</p></div></div>
              <p className="mb-3 text-lg font-bold tracking-tight">{money(monthlyPrice)}<span className="text-[11px] font-normal text-muted-foreground"> / month</span></p>
              {yearly && <p className="-mt-1 mb-3 text-[10px] text-muted-foreground">{money(monthlyPrice * 12)} billed yearly</p>}
              <Features items={plan.features} />
              <div className="mt-auto pt-4"><Button variant={index === 0 ? "outline" : "default"} disabled={current} className={cn("w-full text-[10px]", current ? "bg-accent/10 text-accent disabled:opacity-100" : index === 2 ? accentButton : "border-muted-foreground/50")} onClick={() => choosePlan(plan.name)}>{current ? "Current Plan" : index === 0 ? "Downgrade to Basic" : "Upgrade to Premium"}</Button></div>
            </div>
          })}</div>
        </Panel>
        <Panel icon={Lightbulb} title="Membership Insights" description="Insights and recommendations based on your usage.">
          <div className="grid gap-2 sm:grid-cols-3">{[
            { icon: TrendingUp, title: "Upgrade soon to avoid hitting your member cap", description: "You’ve used 78% of your member limit. Upgrade to keep adding new members without interruption.", color: "bg-accent/5 text-accent" },
            { icon: ChartNoAxesColumnIncreasing, title: "Your usage has increased 22% in the last 60 days", description: "Your gym is growing! Member registrations are up 22% compared to the previous 60 days.", color: "bg-emerald-500/5 text-emerald-600" },
            { icon: Sparkles, title: "Premium plan could reduce admin overhead", description: "Take advantage of automation tools, advanced analytics, and multi-branch support to save time and scale faster.", color: "bg-muted/70 text-muted-foreground" },
          ].map(({ icon: Icon, ...insight }) => <div key={insight.title} className={cn("flex items-center gap-3 rounded-lg p-3", insight.color)}><Icon className="size-5 shrink-0" /><div><h3 className="text-[9px] font-semibold leading-3.5 text-foreground">{insight.title}</h3><p className="mt-1 text-[9px] leading-3.5 text-muted-foreground">{insight.description}</p></div></div>)}</div>
        </Panel>
      </div>
      <div className="min-w-0 space-y-3">
        <Panel icon={FileText} title="Billing & Invoices" description="View and download your recent invoices." action={<button type="button" onClick={() => setDialog("billing")} className="flex items-center gap-1 py-1 text-[10px] font-medium text-accent hover:underline">View All<ArrowRight className="size-3" /></button>}><InvoiceTable /></Panel>
        <Panel icon={Puzzle} title="Add-ons & Additional Services" description="Enhance your subscription with optional add-ons." action={<button type="button" onClick={() => setDialog("addons")} className="flex items-center gap-1 py-1 text-[9px] font-medium text-accent hover:underline">View All Add-ons<ArrowRight className="size-3" /></button>}>{addonList}</Panel>
      </div>
    </div>
    <p className="pt-1 text-right text-[10px] text-muted-foreground">Static preview · Sample billing dates and data · No charges or subscription changes</p>

    <Dialog open={dialog !== null} onOpenChange={open => { if (!open) setDialog(null) }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{dialog === "billing" ? "Billing History" : dialog === "addons" ? "Available Add-ons" : `${selectedPlan} Plan`}</DialogTitle><DialogDescription>{dialog === "billing" ? "Sample invoices for your PulseFit subscription. Downloads are demonstration files." : dialog === "addons" ? "Select add-ons to preview your monthly total. No purchases will be made." : "Preview this plan with sample pricing. Your subscription will not change."}</DialogDescription></DialogHeader>
      {dialog === "billing" ? <InvoiceTable /> : dialog === "addons" ? <div className="space-y-5">{addonList}<div className="flex justify-between border-t border-border pt-4 text-sm font-semibold"><span>Selected add-ons</span><span>{money(addons.filter(addon => selectedAddons.includes(addon.name)).reduce((total, addon) => total + addon.price, 0))} / month</span></div></div> : <div className="space-y-4"><p className="text-2xl font-bold">{money(selected.price * (yearly ? 0.8 : 1))}<span className="text-sm font-normal text-muted-foreground"> / month</span></p><p className="text-xs text-muted-foreground">{yearly ? `${money(selected.price * 0.8 * 12)} billed yearly · 20% savings` : "Billed monthly"}</p><Features items={selected.features} />{selectedPlan === "Basic" && <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">Your sample usage exceeds Basic’s limits for members, trainers, and admin accounts.</p>}{previewConfirmed ? <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">Plan preview complete. No subscription changes or charges were made.</p> : <Button className={cn("w-full", accentButton)} onClick={() => setPreviewConfirmed(true)}>Preview {selectedPlan} Plan</Button>}</div>}
    </DialogContent></Dialog>
  </div>
}
