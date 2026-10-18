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
import { createPlan } from "@/lib/services/subscription.services"
import { createPlanSchema, PLAN_FEATURE_MAX, TRAINER_FEATURE_LABEL } from "@/lib/validators/plan"

/* ---------- types ---------- */

export type Status = "DRAFT" | "ACTIVE" | "INACTIVE"
export type Duration = { id: string; months: number; discount: number }
export type Feature = { id: string; text: string }

/* ---------- constants ---------- */

export const SHORT_MAX = 60
export const LONG_MAX = 300
export const FEATURE_MAX = PLAN_FEATURE_MAX
const TRAINER_FEATURE_ID = "included-trainer"

export const STATUS_OPTIONS: {
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

/* Shared input styling used across the form sections. */
export const inputClass =
  "h-11 rounded-sm bg-card px-3.5 text-sm focus-visible:border-primary focus-visible:ring-primary/20"
export const areaClass =
  "w-full rounded-sm border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"

/* ---------- helpers ---------- */

export const countChars = (text: string) => text.length
export const clampChars = (text: string, max: number) => text.slice(0, max)
const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1)

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

  durations: Duration[]
  durMonths: number
  setDurMonths: (v: number) => void
  durDiscount: number
  setDurDiscount: (v: number) => void
  addDuration: () => void
  removeDuration: (id: string) => void

  features: Feature[]
  includesTrainer: boolean
  setIncludesTrainer: (v: boolean) => void
  addingFeature: boolean
  setAddingFeature: (v: boolean) => void
  featureDraft: string
  setFeatureDraft: (v: string) => void
  addFeature: () => void
  removeFeature: (id: string) => void

  status: Status
  setStatus: (v: Status) => void

  monthly: number
  priceFor: (months: number, discount: number) => number
  format: (n: number) => string

  handleSubmit: (asDraft: boolean) => void
  isSubmitting: boolean
}

const PlanFormContext = createContext<PlanFormValue | null>(null)

export function usePlanForm() {
  const ctx = useContext(PlanFormContext)
  if (!ctx)
    throw new Error("usePlanForm must be used within a <PlanFormProvider>")
  return ctx
}

export function PlanFormProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [planName, setPlanName] = useState("")
  const [shortDesc, setShortDesc] = useState("")
  const [longDesc, setLongDesc] = useState("")

  const [basePrice, setBasePrice] = useState("")
  const [currency, setCurrency] = useState("PKR")
  const [maxHoursPerDay, setMaxHoursPerDay] = useState("")

  const [durations, setDurations] = useState<Duration[]>([])
  const [durMonths, setDurMonths] = useState(1)
  const [durDiscount, setDurDiscount] = useState(0)

  const [features, setFeatures] = useState<Feature[]>([])
  const [addingFeature, setAddingFeature] = useState(false)
  const [featureDraft, setFeatureDraft] = useState("")

  const includesTrainer = features.some((feature) => feature.id === TRAINER_FEATURE_ID)
  const setIncludesTrainer = (included: boolean) => {
    setFeatures((previous) => {
      const remaining = previous.filter((feature) => feature.id !== TRAINER_FEATURE_ID)
      return included
        ? [{ id: TRAINER_FEATURE_ID, text: TRAINER_FEATURE_LABEL }, ...remaining]
        : remaining
    })
  }

  const [status, setStatus] = useState<Status>("DRAFT")

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

  const addFeature = () => {
    const text = featureDraft.trim()
    if (!text) return
    if (text.toLowerCase() === TRAINER_FEATURE_LABEL.toLowerCase()) {
      setIncludesTrainer(true)
      setFeatureDraft("")
      return
    }
    setFeatures((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: capitalize(text) },
    ])
    setFeatureDraft("")
  }

  const removeFeature = (id: string) =>
    setFeatures((prev) => prev.filter((f) => f.id !== id))

  const mutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] })
      toast.success("Plan created successfully.")
      router.push("/dashboard/plans")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (asDraft: boolean) => {
    if (mutation.isPending) return
    if (!planName.trim()) {
      toast.error("Enter a plan name.")
      return
    }
    if (!shortDesc.trim()) {
      toast.error("Enter a short description.")
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
    if (features.length === 0) {
      toast.error("Add at least one feature.")
      return
    }

    const parsed = createPlanSchema.safeParse({
      name: planName.trim(),
      shortDesc: shortDesc.trim(),
      longDesc: longDesc.trim() || undefined,
      // API stores price in minor units (paisa/cents).
      basePriceMinor: Math.round(monthly * 100),
      currency,
      maxHoursPerDay: maxHoursPerDay.trim() ? Number(maxHoursPerDay) : null,
      status: asDraft ? "DRAFT" : status,
      features: features.map((f) => ({ label: f.text })),
      durations: durations.map((d) => ({
        label: `${d.months} ${d.months === 1 ? "Month" : "Months"}`,
        durationMonths: d.months,
        discountPercent: d.discount,
      })),
    })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }
    mutation.mutate(parsed.data)
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
    durations,
    durMonths,
    setDurMonths,
    durDiscount,
    setDurDiscount,
    addDuration,
    removeDuration,
    features,
    includesTrainer,
    setIncludesTrainer,
    addingFeature,
    setAddingFeature,
    featureDraft,
    setFeatureDraft,
    addFeature,
    removeFeature,
    status,
    setStatus,
    monthly,
    priceFor,
    format,
    handleSubmit,
    isSubmitting: mutation.isPending,
  }

  return (
    <PlanFormContext.Provider value={value}>
      {children}
    </PlanFormContext.Provider>
  )
}
