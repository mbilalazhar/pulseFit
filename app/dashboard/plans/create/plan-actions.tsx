"use client"

import Link from "next/link"
import { Loader2Icon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePlanForm } from "./plan-form-context"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function PlanActions() {
  const { handleSubmit, isSubmitting, isEditing, status, pendingChanges, cancelSave, confirmSave } = usePlanForm()
  const activating = pendingChanges?.status === "ACTIVE"

  return (
    <div className="flex items-center justify-end gap-2 p-4">
      <Link
        href="/dashboard/plans"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        Cancel
      </Link>
      <Button
        type="button"
        size="lg"
        onClick={() => handleSubmit(false)}
        disabled={isSubmitting}
        className="gap-1.5"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            {isEditing ? "Saving" : "Creating"}
          </>
        ) : (
          isEditing ? "Save Changes" : status === "DRAFT" ? "Save Draft" : status === "ACTIVE" ? "Create & Activate" : "Create Plan"
        )}
      </Button>
      <Dialog open={pendingChanges !== null} onOpenChange={(open) => { if (!open) cancelSave() }}>
        <DialogContent showCloseButton={!isSubmitting}>
          <DialogHeader>
            <DialogTitle>{activating ? "Activate this plan?" : "Save changes to this plan?"}</DialogTitle>
            <DialogDescription>
              {activating
                ? `Activating “${pendingChanges?.name}” makes it available to members. No changes to its details, pricing or features will be accepted until you set the plan to Inactive.`
                : `Confirm that you want to update “${pendingChanges?.name || "Untitled draft"}” with these details.`}
            </DialogDescription>
          </DialogHeader>
          {pendingChanges && (
            <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-4 text-sm">
              <dt className="text-muted-foreground">Monthly price</dt>
              <dd className="text-right font-medium">{pendingChanges.currency} {(pendingChanges.basePriceMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-right font-medium capitalize">{pendingChanges.status.toLowerCase()}</dd>
            </dl>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={isSubmitting} />}>
              Keep Editing
            </DialogClose>
            <Button type="button" onClick={confirmSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              {isSubmitting ? "Saving" : activating ? "Confirm & Activate" : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
