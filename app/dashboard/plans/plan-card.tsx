"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Check,
  Pencil,
  Trash2,
  Users,
  Power,
  PowerOff,
  Loader2Icon,
  ChevronDown,
  ChevronUp,
  TriangleAlert,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  updatePlanStatus,
  deletePlan,
  type PlanSummary,
  type PlanStatus,
} from "@/lib/services/subscription.services"

const STATUS_BADGE: Record<PlanStatus, string> = {
  ACTIVE: "bg-success/10 text-success",
  INACTIVE: "bg-muted text-muted-foreground",
  DRAFT: "bg-warning/10 text-warning",
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DRAFT: "Draft",
}

/* The status-toggle button changes per current status. */
const STATUS_ACTION: Record<
  PlanStatus,
  { next: PlanStatus; label: string; deactivate: boolean }
> = {
  INACTIVE: { next: "ACTIVE", label: "Activate", deactivate: false },
  DRAFT: { next: "ACTIVE", label: "Activate Plan", deactivate: false },
  ACTIVE: { next: "INACTIVE", label: "Deactivate", deactivate: true },
}

const money = (currency: string, minor: number) =>
  `${currency} ${Math.round(minor / 100).toLocaleString()}`

const VISIBLE_LIMIT = 3

export function PlanCard({ plan }: { plan: PlanSummary }) {
  const queryClient = useQueryClient()

  const [showAllFeatures, setShowAllFeatures] = useState(false)
  const [showAllDurations, setShowAllDurations] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const action = STATUS_ACTION[plan.status]

  const statusMutation = useMutation({
    mutationFn: () => updatePlanStatus(plan.id, action.next),
    onSuccess: () => {
      toast.success(
        action.deactivate ? "Plan deactivated." : "Plan activated.",
      )
      queryClient.invalidateQueries({ queryKey: ["plans"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deletePlan(plan.id),
    onSuccess: () => {
      toast.success("Plan deleted.")
      setDeleteOpen(false)
      queryClient.invalidateQueries({ queryKey: ["plans"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const visibleFeatures = showAllFeatures
    ? plan.features
    : plan.features.slice(0, VISIBLE_LIMIT)
  const visibleDurations = showAllDurations
    ? plan.durations
    : plan.durations.slice(0, VISIBLE_LIMIT)

  return (
    <div className="relative flex flex-col rounded-2xl border bg-white p-5">
      {/* Title + status */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-lg font-bold tracking-tight">{plan.name}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            STATUS_BADGE[plan.status],
          )}
        >
          {STATUS_LABEL[plan.status]}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{plan.shortDesc}</p>

      {/* Price */}
      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight">
          {money(plan.currency, plan.basePriceMinor)}
        </p>
        <p className="text-xs text-muted-foreground">per month</p>
      </div>

      {/* Body: features + durations */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Includes:</p>
          {plan.features.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No features listed.</p>
          ) : (
            <>
              <ul className="mt-2 space-y-1.5">
                {visibleFeatures.map((f) => (
                  <li key={f.id} className="flex items-center gap-1.5 text-sm">
                    <Check className="size-3.5 shrink-0 text-success" strokeWidth={3} />
                    <span className="min-w-0 flex-1 truncate leading-snug" title={f.label}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
              {plan.features.length > VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => setShowAllFeatures((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  {showAllFeatures ? (
                    <>
                      <ChevronUp className="size-3" />
                      View less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3" />
                      View more
                    </>
                  )}
                </button>
              ) : null}
            </>
          )}
        </div>

        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs font-medium">Duration Options</p>
          {plan.durations.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              No durations configured
            </p>
          ) : (
            <>
              <ul className="mt-2 space-y-1.5">
                {visibleDurations.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {d.durationMonths} {d.durationMonths === 1 ? "Month" : "Months"}
                    </span>
                    {d.discountPercent > 0 ? (
                      <span className="font-medium text-accent">
                        Save {d.discountPercent}%
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {plan.durations.length > VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => setShowAllDurations((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  {showAllDurations ? (
                    <>
                      <ChevronUp className="size-3" />
                      View less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3" />
                      View more
                    </>
                  )}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
        <Users className="size-3.5" />
        <span className="font-medium text-foreground">
          {plan.memberCount.toLocaleString()} Members
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => statusMutation.mutate()}
          disabled={statusMutation.isPending}
          className="gap-1.5"
        >
          {statusMutation.isPending ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : action.deactivate ? (
            <PowerOff className="size-3.5" />
          ) : (
            <Power className="size-3.5" />
          )}
          {action.label}
        </Button>
        <Link
          href="/dashboard/plans/create"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <Pencil className="size-3.5" />
          Edit
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>

      {/* Delete confirmation — discourages deletion in favor of deactivating */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <TriangleAlert className="size-4" />
              </span>
              Delete “{plan.name}”?
            </DialogTitle>
            <DialogDescription>
              We don&apos;t recommend deleting plans. Removing a plan can cause
              inconsistencies for your members and their subscription history.
              The recommended approach is to{" "}
              <span className="font-medium text-foreground">deactivate</span> the
              plan instead, and only delete it once it has no members.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={deleteMutation.isPending} />}
            >
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="gap-1.5"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete anyway
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
