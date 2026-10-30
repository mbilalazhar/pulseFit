"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, ArrowRight, Loader2Icon, OctagonAlert } from "lucide-react"
import { getTrainers } from "@/lib/services/trainer.services"
import {
  ITEMS_PER_PAGE,
  TABS,
  matchesTab,
  pageCount,
  schedule,
  showsPagination,
  type TabValue,
} from "./trainers-table-logic"
import { STATUS_BADGE, STATUS_LABEL } from "./trainer-status"
import { TrainerAvatar } from "./trainer-avatar"
import { cn } from "@/lib/utils"

/* Header labels and rows share one track definition so columns stay aligned
   without a <table> — rows need to be links, which a <tr> cannot be. */
const ROW_GRID =
  "grid items-center gap-4 grid-cols-[minmax(200px,2.4fr)_minmax(130px,1.1fr)_minmax(100px,0.9fr)_minmax(70px,0.5fr)_minmax(80px,0.5fr)_minmax(130px,1fr)_minmax(80px,0.5fr)_28px]"

export function TrainersTable() {
  const [activeTab, setActiveTab] = useState<TabValue>("All")
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["trainers"],
    queryFn: getTrainers,
  })

  const trainers = useMemo(() => data?.trainers ?? [], [data])

  const filteredTrainers = useMemo(
    () => trainers.filter((t) => matchesTab(t, activeTab)),
    [trainers, activeTab],
  )

  const totalPages = pageCount(filteredTrainers.length)
  /* Refetches can shrink the list under the current page — clamp rather than
     render an empty page. */
  const page = Math.min(currentPage, totalPages)
  const paginatedTrainers = filteredTrainers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  )

  const showPagination = showsPagination(filteredTrainers.length)

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Loading trainers...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl bg-destructive/5 p-4 text-sm text-destructive">
        <OctagonAlert className="mt-0.5 size-4 shrink-0" />
        <span>{(error as Error).message}</span>
      </div>
    )
  }

  return (
    <section aria-label="Trainer directory" className="min-w-0 space-y-3">
      {/* Tabs */}
      <div className="flex min-w-0 gap-1 overflow-x-auto border-b border-border/80">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={activeTab === tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-accent",
              activeTab === tab.value
                ? "border-rose-500 font-semibold text-rose-600 dark:text-rose-400"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl">
        <div className="min-w-[1060px]">
          {/* Column labels */}
          <div
            className={cn(
              ROW_GRID,
              "px-4 pt-1 pb-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase",
            )}
          >
            <span>Trainer</span>
            <span>Contact Number</span>
            <span>Status</span>
            <span>Members</span>
            <span>Workload</span>
            <span>Work Hours</span>
            <span>Packages</span>
            <span />
          </div>

          {/* Rows */}
          {paginatedTrainers.length > 0 ? (
            <div className="space-y-1">
              {paginatedTrainers.map((trainer) => {
                const hours = schedule(trainer)
                return (
                  <Link
                    key={trainer.id}
                    href={`/dashboard/trainers/${trainer.id}`}
                    className={cn(
                      ROW_GRID,
                      "group relative rounded-sm px-4 py-4 text-[13px]",
                      "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out",
                      /* Lift the row out of the list on hover. */
                      "hover:z-10 hover:-translate-y-1 hover:border-transparent hover:bg-card hover:shadow-lg hover:shadow-black/10",
                    )}
                  >
                    {/* Trainer */}
                    <div className="flex min-w-0 items-center gap-3">
                      <TrainerAvatar
                        src={trainer.profilePhotoUrl}
                        alt={trainer.fullName}
                        size={38}
                        className="size-[38px]"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-foreground">{trainer.fullName}</p>
                          {trainer.trainerType === "CONTRACTOR" ? (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              Contractor
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{trainer.email}</p>
                      </div>
                    </div>

                    {/* Contact Number */}
                    <span className="text-foreground">{trainer.contactNumber}</span>

                    {/* Status */}
                    <span>
                      <span
                        className={cn(
                          "inline-block rounded-full px-3 py-1 text-xs font-medium",
                          STATUS_BADGE[trainer.status],
                        )}
                      >
                        {STATUS_LABEL[trainer.status]}
                      </span>
                    </span>

                    {/* Members — no trainer/member relation exists yet. */}
                    <span className="font-medium text-foreground">0</span>

                    {/* Workload — derived from members, so also unavailable. */}
                    <span className="text-muted-foreground">—</span>

                    {/* Work Hours */}
                    <span>
                      <span className="block text-foreground">{hours.primary}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {hours.secondary}
                      </span>
                    </span>
                    {/* Packages */}
                    <span className="font-medium text-foreground">{trainer.packageCount}</span>

                    {/* Reveal-on-hover affordance */}
                    <ArrowRight
                      className="size-4 -translate-x-2 text-accent opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100"
                      strokeWidth={2.5}
                    />
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="border-b px-4 py-10 text-center text-sm text-muted-foreground">
              {trainers.length === 0
                ? "No trainers added yet."
                : "No trainers in this category."}
            </p>
          )}
        </div>
      </div>

      {/* Pagination — only once the list outgrows a single page. */}
      {showPagination ? (
        <div className="flex items-center justify-end gap-2 px-4 py-4">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setCurrentPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-5" strokeWidth={2.5} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              aria-current={page === p ? "page" : undefined}
              onClick={() => setCurrentPage(p)}
              className={cn(
                "size-9 rounded-lg text-sm font-semibold transition-colors",
                page === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            aria-label="Next page"
            onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </section>
  )
}
