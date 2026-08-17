"use client"

import { cn } from "@/lib/utils"
import { usePlanForm, STATUS_OPTIONS } from "./plan-form-context"

export function PlanStatus() {
  const { status, setStatus } = usePlanForm()

  return (
    <section className="space-y-3 rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold">Plan Status</h2>
          <p className="text-xs text-muted-foreground">
            Save as draft or publish the plan.
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            STATUS_OPTIONS.find((o) => o.value === status)?.badge,
          )}
        >
          {STATUS_OPTIONS.find((o) => o.value === status)?.label}
        </span>
      </div>

      <div className="space-y-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-accent ring-2 ring-accent/20"
                  : "hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-accent" : "border-muted-foreground/40",
                )}
              >
                {active ? <span className="size-2 rounded-full bg-accent" /> : null}
              </span>
              <span>
                <span className="block text-sm font-medium">{opt.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {opt.desc}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
