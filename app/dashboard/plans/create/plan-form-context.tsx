"use client"

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createPlan, updatePlan, type CreatePlanPayload, type PlanSummary } from "@/lib/services/subscription.services"
import { createPlanSchema, PLAN_FEATURE_MAX } from "@/lib/validators/plan"
import { buildPlanFeatures, hasTrainerGuidance, splitPlanFeatures, type PlanFacility } from "@/lib/plan-features"

/* ---------- types ---------- */

export type Status = "DRAFT" | "ACTIVE" | "INACTIVE"
export type Duration = { id: string; months: number; discount: number; label?: string }

/* ---------- constants ---------- */

export const SHORT_MAX = 200
export const LONG_MAX = 2000
export const FEATURE_MAX = PLAN_FEATURE_MAX

export const STATUS_OPTIONS: {
  value: Status
  label: string
  desc: string
  badge: string
}[] = [
  {
    value: "DRAFT",
    label: "Draft",
    desc: "Finish details later. Included trainer guidance needs session settings.",
    badge: "text-warning bg-warning/10",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
    desc: "Hidden from members. You can edit details and add or remove features.",
    badge: "text-muted-foreground bg-muted",
  },
  {
    value: "ACTIVE",
    label: "Active",
    desc: "Available to members. Deactivate the plan before making any changes.",
    badge: "text-success bg-success/10",
  },
]

/* Shared input styling used across the form sections. */
export const inputClass =
  "h-11 rounded-sm bg-card px-3.5 text-sm focus-visible:border-primary focus-visible:ring-primary/20"
export const areaClass =
  "w-full rounded-sm border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"

/* ---------- helpers ---------- */

export const countChars = (text: string) => text.length
export const clampChars = (text: string, max: number) => text.slice(0, max)

