import type { TrainerAvailability } from "@/lib/trainer-availability"
import type { ContractorPaymentType, TrainerShift, TrainerType } from "@/lib/services/trainer.services"

export type TrainerFormData = {
  id: string
  fullName: string
  email: string
  contactNumber: string
  trainerType: TrainerType
  joiningDate: string | null
  monthlySalary: number | null
  shift: TrainerShift | null
  contractorPaymentType: ContractorPaymentType | null
  fixedFeeAmount: number | null
  sessionRate: number | null
  availability: TrainerAvailability[]
  specializations: string[]
  certifications: string[]
  profilePhotoUrl: string | null
}

export function trainerScheduleFields(availability: TrainerAvailability[]) {
  const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
  return [...availability]
    .sort((a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7) || a.startMinute - b.startMinute)
    .map((day) => ({ dayOfWeek: day.dayOfWeek, startTime: time(day.startMinute), endTime: time(day.endMinute) }))
}
