import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dateInTimeZone } from "@/lib/member-status"
import { createExpenseSchema } from "@/lib/validators/expense"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    const parsed = createExpenseSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ message: "Enter a title, valid amount, date, category and payment method." }, { status: 400 })
    const gym = await prisma.gym.findUnique({ where: { id: session.gymId }, select: { timeZone: true } })
    if (!gym) return NextResponse.json({ message: "Gym not found" }, { status: 404 })
    if (parsed.data.status === "PAID" && parsed.data.date > dateInTimeZone(gym.timeZone)) return NextResponse.json({ message: "A paid expense cannot have a future payment date. Use Pending for future payments." }, { status: 400 })
    const expense = await prisma.expense.create({ data: {
      ...parsed.data, date: new Date(`${parsed.data.date}T00:00:00Z`), gymId: session.gymId, recordedByUserId: session.userId,
    }, select: { id: true } })
    return NextResponse.json({ message: "Expense saved", expense }, { status: 201 })
  } catch (error) {
    console.error("Save expense:", error)
    return NextResponse.json({ message: "Could not save the expense. Please try again." }, { status: 500 })
  }
}
