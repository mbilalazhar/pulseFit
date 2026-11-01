"use client"

import { DatePicker } from "@/components/ui/date-time-picker"
import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createExpense } from "@/lib/services/payment.services"
import { expenseMethods } from "@/lib/validators/expense"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { categories } from "./data"
import { Select } from "./payment-ui"

const inputClass = "h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"

export function ExpenseDialog({ open, onOpenChange, currency, today }: { open: boolean; onOpenChange: (open: boolean) => void; currency: string; today: string }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState("PAID")
  const mutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] })
      toast.success("Expense saved.")
      onOpenChange(false)
    },
  })
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get("title") ?? "").trim()
    const amount = Number(form.get("amount"))
    if (!title || !Number.isFinite(amount) || amount <= 0) return
    if (mutation.isPending) return
    mutation.mutate({ title, amountMinor: Math.round(amount * 100), currency,
      category: String(form.get("category")) as typeof categories[number],
      date: String(form.get("date")), method: String(form.get("method")) as typeof expenseMethods[number],
      status: status === "PENDING" ? "PENDING" : "PAID",
    })
  }
  return <Dialog open={open} onOpenChange={(value) => { if (!mutation.isPending) { mutation.reset(); onOpenChange(value) } }}><DialogContent className="sm:max-w-md" showCloseButton={!mutation.isPending}>
    <DialogHeader><DialogTitle>Add Expense</DialogTitle><DialogDescription>Record a paid expense or an amount still to pay. Paid expenses update your totals; pending expenses appear under payables.</DialogDescription></DialogHeader>
    <form onSubmit={handleSubmit} className="space-y-4"><fieldset disabled={mutation.isPending} className="space-y-4">
      <div className="space-y-1.5"><label htmlFor="expense-title" className="text-xs font-medium">Expense title</label><input id="expense-title" name="title" required maxLength={100} pattern=".*\S.*" placeholder="e.g. Equipment maintenance" className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><label htmlFor="expense-amount" className="text-xs font-medium">Amount ({currency})</label><input id="expense-amount" name="amount" type="number" required min="0.01" max="21474836.47" step="0.01" placeholder="0.00" className={inputClass} /></div>
        <div className="space-y-1.5"><label htmlFor="expense-category" className="text-xs font-medium">Category</label><Select id="expense-category" name="category" className="h-9">{categories.map((category) => <option key={category}>{category}</option>)}</Select></div>
        <div className="space-y-1.5"><label htmlFor="expense-date" className="text-xs font-medium">{status === "PAID" ? "Payment date" : "Due date"}</label><DatePicker id="expense-date" name="date" required defaultValue={today} min="1900-01-01" max={status === "PAID" ? today : "9998-12-31"} className={inputClass} /></div>
        <div className="space-y-1.5"><label htmlFor="expense-status" className="text-xs font-medium">Status</label><Select id="expense-status" name="status" className="h-9" value={status} onChange={(event) => setStatus(event.target.value)}><option value="PAID">Paid</option><option value="PENDING">Pending</option></Select></div>
      </div>
      <div className="space-y-1.5"><label htmlFor="expense-method" className="text-xs font-medium">Payment method</label><Select id="expense-method" name="method" className="h-9">{expenseMethods.map((method) => <option key={method}>{method}</option>)}</Select></div>
      </fieldset>{mutation.isError && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={mutation.isPending} className="bg-accent text-white hover:bg-accent-hover">{mutation.isPending ? "Saving…" : "Save Expense"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>
}
