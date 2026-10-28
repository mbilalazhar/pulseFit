import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Plus } from "lucide-react"
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

        <DashboardHeaderButton icon={Plus} text="Create Plan" bgColor="primary" href="/dashboard/plans/create" />
      </header>
      <PlanNotice />

      <PlanList />
    </div>
  )
}
