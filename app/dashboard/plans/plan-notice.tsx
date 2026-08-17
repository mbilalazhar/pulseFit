"use client"

import { useState } from "react"
import { Info, FileText, X } from "lucide-react"

/**
 * Dismissible warning banner shown on the Plans page. Reminds the owner that
 * active plans are purchasable and should be kept consistent.
 */
export function PlanNotice() {
  const [show, setShow] = useState(true)

  if (!show) return null

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
        <Info className="size-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">
          Active plans are available for your members to purchase.
        </p>
        <p className="text-sm text-muted-foreground">
          Anything marked <span className="font-medium text-foreground">Active</span> is live
          on your storefront. Keep pricing, durations and features consistent across plans so
          members get a clear, fair comparison before they subscribe.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Dismiss notification"
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

/**
 * Dismissible banner shown on the Create Plan page, letting the owner know
 * they can save the plan as a draft and finish it later.
 */
export function DraftNotice() {
  const [show, setShow] = useState(true)

  if (!show) return null

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
        <FileText className="size-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">Not ready to publish yet?</p>
        <p className="text-sm text-muted-foreground">
          You can save the plan as a draft and finalize it later when
          you&apos;re ready.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        aria-label="Dismiss notification"
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
