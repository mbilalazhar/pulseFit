"use client"

import { Check } from "lucide-react"
import { PlanIcon } from "@/components/plan-icon"
import { PLAN_CATEGORIES, PLAN_COLORS, PLAN_ICONS } from "@/lib/plan-appearance"
import { cn } from "@/lib/utils"
import { usePlanForm } from "./plan-form-context"

const selectionClass = "cursor-pointer rounded-xl border border-border bg-card transition-all hover:border-foreground/30 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-checked:border-accent peer-checked:bg-accent/5 peer-disabled:cursor-not-allowed peer-disabled:opacity-60"

export function PlanAppearance() {
  const { icon, setIcon, color, setColor, category, setCategory, isSubmitting, planName } = usePlanForm()
  return <section aria-labelledby="plan-appearance-heading" className="space-y-5 rounded-2xl border bg-card p-5">
    <div><h2 id="plan-appearance-heading" className="font-heading text-base font-semibold">Icon and theme colors</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Give your plan a recognizable look. Mix any icon and color, regardless of category.</p></div>
    <fieldset disabled={isSubmitting} className="space-y-2">
      <legend className="mb-2 text-sm font-medium">Plan category</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{PLAN_CATEGORIES.map((item) => <label key={item}>
        <input type="radio" name="plan-category" value={item} checked={category === item} onChange={() => setCategory(item)} className="peer sr-only" />
        <span className={cn(selectionClass, "flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium")}>
          {category === item && <Check aria-hidden="true" className="size-3.5 text-accent" />}{item}
        </span>
      </label>)}</div>
    </fieldset>
    <div className="grid gap-6 sm:grid-cols-2">
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-4">
        <legend className="mb-3 text-sm font-medium">Choose an icon <span className="font-normal text-muted-foreground">· 8 options</span></legend>
        {PLAN_CATEGORIES.map((group) => <div key={group} className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{group}</p>
          <div className="grid grid-cols-2 gap-2">{PLAN_ICONS.filter((item) => item.category === group).map((item) => <label key={item.id}>
            <input type="radio" name="plan-icon" value={item.id} checked={icon === item.id} onChange={() => setIcon(item.id)} className="peer sr-only" />
            <span className={cn(selectionClass, "flex items-center gap-2 p-2")}><PlanIcon icon={item.id} color={color} className="size-9 rounded-lg" /><span className="text-xs font-medium">{item.label}</span></span>
          </label>)}</div>
        </div>)}
      </fieldset>
      <fieldset disabled={isSubmitting} className="min-w-0 space-y-4">
        <legend className="mb-3 text-sm font-medium">Choose a background <span className="font-normal text-muted-foreground">· 12 colors</span></legend>
        {PLAN_CATEGORIES.map((group) => <div key={group} className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{group}</p>
          <div className="grid grid-cols-3 gap-2">{PLAN_COLORS.filter((item) => item.category === group).map((item) => <label key={item.id} title={item.label}>
            <input type="radio" name="plan-color" value={item.id} checked={color === item.id} onChange={() => setColor(item.id)} className="peer sr-only" />
            <span className={cn(selectionClass, "flex flex-col items-center gap-1.5 p-2")}>
              <span className="flex h-7 w-full items-center justify-center rounded-md ring-1 ring-inset ring-black/10" style={{ backgroundColor: item.background, color: item.foreground }}>{color === item.id && <Check aria-hidden="true" className="size-4" />}</span>
              <span className="text-center text-[10px] font-medium">{item.label}</span>
            </span>
          </label>)}</div>
        </div>)}
      </fieldset>
    </div>
    <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/20 p-4" aria-live="polite">
      <PlanIcon icon={icon} color={color} />
      <div className="min-w-0"><p className="break-words font-heading text-base font-semibold">{planName.trim() || "Your plan name"}</p><p className="mt-0.5 text-xs text-muted-foreground">{category} · Live preview</p></div>
    </div>
  </section>
}
