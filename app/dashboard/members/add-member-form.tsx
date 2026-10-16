"use client"

import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react"
import defaultAvatar from "@/assets/User_Default.png"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPlans } from "@/lib/services/subscription.services"
import { getTrainers } from "@/lib/services/trainer.services"
import { cn } from "@/lib/utils"
import { membershipAmounts, membershipExpiry } from "./member-form-calculations"

const controlClassName = "h-11 w-full min-w-0 rounded-sm border border-input bg-white px-3.5 text-sm text-black outline-none transition-colors placeholder:text-muted-foreground focus:border-black focus:ring-3 focus:ring-black/20 focus-visible:border-black focus-visible:ring-3 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-600 disabled:opacity-100 read-only:bg-neutral-50"
const primaryButtonClassName = "gap-1.5 bg-accent text-white hover:bg-accent-hover focus-visible:border-black focus-visible:ring-black/20"

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function displayDate(value: string) {
  return value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—"
}

function Field({ id, label, required, optional, help, children }: { id: string; label: string; required?: boolean; optional?: boolean; help?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="gap-0.5 text-sm leading-normal font-medium text-black">
        {label}{required ? <span aria-hidden="true" className="text-accent">*</span> : null}
        {optional ? <span className="font-normal text-neutral-600">(Optional)</span> : null}
      </Label>
      {children}
      {help ? <div id={`${id}-help`} className="text-xs leading-relaxed text-muted-foreground">{help}</div> : null}
    </div>
  )
}

function MemberInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(controlClassName, className)} />
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4 rounded-2xl border bg-white p-5">
      <h2 id={id} className="font-heading text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function SummaryRow({ label, children, strong = false }: { label: string; children: ReactNode; strong?: boolean }) {
  return <div className={`flex items-start justify-between gap-3 text-sm ${strong ? "font-semibold" : ""}`}><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium text-black tabular-nums">{children}</dd></div>
}

