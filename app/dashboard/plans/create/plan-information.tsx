"use client"

import { Input } from "@/components/ui/input"
import {
  usePlanForm,
  LimitHint,
  countChars,
  clampChars,
  inputClass,
  areaClass,
  SHORT_MAX,
  LONG_MAX,
} from "./plan-form-context"

export function PlanInformation() {
  const {
    planName,
    setPlanName,
    shortDesc,
    setShortDesc,
    longDesc,
    setLongDesc,
  } = usePlanForm()

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <h2 className="font-heading text-base font-semibold">Plan Information</h2>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="plan-name" className="text-sm font-medium">
            Plan Name
          </label>
          <Input
            id="plan-name"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. Pro Plan"
            className={inputClass}
          />
        </div>

        <div className="flex-1 space-y-1.5">
          <label htmlFor="short-desc" className="text-sm font-medium">
            Short Description
          </label>
          <textarea
            id="short-desc"
            rows={1}
            value={shortDesc}
            onChange={(e) => setShortDesc(clampChars(e.target.value, SHORT_MAX))}
            placeholder="e.g. Best for serious athletes....."
            className={areaClass}
          />
          <LimitHint count={countChars(shortDesc)} max={SHORT_MAX} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="long-desc" className="text-sm font-medium">
          Detailed Description{" "}
          <span className="text-muted-foreground">(Optional)</span>
        </label>
        <textarea
          id="long-desc"
          rows={4}
          value={longDesc}
          onChange={(e) => setLongDesc(clampChars(e.target.value, LONG_MAX))}
          placeholder="Describe the plan in detail..."
          className={areaClass}
        />
        <LimitHint count={countChars(longDesc)} max={LONG_MAX} />
      </div>
    </section>
  )
}
