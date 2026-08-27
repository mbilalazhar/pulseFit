import type {
  ContractorPaymentType,
  TrainerShift,
  TrainerStatus,
  TrainerType,
} from "@/lib/services/trainer.services"

/* Everything the detail page renders, shaped once in the page so the panels
   stay presentational. Mirrors the logic/markup split used by the list
   (`trainers-table-logic.ts`). */
export type TrainerDetail = {
  id: string
  fullName: string
  email: string
  contactNumber: string
  trainerType: TrainerType
  status: TrainerStatus
  profilePhotoUrl: string | null
  bio: string | null
  yearsExperience: number | null
  certifications: string[]
  specializations: { id: string; name: string }[]
  joiningDate: Date | null
  monthlySalary: number | null
  workHoursPerDay: number | null
  workDaysPerWeek: number | null
  shift: TrainerShift | null
  contractorPaymentType: ContractorPaymentType | null
  fixedFeeAmount: number | null
  sessionRate: number | null
  sessionsPerWeek: number | null
  packages: {
    id: string
    name: string
    type: "TRAINING" | "CONSULTATION"
    duration: number
    price: number
  }[]
}

/* Stands in for every value the schema cannot supply yet — member counts,
   workload, salary payment history, session bookings. */
export const NOT_TRACKED = "—"

export const formatPkr = (amount: number | null | undefined) =>
  typeof amount === "number" ? `PKR ${amount.toLocaleString("en-US")}` : NOT_TRACKED

export const formatDate = (value: Date | null | undefined) =>
  value
    ? value.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : NOT_TRACKED

export const formatHours = (hours: number | null) =>
  typeof hours === "number" ? `${hours} Hour${hours === 1 ? "" : "s"}` : NOT_TRACKED

export const formatYears = (years: number | null) =>
  typeof years === "number" ? `${years} Year${years === 1 ? "" : "s"}` : NOT_TRACKED

export const formatMinutes = (minutes: number) => `${minutes} Min`

export const SHIFT_LABEL: Record<TrainerShift, string> = {
  MORNING: "Morning",
  EVENING: "Evening",
  NIGHT: "Night",
  FLEXIBLE: "Flexible",
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

/* Only a count of working days is stored, not which days. Weeks are assumed to
   start on Monday, so 6 days reads as Mon - Sat. */
export const workingDaysLabel = (days: number | null) => {
  if (typeof days !== "number" || days < 1) return NOT_TRACKED
  if (days === 1) return WEEKDAYS[0]
  if (days >= WEEKDAYS.length) return `${WEEKDAYS[0]} - ${WEEKDAYS[WEEKDAYS.length - 1]}`
  return `${WEEKDAYS[0]} - ${WEEKDAYS[days - 1]}`
}

export const isWorkingDay = (dayIndex: number, days: number | null) =>
  typeof days === "number" && dayIndex < days

/* Optional profile fields only — the required ones are collected at creation,
   so counting them would peg every trainer well above zero. */
export function profileCompletion(trainer: TrainerDetail) {
  const filled = [
    Boolean(trainer.profilePhotoUrl),
    Boolean(trainer.bio?.trim()),
    typeof trainer.yearsExperience === "number",
    trainer.certifications.length > 0,
    trainer.specializations.length > 0,
    trainer.joiningDate !== null,
    trainer.packages.length > 0,
  ].filter(Boolean).length

  const percent = Math.round((filled / 7) * 100)

  const message =
    percent === 100
      ? "This profile is complete."
      : percent >= 70
        ? "Great! Almost done."
        : percent >= 40
          ? "Getting there — a few details are still missing."
          : "Most of this profile is still empty."

  return { percent, message }
}