/* Warning only (no count): amber when close to the limit, red once reached. */
export function LimitHint({ count, max }: { count: number; max: number }) {
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

/* ---------- context ---------- */

type PlanFormValue = {
  planName: string
  setPlanName: (v: string) => void
  shortDesc: string
  setShortDesc: (v: string) => void
  longDesc: string
  setLongDesc: (v: string) => void

  basePrice: string
  setBasePrice: (v: string) => void
  currency: string
  setCurrency: (v: string) => void
  maxHoursPerDay: string
  setMaxHoursPerDay: (v: string) => void
  guidanceIncluded: boolean
  sessionsPerWeek: string
  setSessionsPerWeek: (v: string) => void
  sessionDurationMinutes: string
  setSessionDurationMinutes: (v: string) => void

  durations: Duration[]
  durMonths: number
  setDurMonths: (v: number) => void
  durDiscount: number
  setDurDiscount: (v: number) => void
  addDuration: () => void
  removeDuration: (id: string) => void

  facilities: PlanFacility[]
  toggleFacility: (id: PlanFacility, included: boolean) => void
  customFeatures: string
  setCustomFeatures: (v: string) => void

  status: Status
  setStatus: (v: Status) => void

  monthly: number
  priceFor: (months: number, discount: number) => number
  format: (n: number) => string

  handleSubmit: (asDraft: boolean) => void
  isSubmitting: boolean
  isEditing: boolean
  pendingChanges: CreatePlanPayload | null
  cancelSave: () => void
  confirmSave: () => void
}

const PlanFormContext = createContext<PlanFormValue | null>(null)

export function usePlanForm() {
  const ctx = useContext(PlanFormContext)
  if (!ctx)
    throw new Error("usePlanForm must be used within a <PlanFormProvider>")
  return ctx
}

export function PlanFormProvider({ children, initialPlan }: { children: ReactNode; initialPlan?: PlanSummary }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [planName, setPlanName] = useState(initialPlan?.name ?? "")
  const [shortDesc, setShortDesc] = useState(initialPlan?.shortDesc ?? "")
  const [longDesc, setLongDesc] = useState(initialPlan?.longDesc ?? "")

  const [basePrice, setBasePrice] = useState(initialPlan ? (initialPlan.basePriceMinor / 100).toFixed(2) : "")
  const [currency, setCurrency] = useState(initialPlan?.currency ?? "PKR")
  const [maxHoursPerDay, setMaxHoursPerDay] = useState(initialPlan?.maxHoursPerDay?.toString() ?? "")
  const [sessionsPerWeek, setSessionsPerWeek] = useState(initialPlan?.sessionsPerWeek?.toString() ?? "")
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(initialPlan?.sessionDurationMinutes?.toString() ?? "")

  const [durations, setDurations] = useState<Duration[]>(() => initialPlan?.durations.map((duration) => ({
    id: duration.id, months: duration.durationMonths, discount: duration.discountPercent,
    label: duration.label ?? undefined,
  })) ?? [])
  const [durMonths, setDurMonths] = useState(1)
  const [durDiscount, setDurDiscount] = useState(0)

  const [facilities, setFacilities] = useState<PlanFacility[]>(() => splitPlanFeatures(initialPlan?.features ?? []).facilities)
  const [customFeatures, setCustomFeatures] = useState(() => splitPlanFeatures(initialPlan?.features ?? []).customFeatures)
  const guidanceIncluded = hasTrainerGuidance(buildPlanFeatures(facilities, customFeatures))
  const toggleFacility = (id: PlanFacility, included: boolean) => {
    setFacilities((previous) => included
      ? [...previous.filter((feature) => feature !== id), id]
      : previous.filter((feature) => feature !== id))
  }

  const [status, setStatus] = useState<Status>(initialPlan?.status ?? "DRAFT")
  const [pendingChanges, setPendingChanges] = useState<CreatePlanPayload | null>(null)

  const monthly = Number(basePrice) || 0

  const priceFor = (months: number, discount: number) =>
    Math.round(monthly * months * (1 - discount / 100) * 100) / 100

  const format = (n: number) =>
    `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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

  const mutation = useMutation({
    mutationFn: (payload: CreatePlanPayload) => initialPlan ? updatePlan(initialPlan.id, payload) : createPlan(payload),
    onSuccess: () => {
      setPendingChanges(null)
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      toast.success(initialPlan ? "Plan updated successfully." : "Plan created successfully.")
      router.push("/dashboard/plans")
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (asDraft: boolean) => {
    if (mutation.isPending) return
    const parsed = createPlanSchema.safeParse({
      name: planName.trim(),
      shortDesc: shortDesc.trim(),
      longDesc: longDesc.trim() || undefined,
      // API stores price in minor units (paisa/cents).
      basePriceMinor: Math.round(monthly * 100),
      currency,
      maxHoursPerDay: maxHoursPerDay.trim() ? Number(maxHoursPerDay) : null,
      sessionsPerWeek: guidanceIncluded && sessionsPerWeek.trim() ? Number(sessionsPerWeek) : null,
      sessionDurationMinutes: guidanceIncluded && sessionDurationMinutes.trim() ? Number(sessionDurationMinutes) : null,
      status: asDraft ? "DRAFT" : status,
      features: buildPlanFeatures(facilities, customFeatures),
      durations: durations.map((d) => ({
        label: d.label ?? `${d.months} ${d.months === 1 ? "Month" : "Months"}`,
        durationMonths: d.months,
        discountPercent: d.discount,
      })),
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    if (initialPlan || parsed.data.status === "ACTIVE") setPendingChanges(parsed.data)
    else mutation.mutate(parsed.data)
  }

  const value: PlanFormValue = {
    planName,
    setPlanName,
    shortDesc,
    setShortDesc,
    longDesc,
    setLongDesc,
    basePrice,
    setBasePrice,
    currency,
    setCurrency,
    maxHoursPerDay,
    setMaxHoursPerDay,
    guidanceIncluded,
    sessionsPerWeek,
    setSessionsPerWeek,
    sessionDurationMinutes,
    setSessionDurationMinutes,
    durations,
    durMonths,
    setDurMonths,
    durDiscount,
    setDurDiscount,
    addDuration,
    removeDuration,
    facilities,
    toggleFacility,
    customFeatures,
    setCustomFeatures,
    status,
    setStatus,
    monthly,
    priceFor,
    format,
    handleSubmit,
    isSubmitting: mutation.isPending,
    isEditing: !!initialPlan,
    pendingChanges,
    cancelSave: () => { if (!mutation.isPending) setPendingChanges(null) },
    confirmSave: () => {
      if (pendingChanges && !mutation.isPending) mutation.mutate(pendingChanges)
    },
  }

  return (
    <PlanFormContext.Provider value={value}>
      {children}
    </PlanFormContext.Provider>
  )
}
