"use client"

import { Phone, Mail, CircleCheck } from "lucide-react"
import { useTrainerForm, formatDate, formatPkr } from "./trainer-form-context"
import { TrainerAvatar } from "../trainer-avatar"

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
    trainerType,
    salaryAmount,
    workHours,
    workDays,
    shift,
    joiningDate,
    pricingModel,
    contractorPrice,
    sessionsPerWeek,
    contractorStartDate,
    specializations,
    certifications,
  } = useTrainerForm()

  return (
    <section className="overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-5 py-4">
        <h2 className="font-heading text-base font-semibold">Trainer Preview</h2>
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center gap-2 bg-gray-100 px-5 py-6">
        {/* No upload in the form yet, so this always shows the default. */}
        <TrainerAvatar
          src={null}
          alt={fullName.trim() || "Trainer"}
          size={96}
          className="size-24 border-4 border-white bg-gray-200"
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="font-heading text-base font-semibold">
            {fullName.trim() || "Trainer Name"}
          </p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            trainerType === "staff"
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-200 text-gray-600"
          }`}>
            {trainerType === "staff" ? "Staff Trainer" : "Contractor"}
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
            {trainerType === "staff"
              ? `Active from ${formatDate(joiningDate)}`
              : `Active from ${formatDate(contractorStartDate)}`}
          </span>
        </div>
      </div>

      {/* Work summary */}
      <div className="space-y-2.5 border-b px-5 py-4">
        <h3 className="font-heading text-sm font-semibold">
          {trainerType === "staff" ? "Work Summary" : "Compensation Summary"}
        </h3>
        {trainerType === "staff" ? (
          <>
            <SummaryRow
              label="Salary (Monthly)"
              value={salaryAmount > 0 ? formatPkr(salaryAmount) : "—"}
            />
            <SummaryRow label="Work Hours / Day" value={workHours} />
            <SummaryRow label="Work Days" value={workDays} />
            <SummaryRow label="Shift" value={shift} />
            <SummaryRow label="Joining Date" value={formatDate(joiningDate)} />
          </>
        ) : (
          <>
            <SummaryRow
              label={
                pricingModel === "fixed"
                  ? "Monthly Fee"
                  : "Price per Session"
              }
              value={contractorPrice ? formatPkr(Number(contractorPrice)) : "—"}
            />
            <SummaryRow
              label="Pricing Model"
              value={pricingModel === "fixed" ? "Fixed Monthly" : "Session-based"}
            />
            <SummaryRow label="Sessions per Week" value={sessionsPerWeek || "—"} />
            <SummaryRow label="Start Date" value={formatDate(contractorStartDate)} />
          </>
        )}
      </div>

      {/* Specializations & Certifications (staff only) */}
      {trainerType === "staff" && (
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-2">
            <h3 className="font-heading text-sm font-semibold">
              Specializations ({specializations.length})
            </h3>
            {specializations.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No specializations selected yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {specializations.map((spec) => (
                  <span
                    key={spec}
                    className="inline-block rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </div>

          {certifications.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="font-heading text-sm font-semibold">
                Certifications ({certifications.length})
              </h3>
              <ul className="space-y-1.5">
                {certifications.map((cert) => (
                  <li key={cert.id} className="text-xs text-muted-foreground">
                    {cert.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
