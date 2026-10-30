"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createTrainer,
  updateTrainer,
  type CreateTrainerPayload,
  type ContractorPaymentType,
  type TrainerShift,
} from "@/lib/services/trainer.services"
import { trainerScheduleFields, type TrainerFormData } from "@/lib/trainer-form-data"
import { WORKING_DAYS, timeToMinutes, endTimeToMinutes, trainerAvailabilitySchema, contractorSessionsSchema } from "@/lib/trainer-availability"

/* ---------- types ---------- */

export type TrainerType = "staff" | "contractor"
export type PricingModel = "fixed" | "session"
export type Certification = { id: string; text: string }
export type ContractorSessionInput = WorkingDayInput & { id: string }
export type WorkingDayInput = { dayOfWeek: number; startTime: string; endTime: string }

/* ---------- constants ---------- */

export const SHIFT_OPTIONS = ["Morning Shift", "Evening Shift", "Night Shift", "Flexible"]

/* A trainer is tagged with the handful of things they actually coach. */
export const MAX_SPECIALIZATIONS = 3
export const SPECIALIZATIONS = [
  "Yoga",
  "Weight Training",
  "Resistance Training",
  "Cardio",
  "CrossFit",
  "Pilates",
  "Nutrition",
  "HIIT",
  "Boxing",
  "Swimming",
  "Stretching",
  "Mobility",
]

export const CERTIFICATION_MAX = 120

/* Select labels map to the enums the API stores. */
const SHIFT_VALUES: Record<string, TrainerShift> = {
  "Morning Shift": "MORNING",
  "Evening Shift": "EVENING",
  "Night Shift": "NIGHT",
  Flexible: "FLEXIBLE",
}
const PAYMENT_TYPES: Record<PricingModel, ContractorPaymentType> = {
  fixed: "FIXED_FEE",
  session: "SESSION_BASED",
}

/* Shared field styling, mirroring the plan form's tokens. */
export const inputClass =
  "h-11 rounded-sm bg-card px-3.5 text-sm focus-visible:border-primary focus-visible:ring-primary/20"
export const areaClass =
  "w-full rounded-sm border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"

/* ---------- helpers ---------- */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/* Formats the yyyy-mm-dd value from <input type="date"> without constructing a
   Date, so the rendered string never shifts with the viewer's timezone. */
export function formatDate(iso: string) {
  if (!iso) return "—"
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return "—"
  return `${day} ${MONTHS[month - 1]} ${year}`
}

export const formatPkr = (amount: number) => `PKR ${amount.toLocaleString()}`

/* ---------- context ---------- */

type TrainerFormValue = {
  isEditing: boolean
  cancelHref: string
  profilePhotoUrl: string | null
  fullName: string
  setFullName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  phone: string
  setPhone: (v: string) => void

  trainerType: TrainerType
  setTrainerType: (v: TrainerType) => void

  salary: string
  setSalary: (v: string) => void
  workingDays: WorkingDayInput[]
  toggleWorkingDay: (dayOfWeek: number) => void
  updateWorkingTime: (dayOfWeek: number, field: "startTime" | "endTime", value: string) => void
  shift: string
  setShift: (v: string) => void
  joiningDate: string
  setJoiningDate: (v: string) => void

  pricingModel: PricingModel
  setPricingModel: (v: PricingModel) => void
  contractorPrice: string
  setContractorPrice: (v: string) => void
  contractorSessions: ContractorSessionInput[]
  addContractorSession: () => void
  removeContractorSession: (id: string) => void
  updateContractorSession: (id: string, changes: Partial<WorkingDayInput>) => void
  contractorStartDate: string
  setContractorStartDate: (v: string) => void

  specializations: string[]
  toggleSpecialization: (name: string) => void

  certifications: Certification[]
  certDraft: string
  setCertDraft: (v: string) => void
  addCertification: () => void
  removeCertification: (id: string) => void

  salaryAmount: number
  handleSubmit: () => void
  isSubmitting: boolean
}

const TrainerFormContext = createContext<TrainerFormValue | null>(null)

export function useTrainerForm() {
  const ctx = useContext(TrainerFormContext)
  if (!ctx)
    throw new Error("useTrainerForm must be used within a <TrainerFormProvider>")
  return ctx
}

