import { prisma } from "@/lib/prisma"
import { ATTENDANCE_LIMIT_MS } from "@/lib/attendance"

// Conditional SQL makes concurrent workers/manual checkouts safe. A delayed sweep
// always records the six-hour deadline, never the time the worker happened to run.
export async function closeOverdueAttendance(gymId?: string, now = new Date()) {
  const cutoff = new Date(now.getTime() - ATTENDANCE_LIMIT_MS)
  return prisma.$executeRaw`
    UPDATE "Attendance"
    SET "checkOutAt" = "checkInAt" + INTERVAL '6 hours', "durationMinutes" = 360
    WHERE "checkOutAt" IS NULL AND "checkInAt" <= ${cutoff}
      AND (${gymId ?? null}::text IS NULL OR "gymId" = ${gymId ?? null})
  `
}
