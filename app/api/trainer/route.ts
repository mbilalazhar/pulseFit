import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { message: "User Not authenticated for this request" },
        { status: 401 },
      );
    }

    const trainers = await prisma.trainer.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: "desc" },
      include: {
        specializations: {
          select: { specialization: { select: { id: true, name: true } } },
        },
        _count: { select: { packages: true } },
      },
    });

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
      shift: trainer.shift,
      contractorPaymentType: trainer.contractorPaymentType,
      sessionsPerWeek: trainer.sessionsPerWeek,
      joiningDate: trainer.joiningDate,
      certifications: trainer.certifications,
      specializations: trainer.specializations.map((s) => s.specialization),
      packageCount: trainer._count.packages,
    }));

    return NextResponse.json({ trainers: shaped }, { status: 200 });
  } catch (error) {
    console.error("Fetch trainers error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
