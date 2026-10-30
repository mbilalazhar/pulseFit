"use client"

import { Check, Clock3 } from "lucide-react"
import { buildPlanFeatures } from "@/lib/plan-features"
import { usePlanForm } from "./plan-form-context"

export function FeatureSummary() {
  const { facilities, customFeatures, maxHoursPerDay, guidanceIncluded, sessionsPerWeek, sessionDurationMinutes } = usePlanForm()
  const features = buildPlanFeatures(facilities, customFeatures)

  return (
    <section aria-labelledby="feature-summary-heading" className="space-y-4 rounded-2xl border bg-card p-5">
      <h2 id="feature-summary-heading" className="font-heading text-base font-semibold">Feature Summary</h2>
      <div className="flex items-start gap-2 text-sm">
        <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>{maxHoursPerDay.trim()
          ? `Up to ${maxHoursPerDay} ${Number(maxHoursPerDay) === 1 ? "hour" : "hours"} of gym access per day`
          : "Unlimited gym access during opening hours"}</span>
      </div>
      {features.length ? (
        <ul className="space-y-2 border-t pt-3">
          {features.map((feature) => (
            <li key={feature.label} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-success" />
              <span className="min-w-0 break-words">{feature.label}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-xs text-muted-foreground">No additional features selected. You can add or remove features while this plan is a draft or inactive.</p>}
      {guidanceIncluded && (
        <p className="rounded-lg bg-muted/40 p-3 text-sm">
          {sessionsPerWeek && sessionDurationMinutes
            ? `${sessionsPerWeek} trainer ${Number(sessionsPerWeek) === 1 ? "session" : "sessions"} per week · ${sessionDurationMinutes} minutes per session`
            : "Set weekly sessions and session length to complete trainer guidance."}
        </p>
      )}
    </section>
  )
}
