import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DraftNotice } from "../plan-notice"
import { PlanFormProvider } from "./plan-form-context"
import { PlanInformation } from "./plan-information"
import { PricingDurations } from "./pricing-durations"
import { PlanFeatures } from "./plan-features"
import { PlanStatus } from "./plan-status"
import { PlanActions } from "./plan-actions"

export default function CreatePlanPage() {
  return (
    <div className="mx-auto max-w-8xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/plans"
            aria-label="Back to plans"
            className="group inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 hover:bg-primary"
          >
            <ArrowLeft className="size-5 text-foreground transition-colors duration-300 group-hover:text-primary-foreground" />
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Create New Plan
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Build a membership plan for your gym. Add pricing, duration and features.
        </p>
      </div>

      {/* Form — client sections share state through the provider */}
      <PlanFormProvider>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <DraftNotice />
            <PlanInformation />
            <PricingDurations />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <PlanFeatures />
            <PlanStatus />
            <PlanActions />
          </div>
        </div>
      </PlanFormProvider>
    </div>
  )
}
