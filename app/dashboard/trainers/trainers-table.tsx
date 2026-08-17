"use client"

import { useState, useMemo } from "react"
import { trainersData, type TrainerStatus } from "./data"
import { WorkloadRing } from "./workload-ring"
import { User, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 2

const STATUS_BADGE: Record<TrainerStatus, string> = {
  Active: "bg-green-100 text-green-700",
  "On Leave": "bg-orange-100 text-orange-700",
  "Applied Leave": "bg-blue-50 text-blue-500",
}

const STATUS_TABS: Array<{ label: string; value: TrainerStatus | "All" }> = [
  { label: "All Trainers", value: "All" },
  { label: "On Leave", value: "On Leave" },
]

export function TrainersTable() {
  const [activeStatus, setActiveStatus] = useState<TrainerStatus | "All">("All")
  const [currentPage, setCurrentPage] = useState(1)

  const filteredTrainers = useMemo(() => {
    if (activeStatus === "All") return trainersData
    return trainersData.filter((t) => t.status === activeStatus)
  }, [activeStatus])

  const totalPages = Math.ceil(filteredTrainers.length / ITEMS_PER_PAGE)
  const paginatedTrainers = filteredTrainers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const handleStatusChange = (status: TrainerStatus | "All") => {
    setActiveStatus(status)
    setCurrentPage(1)
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      {/* Header tabs */}
      <div className="border-b px-6">
        <div className="flex gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className={cn(
                "border-b-2 px-4 py-4 text-sm font-medium transition-colors",
                activeStatus === tab.value
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-8 py-3 text-left font-medium whitespace-nowrap text-muted-foreground">
                Trainer
              </th>
              <th className="px-8 py-3 text-left font-medium whitespace-nowrap text-muted-foreground">
                Status
              </th>
              <th className="px-8 py-3 text-left font-medium whitespace-nowrap text-muted-foreground">
                Members
              </th>
              <th className="px-8 py-3 text-left font-medium whitespace-nowrap text-muted-foreground">
                Workload
              </th>
              <th className="px-8 py-3 text-left font-medium whitespace-nowrap text-muted-foreground">
                Work Hours
              </th>
              <th className="px-8 py-3 text-left font-medium whitespace-nowrap text-muted-foreground">
                Salary
              </th>
              <th className="px-8 py-3 text-left font-medium whitespace-nowrap text-muted-foreground">
                Packages
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedTrainers.length > 0 ? (
              paginatedTrainers.map((trainer) => (
                <tr key={trainer.id} className="border-b transition-colors hover:bg-muted/30">
                  {/* Trainer */}
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <User className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{trainer.name}</p>
                        <p className="text-xs text-muted-foreground">{trainer.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-8 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-block rounded-full px-3 py-1 text-xs font-medium",
                        STATUS_BADGE[trainer.status],
                      )}
                    >
                      {trainer.status}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">{trainer.statusNote}</p>
                  </td>

                  {/* Members */}
                  <td className="px-8 py-4 whitespace-nowrap">
                    <p className="font-medium text-foreground">{trainer.membersCount}</p>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      View members
                    </button>
                  </td>

                  {/* Workload */}
                  <td className="px-8 py-4">
                    <WorkloadRing percent={trainer.workloadPercent} label={trainer.workloadLabel} />
                  </td>

                  {/* Work Hours */}
                  <td className="px-8 py-4 whitespace-nowrap">
                    <p className="text-foreground">{trainer.workingHours}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{trainer.workHoursPerDay}</p>
                  </td>

                  {/* Salary */}
                  <td className="px-8 py-4 whitespace-nowrap">
                    <p className="font-medium text-foreground">{trainer.salary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{trainer.salaryNote}</p>
                  </td>

                  {/* Packages */}
                  <td className="px-8 py-4 whitespace-nowrap">
                    <p className="font-medium text-foreground">{trainer.packagesCount}</p>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-8 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No trainers in this category.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginatedTrainers.length > 0 ? (
        <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex size-9 items-center justify-center rounded-lg border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              aria-current={currentPage === page ? "page" : undefined}
              onClick={() => setCurrentPage(page)}
              className={cn(
                "size-9 rounded-lg text-sm font-semibold transition-colors",
                currentPage === page
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            aria-label="Next page"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex size-9 items-center justify-center rounded-lg border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
