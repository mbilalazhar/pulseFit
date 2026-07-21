"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Check,
  X,
  Info,
  FileText,
  Trash2,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/* ---------- helpers ---------- */

const countChars = (text: string) => text.length

// Keep a value within `max` characters.
const clampChars = (text: string, max: number) => text.slice(0, max)

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1)

const inputClass =
  "h-11 rounded-sm bg-white px-3.5 text-sm focus-visible:border-primary focus-visible:ring-primary/20"
const areaClass =
  "w-full rounded-sm border border-input bg-white px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"

/* Warning only (no count): amber when close to the limit, red once reached. */
function LimitHint({ count, max }: { count: number; max: number }) {
  if (count >= max)
    return (
      <p className="text-xs font-medium text-destructive">
        Character limit reached.
      </p>
    )
  if (count >= Math.floor(max * 0.9))
    return (
      <p className="text-xs font-medium text-warning">
        Approaching the character limit.
      </p>
    )
  return null
}

/* ---------- types ---------- */

type Status = "DRAFT" | "ACTIVE" | "INACTIVE"
type Duration = { id: string; months: number; discount: number }
type Feature = { id: string; text: string }

const STATUS_OPTIONS: {
  value: Status
  label: string
  desc: string
  badge: string
}[] = [
  {
    value: "DRAFT",
    label: "Draft",
    desc: "Only you can see this plan.",
    badge: "text-warning bg-warning/10",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
    desc: "Hidden from members — you can reactivate it anytime.",
    badge: "text-muted-foreground bg-muted",
  },
  {
    value: "ACTIVE",
    label: "Active",
    desc: "This plan will be visible to all members.",
    badge: "text-success bg-success/10",
  },
]

const SHORT_MAX = 60
const LONG_MAX = 300
const FEATURE_MAX = 250

