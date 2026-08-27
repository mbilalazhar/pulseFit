import Link from "next/link"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TrainersTable } from "./trainers-table"
import { StatsCards } from "./stats-cards"

export default function Trainers() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Trainers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your gym trainers and their workload.
          </p>
        </div>

        <Link
          href="/dashboard/trainers/create"
          className={cn(buttonVariants({ size: "lg" }), "gap-2 self-start sm:self-auto")}
        >
          <Plus className="size-4" />
          Add New Trainer
        </Link>
      </header>

      {/* Stats */}
      <StatsCards />

      {/* Table */}
      <TrainersTable />
    </div>
  )
}
