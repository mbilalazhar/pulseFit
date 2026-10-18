import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dateInTimeZone } from "@/lib/member-status"
import { buildAttendance, eligibleForAttendance } from "@/lib/attendance"

export async function GET(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    const date = new URL(req.url).searchParams.get("date") ?? undefined
    if (date !== undefined && (!z.iso.date().safeParse(date).success || date < "1900-01-01")) return NextResponse.json({ message: "Choose a valid attendance date" }, { status: 400 })
    const gym = await prisma.gym.findUnique({ where: { id: session.gymId }, select: { timeZone: true } })
    if (!gym) return NextResponse.json({ message: "Gym not found" }, { status: 404 })
    if (date && date > dateInTimeZone(gym.timeZone)) return NextResponse.json({ message: "Attendance dates cannot be in the future" }, { status: 400 })
    const [members, records] = await Promise.all([
      prisma.member.findMany({ where: { gymId: session.gymId }, select: { id: true, name: true, email: true, phone: true, status: true, startDate: true, createdAt: true, plan: { select: { name: true } } } }),
      prisma.attendance.findMany({ where: { gymId: session.gymId }, select: { id: true, memberId: true, attendanceDate: true, checkInAt: true, checkOutAt: true } }),
    ])
    return NextResponse.json(buildAttendance(members, records, gym.timeZone, date), { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Fetch attendance error:", error)
    return NextResponse.json({ message: "Could not load attendance" }, { status: 500 })
  }
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("present"), memberId: z.string().min(1) }),
  z.object({ action: z.literal("left"), attendanceId: z.string().min(1) }),
])

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    const parsed = actionSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ message: "Invalid attendance details" }, { status: 400 })
    const action = parsed.data
    const now = new Date()
    if (action.action === "left") {
      const result = await prisma.attendance.updateMany({ where: { id: action.attendanceId, gymId: session.gymId, checkOutAt: null }, data: { checkOutAt: now } })
      if (!result.count) return NextResponse.json({ message: "This visit is already checked out or unavailable" }, { status: 409 })
      return NextResponse.json({ message: "Member marked as left" })
    }
    const [gym, member] = await Promise.all([
      prisma.gym.findUnique({ where: { id: session.gymId }, select: { timeZone: true } }),
      prisma.member.findFirst({ where: { id: action.memberId, gymId: session.gymId }, select: { status: true, startDate: true } }),
    ])
    if (!gym || !member) return NextResponse.json({ message: "Member not found in your gym" }, { status: 404 })
    const today = dateInTimeZone(gym.timeZone, now)
    if (!eligibleForAttendance(member, today)) return NextResponse.json({ message: "This member does not have an active membership" }, { status: 400 })
    await prisma.attendance.create({ data: { gymId: session.gymId, memberId: action.memberId, attendanceDate: new Date(`${today}T00:00:00Z`), checkInAt: now } })
    return NextResponse.json({ message: "Member marked present" }, { status: 201 })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ message: "Attendance is already recorded for today, or a previous visit is still open" }, { status: 409 })
    console.error("Update attendance error:", error)
    return NextResponse.json({ message: "Could not update attendance" }, { status: 500 })
  }
}
