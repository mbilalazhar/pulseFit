import type { TrainerSummary } from "@/lib/services/trainer.services"

export const ITEMS_PER_PAGE = 7

export type TabValue = "All" | "Contractor" | "OnLeave"

export const TABS: Array<{ label: string; value: TabValue }> = [
  { label: "All Trainers", value: "All" },
  { label: "Private Contractors", value: "Contractor" },
  { label: "On Leave", value: "OnLeave" },
]

export const matchesTab = (trainer: TrainerSummary, tab: TabValue) => {
  if (tab === "Contractor") return trainer.trainerType === "CONTRACTOR"
  if (tab === "OnLeave") return trainer.status === "ON_LEAVE"
  return true
}

/* A single page's worth or less needs no pager. */
export const showsPagination = (count: number) => count > ITEMS_PER_PAGE

export const pageCount = (count: number) =>
  Math.max(1, Math.ceil(count / ITEMS_PER_PAGE))

/* Staff carry a daily schedule; contractors carry a weekly session count. */
export function schedule(trainer: TrainerSummary) {
  if (trainer.trainerType === "CONTRACTOR") {
    const sessions = trainer.sessionsPerWeek
    return {
      primary: sessions ? `${sessions} ${sessions === 1 ? "session" : "sessions"} / week` : "—",
      secondary:
        trainer.contractorPaymentType === "FIXED_FEE" ? "Fixed monthly fee" : "Per session",
    }
  }
  return {
    primary: trainer.workHoursPerDay ? `${trainer.workHoursPerDay}h / day` : "—",
    secondary: trainer.workDaysPerWeek ? `${trainer.workDaysPerWeek} days / week` : "—",
  }
}
