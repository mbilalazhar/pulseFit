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
        where: { gymId: session.gymId, deletedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true, name: true, email: true, phone: true, status: true,
          createdAt: true,
          assignments: {
            where: { gymId: session.gymId, endedAt: null },
            orderBy: [{ startedAt: "desc" }, { id: "desc" }], take: 1,
            select: { trainer: { select: { id: true, fullName: true } } },
          },
          subscriptions: {
            where: { gymId: session.gymId },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { plan: { select: planFields }, finalMinor: true, durationMonths: true, currency: true, startDate: true, endDate: true, status: true },
          },
          payments: {
            where: { gymId: session.gymId },
            orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
            select: { amountMinor: true, kind: true, currency: true, paidAt: true, method: true },
          },
        },
      }),
      prisma.plan.findMany({ where: { gymId: session.gymId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ])
    const directory = records.map((record) => {
      const current = record.subscriptions.find((item) => item.status === "ACTIVE")
        ?? record.subscriptions.find((item) => item.status !== "CANCELLED")
      return {
        ...record,
        startDate: current?.startDate ?? null,
        durationMonths: current?.durationMonths ?? null,
        plan: current?.plan ?? null,
        trainer: record.assignments[0]?.trainer ?? null,
        subscriptions: record.subscriptions.map((item) => ({ ...item, priceMinor: item.finalMinor })),
        payments: record.payments.filter((item) => item.currency === current?.currency).map((item) => ({
          ...item, amountMinor: item.kind === "REFUND" ? -item.amountMinor : item.amountMinor,
          method: item.method.toLowerCase(),
        })),
      }
    })
    return NextResponse.json({ ...buildMemberDirectory(directory, gym.timeZone), plans }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ message: "Could not load members. Please try again." }, { status: 500 })
  }
}
