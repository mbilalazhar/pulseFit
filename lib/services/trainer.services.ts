import type { TrainerAvailability } from "@/lib/trainer-availability"
import type { TrainerWorkload } from "@/lib/trainer-workload"

export type TrainerType = "STAFF" | "CONTRACTOR"
export type TrainerShift = "MORNING" | "EVENING" | "NIGHT" | "FLEXIBLE"
export type ContractorPaymentType = "FIXED_FEE" | "SESSION_BASED"

export type CreateStaffTrainerPayload = {
  trainerType: "STAFF"
  fullName: string
  email: string
  contactNumber: string
  joiningDate: string
  monthlySalary: number
  availability: TrainerAvailability[]
  shift: TrainerShift
  specializations: string[]
  certifications: string[]
}

export type CreateContractorTrainerPayload = {
  trainerType: "CONTRACTOR"
  fullName: string
  email: string
  contactNumber: string
  joiningDate: string
  paymentType: ContractorPaymentType
  amount: number
  sessions: TrainerAvailability[]
}

export type CreateTrainerPayload =
  | CreateStaffTrainerPayload
  | CreateContractorTrainerPayload

export type CreateTrainerResponse = {
  message: string
  trainer: {
    id: string
    fullName: string
    email: string
    trainerType: TrainerType
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const fields = data?.error && typeof data.error === "object"
      ? Object.values(data.error).flat().filter((value): value is string => typeof value === "string")
      : []
    throw new Error(fields.length ? fields.join(" ") : data?.message ?? "Something went wrong. Please try again.")
  }

  return data as T
}

export async function createTrainer(
  payload: CreateTrainerPayload,
): Promise<CreateTrainerResponse> {
  const response = await fetch("/api/trainer/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return parseResponse<CreateTrainerResponse>(response)
}

/* ---------- reading trainers ---------- */

export async function updateTrainer(id: string, payload: CreateTrainerPayload): Promise<CreateTrainerResponse> {
  const response = await fetch(`/api/trainer/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return parseResponse<CreateTrainerResponse>(response)
}

export type TrainerStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE"

export type TrainerSummary = {
  id: string
  fullName: string
  email: string
  contactNumber: string
  trainerType: TrainerType
  status: TrainerStatus
  profilePhotoUrl: string | null
  workHoursPerDay: number | null
  workDaysPerWeek: number | null
  availability: TrainerAvailability[]
  shift: TrainerShift | null
  contractorPaymentType: ContractorPaymentType | null
  sessionsPerWeek: number | null
  joiningDate: string | null
  certifications: string[]
  specializations: { id: string; name: string }[]
  packageCount: number
  memberCount: number
  unallocatedMemberCount: number
  workload: TrainerWorkload
}

export type GetTrainersResponse = {
  trainers: TrainerSummary[]
}

export async function getTrainers(): Promise<GetTrainersResponse> {
  const response = await fetch("/api/trainer", { method: "GET", cache: "no-store" })

  return parseResponse<GetTrainersResponse>(response)
}
