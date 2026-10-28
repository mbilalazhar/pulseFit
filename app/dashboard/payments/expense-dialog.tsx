"use client"

import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { categories, previewDate, type Expense } from "./data"
import { Select } from "./payment-ui"

const inputClass = "h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20"

export function ExpenseDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (open: boolean) => void; onAdd: (expense: Expense) => void }) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get("title") ?? "").trim()
    const amount = Number(form.get("amount"))
    if (!title || !Number.isFinite(amount) || amount <= 0) return
    onAdd({ id: crypto.randomUUID(), title, amount, category: String(form.get("category")), date: String(form.get("date")), method: String(form.get("method")), status: form.get("status") === "Pending" ? "Pending" : "Paid" })
    onOpenChange(false)
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md">
    <DialogHeader><DialogTitle>Add Expense</DialogTitle><DialogDescription>Preview an expense with sample data. Changes reset when you leave or refresh this page.</DialogDescription></DialogHeader>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5"><label htmlFor="expense-title" className="text-xs font-medium">Expense title</label><input id="expense-title" name="title" required maxLength={100} pattern=".*\S.*" placeholder="e.g. Equipment maintenance" className={inputClass} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><label htmlFor="expense-amount" className="text-xs font-medium">Amount (PKR)</label><input id="expense-amount" name="amount" type="number" required min="0.01" max="100000000" step="0.01" placeholder="0.00" className={inputClass} /></div>
        <div className="space-y-1.5"><label htmlFor="expense-category" className="text-xs font-medium">Category</label><Select id="expense-category" name="category" className="h-9">{categories.map((category) => <option key={category}>{category}</option>)}</Select></div>
        <div className="space-y-1.5"><label htmlFor="expense-date" className="text-xs font-medium">Date</label><input id="expense-date" name="date" type="date" required defaultValue={previewDate} min="2026-10-01" max="2026-10-31" className={inputClass} /></div>
        <div className="space-y-1.5"><label htmlFor="expense-status" className="text-xs font-medium">Status</label><Select id="expense-status" name="status" className="h-9"><option>Paid</option><option>Pending</option></Select></div>
      </div>
      <div className="space-y-1.5"><label htmlFor="expense-method" className="text-xs font-medium">Payment method</label><Select id="expense-method" name="method" className="h-9"><option>Bank Transfer</option><option>Cash</option><option>JazzCash</option><option>Easypaisa</option><option>Card</option></Select></div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" className="bg-accent text-white hover:bg-accent-hover">Add Expense</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>
}
