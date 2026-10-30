"use client"

import { useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, Loader2, Plus } from "lucide-react"
import defaultAvatar from "@/assets/User_Default.png"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getPlans } from "@/lib/services/subscription.services"
import { getTrainers } from "@/lib/services/trainer.services"
import { createMember } from "@/lib/services/member.services"
import { cn } from "@/lib/utils"
import { hasTrainerGuidance } from "@/lib/plan-features"
import { requiresAdditionalTrainingCharge } from "@/lib/training-charges"
import { membershipAmounts, membershipExpiry } from "./member-form-calculations"

const controlClassName = "h-11 w-full min-w-0 rounded-sm border border-input bg-card px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground/80 disabled:opacity-100 read-only:bg-muted"
const primaryButtonClassName = "gap-1.5 bg-accent text-white hover:bg-accent-hover focus-visible:border-ring focus-visible:ring-ring/20"

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
      <Label htmlFor={id} className="gap-0.5 text-sm leading-normal font-medium text-foreground">
        {label}{required ? <span aria-hidden="true" className="text-accent">*</span> : null}
        {optional ? <span className="font-normal text-foreground/80">(Optional)</span> : null}
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
    <section aria-labelledby={id} className="space-y-4 rounded-2xl border bg-card p-5">
      <h2 id={id} className="font-heading text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function SummaryRow({ label, children, strong = false }: { label: string; children: ReactNode; strong?: boolean }) {
  return <div className={`flex items-start justify-between gap-3 text-sm ${strong ? "font-semibold" : ""}`}><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium text-foreground tabular-nums">{children}</dd></div>
}

