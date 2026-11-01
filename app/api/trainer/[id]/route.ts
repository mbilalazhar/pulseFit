import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateTrainerSchema } from "@/lib/validators/trainer"
import { weeklyWorkHours } from "@/lib/trainer-availability"
import { sameWorkingHours } from "@/lib/trainer-update"
import { reassignTrainerSchedule, ScheduleChangeError } from "@/lib/trainer-schedule-change-server"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    const { id } = await params
    const parsed = updateTrainerSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ message: "Invalid Data", error: parsed.error.flatten().fieldErrors }, { status: 400 })
    const data = parsed.data
    const hours = data.trainerType === "STAFF" ? data.availability : data.sessions

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.trainer.findFirst({
        where: { id, gymId: session.gymId },
        include: { availability: true, gym: { select: { timeZone: true } } },
      })
      if (!existing) return { error: "Trainer not found", status: 404 } as const
      const changedHours = !sameWorkingHours(existing.availability, hours)
      if (changedHours) {
        await reassignTrainerSchedule(tx, {
          gymId: session.gymId, trainer: existing, hours,
          timeZone: existing.gym.timeZone, confirmation: data.scheduleConfirmation,
        })
      } else if (data.scheduleConfirmation) {
        throw new ScheduleChangeError("The trainer's working hours changed while reviewing. Close the review and reload the edit form.")
      }
      const compensation = data.trainerType === "STAFF" ? {
        monthlySalaryMinor: Math.round(data.monthlySalary * 100),
        workHoursPerDay: weeklyWorkHours(hours) / hours.length,
        workDaysPerWeek: hours.length,
        shift: data.shift,
        contractorPaymentType: null, fixedFeeAmount: null, sessionRate: null, sessionsPerWeek: null,
        certifications: data.certifications,
        specializations: {
          deleteMany: {},
          create: data.specializations.map((name) => ({ specialization: { connectOrCreate: { where: { name }, create: { name } } } })),
        },
      } : {
        monthlySalaryMinor: null, workHoursPerDay: null, workDaysPerWeek: null, shift: null,
        contractorPaymentType: data.paymentType,
        fixedFeeAmount: data.paymentType === "FIXED_FEE" ? Math.round(data.amount * 100) : null,
        sessionRate: data.paymentType === "SESSION_BASED" ? Math.round(data.amount * 100) : null,
        sessionsPerWeek: hours.length,
      }
      const trainer = await tx.trainer.update({
        where: { id_gymId: { id, gymId: session.gymId } },
        data: {
          fullName: data.fullName, email: data.email, contactNumber: data.contactNumber,
          trainerType: data.trainerType, joiningDate: new Date(`${data.joiningDate}T00:00:00Z`),
          ...compensation,
          ...(changedHours ? { availability: { deleteMany: {}, create: hours } } : {}),
        },
        select: { id: true, fullName: true, email: true, trainerType: true },
      })
      return { trainer }
    }, { isolationLevel: "Serializable" })
    if ("error" in result) return NextResponse.json({ message: result.error }, { status: result.status })
    return NextResponse.json({ message: "Trainer updated", trainer: result.trainer })
  } catch (error) {
    if (error instanceof ScheduleChangeError) return NextResponse.json({
      message: error.message, ...(error.review ? { code: "SCHEDULE_REVIEW_REQUIRED", review: error.review } : {}),
    }, { status: 409 })
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") return NextResponse.json({ message: "A trainer with this email already exists in your gym." }, { status: 409 })
      if (error.code === "P2025") return NextResponse.json({ message: "Trainer not found" }, { status: 404 })
      if (error.code === "P2034") return NextResponse.json({ message: "This trainer or their schedule changed while saving. Please try again." }, { status: 409 })
    }
    console.error("Update trainer error:", error)
    return NextResponse.json({ message: "Could not update trainer details" }, { status: 500 })
  }
}
