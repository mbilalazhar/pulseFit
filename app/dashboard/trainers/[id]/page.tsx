import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { ArrowLeft, Pencil } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { ProfileHeader } from "./profile-header"
import { AboutPanels } from "./about-panels"
import { TrainerScheduling } from "./trainer-scheduling"
import { dateInTimeZone } from "@/lib/member-status"
import { mondayOf } from "@/lib/trainer-scheduling"
import { PackagesTable } from "./packages-table"
import type { TrainerDetail } from "./trainer-detail-logic"
import { WORKING_DAYS, formatWorkTime } from "@/lib/trainer-availability"

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
      gym: { select: { timeZone: true } },
      availability: { select: { dayOfWeek: true, startMinute: true, endMinute: true } },
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
        <h1 className="flex-1 font-heading text-2xl font-bold tracking-tight">Trainer Details</h1>
        <DashboardHeaderButton icon={Pencil} text="Edit Trainer" bgColor="primary" href={`/dashboard/trainers/${trainer.id}/edit`} />
      </div>

      <ProfileHeader trainer={trainer} />
      <AboutPanels trainer={trainer} />

      {trainer.availability.length > 0 && (
        <section className="space-y-3 rounded-2xl border bg-card p-5">
          <h3 className="font-heading text-base font-semibold">{trainer.trainerType === "CONTRACTOR" ? "Weekly Contractor Sessions" : "Working Hours"}</h3>
          <p className="text-xs text-muted-foreground">Gym local time</p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WORKING_DAYS.map((day) => {
              const hours = trainer.availability.filter((entry) => entry.dayOfWeek === day.value)
              return (
                <div key={day.value} className="rounded-lg bg-muted/50 p-3 text-sm">
                  <dt className="font-medium">{day.label}</dt>
                  <dd className="mt-1 text-muted-foreground">
                    {hours.length ? hours.map((entry) => `${formatWorkTime(entry.startMinute)} – ${formatWorkTime(entry.endMinute)}`).join(", ") : "Day off"}
                  </dd>
                </div>
              )
            })}
          </dl>
        </section>
      )}

      <TrainerScheduling key={trainer.id} trainerId={trainer.id} trainerName={trainer.fullName} trainerMetrics={{ trainerType: trainer.trainerType, monthlySalary: trainer.monthlySalary, workDaysPerWeek: trainer.workDaysPerWeek }} initialWeek={mondayOf(dateInTimeZone(record.gym.timeZone))}>
        <PackagesTable trainer={trainer} />
      </TrainerScheduling>
    </div>
  )
}
