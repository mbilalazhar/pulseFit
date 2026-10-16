"use client"

import { Plus, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePlanForm, areaClass } from "./plan-form-context"

export function PricingDurations() {
  const {
    basePrice,
    setBasePrice,
    currency,
    setCurrency,
    maxHoursPerDay,
    setMaxHoursPerDay,
    durations,
    durMonths,
    setDurMonths,
    durDiscount,
    setDurDiscount,
    addDuration,
    removeDuration,
    priceFor,
    format,
  } = usePlanForm()

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <h2 className="font-heading text-base font-semibold">
        Pricing &amp; Durations
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="base-price" className="text-sm font-medium">
            Base Price
          </label>
          <div className="flex h-11 items-center gap-3 rounded-xl border border-input bg-white pl-1.5 pr-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
            <select
              id="currency"
              aria-label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-8 shrink-0 cursor-pointer rounded-md border border-input bg-muted/60 px-2 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <option value="PKR">PKR</option>
              <option value="USD">USD</option>
            </select>
            <input
              id="base-price"
              inputMode="decimal"
              value={basePrice}
              onChange={(e) => {
                const value = e.target.value
                if (/^\d*(\.\d{0,2})?$/.test(value)) setBasePrice(value)
              }}
              placeholder="0.00"
              className="min-w-0 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the monthly price of this plan.
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="max-hours-per-day" className="text-sm font-medium">
            Maximum Gym Hours / Day
          </label>
          <div className="flex h-11 items-center gap-3 rounded-xl border border-input bg-white px-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
            <input
              id="max-hours-per-day"
              type="number"
              inputMode="decimal"
              min={0}
              max={24}
              step="any"
              value={maxHoursPerDay}
              onChange={(e) => setMaxHoursPerDay(e.target.value)}
              placeholder="e.g. 2"
              aria-describedby="max-hours-hint"
              className="min-w-0 w-full bg-transparent text-sm outline-none"
            />
            <span className="shrink-0 rounded-md bg-muted/60 px-2 py-1 text-xs font-medium text-muted-foreground">
              hrs/day
            </span>
          </div>
          <p id="max-hours-hint" className="text-xs text-muted-foreground">
            Set a daily limit up to 24 hours. Leave blank for no limit.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Available Durations</p>
          <p className="text-xs text-muted-foreground">
            Pick a duration (1–12 months), set a discount, and the price is
            calculated for you.
          </p>
        </div>

        {/* Add-duration row */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed p-3">
          <div className="space-y-1">
            <label htmlFor="dur-months" className="text-xs font-medium">
              Duration
            </label>
            <div className="relative mx-2 w-56">
              <select
                id="dur-months"
                value={durMonths}
                onChange={(e) => setDurMonths(Number(e.target.value))}
                className={cn(areaClass, "h-10 w-full py-0 pr-10 appearance-none")}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? "Month" : "Months"}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1 ">
            <label htmlFor="dur-discount" className="text-xs font-medium">
              Discount %
            </label>
            <input
              id="dur-discount"
              type="number"
              min={0}
              max={100}
              value={durDiscount}
              onChange={(e) =>
                setDurDiscount(
                  Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                )
              }
              className={cn(
                areaClass,
                "h-10 w-56 mx-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              )}
            />
          </div>

          <Button type="button" size="lg" onClick={addDuration} className="h-10 gap-1.5">
            <Plus className="size-4" />
            Add
          </Button>
        </div>

        {/* Selected durations */}
        {durations.length === 0 ? (
          <p className="rounded-xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
            No durations added yet.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {durations.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-xl border p-3"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {d.months} {d.months === 1 ? "Month" : "Months"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.discount > 0 ? `${d.discount}% discount` : "No discount"}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-accent">
                    {format(priceFor(d.months, d.discount))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeDuration(d.id)}
                  aria-label={`Remove ${d.months}-month duration`}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
