import Link from "next/link"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PlanNotice } from "./plan-notice"
import { PlanList } from "./plan-list"

export default function Plans() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Plans</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage subscription plans for your gym.
          </p>
        </div>

        <Link
          href="/dashboard/plans/create"
          className={cn(buttonVariants({ size: "lg" }), "gap-2 self-start sm:self-auto")}
        >
          <Plus className="size-4" />
          Create Plan
        </Link>
      </header>
      <PlanNotice />

      <PlanList />
    </div>
  )
}