export function AddMemberForm() {
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: getPlans })
  const trainersQuery = useQuery({ queryKey: ["trainers"], queryFn: getTrainers })
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [planId, setPlanId] = useState("")
  const [durationMonths, setDurationMonths] = useState(1)
  const [startDate, setStartDate] = useState(today)
  const [trainerRequired, setTrainerRequired] = useState(false)
  const [sessionOverrides, setSessionOverrides] = useState<{ sessionsPerWeek?: string; sessionDurationMinutes?: string }>({})
  const [additionalCharge, setAdditionalCharge] = useState("")
  const [specialDiscount, setSpecialDiscount] = useState("")
  const [received, setReceived] = useState("")
  const plans = plansQuery.data?.plans.filter((plan) => plan.status === "ACTIVE") ?? []
  const trainers = trainersQuery.data?.trainers.filter((trainer) => trainer.status === "ACTIVE") ?? []
  const selected = plans.find((plan) => plan.id === planId)
  const guidanceIncluded = hasTrainerGuidance(selected?.features ?? [])
  const needsTrainer = guidanceIncluded || trainerRequired
  const sessionsPerWeek = sessionOverrides.sessionsPerWeek ?? (guidanceIncluded ? selected?.sessionsPerWeek?.toString() ?? "" : "")
  const sessionDurationMinutes = sessionOverrides.sessionDurationMinutes ?? (guidanceIncluded ? selected?.sessionDurationMinutes?.toString() ?? "" : "")
  const chargeRequired = !!selected && needsTrainer && requiresAdditionalTrainingCharge(guidanceIncluded, selected, {
    sessionsPerWeek: sessionsPerWeek.trim() ? Number(sessionsPerWeek) : null,
    sessionDurationMinutes: sessionDurationMinutes.trim() ? Number(sessionDurationMinutes) : null,
  })
  const expiryDate = selected ? membershipExpiry(startDate, durationMonths) : ""
  const discountPercent = selected?.durations.find((duration) => duration.durationMonths === durationMonths)?.discountPercent ?? 0
  const amounts = membershipAmounts(selected?.basePriceMinor ?? 0, durationMonths, discountPercent, specialDiscount, received, chargeRequired ? additionalCharge : "0")
  const money = (minor: number) => selected ? `${selected.currency} ${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"
  const durationLabel = `${durationMonths} ${durationMonths === 1 ? "Month" : "Months"}`
  const paymentStatus = selected ? amounts.status : "Pending"
  const statusClassName = paymentStatus === "Paid" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400" : paymentStatus === "Partial" ? "bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-400" : "bg-muted text-foreground"
  const mutation = useMutation({
    mutationFn: createMember,
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["members"] })
      void queryClient.invalidateQueries({ queryKey: ["plans"] })
      void queryClient.invalidateQueries({ queryKey: ["trainers"] })
      void queryClient.invalidateQueries({ queryKey: ["payments"] })
    },
  })
  const canSubmit = !!selected && !!expiryDate && !plansQuery.isError && !mutation.isPending && !mutation.isSuccess && (!needsTrainer || (!trainersQuery.isPending && !trainersQuery.isError && trainers.length > 0))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    const fields = new FormData(event.currentTarget)
    mutation.mutate({
      name: fullName,
      phone: String(fields.get("phone") ?? ""),
      email,
      planId,
      durationMonths,
      startDate,
      trainerId: needsTrainer ? String(fields.get("trainerId") ?? "") : null,
      sessionsPerWeek: needsTrainer ? Number(sessionsPerWeek) : undefined,
      sessionDurationMinutes: needsTrainer ? Number(sessionDurationMinutes) : undefined,
      additionalChargeMinor: chargeRequired && additionalCharge.trim() ? Math.round(Number(additionalCharge) * 100) : undefined,
      specialDiscountMinor: Math.round(Number(specialDiscount || 0) * 100),
      amountReceivedMinor: Math.round(Number(received || 0) * 100),
      paymentDate: String(fields.get("paymentDate") ?? ""),
      paymentMethod: (fields.get("paymentMethod") || "other") as "cash" | "card" | "bank_transfer" | "upi" | "mobile_wallet" | "other",
    })
  }

  function resetForm() {
    formRef.current?.reset()
    setFullName("")
    setEmail("")
    setPlanId("")
    setDurationMonths(1)
    setStartDate(today())
    setTrainerRequired(false)
    setSessionOverrides({})
    setAdditionalCharge("")
    setSpecialDiscount("")
    setReceived("")
    mutation.reset()
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} aria-busy={mutation.isPending} className="space-y-6 text-foreground ">
      <header>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/members" aria-label="Back to members" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-foreground outline-none transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <ArrowLeft aria-hidden="true" className="size-5" />
            </Link>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Add New Member</h1>
          </div>
          <p className="text-sm text-muted-foreground">Create a new member profile and assign membership details.</p>
        </div>
      </header>

      <fieldset disabled={mutation.isPending || mutation.isSuccess} className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Section id="member-information" title="Member Information">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field id="member-name" label="Full Name" required>
                <MemberInput id="member-name" name="name" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Enter full name" required pattern={".*\\S.*"} maxLength={120} />
              </Field>
              <Field id="member-phone" label="Phone" required>
                <MemberInput id="member-phone" name="phone" type="tel" autoComplete="tel" placeholder="Enter phone number" required pattern={"(?=(?:[^0-9]*[0-9]){7})[+0-9\\(\\) .\\-]{7,20}"} title="Enter a phone number with at least 7 digits and up to 20 characters." maxLength={20} />
              </Field>
              <Field id="member-email" label="Email" required>
                <MemberInput id="member-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="Enter email address" required maxLength={254} />
              </Field>
            </div>
          </Section>

          <Section id="membership-details" title="Membership Details">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Field id="member-plan" label="Subscription Plan" required help={
                plansQuery.isError ? <span role="alert">Couldn&apos;t load plans. <button type="button" onClick={() => void plansQuery.refetch()} className="font-semibold text-foreground underline">Try again</button></span>
                  : !plansQuery.isPending && plans.length === 0 ? <span>No active plans available. <Link href="/dashboard/plans" className="font-semibold text-foreground underline">Manage plans</Link></span> : undefined
              }>
                <select id="member-plan" name="planId" value={planId} onChange={(event) => { setPlanId(event.target.value); setSessionOverrides({}); setTrainerRequired(false); setAdditionalCharge(""); setSpecialDiscount(""); setReceived("") }} required disabled={plansQuery.isPending || plansQuery.isError || plans.length === 0} aria-describedby={plansQuery.isError || plans.length === 0 ? "member-plan-help" : undefined} className={controlClassName}>
                  <option value="" disabled>{plansQuery.isPending ? "Loading plans…" : "Select a plan"}</option>
                  {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                </select>
              </Field>
              <Field id="member-start-date" label="Membership Start Date" required>
                <MemberInput id="member-start-date" name="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required max="9999-01-01" />
              </Field>
              <Field id="member-duration" label="Membership Duration" required>
                <select id="member-duration" name="durationMonths" value={durationMonths} onChange={(event) => { setDurationMonths(Number(event.target.value)); setAdditionalCharge(""); setSpecialDiscount(""); setReceived("") }} required className={controlClassName}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((months) => <option key={months} value={months}>{months} {months === 1 ? "Month" : "Months"}</option>)}
                </select>
              </Field>
              {!guidanceIncluded && <fieldset className="min-w-0 space-y-1.5">
                <legend className="text-sm font-medium">Trainer Required?</legend>
                <div className="flex h-11 items-center gap-4">
                  {[true, false].map((value) => <label key={String(value)} className="flex cursor-pointer items-center gap-2.5">
                    <input type="radio" name="trainerRequired" value={String(value)} checked={trainerRequired === value} onChange={() => { setTrainerRequired(value); setSessionOverrides({}); setAdditionalCharge("") }} className="size-4 cursor-pointer accent-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black" />
                    <span className="text-sm font-medium">{value ? "Yes" : "No"}</span>
                  </label>)}
                </div>
              </fieldset>}
              <Field id="member-trainer" label="Assigned Trainer" required={needsTrainer} help={needsTrainer ? (
                trainersQuery.isError ? <span role="alert">Couldn&apos;t load trainers. <button type="button" onClick={() => void trainersQuery.refetch()} className="font-semibold text-foreground underline">Try again</button></span>
                  : !trainersQuery.isPending && trainers.length === 0 ? (guidanceIncluded ? "This plan includes trainer guidance. Add an active trainer before enrolling a member." : "No active trainers available. Select No or add an active trainer.") : undefined
              ) : undefined}>
                <select key={`${planId}-${needsTrainer}`} id="member-trainer" name="trainerId" defaultValue="" required={needsTrainer} disabled={!needsTrainer || trainersQuery.isPending || trainersQuery.isError || trainers.length === 0} aria-describedby={needsTrainer && (trainersQuery.isError || trainers.length === 0) ? "member-trainer-help" : undefined} className={controlClassName}>
                  <option value="" disabled={needsTrainer}>{!needsTrainer ? "No trainer assigned" : trainersQuery.isPending ? "Loading trainers…" : "Select a trainer"}</option>
                  {trainers.map((trainer) => <option key={trainer.id} value={trainer.id}>{trainer.fullName}{trainer.specializations.length ? ` (${trainer.specializations.map((item) => item.name).join(", ")})` : ""}</option>)}
                </select>
              </Field>
              {needsTrainer && <>
                <Field id="member-weekly-sessions" label="Sessions per Week" required help={guidanceIncluded ? "Starts with the plan allowance. You can change it for this member." : "Enter how many trainer sessions this member will receive each week."}>
                  <MemberInput id="member-weekly-sessions" name="sessionsPerWeek" type="number" min={1} max={21} step={1} required
                    value={sessionsPerWeek} onChange={(event) => { setSessionOverrides((previous) => ({ ...previous, sessionsPerWeek: event.target.value })); setAdditionalCharge("") }}
                    aria-describedby="member-weekly-sessions-help" />
                </Field>
                <Field id="member-session-minutes" label="Session Length (minutes)" required help={guidanceIncluded ? "Starts with the plan limit. You can change it for this member." : "Enter the length of each trainer session in minutes."}>
                  <MemberInput id="member-session-minutes" name="sessionDurationMinutes" type="number" min={1} max={1440} step={1} required
                    value={sessionDurationMinutes} onChange={(event) => { setSessionOverrides((previous) => ({ ...previous, sessionDurationMinutes: event.target.value })); setAdditionalCharge("") }}
                    aria-describedby="member-session-minutes-help" />
                </Field>
              </>}
            </div>
          </Section>

          <Section id="payment-details" title="Payment Details">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field id="member-payment-date" label="Payment Date" required>
                <MemberInput id="member-payment-date" name="paymentDate" type="date" defaultValue={today()} max={today()} required />
              </Field>
              <Field id="member-plan-amount" label="Plan Amount" help="Includes any discount configured for the selected duration.">
                <MemberInput id="member-plan-amount" value={money(amounts.planAmount)} readOnly aria-describedby="member-plan-amount-help" />
              </Field>
              {chargeRequired && (
                <Field id="member-additional-charge" label="Additional Training Charges" required
                  help={`Total extra charge for the selected ${durationMonths}-month membership, in ${selected?.currency}. Enter 0 if no extra charge applies.`}>
                  <MemberInput id="member-additional-charge" name="additionalCharge" type="number" inputMode="decimal" min="0" max="21474836.47" step="0.01" required
                    placeholder="Enter amount" value={additionalCharge} onChange={(event) => setAdditionalCharge(event.target.value)}
                    aria-describedby="member-additional-charge-help" />
                </Field>
              )}
              <Field id="member-discount" label="Special Discount" optional>
                <MemberInput id="member-discount" name="specialDiscount" type="number" inputMode="decimal" min="0" max={amounts.planAmount / 100} step="0.01" placeholder="0.00" value={specialDiscount} onChange={(event) => setSpecialDiscount(event.target.value)} disabled={!selected} />
              </Field>
              <Field id="member-final-amount" label="Final Amount" help="Plan amount plus additional training charges, minus special discount.">
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
          <aside aria-labelledby="membership-summary-title" className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 id="membership-summary-title" className="font-heading text-base font-semibold">Membership Summary</h2>
            </div>
            <div className="flex flex-col items-center gap-2 bg-muted px-5 py-6 text-center">
              <Image src={defaultAvatar} alt="" width={96} height={96} className="size-24 shrink-0 rounded-full border-4 border-card bg-muted object-cover" />
              <p className="w-full font-heading text-base font-semibold [overflow-wrap:anywhere]">{fullName.trim() || "Member Name"}</p>
              <p className="w-full text-sm text-muted-foreground [overflow-wrap:anywhere]">{email.trim() || "Email address"}</p>
            </div>
            <dl className="space-y-2.5 border-b px-5 py-4">
              <SummaryRow label="Subscription Plan">{selected?.name ?? "—"}</SummaryRow>
              <SummaryRow label="Start Date">{displayDate(startDate)}</SummaryRow>
              <SummaryRow label="Expiry Date">{displayDate(expiryDate)}</SummaryRow>
              <SummaryRow label="Duration">{durationLabel}</SummaryRow>
              {needsTrainer && <>
                <SummaryRow label="Weekly Sessions">{sessionsPerWeek || "—"}</SummaryRow>
                <SummaryRow label="Session Length">{sessionDurationMinutes ? `${sessionDurationMinutes} minutes` : "—"}</SummaryRow>
              </>}
            </dl>
            <div className="space-y-2.5 border-b px-5 py-4">
              <h3 className="font-heading text-sm font-semibold">Payment Summary</h3>
              <dl className="space-y-2.5">
                <SummaryRow label="Plan Amount">{money(amounts.planAmount)}</SummaryRow>
                {chargeRequired && <SummaryRow label="Additional Training Charges">{money(amounts.additionalChargeMinor)}</SummaryRow>}
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
              <Link href="/dashboard/members" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-card text-foreground")}>Cancel</Link>
              <Button type="submit" size="lg" disabled={!canSubmit} className={primaryButtonClassName}>
                {mutation.isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Plus aria-hidden="true" className="size-4" />}
                {mutation.isPending ? "Saving…" : mutation.isSuccess ? "Member Added" : "Add Member"}
              </Button>
            </div>
            {mutation.isError ? <p role="alert" className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-400">{mutation.error.message}</p> : null}
          </div>
        </div>
      </fieldset>
      {mutation.isSuccess ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 p-4">
          <p role="status" className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-400"><CheckCircle2 aria-hidden="true" className="size-4" />{mutation.data.member.name} was added successfully.</p>
          <Button type="button" variant="outline" onClick={resetForm}>Add another member</Button>
        </div>
      ) : null}
    </form>
  )
}

