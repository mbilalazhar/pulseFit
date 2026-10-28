"use client"

import { Label } from "@/components/ui/label"
import { usePlanForm, areaClass, FEATURE_MAX } from "./plan-form-context"

export function CustomPlanFeatures() {
  const { customFeatures, setCustomFeatures } = usePlanForm()
  const lines = customFeatures.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const tooLong = lines.some((line) => line.length > FEATURE_MAX)

  return (
    <section aria-labelledby="custom-features-heading" className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 id="custom-features-heading" className="font-heading text-base font-semibold">Custom Features</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add the extra benefits that make this plan your own.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="custom-features">Additional benefits <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <textarea id="custom-features" rows={5} value={customFeatures}
          onChange={(event) => setCustomFeatures(event.target.value)}
          placeholder={"Monthly fitness assessment\nPersonal nutrition consultation\nOne guest pass per month"}
          aria-describedby="custom-features-hint" aria-invalid={tooLong} className={areaClass} />
        <p id="custom-features-hint" className={tooLong ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {tooLong ? `Each feature must be ${FEATURE_MAX} characters or fewer.` : `One feature per line, up to ${FEATURE_MAX} characters each. These are saved with the plan.`}
        </p>
      </div>
    </section>
  )
}
