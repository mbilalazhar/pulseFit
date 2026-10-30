import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PlanForm } from "../../create/plan-form"

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")

  const { id } = await params
  const plan = await prisma.plan.findFirst({
    where: { id, gymId: session.gymId },
    select: {
      id: true, name: true, shortDesc: true, longDesc: true,
      basePriceMinor: true, currency: true, maxHoursPerDay: true, status: true,
      sessionsPerWeek: true, sessionDurationMinutes: true,
      features: { select: { id: true, label: true } },
      durations: {
        select: { id: true, label: true, durationMonths: true, discountPercent: true },
        orderBy: { durationMonths: "asc" },
      },
      _count: { select: { memberSubscriptions: true } },
    },
  })
  if (!plan) notFound()
  if (plan.status === "ACTIVE") redirect("/dashboard/plans")

  return <PlanForm initialPlan={{ ...plan, memberCount: plan._count.memberSubscriptions }} />
}