export function AddMemberForm() {
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: getPlans })
  const trainersQuery = useQuery({ queryKey: ["trainers"], queryFn: getTrainers })
  const [previewComplete, setPreviewComplete] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [durationId, setDurationId] = useState("")
  const [startDate, setStartDate] = useState(today)
  const [trainerRequired, setTrainerRequired] = useState(false)
  const [specialDiscount, setSpecialDiscount] = useState("")
  const [received, setReceived] = useState("")
  const plans = plansQuery.data?.plans.filter((plan) => plan.status === "ACTIVE") ?? []
  const trainers = trainersQuery.data?.trainers.filter((trainer) => trainer.status === "ACTIVE") ?? []
  const options = plans.flatMap((plan) => plan.durations.map((duration) => ({ plan, duration })))
  const selected = options.find(({ duration }) => duration.id === durationId)
  const expiryDate = selected ? membershipExpiry(startDate, selected.duration.durationMonths) : ""
  const amounts = membershipAmounts(selected?.plan.basePriceMinor ?? 0, selected?.duration.durationMonths ?? 0, selected?.duration.discountPercent ?? 0, specialDiscount, received)
  const money = (minor: number) => selected ? `${selected.plan.currency} ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"
  const durationLabel = selected ? `${selected.duration.durationMonths} ${selected.duration.durationMonths === 1 ? "Month" : "Months"}` : "—"
  const paymentStatus = selected ? amounts.status : "Pending"
  const statusClassName = paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-800" : paymentStatus === "Partial" ? "bg-amber-50 text-amber-900" : "bg-neutral-100 text-neutral-800"
  const canSubmit = !!selected && !!expiryDate && !plansQuery.isError && (!trainerRequired || (!trainersQuery.isPending && !trainersQuery.isError && trainers.length > 0))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSubmit) setPreviewComplete(true)
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => setPreviewComplete(false)} className="space-y-6 text-black [--ring:#000]">
      <header>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/members" aria-label="Back to members" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-black outline-none transition-colors hover:bg-black hover:text-white focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2">
              <ArrowLeft aria-hidden="true" className="size-5" />
            </Link>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Add New Member</h1>
          </div>
          <p className="text-sm text-muted-foreground">Create a new member profile and assign membership details.</p>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Section id="member-information" title="Member Information">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field id="member-name" label="Full Name" required>
                <MemberInput id="member-name" name="name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Enter full name" required pattern={".*\\S.*"} maxLength={120} />
              </Field>
              <Field id="member-phone" label="Phone" required>
                <MemberInput id="member-phone" name="phone" type="tel" autoComplete="tel" placeholder="Enter phone number" required pattern={"(?=(?:[^0-9]*[0-9]){7})[+0-9\\(\\) .\\-]{7,20}"} title="Enter a phone number with at least 7 digits and up to 20 characters." maxLength={20} />
              </Field>
              <Field id="member-email" label="Email" required>
                <MemberInput id="member-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="Enter email address" required maxLength={254} />
              </Field>
              <Field id="member-id" label="Member ID" help="Automatically generated when saved.">
                <MemberInput id="member-id" value="Auto-generated" readOnly aria-describedby="member-id-help" />
              </Field>
            </div>
          </Section>

          <Section id="membership-details" title="Membership Details">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field id="member-plan" label="Subscription Plan" required help={
                plansQuery.isError ? <span role="alert">Couldn&apos;t load plans. <button type="button" onClick={() => void plansQuery.refetch()} className="font-semibold text-black underline">Try again</button></span>
                  : !plansQuery.isPending && options.length === 0 ? <span>No active plans with durations. <Link href="/dashboard/plans" className="font-semibold text-black underline">Manage plans</Link></span> : undefined
              }>
                <select id="member-plan" name="planDurationId" value={durationId} onChange={(event) => { setDurationId(event.target.value); setSpecialDiscount(""); setReceived("") }} required disabled={plansQuery.isPending || plansQuery.isError || options.length === 0} aria-describedby={plansQuery.isError || options.length === 0 ? "member-plan-help" : undefined} className={controlClassName}>
                  <option value="" disabled>{plansQuery.isPending ? "Loading plans…" : "Select a plan"}</option>
                  {options.map(({ plan, duration }) => <option key={duration.id} value={duration.id}>{plan.name} ({duration.durationMonths} {duration.durationMonths === 1 ? "Month" : "Months"})</option>)}
                </select>
                <input type="hidden" name="planId" value={selected?.plan.id ?? ""} />
              </Field>
              <Field id="member-start-date" label="Membership Start Date" required>
                <MemberInput id="member-start-date" name="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required max="9999-01-01" />
              </Field>
              <Field id="member-expiry-date" label="Membership Expiry Date" help="Auto-calculated based on plan duration.">
                <MemberInput id="member-expiry-date" name="expiryDate" type="date" value={expiryDate} readOnly aria-describedby="member-expiry-date-help" />
              </Field>
              <fieldset className="min-w-0 space-y-1.5">
                <legend className="text-sm font-medium">Trainer Required?</legend>
                <div className="flex h-11 items-center gap-4">
                  {[true, false].map((value) => <label key={String(value)} className="flex cursor-pointer items-center gap-2.5">
                    <input type="radio" name="trainerRequired" value={String(value)} checked={trainerRequired === value} onChange={() => setTrainerRequired(value)} className="size-4 cursor-pointer accent-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black" />
                    <span className="text-sm font-medium">{value ? "Yes" : "No"}</span>
                  </label>)}
                </div>
              </fieldset>
              <Field id="member-trainer" label="Trainer Selection" required={trainerRequired} help={trainerRequired ? (
                trainersQuery.isError ? <span role="alert">Couldn&apos;t load trainers. <button type="button" onClick={() => void trainersQuery.refetch()} className="font-semibold text-black underline">Try again</button></span>
                  : !trainersQuery.isPending && trainers.length === 0 ? "No active trainers available. Select No or add an active trainer." : undefined
              ) : undefined}>
                <select key={String(trainerRequired)} id="member-trainer" name="trainerId" defaultValue="" required={trainerRequired} disabled={!trainerRequired || trainersQuery.isPending || trainersQuery.isError || trainers.length === 0} aria-describedby={trainerRequired && (trainersQuery.isError || trainers.length === 0) ? "member-trainer-help" : undefined} className={controlClassName}>
                  <option value="" disabled={trainerRequired}>{!trainerRequired ? "No trainer assigned" : trainersQuery.isPending ? "Loading trainers…" : "Select a trainer"}</option>
                  {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.fullName}{trainer.specializations.length ? ` (${trainer.specializations.map((item) => item.name).join(", ")})` : ""}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section id="payment-details" title="Payment Details">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field id="member-payment-date" label="Payment Date" required>
                <MemberInput id="member-payment-date" name="paymentDate" type="date" defaultValue={today()} max={today()} required />
              </Field>
              <Field id="member-plan-amount" label="Plan Amount" help="Includes the plan duration discount.">
                <MemberInput id="member-plan-amount" value={money(amounts.planAmount)} readOnly aria-describedby="member-plan-amount-help" />
              </Field>
              <Field id="member-discount" label="Special Discount" optional>
                <MemberInput id="member-discount" name="specialDiscount" type="number" inputMode="decimal" min="0" max={amounts.planAmount / 100} step="0.01" placeholder="0.00" value={specialDiscount} onChange={(event) => setSpecialDiscount(event.target.value)} disabled={!selected} />
              </Field>
              <Field id="member-final-amount" label="Final Amount" help="Plan amount minus special discount.">
                <MemberInput id="member-final-amount" value={money(amounts.finalAmount)} readOnly aria-describedby="member-final-amount-help" />
              </Field>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Field id="member-received" label="Amount Received">
                <MemberInput id="member-received" name="amountReceived" type="number" inputMode="decimal" min="0" max={amounts.finalAmount / 100} step="0.01" placeholder="0.00" value={received} onChange={(event) => setReceived(event.target.value)} disabled={!selected} />
              </Field>
              <Field id="member-payment-status" label="Payment Status" help="Auto-calculated from the amount received.">
                <output id="member-payment-status" aria-describedby="member-payment-status-help" className={`flex h-11 items-center gap-2 rounded-sm px-3.5 text-sm font-medium ${statusClassName}`}><CheckCircle2 aria-hidden="true" className="size-4" />{paymentStatus}</output>
              </Field>
              <Field id="member-payment-method" label="Payment Method" optional>
                <div className="relative">
                  <select id="member-payment-method" name="paymentMethod" defaultValue="" className={controlClassName}>
                    <option value="">Select method</option>
                    <option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option><option value="upi">UPI</option><option value="mobile_wallet">Mobile wallet</option><option value="other">Other</option>
                  </select>
                </div>
              </Field>
            </div>
          </Section>
        </div>

        <div className="min-w-0 space-y-6">
          <aside aria-labelledby="membership-summary-title" className="overflow-hidden rounded-2xl border bg-white">
            <div className="border-b px-5 py-4">
              <h2 id="membership-summary-title" className="font-heading text-base font-semibold">Membership Summary</h2>
            </div>
            <div className="flex flex-col items-center gap-2 bg-neutral-100 px-5 py-6 text-center">
              <Image src={defaultAvatar} alt="" width={96} height={96} className="size-24 shrink-0 rounded-full border-4 border-white bg-neutral-200 object-cover" />
              <p className="w-full font-heading text-base font-semibold [overflow-wrap:anywhere]">{fullName.trim() || "Member Name"}</p>
              <p className="w-full text-sm text-muted-foreground [overflow-wrap:anywhere]">{email.trim() || "Email address"}</p>
            </div>
            <dl className="space-y-2.5 border-b px-5 py-4">
              <SummaryRow label="Subscription Plan">{selected?.plan.name ?? "—"}</SummaryRow>
              <SummaryRow label="Start Date">{displayDate(startDate)}</SummaryRow>
              <SummaryRow label="Expiry Date">{displayDate(expiryDate)}</SummaryRow>
              <SummaryRow label="Duration">{durationLabel}</SummaryRow>
            </dl>
            <div className="space-y-2.5 border-b px-5 py-4">
              <h3 className="font-heading text-sm font-semibold">Payment Summary</h3>
              <dl className="space-y-2.5">
                <SummaryRow label="Plan Amount">{money(amounts.planAmount)}</SummaryRow>
                <SummaryRow label="Special Discount">{selected && amounts.discount > 0 ? "− " : ""}{money(amounts.discount)}</SummaryRow>
                <SummaryRow label="Final Amount" strong>{money(amounts.finalAmount)}</SummaryRow>
                <SummaryRow label="Amount Received">{money(amounts.amountReceived)}</SummaryRow>
                {selected && amounts.balance > 0 ? <SummaryRow label="Balance Due" strong>{money(amounts.balance)}</SummaryRow> : null}
              </dl>
            </div>
            <dl className="px-5 py-4">
              <div className="flex items-center justify-between gap-3 text-sm"><dt className="font-medium">Payment Status</dt><dd className={`flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${statusClassName}`}><span className="size-1.5 rounded-full bg-current" />{paymentStatus}</dd></div>
            </dl>
          </aside>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link href="/dashboard/members" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-white text-black")}>Cancel</Link>
              <Button type="submit" size="lg" disabled={!canSubmit} className={primaryButtonClassName}><Plus aria-hidden="true" className="size-4" />Add Member</Button>
            </div>
            <p className="text-right text-xs text-muted-foreground">Preview only. Details won&apos;t be saved.</p>
            {previewComplete ? <p role="status" className="flex items-start gap-2 rounded-xl border bg-white p-3 text-sm"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />Member details are ready. This is a preview; no member has been saved.</p> : null}
          </div>
        </div>
      </div>
    </form>
  )
}

