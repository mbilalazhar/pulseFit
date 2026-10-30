import type { TrainerAvailability } from "@/lib/trainer-availability"
import type { AllocationInput, ScheduleSession } from "@/lib/trainer-scheduling"
import type { UnallocatedTrainerMember } from "@/lib/trainer-unallocated-members"

export type TrainerScheduleData = {
  weekStart: string
  today: string
  timeZone: string
  trainerStatus: "ACTIVE" | "INACTIVE" | "ON_LEAVE"
  availability: TrainerAvailability[]
  sessions: ScheduleSession[]
  members: UnallocatedTrainerMember[]
}

async function responseData<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message ?? "Could not update the schedule. Please try again.")
  return data as T
}

export async function getTrainerSchedule(trainerId: string, week: string): Promise<TrainerScheduleData> {
  return responseData(await fetch(`/api/trainer/${encodeURIComponent(trainerId)}/schedule?week=${encodeURIComponent(week)}`, { cache: "no-store" }))
}

export async function allocateTrainerSessions(trainerId: string, input: AllocationInput): Promise<{ count: number }> {
  return responseData(await fetch(`/api/trainer/${encodeURIComponent(trainerId)}/schedule`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }))
}
