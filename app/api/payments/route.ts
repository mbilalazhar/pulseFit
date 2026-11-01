import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildPaymentsOverview } from "@/lib/payments"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    const currency = new URL(req.url).searchParams.get("currency") ?? "PKR"
    if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ message: "Choose a valid currency" }, { status: 400 })
    const data = await prisma.$transaction(async (tx) => {
      const gym = await tx.gym.findUnique({ where: { id: session.gymId }, select: { timeZone: true } })
      if (!gym) return null
      const [payments, subscriptions, expenses] = await Promise.all([
        tx.payment.findMany({ where: { gymId: session.gymId }, select: {
          id: true, memberSubscriptionId: true, amountMinor: true, currency: true, kind: true, method: true, paidAt: true,
          member: { select: { name: true } }, subscription: { select: { planNameSnapshot: true } },
        } }),
        tx.memberSubscription.findMany({ where: { gymId: session.gymId }, select: {
          id: true, finalMinor: true, currency: true, status: true, paymentDueDate: true, planNameSnapshot: true, member: { select: { name: true } },
        } }),
        tx.expense.findMany({ where: { gymId: session.gymId }, select: {
          id: true, title: true, category: true, amountMinor: true, currency: true, date: true, status: true, method: true,
        } }),
      ])
      return buildPaymentsOverview({ payments, subscriptions, expenses, timeZone: gym.timeZone, currency })
    }, { isolationLevel: "RepeatableRead" })
    if (!data) return NextResponse.json({ message: "Gym not found" }, { status: 404 })
    return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Load payments:", error)
    return NextResponse.json({ message: "Could not load payments. Please try again." }, { status: 500 })
  }
}
