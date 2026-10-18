import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createMemberSchema } from "@/lib/validators/member"
import { memberStatusFromStartDate } from "@/lib/member-status"
import { membershipAmounts, membershipExpiry } from "@/lib/membership"

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
          basePriceMinor: true,
          currency: true,
          durations: { where: { durationMonths: data.durationMonths }, select: { discountPercent: true } },
        },
      })
      if (!plan) {
        return { message: "Select an active plan from your gym", status: 400 } as const
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
        String(data.specialDiscountMinor / 100), String(data.amountReceivedMinor / 100))
      if (amounts.planAmount > 2147483647 || data.specialDiscountMinor > amounts.planAmount || data.amountReceivedMinor > amounts.finalAmount) {
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
          planId: data.planId,
          startDate,
          durationMonths: data.durationMonths,
          trainerId: data.trainerId ?? null,
          status,
          subscriptions: {
            create: {
              gymId: session.gymId,
              planId: data.planId,
              priceMinor: amounts.finalAmount,
              discountMinor: data.specialDiscountMinor,
              currency: plan.currency,
              startDate,
              endDate: new Date(`${expiry}T00:00:00.000Z`),
              status,
            },
          },
          payments: data.amountReceivedMinor > 0 ? {
            create: {
              gymId: session.gymId,
              amountMinor: data.amountReceivedMinor,
              method: data.paymentMethod,
              paidAt: new Date(`${data.paymentDate}T00:00:00.000Z`),
            },
          } : undefined,
        },
      })
      return { member } as const
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
