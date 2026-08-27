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
  type ContractorPaymentType,
  type TrainerShift,
} from "@/lib/services/trainer.services"

/* ---------- types ---------- */

export type TrainerType = "staff" | "contractor"
export type PricingModel = "fixed" | "session"
export type Certification = { id: string; text: string }

/* ---------- constants ---------- */

export const WORK_HOURS_OPTIONS = ["4 Hours", "6 Hours", "8 Hours", "10 Hours", "12 Hours"]
export const WORK_DAYS_OPTIONS = ["5 Days / Week", "6 Days / Week", "7 Days / Week"]
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
  "h-11 rounded-sm bg-white px-3.5 text-sm focus-visible:border-primary focus-visible:ring-primary/20"
export const areaClass =
  "w-full rounded-sm border border-input bg-white px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20"

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

/* "8 Hours" / "6 Days / Week" carry their number as the leading token. */
const leadingNumber = (label: string) => Number(label.split(" ")[0]) || 0

/* ---------- context ---------- */

type TrainerFormValue = {
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
  workHours: string
  setWorkHours: (v: string) => void
  workDays: string
  setWorkDays: (v: string) => void
  shift: string
  setShift: (v: string) => void
  joiningDate: string
  setJoiningDate: (v: string) => void

  pricingModel: PricingModel
  setPricingModel: (v: PricingModel) => void
  contractorPrice: string
  setContractorPrice: (v: string) => void
  sessionsPerWeek: string
  setSessionsPerWeek: (v: string) => void
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

export function TrainerFormProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const [trainerType, setTrainerType] = useState<TrainerType>("staff")

  const [salary, setSalary] = useState("")
  const [workHours, setWorkHours] = useState(WORK_HOURS_OPTIONS[2])
  const [workDays, setWorkDays] = useState(WORK_DAYS_OPTIONS[1])
  const [shift, setShift] = useState(SHIFT_OPTIONS[0])
  const [joiningDate, setJoiningDate] = useState("")

  const [pricingModel, setPricingModel] = useState<PricingModel>("session")
  const [contractorPrice, setContractorPrice] = useState("")
  const [sessionsPerWeek, setSessionsPerWeek] = useState("")
  const [contractorStartDate, setContractorStartDate] = useState("")

  const [specializations, setSpecializations] = useState<string[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [certDraft, setCertDraft] = useState("")

  const salaryAmount = Number(salary) || 0

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
    mutationFn: createTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] })
      toast.success("Trainer created successfully.")
      router.push("/dashboard/trainers")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = () => {
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
        workHoursPerDay: leadingNumber(workHours),
        workDaysPerWeek: leadingNumber(workDays),
        shift: SHIFT_VALUES[shift],
        specializations,
        certifications: certifications.map((c) => c.text),
      })
      return
    }

    const price = Number(contractorPrice) || 0
    const sessions = Number(sessionsPerWeek) || 0
    if (price <= 0) {
      toast.error("Enter a price greater than zero.")
      return
    }
    if (sessions <= 0) {
      toast.error("Enter sessions per week greater than zero.")
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
      sessionsPerWeek: sessions,
    })
  }

  const value = useMemo<TrainerFormValue>(
    () => ({
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
      workHours,
      setWorkHours,
      workDays,
      setWorkDays,
      shift,
      setShift,
      joiningDate,
      setJoiningDate,
      pricingModel,
      setPricingModel,
      contractorPrice,
      setContractorPrice,
      sessionsPerWeek,
      setSessionsPerWeek,
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
      fullName,
      email,
      phone,
      trainerType,
      salary,
      workHours,
      workDays,
      shift,
      joiningDate,
      pricingModel,
      contractorPrice,
      sessionsPerWeek,
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
