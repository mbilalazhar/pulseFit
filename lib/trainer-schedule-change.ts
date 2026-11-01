import { z } from "zod"
import type { TrainerAvailability } from "@/lib/trainer-availability"

export const scheduleConfirmationSchema = z.object({
  confirmed: z.literal(true),
  revision: z.string().min(1),
  sessions: z.array(z.object({
    sessionId: z.string().min(1),
    trainerId: z.string().min(1),
    date: z.iso.date().refine((date) => date >= "1900-01-01" && date <= "9998-12-31"),
    startMinute: z.number().int().min(0).max(1439),
  })).max(5000),
})

export type ScheduleConfirmation = z.infer<typeof scheduleConfirmationSchema>
export type ScheduleChangeReview = {
  revision: string
  trainerId: string
  timeZone: string
  trainers: { id: string; fullName: string; availability: TrainerAvailability[] }[]
  sessions: {
    id: string
    memberId: string
    memberName: string
    canTransfer: boolean
    startsAt: string
    endsAt: string
    date: string
    startMinute: number
    duration: number
    needsNewTime: boolean
  }[]
}