export default function CreatePlan() {
  const [planName, setPlanName] = useState("")
  const [shortDesc, setShortDesc] = useState("")
  const [longDesc, setLongDesc] = useState("")

  const [basePrice, setBasePrice] = useState("")
  const [currency, setCurrency] = useState("PKR")

  const [durations, setDurations] = useState<Duration[]>([])
  const [durMonths, setDurMonths] = useState(1)
  const [durDiscount, setDurDiscount] = useState(0)

  const [features, setFeatures] = useState<Feature[]>([])
  const [addingFeature, setAddingFeature] = useState(false)
  const [featureDraft, setFeatureDraft] = useState("")

  const [status, setStatus] = useState<Status>("DRAFT")

  const [showInfoBanner, setShowInfoBanner] = useState(true)
  const [showDraftBanner, setShowDraftBanner] = useState(true)

  const monthly = Number(basePrice) || 0

  const priceFor = (months: number, discount: number) =>
    Math.round(monthly * months * (1 - discount / 100))

  const format = (n: number) => `${currency} ${n.toLocaleString()}`

  const addDuration = () => {
    if (durations.some((d) => d.months === durMonths)) {
      toast.error(`A ${durMonths}-month duration is already added.`)
      return
    }
    setDurations((prev) =>
      [
        ...prev,
        { id: crypto.randomUUID(), months: durMonths, discount: durDiscount },
      ].sort((a, b) => a.months - b.months),
    )
  }

  const removeDuration = (id: string) =>
    setDurations((prev) => prev.filter((d) => d.id !== id))

  const addFeature = () => {
    const text = featureDraft.trim()
    if (!text) return
    setFeatures((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: capitalize(text) },
    ])
    setFeatureDraft("")
  }

  const removeFeature = (id: string) =>
    setFeatures((prev) => prev.filter((f) => f.id !== id))

  const featureChars = useMemo(() => countChars(featureDraft), [featureDraft])

  const handleSubmit = (asDraft: boolean) => {
    if (!planName.trim()) {
      toast.error("Enter a plan name.")
      return
    }
    if (monthly <= 0) {
      toast.error("Enter a base price greater than zero.")
      return
    }
    if (durations.length === 0) {
      toast.error("Add at least one billing duration.")
      return
    }

    const payload = {
      planName: planName.trim(),
      shortDesc: shortDesc.trim(),
      longDesc: longDesc.trim(),
      currency,
      basePrice: monthly,
      status: asDraft ? "DRAFT" : status,
      durations: durations.map((d) => ({
        months: d.months,
        discount: d.discount,
        price: priceFor(d.months, d.discount),
      })),
      features: features.map((f) => f.text),
    }
    // Backend wiring is not in scope yet — surface the assembled plan for now.
    console.log("Plan payload", payload)
    toast.success(asDraft ? "Plan saved as draft." : "Plan created.")
  }

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <Link
        href="/dashboard/plans"
        className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3.5 py-2 text-sm font-medium shadow-sm transition-all duration-300 hover:scale-105 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
      >
        <ArrowLeft className="h-4 w-0 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:w-4 group-hover:translate-x-0 group-hover:scale-125 group-hover:opacity-100" />
        Back to Plans
      </Link>

      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Create New Plan
        </h1>
        <p className="text-sm text-muted-foreground">
          Build a membership plan for your gym. Add pricing, duration and features.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ---------- LEFT COLUMN ---------- */}
        <div className="space-y-6">
          {/* Info banners */}
          {showInfoBanner ? (
            <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Info className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Active plans are visible to all members.
                </p>
                <p className="text-sm text-muted-foreground">
                  Keep your plans consistent and competitive to attract and
                  retain more members.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoBanner(false)}
                aria-label="Dismiss notification"
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          {showDraftBanner ? (
            <div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
                <FileText className="size-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Not ready to publish yet?</p>
                <p className="text-sm text-muted-foreground">
                  You can save the plan as a draft and finalize it later when
                  you&apos;re ready.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDraftBanner(false)}
                aria-label="Dismiss notification"
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          {/* Plan Information */}
          <section className="space-y-4 rounded-2xl border bg-white p-5">
            <h2 className="font-heading text-base font-semibold">
              Plan Information
            </h2>

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
                  onChange={(e) =>
                    setShortDesc(clampChars(e.target.value, SHORT_MAX))
                  }
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
                onChange={(e) =>
                  setLongDesc(clampChars(e.target.value, LONG_MAX))
                }
                placeholder="Describe the plan in detail..."
                className={areaClass}
              />
              <LimitHint count={countChars(longDesc)} max={LONG_MAX} />
            </div>
          </section>

          {/* Pricing & Durations */}
          <section className="space-y-4 rounded-2xl border bg-white p-5">
            <h2 className="font-heading text-base font-semibold">
              Pricing &amp; Durations
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="base-price" className="text-sm font-medium">
                  Base Price
                </label>
                <div className="flex h-11 items-center rounded-xl border border-input bg-white px-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                  <span className="mr-2 text-sm text-muted-foreground">
                    {currency}
                  </span>
                  <input
                    id="base-price"
                    inputMode="decimal"
                    value={basePrice}
                    onChange={(e) =>
                      setBasePrice(e.target.value.replace(/[^0-9.]/g, ""))
                    }
                    placeholder="0.00"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the monthly price of this plan.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="currency" className="text-sm font-medium">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={cn(areaClass, "h-11 py-0")}
                >
                  <option value="PKR">PKR - Pakistani Rupee</option>
                  <option value="USD">USD - US Dollar</option>
                </select>
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
                  <select
                    id="dur-months"
                    value={durMonths}
                    onChange={(e) => setDurMonths(Number(e.target.value))}
                    className={cn(areaClass, "h-10 w-56 py-0 mx-2")}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 1 ? "Month" : "Months"}
                      </option>
                    ))}
                  </select>
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
                    className={cn(areaClass, "h-10 w-56 mx-2")}
                  />
                </div>

                <Button
                  type="button"
                  size="lg"
                  onClick={addDuration}
                  className="h-10 gap-1.5"
                >
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
                          {d.discount > 0
                            ? `${d.discount}% discount`
                            : "No discount"}
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
        </div>

        {/* ---------- RIGHT COLUMN ---------- */}
        <div className="space-y-6">
          {/* Plan Features (replaces the preview) */}
          <section className="space-y-4 rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold">
                Plan Features
              </h2>
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
                  onChange={(e) =>
                    setFeatureDraft(clampChars(e.target.value, FEATURE_MAX))
                  }
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

          {/* Plan Status */}
          <section className="space-y-3 rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base font-semibold">
                  Plan Status
                </h2>
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
                      {active ? (
                        <span className="size-2 rounded-full bg-accent" />
                      ) : null}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">
                        {opt.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {opt.desc}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 p-4">
            <Link
              href="/dashboard/plans"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Cancel
            </Link>
            <Button type="button" size="lg" onClick={() => handleSubmit(false)}>
              Create Plan
            </Button>
          </div>
        </div>
       </div>
    </div>
  )
}
