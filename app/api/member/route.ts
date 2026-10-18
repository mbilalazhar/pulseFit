import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildMemberDirectory } from "@/lib/member-directory"

const planFields = { id: true, name: true, basePriceMinor: true, currency: true } as const

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    }
    const gym = await prisma.gym.findUnique({ where: { id: session.gymId }, select: { timeZone: true } })
    if (!gym) return NextResponse.json({ message: "Gym not found" }, { status: 404 })

    const [records, plans] = await Promise.all([
      prisma.member.findMany({
        where: { gymId: session.gymId },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true, name: true, email: true, phone: true, status: true,
          startDate: true, durationMonths: true, createdAt: true,
          plan: { select: planFields },
          trainer: { select: { id: true, fullName: true } },
          subscriptions: {
            where: { gymId: session.gymId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { plan: { select: planFields }, priceMinor: true, currency: true, startDate: true, endDate: true, status: true },
          },
          payments: {
            where: { gymId: session.gymId },
            orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
            select: { amountMinor: true, paidAt: true, method: true },
          },
        },
      }),
      prisma.plan.findMany({ where: { gymId: session.gymId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ])
    return NextResponse.json({ ...buildMemberDirectory(records, gym.timeZone), plans }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ message: "Could not load members. Please try again." }, { status: 500 })
  }
}
