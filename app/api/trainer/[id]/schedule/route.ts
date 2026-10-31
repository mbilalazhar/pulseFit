import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dateInTimeZone } from "@/lib/member-status"
import { shiftDate } from "@/lib/attendance"
import { getUnallocatedTrainerMembers } from "@/lib/trainer-unallocated-members"
import { allocationSchema, gymInstant, mondayOf, overlaps, prepareAllocation, scheduleSegments } from "@/lib/trainer-scheduling"
import { calculateTrainerWorkload } from "@/lib/trainer-workload"

type Context = { params: Promise<{ id: string }> }
class AllocationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export async function GET(req: Request, context: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    const { id } = await context.params
    const trainer = await prisma.trainer.findFirst({ where: { id, gymId: session.gymId }, include: { gym: { select: { timeZone: true } }, availability: true, _count: { select: { assignments: { where: { gymId: session.gymId, endedAt: null, member: { deletedAt: null } } } } } } })
    if (!trainer) return NextResponse.json({ message: "Trainer not found" }, { status: 404 })
    const now = new Date()
    const today = dateInTimeZone(trainer.gym.timeZone, now)
    const requested = new URL(req.url).searchParams.get("week") ?? today
    if (!z.iso.date().safeParse(requested).success || requested < "1900-01-01" || requested > "9998-12-31") return NextResponse.json({ message: "Choose a valid week" }, { status: 400 })
    const weekStart = mondayOf(requested)
    const [records, members] = await Promise.all([
      prisma.trainingSession.findMany({
        where: { gymId: session.gymId, trainerId: id, status: { not: "CANCELED" }, startsAt: { lt: gymInstant(shiftDate(weekStart, 7), 0, trainer.gym.timeZone, false) }, endsAt: { gt: gymInstant(weekStart, 0, trainer.gym.timeZone, false) } },
        include: { member: { select: { name: true } } }, orderBy: { startsAt: "asc" },
      }),
      getUnallocatedTrainerMembers(session.gymId, id, now),
    ])
    return NextResponse.json({
      weekStart, today, timeZone: trainer.gym.timeZone, trainerStatus: trainer.status,
      availability: trainer.availability.map(({ dayOfWeek, startMinute, endMinute }) => ({ dayOfWeek, startMinute, endMinute })),
      sessions: records.flatMap((record) => scheduleSegments(record, weekStart, trainer.gym.timeZone)), members,
      memberCount: trainer._count.assignments,
      workload: calculateTrainerWorkload(trainer.availability, records, weekStart, trainer.gym.timeZone),
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Load trainer schedule:", error)
    return NextResponse.json({ message: "Could not load the trainer's schedule" }, { status: 500 })
  }
}

export async function POST(req: Request, context: Context) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    const { id } = await context.params
    const parsed = allocationSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ message: "Select a member, week, and valid session times" }, { status: 400 })
    const input = parsed.data
    const result = await prisma.$transaction(async (tx) => {
      const trainer = await tx.trainer.findFirst({ where: { id, gymId: session.gymId }, include: { availability: true, gym: { select: { timeZone: true } } } })
      if (!trainer) throw new AllocationError("Trainer not found", 404)
      if (trainer.status !== "ACTIVE") throw new AllocationError("Sessions can only be allocated to an active trainer.")
      const member = await tx.member.findFirst({
        where: { id: input.memberId, gymId: session.gymId, deletedAt: null, assignments: { some: { gymId: session.gymId, trainerId: id, endedAt: null } } },
        include: { subscriptions: { where: { gymId: session.gymId, status: { in: ["ACTIVE", "INACTIVE"] } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] } },
      })
      if (!member) throw new AllocationError("Member is not currently assigned to this trainer in your gym.", 404)
      if (member.status === "FROZEN") throw new AllocationError("This member's membership is frozen.")
      const subscription = member.subscriptions.find((item) => item.status === "ACTIVE") ?? member.subscriptions[0]
      if (!subscription?.sessionsPerWeek || !subscription.sessionDurationMinutes) throw new AllocationError("Configure this member's weekly session allowance and session length first.")
      const now = new Date()
      let slots: { startsAt: Date; endsAt: Date }[]
      try {
        slots = prepareAllocation(input, {
          availability: trainer.availability, timeZone: trainer.gym.timeZone,
          sessionsPerWeek: subscription.sessionsPerWeek, sessionDurationMinutes: subscription.sessionDurationMinutes,
          membershipStart: subscription.startDate.toISOString().slice(0, 10), membershipEnd: subscription.endDate.toISOString().slice(0, 10), now,
        })
      } catch (error) { throw new AllocationError(error instanceof Error ? error.message : "Invalid session times") }
      const existingAllocation = await tx.trainingSession.findFirst({ where: { gymId: session.gymId, trainerId: id, memberId: member.id, status: "SCHEDULED", endsAt: { gt: now } } })
      if (existingAllocation) throw new AllocationError("This member already has upcoming allocated sessions. Refresh the schedule.", 409)
      const weekStart = gymInstant(input.weekStart, 0, trainer.gym.timeZone, false)
      const weekEnd = gymInstant(shiftDate(input.weekStart, 7), 0, trainer.gym.timeZone, false)
      const existing = await tx.trainingSession.findMany({ where: {
        gymId: session.gymId, status: { not: "CANCELED" },
        OR: [{ trainerId: id }, { memberId: member.id }],
        startsAt: { lt: weekEnd }, endsAt: { gt: weekStart },
      } })
      if (existing.some((booking) => booking.memberId === member.id)) throw new AllocationError("This member already has sessions in the selected week.", 409)
      if (existing.some((booking) => slots.some((slot) => overlaps(booking, slot)))) throw new AllocationError("A selected time is already booked. Refresh and choose another time.", 409)
      return tx.trainingSession.createMany({ data: slots.map((slot) => ({ gymId: session.gymId, trainerId: id, memberId: member.id, ...slot })) })
    }, { isolationLevel: "Serializable" })
    return NextResponse.json({ message: "Sessions allocated", count: result.count }, { status: 201 })
  } catch (error) {
    if (error instanceof AllocationError) return NextResponse.json({ message: error.message }, { status: error.status })
    if (error && typeof error === "object" && "code" in error && ["P2034", "P2002"].includes(String(error.code))) return NextResponse.json({ message: "The schedule changed while saving. Refresh and try again." }, { status: 409 })
    console.error("Allocate trainer sessions:", error)
    return NextResponse.json({ message: "Could not allocate sessions" }, { status: 500 })
  }
}
