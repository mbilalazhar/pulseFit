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
        select: { id: true, name: true, type: true, duration: true, price: true },
      },
    },
  })
  if (!record) notFound()

  const trainer: TrainerDetail = {
    ...record,
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
      <MetricsStrip trainer={trainer} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <WeeklySchedule trainer={trainer} />
        <PackagesTable trainer={trainer} />
      </div>
    </div>
  )
}
