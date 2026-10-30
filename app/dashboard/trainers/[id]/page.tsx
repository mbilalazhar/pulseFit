import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { ProfileHeader } from "./profile-header"
import { AboutPanels } from "./about-panels"
import { MetricsStrip } from "./metrics-strip"
import { WeeklySchedule } from "./weekly-schedule"
import { PackagesTable } from "./packages-table"
import { UnallocatedMembers } from "./unallocated-members"
import { getUnallocatedTrainerMembers } from "@/lib/trainer-unallocated-members"
import type { TrainerDetail } from "./trainer-detail-logic"

export default async function TrainerDetailPage(
  props: PageProps<"/dashboard/trainers/[id]">,
) {
  const { id } = await props.params

  const session = await getSession()
  if (!session || session.role !== "ADMIN") redirect("/login")

  /* Scoped to the session's gym so one gym cannot read another's trainers. */
  const record = await prisma.trainer.findFirst({
    where: { id, gymId: session.gymId },
    include: {
      specializations: {
        select: { specialization: { select: { id: true, name: true } } },
      },
      packages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, type: true, duration: true, priceMinor: true },
      },
    },
  })
  if (!record) notFound()

  const unallocatedMembers = await getUnallocatedTrainerMembers(session.gymId, record.id)

  const trainer: TrainerDetail = {
    ...record,
    monthlySalary: record.monthlySalaryMinor == null ? null : record.monthlySalaryMinor / 100,
    fixedFeeAmount: record.fixedFeeAmount == null ? null : record.fixedFeeAmount / 100,
    sessionRate: record.sessionRate == null ? null : record.sessionRate / 100,
    packages: record.packages.map((item) => ({ ...item, price: item.priceMinor / 100 })),
    specializations: record.specializations.map((s) => s.specialization),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/trainers"
          aria-label="Back to trainers"
          className="group inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 hover:bg-primary"
        >
          <ArrowLeft className="size-5 text-foreground transition-colors duration-300 group-hover:text-primary-foreground" />
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Trainer Details</h1>
      </div>

      <ProfileHeader trainer={trainer} />
      <AboutPanels trainer={trainer} />
      <UnallocatedMembers members={unallocatedMembers} />
      <MetricsStrip trainer={trainer} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
        <WeeklySchedule key={trainer.id} trainerName={trainer.fullName} />
        <PackagesTable trainer={trainer} />
      </div>
    </div>
  )
}
