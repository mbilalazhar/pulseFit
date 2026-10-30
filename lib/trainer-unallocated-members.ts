import { prisma } from "@/lib/prisma"

export async function getUnallocatedTrainerMembers(gymId: string, trainerId: string, now = new Date()) {
  const members = await prisma.member.findMany({
    where: {
      gymId,
      deletedAt: null,
      assignments: { some: { gymId, trainerId, endedAt: null } },
      // Allocation is all-or-none. A saved upcoming booking means the member
      // already has an allocation; do not show a partial weekly remainder.
      trainingSessions: { none: { gymId, trainerId, status: "SCHEDULED", endsAt: { gt: now } } },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      subscriptions: {
        where: { gymId, status: { in: ["ACTIVE", "INACTIVE"] } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          status: true,
          planNameSnapshot: true,
          sessionsPerWeek: true,
          sessionDurationMinutes: true,
        },
      },
    },
  })

  return members.map((member) => {
    const subscription = member.subscriptions.find((item) => item.status === "ACTIVE")
      ?? member.subscriptions[0]
    return {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      planName: subscription?.planNameSnapshot ?? null,
      // Use the member's purchased allowance, including any custom sessions.
      sessionsPerWeek: subscription?.sessionsPerWeek ?? null,
      sessionDurationMinutes: subscription?.sessionDurationMinutes ?? null,
    }
  })
}

export type UnallocatedTrainerMember = Awaited<ReturnType<typeof getUnallocatedTrainerMembers>>[number]
