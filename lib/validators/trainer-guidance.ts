import { z } from "zod"

export const trainerGuidanceSchema = z.object({
  sessionsPerWeek: z.number().int("Weekly sessions must be a whole number")
    .min(1, "Choose at least one session per week").max(21, "Choose no more than 21 sessions per week"),
  sessionDurationMinutes: z.number().int("Session length must be a whole number of minutes")
    .min(1, "Enter a session length of at least one minute").max(1440, "Session length cannot exceed 24 hours"),
})
