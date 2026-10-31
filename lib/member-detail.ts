import { prisma } from "@/lib/prisma"

/** The caller must authenticate an admin before passing their session's gym ID. */
export function getMemberDetail(gymId: string, memberId: string, now = new Date()) {
  return prisma.member.findFirst({
    where: { id: memberId, gymId, deletedAt: null },
    select: {
      id: true, name: true, phone: true, email: true, status: true, joinedAt: true,
      gym: { select: { timeZone: true } },
      assignments: {
        where: { gymId, endedAt: null }, orderBy: [{ startedAt: "desc" }, { id: "desc" }],
        select: { id: true, trainer: { select: { id: true, fullName: true } } },
      },
      subscriptions: {
        where: { gymId, status: { not: "CANCELLED" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true, planNameSnapshot: true, durationMonths: true, startDate: true, endDate: true,
          status: true, finalMinor: true, currency: true, paymentDueDate: true,
          sessionsPerWeek: true, sessionDurationMinutes: true,
          payments: {
            where: { gymId }, orderBy: [{ paidAt: "desc" }, { id: "desc" }],
            select: { id: true, kind: true, amountMinor: true, currency: true, method: true, paidAt: true },
          },
        },
      },
      attendance: {
        where: { gymId, checkInAt: { lte: now } }, orderBy: { attendanceDate: "asc" },
        select: { id: true, attendanceDate: true, checkInAt: true, checkOutAt: true, durationMinutes: true },
      },
      measurements: {
        where: { gymId, measuredAt: { lte: now } }, orderBy: [{ measuredAt: "desc" }, { id: "desc" }], take: 2,
        select: { measuredAt: true, weightKg: true, bodyFatPct: true, muscleMassKg: true },
      },
      goals: { where: { gymId }, orderBy: { id: "asc" }, select: { id: true, type: true, description: true, achievedAt: true } },
      notes: { where: { gymId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 10, select: { id: true, body: true, createdAt: true } },
      trainingSessions: {
        where: { gymId, status: "SCHEDULED", endsAt: { gt: now } }, orderBy: [{ startsAt: "asc" }, { id: "asc" }], take: 8,
        select: { id: true, startsAt: true, endsAt: true, trainer: { select: { id: true, fullName: true } } },
      },
    },
  })
}
