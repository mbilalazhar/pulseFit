import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPlanSchema } from "@/lib/validators/plan";

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]),
}).strict();

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Not Authenticated" }, { status: 401 });
    }
    const { id } = await params;
    const parsed = createPlanSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid Data", error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const existing = await prisma.plan.findFirst({
      where: { id, gymId: session.gymId }, select: { status: true },
    });
    if (!existing) return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    if (existing.status === "ACTIVE") {
      return NextResponse.json({ message: "Deactivate this plan before editing it" }, { status: 409 });
    }
    const { features, durations, ...data } = parsed.data;
    // Nested writes are atomic; the status condition also guards concurrent activation.
    const plan = await prisma.plan.update({
      where: { id, gymId: session.gymId, status: { in: ["DRAFT", "INACTIVE"] } },
      data: {
        ...data,
        name: data.name || `Untitled draft ${crypto.randomUUID()}`,
        longDesc: data.longDesc || null,
        maxHoursPerDay: data.maxHoursPerDay ?? null,
        features: { deleteMany: {}, create: features },
        durations: { deleteMany: {}, create: durations },
      },
      select: { id: true, name: true, status: true, basePriceMinor: true, currency: true },
    });
    return NextResponse.json({ message: "Plan updated", plan });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json({ message: "A plan with this name already exists in your gym" }, { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json({ message: "This plan is no longer available for editing. Refresh the plans page." }, { status: 409 });
      }
    }
    console.error("Update plan error:", error);
    return NextResponse.json({ message: "Error updating plan" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Not Authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid Data", error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.plan.findFirst({
      where: { id, gymId: session.gymId },
      include: { features: true, durations: true },
    });
    if (!existing) return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    if (existing.status === "ACTIVE" && parsed.data.status !== "INACTIVE") {
      return NextResponse.json({ message: "Deactivate this plan before making any changes" }, { status: 409 });
    }
    if (parsed.data.status === "ACTIVE") {
      const ready = createPlanSchema.safeParse({ ...existing, status: "ACTIVE", longDesc: existing.longDesc ?? undefined });
      if (!ready.success) {
        return NextResponse.json({
          message: "Complete the plan details before activating it",
          error: ready.error.flatten().fieldErrors,
        }, { status: 400 });
      }
    }
    // Reject activation if the saved details changed after validation.
    const result = await prisma.plan.updateMany({
      where: { id, gymId: session.gymId, status: existing.status, updatedAt: existing.updatedAt },
      data: { status: parsed.data.status },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: "This plan changed. Refresh the plans page and try again." }, { status: 409 });
    }

    return NextResponse.json(
      { message: "Plan status updated", status: parsed.data.status },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update plan status error:", error);
    return NextResponse.json(
      { message: "Error updating plan status" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Not Authenticated" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.plan.findFirst({
      where: { id, gymId: session.gymId }, select: { status: true },
    });
    if (!existing) return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    if (existing.status === "ACTIVE") {
      return NextResponse.json({ message: "Deactivate this plan before deleting it" }, { status: 409 });
    }

    // Guard: refuse to delete a plan assigned to members or subscriptions —
    // deactivating is the safe path until no members remain.
    const subscribers = await prisma.memberSubscription.count({ where: { planId: id, gymId: session.gymId } });
    if (subscribers > 0) {
      return NextResponse.json(
        {
          message:
            "This plan still has subscribed members. Deactivate it instead, and delete it once no members remain.",
        },
        { status: 409 },
      );
    }

    // Scoped to the caller's gym; features and durations cascade automatically.
    const result = await prisma.plan.deleteMany({
      where: { id, gymId: session.gymId, status: { in: ["DRAFT", "INACTIVE"] } },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Plan deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete plan error:", error);
    return NextResponse.json(
      { message: "Error deleting plan" },
      { status: 500 },
    );
  }
}
