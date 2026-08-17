"use client"

import { useMemo } from "react"
import { Plus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  usePlanForm,
  LimitHint,
  countChars,
  clampChars,
  areaClass,
  FEATURE_MAX,
} from "./plan-form-context"

export function PlanFeatures() {
  const {
    features,
    addingFeature,
    setAddingFeature,
    featureDraft,
    setFeatureDraft,
    addFeature,
    removeFeature,
  } = usePlanForm()

  const featureChars = useMemo(() => countChars(featureDraft), [featureDraft])

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold">Plan Features</h2>
        {!addingFeature ? (
          <button
            type="button"
            onClick={() => setAddingFeature(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            <Plus className="size-4" />
            Add Feature
          </button>
        ) : null}
      </div>

      {addingFeature ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            rows={2}
            value={featureDraft}
            onChange={(e) => setFeatureDraft(clampChars(e.target.value, FEATURE_MAX))}
            placeholder="Describe a feature or benefit..."
            className={areaClass}
          />
          <LimitHint count={featureChars} max={FEATURE_MAX} />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={addFeature}
              disabled={!featureDraft.trim()}
              className="gap-1"
            >
              <Check className="size-3.5" />
              Add
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingFeature(false)
                setFeatureDraft("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {features.length === 0 && !addingFeature ? (
        <p className="rounded-xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
          No features added yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {features.map((f) => (
            <li
              key={f.id}
              className="group flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3"
            >
              <Check
                className="mt-0.5 size-4 shrink-0 text-success drop-shadow-[0_0_6px_rgba(22,163,74,0.85)]"
                strokeWidth={3}
              />
              <span className="flex-1 text-sm leading-snug">{f.text}</span>
              <button
                type="button"
                onClick={() => removeFeature(f.id)}
                aria-label="Remove feature"
                className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
