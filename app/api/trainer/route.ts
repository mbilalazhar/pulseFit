import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { dateInTimeZone } from "@/lib/member-status";
import { shiftDate } from "@/lib/attendance";
import { gymInstant, mondayOf } from "@/lib/trainer-scheduling";
import { calculateTrainerWorkload } from "@/lib/trainer-workload";
import { prioritizeTrainers, unallocatedMemberCounts } from "@/lib/trainer-allocation-priority";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { message: "User Not authenticated for this request" },
        { status: 401 },
      );
    }

    const gym = await prisma.gym.findUniqueOrThrow({ where: { id: session.gymId }, select: { timeZone: true } });
    const now = new Date();
    const weekStart = mondayOf(dateInTimeZone(gym.timeZone, now));
    const [trainers, assignments, upcomingSessions] = await Promise.all([
      prisma.trainer.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: "desc" },
      include: {
        availability: { select: { dayOfWeek: true, startMinute: true, endMinute: true } },
        specializations: {
          select: { specialization: { select: { id: true, name: true } } },
        },
        sessions: {
          where: {
            gymId: session.gymId, status: { not: "CANCELED" },
            startsAt: { lt: gymInstant(shiftDate(weekStart, 7), 0, gym.timeZone, false) },
            endsAt: { gt: gymInstant(weekStart, 0, gym.timeZone, false) },
          },
          select: { id: true, startsAt: true, endsAt: true, status: true },
        },
        _count: { select: { packages: true, assignments: { where: { gymId: session.gymId, endedAt: null, member: { deletedAt: null } } } } },
      },
      }),
      prisma.memberTrainerAssignment.findMany({
        where: { gymId: session.gymId, endedAt: null, member: { deletedAt: null } },
        select: { trainerId: true, memberId: true },
      }),
      prisma.trainingSession.findMany({
        where: { gymId: session.gymId, status: "SCHEDULED", endsAt: { gt: now } },
        select: { trainerId: true, memberId: true },
        distinct: ["trainerId", "memberId"],
      }),
    ]);
    const pendingCounts = unallocatedMemberCounts(assignments, upcomingSessions);

    const shaped = trainers.map((trainer) => ({
      id: trainer.id,
      fullName: trainer.fullName,
      email: trainer.email,
      contactNumber: trainer.contactNumber,
      trainerType: trainer.trainerType,
      status: trainer.status,
      profilePhotoUrl: trainer.profilePhotoUrl,
      workHoursPerDay: trainer.workHoursPerDay,
      workDaysPerWeek: trainer.workDaysPerWeek,
      availability: trainer.availability,
      shift: trainer.shift,
      contractorPaymentType: trainer.contractorPaymentType,
      sessionsPerWeek: trainer.sessionsPerWeek,
      joiningDate: trainer.joiningDate,
      certifications: trainer.certifications,
      specializations: trainer.specializations.map((s) => s.specialization),
      packageCount: trainer._count.packages,
      memberCount: trainer._count.assignments,
      unallocatedMemberCount: pendingCounts.get(trainer.id) ?? 0,
      workload: calculateTrainerWorkload(trainer.availability, trainer.sessions, weekStart, gym.timeZone),
    }));

    return NextResponse.json({ trainers: prioritizeTrainers(shaped) }, { status: 200, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Fetch trainers error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
