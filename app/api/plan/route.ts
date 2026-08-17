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

    const plans = await prisma.plan.findMany({
      where: { gymId: session.gymId },
      orderBy: { createdAt: "desc" },
      include: {
        features: { select: { id: true, label: true } },
        durations: {
          select: {
            id: true,
            label: true,
            durationMonths: true,
            discountPercent: true,
          },
          orderBy: { durationMonths: "asc" },
        },
        _count: { select: { memberSubscriptions: true } },
      },
    });

    const shaped = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      shortDesc: plan.shortDesc,
      longDesc: plan.longDesc,
      basePriceMinor: plan.basePriceMinor,
      currency: plan.currency,
      status: plan.status,
      features: plan.features,
      durations: plan.durations,
      memberCount: plan._count.memberSubscriptions,
    }));

    return NextResponse.json({ plans: shaped }, { status: 200 });
  } catch (error) {
    console.error("Fetch plans error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
