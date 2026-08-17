import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateStatusSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]),
});

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
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid Data", error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Scope the update to the caller's gym so one gym can't touch another's plans.
    const result = await prisma.plan.updateMany({
      where: { id, gymId: session.gymId },
      data: { status: parsed.data.status },
    });

    if (result.count === 0) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
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

    // Guard: refuse to delete a plan that still has member subscriptions —
    // deactivating is the safe path until no members remain.
    const subscribers = await prisma.memberSubscription.count({
      where: { planId: id, gymId: session.gymId },
    });
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
      where: { id, gymId: session.gymId },
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
