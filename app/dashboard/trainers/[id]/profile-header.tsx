import { BadgeCheck, CalendarClock, CalendarDays, Mail, MapPin, Phone, Star, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { TrainerAvatar } from "../trainer-avatar"
import { STATUS_BADGE, STATUS_DOT, STATUS_LABEL } from "../trainer-status"
import {
  formatDate,
  formatYears,
  NOT_TRACKED,
  profileCompletion,
  type TrainerDetail,
} from "./trainer-detail-logic"

function InfoTile({
  icon,
  iconClass,
  label,
  value,
  note,
}: {
  icon: React.ReactNode
  iconClass: string
  label: string
  value: string
  note?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconClass)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold text-foreground">{value}</p>
        {note ? <p className="text-[11px] text-muted-foreground">{note}</p> : null}
      </div>
    </div>
  )
}

export function ProfileHeader({ trainer }: { trainer: TrainerDetail }) {
  const { percent, message } = profileCompletion(trainer)
  const role = trainer.trainerType === "CONTRACTOR" ? "Private Contractor" : "Personal Trainer"

  return (
    <section className="rounded-2xl border bg-white p-6">
      {/* Status sits where the Edit / Actions controls would go. */}
      <div className="flex justify-end">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium",
            STATUS_BADGE[trainer.status],
          )}
        >
          <span className={cn("size-1.5 rounded-full", STATUS_DOT[trainer.status])} />
          {STATUS_LABEL[trainer.status]}
        </span>
      </div>

      <div className="mt-2 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1.2fr)] xl:gap-8">
        {/* Identity */}
        <div className="flex items-start gap-4">
          <TrainerAvatar
            src={trainer.profilePhotoUrl}
            alt={trainer.fullName}
            size={120}
            className="size-28 rounded-2xl bg-gray-100"
          />
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-heading text-xl font-bold tracking-tight">
                {trainer.fullName}
              </h2>
              {trainer.status === "ACTIVE" ? (
                <BadgeCheck className="size-5 shrink-0 text-accent" aria-label="Active trainer" />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{role}</p>

            <div className="space-y-1.5 pt-1">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                <span className="truncate">{trainer.contactNumber}</span>
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" />
                <span className="truncate">{trainer.email}</span>
              </p>
              {/* No location field on the trainer record yet. */}
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0" />
                <span>{NOT_TRACKED}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Profile completion */}
        <div className="space-y-2 xl:border-l xl:pl-8">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Profile Completion</p>
            <span className="text-sm font-semibold text-accent">{percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion"
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{message}</p>
        </div>

        {/* Key dates and figures */}
        <div className="grid grid-cols-1 gap-5 rounded-xl border p-4 sm:grid-cols-2">
          <InfoTile
            icon={<CalendarDays className="size-4 text-rose-600" />}
            iconClass="bg-rose-50"
            label="Joining Date"
            value={formatDate(trainer.joiningDate)}
          />
          <InfoTile
            icon={<Star className="size-4 text-amber-500" />}
            iconClass="bg-amber-50"
            label="Years of Experience"
            value={formatYears(trainer.yearsExperience)}
          />
          {/* No salary payment records exist yet. */}
          <InfoTile
            icon={<Wallet className="size-4 text-emerald-600" />}
            iconClass="bg-emerald-50"
            label="Last Salary Paid"
            value={NOT_TRACKED}
            note="Not tracked yet"
          />
          <InfoTile
            icon={<CalendarClock className="size-4 text-sky-600" />}
            iconClass="bg-sky-50"
            label="Next Salary Date"
            value={NOT_TRACKED}
            note="Not tracked yet"
          />
        </div>
      </div>
    </section>
  )
}
