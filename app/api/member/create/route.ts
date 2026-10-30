import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createMemberSchema } from "@/lib/validators/member"
import { memberStatusFromStartDate } from "@/lib/member-status"
import { membershipAmounts, membershipExpiry } from "@/lib/membership"
import { hasTrainerGuidance } from "@/lib/plan-features"
import { trainerGuidanceSchema } from "@/lib/validators/trainer-guidance"
import { requiresAdditionalTrainingCharge } from "@/lib/training-charges"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const parsed = createMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid Data", error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    const data = parsed.data

    const result = await prisma.$transaction(async (tx) => {
      const gym = await tx.gym.findUnique({
        where: { id: session.gymId },
        select: { timeZone: true },
      })
      if (!gym) return { message: "Gym not found", status: 404 } as const

      const plan = await tx.plan.findFirst({
        where: {
          id: data.planId,
          gymId: session.gymId,
          status: "ACTIVE",
        },
        select: {
          name: true,
          basePriceMinor: true,
          currency: true,
          features: { select: { label: true } },
          sessionsPerWeek: true,
          sessionDurationMinutes: true,
          durations: { where: { durationMonths: data.durationMonths }, select: { discountPercent: true } },
        },
      })
      if (!plan) {
        return { message: "Select an active plan from your gym", status: 400 } as const
      }

      const guidanceIncluded = hasTrainerGuidance(plan.features)
      let sessionsPerWeek: number | null = null
      let sessionDurationMinutes: number | null = null
      if (guidanceIncluded || data.trainerId) {
        if (!data.trainerId) return { message: "Assign an active trainer for a plan that includes trainer guidance", status: 400 } as const
        const guidance = trainerGuidanceSchema.safeParse({
          sessionsPerWeek: data.sessionsPerWeek === undefined && guidanceIncluded ? plan.sessionsPerWeek : data.sessionsPerWeek,
          sessionDurationMinutes: data.sessionDurationMinutes === undefined && guidanceIncluded ? plan.sessionDurationMinutes : data.sessionDurationMinutes,
        })
        if (!guidance.success) return { message: "Enter valid weekly sessions and session length for the assigned trainer", status: 400 } as const
        sessionsPerWeek = guidance.data.sessionsPerWeek
        sessionDurationMinutes = guidance.data.sessionDurationMinutes
      }

      if (!data.trainerId && (data.sessionsPerWeek != null || data.sessionDurationMinutes != null)) {
        return { message: "Assign a trainer for the requested training sessions", status: 400 } as const
      }
      const chargeRequired = !!data.trainerId && requiresAdditionalTrainingCharge(guidanceIncluded, plan, { sessionsPerWeek, sessionDurationMinutes })
      if (chargeRequired && data.additionalChargeMinor === undefined) {
        return { message: "Enter the additional training charge, or 0 if no extra charge applies", status: 400 } as const
      }
      const additionalChargeMinor = data.additionalChargeMinor ?? 0
      if (!chargeRequired && additionalChargeMinor > 0) {
        return { message: "Additional training charges apply only to training outside the plan allowance", status: 400 } as const
      }

      if (data.trainerId) {
        const trainer = await tx.trainer.findFirst({
          where: { id: data.trainerId, gymId: session.gymId, status: "ACTIVE" },
          select: { id: true },
        })
        if (!trainer) return { message: "Select an active trainer from your gym", status: 400 } as const
      }

      const now = new Date()
      if (data.paymentDate && memberStatusFromStartDate(data.paymentDate, gym.timeZone, now) === "INACTIVE") {
        return { message: "Payment date cannot be in the future", status: 400 } as const
      }
      const amounts = membershipAmounts(plan.basePriceMinor, data.durationMonths, plan.durations[0]?.discountPercent ?? 0,
        String(data.specialDiscountMinor / 100), String(data.amountReceivedMinor / 100), String(additionalChargeMinor / 100))
      if (amounts.planAmount > 2147483647 || amounts.finalAmount > 2147483647 || data.specialDiscountMinor > amounts.planAmount || data.amountReceivedMinor > amounts.finalAmount) {
        return { message: "Check the discount and amount received against the selected plan price", status: 400 } as const
      }
      const expiry = membershipExpiry(data.startDate, data.durationMonths)
      if (!expiry || expiry.length !== 10) {
        return { message: "Choose a start date and duration with a valid expiry date", status: 400 } as const
      }
      const status = memberStatusFromStartDate(data.startDate, gym.timeZone, now)
      const startDate = new Date(`${data.startDate}T00:00:00.000Z`)
      const member = await tx.member.create({
        data: {
          gymId: session.gymId,
          name: data.name,
          phone: data.phone,
          email: data.email,
          status,
        },
      })
      const subscription = await tx.memberSubscription.create({
        data: {
          gymId: session.gymId,
          memberId: member.id,
          planId: data.planId,
          planNameSnapshot: plan.name,
          durationMonths: data.durationMonths,
          sessionsPerWeek,
          sessionDurationMinutes,
          priceMinor: amounts.planAmount,
          discountMinor: data.specialDiscountMinor,
          additionalChargeMinor,
          finalMinor: amounts.finalAmount,
          currency: plan.currency,
          paymentStatus: amounts.balance === 0 ? "PAID" : data.amountReceivedMinor > 0 ? "PARTIAL" : "UNPAID",
          startDate,
          endDate: new Date(`${expiry}T00:00:00.000Z`),
          status,
        },
      })
      if (data.trainerId) {
        await tx.memberTrainerAssignment.create({
          data: { gymId: session.gymId, memberId: member.id, trainerId: data.trainerId, startedAt: startDate },
        })
      }
      if (data.amountReceivedMinor > 0) {
        const methods = { cash: "CASH", card: "CARD", bank_transfer: "BANK_TRANSFER", upi: "ONLINE", mobile_wallet: "ONLINE", other: "OTHER" } as const
        await tx.payment.create({
          data: {
            gymId: session.gymId,
            memberId: member.id,
            memberSubscriptionId: subscription.id,
            amountMinor: data.amountReceivedMinor,
            currency: plan.currency,
            method: methods[data.paymentMethod],
            recordedByUserId: session.userId,
            paidAt: new Date(`${data.paymentDate}T00:00:00.000Z`),
          },
        })
      }
      // Keep the existing response shape while storing membership data once.
      return { member: {
        ...member,
        planId: data.planId,
        startDate,
        durationMonths: data.durationMonths,
        trainerId: data.trainerId ?? null,
        sessionsPerWeek,
        sessionDurationMinutes,
        additionalChargeMinor,
      } } as const
    })

    if ("message" in result) {
      return NextResponse.json({ message: result.message }, { status: result.status })
    }
    return NextResponse.json({ message: "Member Created", member: result.member }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json({ message: "A member with this email already exists in your gym" }, { status: 409 })
      }
      if (error.code === "P2003") {
        return NextResponse.json({ message: "The selected gym, plan, or trainer is no longer available" }, { status: 409 })
      }
    }
    console.error("Error creating member:", error)
    return NextResponse.json({ message: "Error creating member" }, { status: 500 })
  }
}
