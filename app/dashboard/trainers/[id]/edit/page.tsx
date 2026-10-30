import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TrainerForm } from "../../create/trainer-form"

export default async function EditTrainerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")
  const { id } = await params
  const trainer = await prisma.trainer.findFirst({
    where: { id, gymId: session.gymId },
    select: {
      id: true, fullName: true, email: true, contactNumber: true, trainerType: true,
      joiningDate: true, monthlySalaryMinor: true, shift: true, contractorPaymentType: true,
      fixedFeeAmount: true, sessionRate: true, certifications: true, profilePhotoUrl: true,
      availability: { select: { dayOfWeek: true, startMinute: true, endMinute: true } },
      specializations: { select: { specialization: { select: { name: true } } } },
    },
  })
  if (!trainer) notFound()
  return <TrainerForm initialTrainer={{
    id: trainer.id, fullName: trainer.fullName, email: trainer.email, contactNumber: trainer.contactNumber,
    trainerType: trainer.trainerType, joiningDate: trainer.joiningDate?.toISOString().slice(0, 10) ?? null,
    monthlySalary: trainer.monthlySalaryMinor == null ? null : trainer.monthlySalaryMinor / 100,
    shift: trainer.shift, contractorPaymentType: trainer.contractorPaymentType,
    fixedFeeAmount: trainer.fixedFeeAmount == null ? null : trainer.fixedFeeAmount / 100,
    sessionRate: trainer.sessionRate == null ? null : trainer.sessionRate / 100,
    availability: trainer.availability, specializations: trainer.specializations.map((entry) => entry.specialization.name),
    certifications: trainer.certifications, profilePhotoUrl: trainer.profilePhotoUrl,
  }} />
}
