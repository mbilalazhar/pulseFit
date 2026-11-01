"use client"

import { cloneElement, isValidElement, useId, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2, Save, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-time-picker"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getPlans } from "@/lib/services/subscription.services"
import { getTrainers } from "@/lib/services/trainer.services"
import { updateMember } from "@/lib/services/member.services"
import { memberEditSchema, type MemberEditData, type MemberEditInput, type MemberChange } from "@/lib/member-edit"
import { membershipAmounts, membershipExpiry } from "@/lib/membership"
import { TrainerSelect } from "./trainer-select"

const control = "h-11 w-full min-w-0 rounded-sm border border-input bg-card px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:bg-muted"
const panel = "space-y-4 rounded-2xl border bg-card p-5"
function Field({ label, children }: { label: string; children: ReactNode }) {
  const id = useId()
  return <div className="min-w-0 space-y-1.5"><label htmlFor={id} className="block text-sm font-medium">{label}</label>{isValidElement<{ id?: string }>(children) ? cloneElement(children, { id }) : children}</div>
}

export function EditMemberForm({ initial }: { initial: MemberEditData }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: getPlans, refetchOnMount: "always" })
  const trainersQuery = useQuery({ queryKey: ["trainers"], queryFn: getTrainers, refetchOnMount: "always", refetchOnWindowFocus: true, refetchInterval: 60_000 })
  const [planId, setPlanId] = useState(initial.membership?.planId ?? "")
  const [trainerId, setTrainerId] = useState(initial.trainerId ?? "")
  const [startDate, setStartDate] = useState(initial.membership?.startDate ?? "")
  const [durationMonths, setDurationMonths] = useState(initial.membership?.durationMonths ?? 1)
  const [discount, setDiscount] = useState(String((initial.membership?.discountMinor ?? 0) / 100))
  const [additional, setAdditional] = useState(String((initial.membership?.additionalChargeMinor ?? 0) / 100))
  const [pending, setPending] = useState<{ input: MemberEditInput; changes: MemberChange[]; token: string } | null>(null)
  const [error, setError] = useState("")
  const backHref = `/dashboard/members/${initial.id}`
  const plans = plansQuery.data?.plans.filter((plan) => plan.status === "ACTIVE" || plan.id === initial.membership?.planId) ?? []
  const trainers = trainersQuery.data?.trainers.filter((trainer) => trainer.status === "ACTIVE" || trainer.id === initial.trainerId) ?? []
  const plan = plans.find((item) => item.id === planId)
  const reprice = initial.membership && (planId !== initial.membership.planId || durationMonths !== initial.membership.durationMonths)
  const priceMinor = reprice ? plan ? membershipAmounts(plan.basePriceMinor, durationMonths, plan.durations.find((item) => item.durationMonths === durationMonths)?.discountPercent ?? 0, "0", "0").planAmount : null : initial.membership?.priceMinor ?? null
  const currency = reprice ? plan?.currency ?? initial.membership?.currency : initial.membership?.currency
  const totalMinor = priceMinor == null ? null : priceMinor - Math.round(Number(discount || 0) * 100) + Math.round(Number(additional || 0) * 100)
  const expiry = startDate === initial.membership?.startDate && durationMonths === initial.membership.durationMonths ? initial.membership.endDate : membershipExpiry(startDate, durationMonths)
  const money = (amount: number | null) => amount == null ? "—" : `${currency} ${(amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const mutation = useMutation({
    mutationFn: (input: MemberEditInput) => updateMember(initial.id, input),
    onSuccess: async (result, input) => {
      if ("requiresConfirmation" in result) { setPending({ input, changes: result.changes, token: result.reviewToken }); return }
      if ("unchanged" in result) { toast.info("No changes to save."); return }
      setPending(null)
      await Promise.all(["members", "trainers", "trainer-schedule", "payments", "plans"].map((key) => queryClient.invalidateQueries({ queryKey: [key] })))
      toast.success("Member details updated.")
      router.push(backHref)
      router.refresh()
    },
    onError: (cause: Error) => setError(cause.message),
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending) return
    setError("")
    const fields = new FormData(event.currentTarget)
    const text = (key: string) => String(fields.get(key) ?? "")
    const number = (key: string) => Number(text(key))
    const input: MemberEditInput = {
      revision: initial.revision, name: text("name"), phone: text("phone"), email: text("email"), trainerId: trainerId || null,
      membership: initial.membership ? { planId, durationMonths, startDate, discountMinor: Math.round(Number(discount || 0) * 100), additionalChargeMinor: Math.round(Number(additional || 0) * 100),
        sessionsPerWeek: trainerId && text("sessionsPerWeek") ? number("sessionsPerWeek") : null,
        sessionDurationMinutes: trainerId && text("sessionDurationMinutes") ? number("sessionDurationMinutes") : null,
        paymentDueDate: text("paymentDueDate") || null,
      } : null,
      payments: initial.payments.map((payment) => ({ id: payment.id, amountMinor: Math.round(number(`amount-${payment.id}`) * 100), date: text(`date-${payment.id}`), method: text(`method-${payment.id}`) as MemberEditInput["payments"][number]["method"] })),
    }
    const parsed = memberEditSchema.safeParse(input)
    if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    mutation.mutate(input)
  }
  return <div className="mx-auto max-w-[1400px] space-y-6">
    <header className="flex items-center gap-3"><Link href={backHref} aria-label="Back to member details" className={buttonVariants({ variant: "ghost", size: "icon" })}><ArrowLeft className="size-5" /></Link><div><h1 className="font-heading text-2xl font-bold">Edit Member</h1><p className="mt-1 text-sm text-muted-foreground">Update {initial.name}&apos;s saved details. Review every change before confirming.</p></div></header>
    <form onSubmit={submit}>
      <fieldset disabled={mutation.isPending || pending !== null} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <section className={panel}><h2 className="font-heading font-semibold">Member Information</h2><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Full name"><input name="name" defaultValue={initial.name} required maxLength={120} className={control} /></Field>
            <Field label="Phone"><input name="phone" defaultValue={initial.phone} required type="tel" maxLength={20} className={control} /></Field>
            <Field label="Email"><input name="email" defaultValue={initial.email} type="email" maxLength={254} className={control} /></Field>
          </div></section>
          <section className={panel}><h2 className="font-heading font-semibold">Membership Details</h2>
            {initial.membership ? <>
              {plansQuery.isError && <p role="alert" className="text-sm text-destructive">Could not refresh available plans. <button type="button" className="underline" onClick={() => void plansQuery.refetch()}>Try again</button></p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Membership plan"><select value={planId} onChange={(event) => setPlanId(event.target.value)} disabled={plansQuery.isPending || plansQuery.isError} className={control}>
                  {!plans.some((item) => item.id === initial.membership!.planId) && <option value={initial.membership.planId}>{initial.membership.planName}</option>}
                  {plans.map((item) => <option key={item.id} value={item.id}>{item.id === initial.membership!.planId ? `${initial.membership!.planName} (saved plan)` : item.name}{item.status !== "ACTIVE" ? ` · ${item.status.toLowerCase()}` : ""}</option>)}
                </select></Field>
                <Field label="Duration (months)"><select value={durationMonths} onChange={(event) => setDurationMonths(Number(event.target.value))} className={control}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1} {index ? "months" : "month"}</option>)}</select></Field>
                <Field label="Membership start"><DatePicker value={startDate} onValueChange={setStartDate} required min="1900-01-01" max="9998-12-31" className={control} /></Field>
                <Field label="Membership expiry"><input value={expiry || "Choose valid dates"} readOnly className={`${control} bg-muted/50`} /></Field>
                <Field label={`Special discount (${currency})`}><input type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(event.target.value)} className={control} /></Field>
                <Field label={`Additional training charge (${currency})`}><input type="number" min="0" step="0.01" value={additional} onChange={(event) => setAdditional(event.target.value)} className={control} /></Field>
                <Field label="Payment due date"><DatePicker name="paymentDueDate" defaultValue={initial.membership.paymentDueDate ?? ""} min="1900-01-01" max="9998-12-31" className={control} /></Field>
              </div>
              <p className="text-xs text-muted-foreground">Changing the plan or duration recalculates the membership price using the plan&apos;s current pricing. Existing payments stay linked to this membership.</p>
            </> : <p className="text-sm text-muted-foreground">No membership is recorded for this member.</p>}
          </section>
          <section className={panel}><h2 className="font-heading font-semibold">Trainer Assignment</h2>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!trainerId} onChange={(event) => setTrainerId(event.target.checked ? initial.trainerId || trainers[0]?.id || "" : "")} disabled={trainersQuery.isPending || trainersQuery.isError || !trainers.length} />Assign a trainer</label>
            {trainersQuery.isError && <p role="alert" className="text-sm text-destructive">Could not refresh trainers. <button type="button" className="underline" onClick={() => void trainersQuery.refetch()}>Try again</button></p>}
            {trainerId && <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><label htmlFor="member-trainer" className="text-sm font-medium">Assigned trainer</label>
                {trainers.some((item) => item.id === trainerId) ? <TrainerSelect trainers={trainers} value={trainerId} onValueChange={setTrainerId} required disabled={mutation.isPending || pending !== null || trainersQuery.isError} placeholder="Select a trainer" /> : <input value={initial.trainerName ?? "Loading trainer…"} readOnly className={control} />}
                <p id="member-trainer-help" className="text-xs text-muted-foreground">Changing the trainer also transfers upcoming sessions at their existing times when available.</p>
              </div>
              {initial.membership && <>
                <Field label="Sessions per week"><input name="sessionsPerWeek" defaultValue={initial.membership.sessionsPerWeek ?? ""} type="number" min="1" max="21" required className={control} /></Field>
                <Field label="Session length (minutes)"><input name="sessionDurationMinutes" defaultValue={initial.membership.sessionDurationMinutes ?? ""} type="number" min="1" max="1440" required className={control} /></Field>
              </>}
            </div>}
          </section>
          <section className={panel}><h2 className="font-heading font-semibold">Saved Payments</h2><p className="text-xs text-muted-foreground">Correct recorded amounts, dates and methods here. These changes will update revenue and the member&apos;s outstanding balance.</p>
            {initial.payments.length ? initial.payments.map((payment, index) => <div key={payment.id} className="space-y-3 rounded-xl border p-4"><h3 className="text-sm font-medium">{payment.kind === "REFUND" ? "Refund" : "Payment"} {index + 1}</h3><div className="grid gap-3 sm:grid-cols-3">
              <Field label={`Amount (${payment.currency})`}><input name={`amount-${payment.id}`} type="number" min="0.01" max="21474836.47" step="0.01" defaultValue={payment.amountMinor / 100} required className={control} /></Field>
              <Field label="Payment date"><DatePicker name={`date-${payment.id}`} defaultValue={payment.date} required min="1900-01-01" max={initial.today} className={control} /></Field>
              <Field label="Payment method"><select name={`method-${payment.id}`} defaultValue={payment.method} className={control}>{["CASH", "CARD", "BANK_TRANSFER", "ONLINE", "OTHER"].map((method) => <option key={method} value={method}>{method.replaceAll("_", " ")}</option>)}</select></Field>
            </div></div>) : <p className="text-sm text-muted-foreground">No payments recorded for this membership.</p>}
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-6">
          {initial.membership && <section className={panel}><h2 className="font-heading font-semibold">Membership Summary</h2><dl className="space-y-3 text-sm">{[["Membership price", money(priceMinor)], ["Discount", money(Math.round(Number(discount || 0) * 100))], ["Training charge", money(Math.round(Number(additional || 0) * 100))], ["Total", money(totalMinor)]].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl></section>}
          <div className="flex flex-wrap justify-end gap-2"><Link href={backHref} className={buttonVariants({ variant: "outline" })}>Cancel</Link><Button type="submit" disabled={mutation.isPending}><Save className="size-4" />{mutation.isPending ? "Reviewing…" : "Save Changes"}</Button></div>
        </aside>
      </fieldset>
      {error && !pending && <div role="alert" className="mt-4 space-y-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive"><p>{error}</p><Button type="button" variant="outline" onClick={() => router.refresh()}>Reload saved details</Button></div>}
    </form>
    <Dialog open={pending !== null} onOpenChange={(open) => { if (!open && !mutation.isPending) { setPending(null); setError("") } }}>
      <DialogContent className="max-h-[90svh] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl" showCloseButton={!mutation.isPending}>
        <DialogHeader><DialogTitle>Review member changes</DialogTitle><DialogDescription>Check the previous and new values below. Nothing has been saved yet.</DialogDescription></DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto">
          <div role="alert" className="flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm"><TriangleAlert className="size-5 shrink-0 text-destructive" /><p><strong>These changes are irreversible.</strong> Once confirmed, the saved details will be replaced. There is no undo action. Confirm only after reviewing every change.</p></div>
          <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-muted/50"><tr><th className="p-3">Detail</th><th className="p-3">Previously</th><th className="p-3">After saving</th></tr></thead><tbody>{pending?.changes.map((change) => <tr key={change.field} className="border-t align-top"><th scope="row" className="p-3 font-medium">{change.field}</th><td className="max-w-64 break-words p-3 text-muted-foreground">{change.before}</td><td className="max-w-64 break-words bg-accent/5 p-3 font-medium">{change.after}</td></tr>)}</tbody></table></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter><Button variant="outline" disabled={mutation.isPending} onClick={() => { setPending(null); setError("") }}>Keep Editing</Button><Button disabled={mutation.isPending} onClick={() => { if (pending) { setError(""); mutation.mutate({ ...pending.input, confirmed: true, reviewToken: pending.token }) } }}>{mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{mutation.isPending ? "Saving…" : "Confirm & Save Changes"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
}
