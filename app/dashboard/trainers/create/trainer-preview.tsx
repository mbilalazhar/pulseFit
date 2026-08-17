"use client"

import { User, Phone, Mail, CircleCheck } from "lucide-react"
import { useTrainerForm, formatDate, formatPkr } from "./trainer-form-context"

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

export function TrainerPreview() {
  const {
    fullName,
    email,
    phone,
    salaryAmount,
    workHours,
    workDays,
    shift,
    joiningDate,
    packages,
  } = useTrainerForm()

  const totalPackages = packages.length

  return (
    <section className="overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-5 py-4">
        <h2 className="font-heading text-base font-semibold">Trainer Preview</h2>
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center gap-2 bg-accent/5 px-5 py-6">
        <div className="flex size-24 items-center justify-center rounded-full border-4 border-white bg-muted text-muted-foreground">
          <User className="size-10" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="font-heading text-base font-semibold">
            {fullName.trim() || "Trainer Name"}
          </p>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            Personal Trainer
          </span>
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-2.5 border-b px-5 py-4">
        <div className="flex items-center gap-2.5 text-sm">
          <Phone className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            {phone.trim() ? `+92 ${phone.trim()}` : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <Mail className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">{email.trim() || "—"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm">
          <CircleCheck className="size-4 shrink-0 text-success" />
          <span className="font-medium text-success">
            Active from {formatDate(joiningDate)}
          </span>
        </div>
      </div>

      {/* Work summary */}
      <div className="space-y-2.5 border-b px-5 py-4">
        <h3 className="font-heading text-sm font-semibold">Work Summary</h3>
        <SummaryRow
          label="Salary (Monthly)"
          value={salaryAmount > 0 ? formatPkr(salaryAmount) : "—"}
        />
        <SummaryRow label="Work Hours / Day" value={workHours} />
        <SummaryRow label="Work Days" value={workDays} />
        <SummaryRow label="Shift" value={shift} />
        <SummaryRow label="Joining Date" value={formatDate(joiningDate)} />
      </div>

      {/* Packages */}
      <div className="space-y-3 px-5 py-4">
        <h3 className="font-heading text-sm font-semibold">
          Packages ({totalPackages})
        </h3>

        {totalPackages === 0 ? (
          <p className="text-xs text-muted-foreground">No packages added yet.</p>
        ) : (
          <>
            <div className="space-y-2.5">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pkg.type}
                      {pkg.duration === "-" ? "" : ` · ${pkg.duration}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    {formatPkr(pkg.price)}
                  </span>
                </div>
              ))}
            </div>
            <p className="border-t pt-3 text-xs text-muted-foreground">
              Total {totalPackages} {totalPackages === 1 ? "package" : "packages"}
            </p>
          </>
        )}
      </div>
    </section>
  )
}