export function TrainerFormProvider({ children, initialTrainer }: { children: ReactNode; initialTrainer?: TrainerFormData }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [fullName, setFullName] = useState(initialTrainer?.fullName ?? "")
  const [email, setEmail] = useState(initialTrainer?.email ?? "")
  const [phone, setPhone] = useState(initialTrainer?.contactNumber ?? "")

  const [trainerType, setTrainerType] = useState<TrainerType>(initialTrainer?.trainerType === "CONTRACTOR" ? "contractor" : "staff")

  const [salary, setSalary] = useState(initialTrainer?.monthlySalary?.toString() ?? "")
  const [workingDays, setWorkingDays] = useState<WorkingDayInput[]>(
    initialTrainer?.trainerType === "STAFF" ? trainerScheduleFields(initialTrainer.availability) : WORKING_DAYS.filter((day) => day.value !== 0).map((day) => ({
      dayOfWeek: day.value, startTime: "12:00", endTime: "20:00",
    })),
  )
  const [shift, setShift] = useState(Object.entries(SHIFT_VALUES).find(([, value]) => value === initialTrainer?.shift)?.[0] ?? SHIFT_OPTIONS[3])
  const [joiningDate, setJoiningDate] = useState(initialTrainer?.joiningDate ?? "")

  const [pricingModel, setPricingModel] = useState<PricingModel>(initialTrainer?.contractorPaymentType === "FIXED_FEE" ? "fixed" : "session")
  const [contractorPrice, setContractorPrice] = useState((initialTrainer?.contractorPaymentType === "FIXED_FEE" ? initialTrainer.fixedFeeAmount : initialTrainer?.sessionRate)?.toString() ?? "")
  const [contractorSessions, setContractorSessions] = useState<ContractorSessionInput[]>(initialTrainer?.trainerType === "CONTRACTOR"
    ? trainerScheduleFields(initialTrainer.availability).map((session, index) => ({ ...session, id: `saved-session-${index}` }))
    : [
    { id: "first-session", dayOfWeek: 1, startTime: "12:00", endTime: "13:00" },
  ])
  const [contractorStartDate, setContractorStartDate] = useState(initialTrainer?.joiningDate ?? "")

  const [specializations, setSpecializations] = useState<string[]>(initialTrainer?.specializations ?? [])
  const [certifications, setCertifications] = useState<Certification[]>(initialTrainer?.certifications.map((text, index) => ({ id: `saved-cert-${index}`, text })) ?? [])
  const [certDraft, setCertDraft] = useState("")

  const salaryAmount = Number(salary) || 0

  const toggleWorkingDay = (dayOfWeek: number) => {
    setWorkingDays((days) => days.some((day) => day.dayOfWeek === dayOfWeek)
      ? days.filter((day) => day.dayOfWeek !== dayOfWeek)
      : [...days, { dayOfWeek, startTime: "12:00", endTime: "20:00" }]
        .sort((a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7)))
  }

  const updateWorkingTime = (dayOfWeek: number, field: "startTime" | "endTime", value: string) => {
    setWorkingDays((days) => days.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day))
  }

  const addContractorSession = () => {
    setContractorSessions((sessions) => {
      if (sessions.length >= 21) return sessions
      const last = sessions.at(-1)
      const end = last ? endTimeToMinutes(last.endTime) : NaN
      const sameDay = Number.isFinite(end) && end + 60 < 1440
      const start = sameDay ? end : 720
      const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
      return [...sessions, { id: crypto.randomUUID(), dayOfWeek: last ? (sameDay ? last.dayOfWeek : (last.dayOfWeek + 1) % 7) : 1, startTime: time(start), endTime: time(start + 60) }]
    })
  }

  const removeContractorSession = (id: string) => setContractorSessions((sessions) => sessions.filter((session) => session.id !== id))
  const updateContractorSession = (id: string, changes: Partial<WorkingDayInput>) => setContractorSessions((sessions) => sessions.map((session) => session.id === id ? { ...session, ...changes } : session))

  const toggleSpecialization = (name: string) => {
    if (specializations.includes(name)) {
      setSpecializations((prev) => prev.filter((s) => s !== name))
      return
    }
    if (specializations.length >= MAX_SPECIALIZATIONS) {
      toast.error(`Pick at most ${MAX_SPECIALIZATIONS} specializations.`)
      return
    }
    setSpecializations((prev) => [...prev, name])
  }

  const addCertification = () => {
    const text = certDraft.trim()
    if (!text) return
    if (certifications.some((c) => c.text.toLowerCase() === text.toLowerCase())) {
      toast.error(`"${text}" is already added.`)
      return
    }
    setCertifications((prev) => [...prev, { id: crypto.randomUUID(), text }])
    setCertDraft("")
  }

  const removeCertification = (id: string) =>
    setCertifications((prev) => prev.filter((c) => c.id !== id))

  const mutation = useMutation({
    mutationFn: (payload: CreateTrainerPayload) => initialTrainer ? updateTrainer(initialTrainer.id, payload) : createTrainer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] })
      if (initialTrainer) queryClient.invalidateQueries({ queryKey: ["trainer-schedule", initialTrainer.id] })
      toast.success(initialTrainer ? "Trainer updated successfully." : "Trainer created successfully.")
      router.push(initialTrainer ? `/dashboard/trainers/${initialTrainer.id}` : "/dashboard/trainers")
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = () => {
    if (mutation.isPending) return
    if (!fullName.trim()) {
      toast.error("Enter the trainer's full name.")
      return
    }
    if (!email.trim()) {
      toast.error("Enter an email address.")
      return
    }
    if (!phone.trim()) {
      toast.error("Enter a phone number.")
      return
    }

    if (trainerType === "staff") {
      const availability = trainerAvailabilitySchema.safeParse(workingDays.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        startMinute: timeToMinutes(day.startTime),
        endMinute: endTimeToMinutes(day.endTime),
      })))
      if (!availability.success) {
        toast.error(workingDays.length === 0
          ? "Select at least one working day."
          : "Set a valid start and end time for each working day. End time must be after start time.")
        return
      }
      if (salaryAmount <= 0) {
        toast.error("Enter a monthly salary greater than zero.")
        return
      }
      if (!joiningDate) {
        toast.error("Pick a joining date.")
        return
      }
      if (specializations.length === 0) {
        toast.error("Add at least one specialization.")
        return
      }

      mutation.mutate({
        trainerType: "STAFF",
        fullName: fullName.trim(),
        email: email.trim(),
        contactNumber: phone.trim(),
        joiningDate,
        monthlySalary: salaryAmount,
        availability: availability.data,
        shift: SHIFT_VALUES[shift],
        specializations,
        certifications: certifications.map((c) => c.text),
      })
      return
    }

    const price = Number(contractorPrice) || 0
    const sessions = contractorSessionsSchema.safeParse(contractorSessions.map((session) => ({
      dayOfWeek: session.dayOfWeek,
      startMinute: timeToMinutes(session.startTime),
      endMinute: endTimeToMinutes(session.endTime),
    })))
    if (price <= 0) {
      toast.error("Enter a price greater than zero.")
      return
    }
    if (!sessions.success) {
      toast.error(contractorSessions.length === 0 ? "Add at least one weekly session." : "Give each session a valid time range. Sessions on the same day must not overlap.")
      return
    }
    if (!contractorStartDate) {
      toast.error("Pick a start date.")
      return
    }

    mutation.mutate({
      trainerType: "CONTRACTOR",
      fullName: fullName.trim(),
      email: email.trim(),
      contactNumber: phone.trim(),
      joiningDate: contractorStartDate,
      paymentType: PAYMENT_TYPES[pricingModel],
      amount: price,
      sessions: sessions.data,
    })
  }

  const value = useMemo<TrainerFormValue>(
    () => ({
      isEditing: !!initialTrainer,
      cancelHref: initialTrainer ? `/dashboard/trainers/${initialTrainer.id}` : "/dashboard/trainers",
      profilePhotoUrl: initialTrainer?.profilePhotoUrl ?? null,
      fullName,
      setFullName,
      email,
      setEmail,
      phone,
      setPhone,
      trainerType,
      setTrainerType,
      salary,
      setSalary,
      workingDays,
      toggleWorkingDay,
      updateWorkingTime,
      shift,
      setShift,
      joiningDate,
      setJoiningDate,
      pricingModel,
      setPricingModel,
      contractorPrice,
      setContractorPrice,
      contractorSessions,
      addContractorSession,
      removeContractorSession,
      updateContractorSession,
      contractorStartDate,
      setContractorStartDate,
      specializations,
      toggleSpecialization,
      certifications,
      certDraft,
      setCertDraft,
      addCertification,
      removeCertification,
      salaryAmount,
      handleSubmit,
      isSubmitting: mutation.isPending,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      initialTrainer,
      fullName,
      email,
      phone,
      trainerType,
      salary,
      workingDays,
      shift,
      joiningDate,
      pricingModel,
      contractorPrice,
      contractorSessions,
      contractorStartDate,
      specializations,
      certifications,
      certDraft,
      mutation.isPending,
    ],
  )

  return (
    <TrainerFormContext.Provider value={value}>
      {children}
    </TrainerFormContext.Provider>
  )
}
