"use client"

import { Clock3 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PLAN_FACILITIES } from "@/lib/plan-features"
import { cn } from "@/lib/utils"
import { usePlanForm, inputClass } from "./plan-form-context"

export function PlanFeatures() {
  const { facilities, toggleFacility, maxHoursPerDay, setMaxHoursPerDay,
    guidanceIncluded, sessionsPerWeek, setSessionsPerWeek, sessionDurationMinutes, setSessionDurationMinutes } = usePlanForm()

  return (
    <section aria-labelledby="plan-features-heading" className="space-y-5 rounded-2xl border bg-card p-5">
      <div>
        <h2 id="plan-features-heading" className="font-heading text-base font-semibold">Plan Features</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose the facilities and services included in this membership.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PLAN_FACILITIES.map((feature) => {
          const checked = facilities.includes(feature.id)
          return (
            <Label key={feature.id} htmlFor={`facility-${feature.id}`} className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm leading-snug transition-colors hover:bg-muted/40",
              checked && "border-foreground/30 bg-muted/40",
            )}>
              <Checkbox id={`facility-${feature.id}`} checked={checked} onCheckedChange={(value) => toggleFacility(feature.id, value === true)} />
              {feature.label}
            </Label>
          )
        })}
      </div>
      {guidanceIncluded && (
        <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
          <div>
            <h3 className="text-sm font-medium">Included trainer sessions</h3>
            <p className="mt-1 text-xs text-muted-foreground">Both settings are required when trainer guidance is included. They become the defaults when you add a member.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-sessions-per-week">Sessions per week <span aria-hidden="true" className="text-destructive">*</span></Label>
              <Input id="plan-sessions-per-week" type="number" min={1} max={21} step={1} required
                value={sessionsPerWeek} onChange={(event) => setSessionsPerWeek(event.target.value)} placeholder="e.g. 3" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-session-minutes">Session length (minutes) <span aria-hidden="true" className="text-destructive">*</span></Label>
              <Input id="plan-session-minutes" type="number" min={1} max={1440} step={1} required
                value={sessionDurationMinutes} onChange={(event) => setSessionDurationMinutes(event.target.value)} placeholder="e.g. 60" className={inputClass} />
            </div>
          </div>
        </div>
      )}
      <div className="grid items-center gap-4 border-t pt-5 sm:grid-cols-[1fr_180px]">
        <div>
          <Label htmlFor="max-hours-per-day" className="gap-2"><Clock3 className="size-4" />Daily gym access</Label>
          <p id="max-hours-hint" className="mt-1.5 text-xs text-muted-foreground">Hours allowed per day, up to 24. Leave blank for unlimited access during opening hours.</p>
        </div>
        <div className="space-y-1.5">
          <Input id="max-hours-per-day" type="number" inputMode="decimal" min={0.01} max={24} step="any"
            value={maxHoursPerDay} onChange={(event) => setMaxHoursPerDay(event.target.value)}
            placeholder="Unlimited" aria-describedby="max-hours-hint" className={inputClass} />
          <p className="text-xs text-muted-foreground">Hours per day</p>
        </div>
      </div>
    </section>
  )
}
