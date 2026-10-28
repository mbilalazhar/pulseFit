import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Plus } from "lucide-react"
import { TrainersTable } from "./trainers-table"
import { StatsCards } from "./stats-cards"

export default function Trainers() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Trainers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your gym trainers and their workload.
          </p>
        </div>

        <DashboardHeaderButton icon={Plus} text="Add New Trainer" bgColor="primary" href="/dashboard/trainers/create" />
      </header>

      {/* Stats */}
      <StatsCards />

      {/* Table */}
      <TrainersTable />
    </div>
  )
}
