"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

/* ---------- types ---------- */

export type PackageType = "Training" | "Consultation"
/* Consultations have no fixed slot length, so they carry "-". */
export type PackageDuration = "30 Min" | "60 Min" | "-"

export type TrainerPackage = {
  id: string
  name: string
  type: PackageType
  duration: PackageDuration
  price: number
}

/* ---------- constants ---------- */

export const WORK_HOURS_OPTIONS = ["4 Hours", "6 Hours", "8 Hours", "10 Hours", "12 Hours"]
export const WORK_DAYS_OPTIONS = ["5 Days / Week", "6 Days / Week", "7 Days / Week"]
export const SHIFT_OPTIONS = ["Morning Shift", "Evening Shift", "Night Shift", "Flexible"]
export const PACKAGE_TYPES: PackageType[] = ["Training", "Consultation"]
export const TRAINING_DURATIONS: PackageDuration[] = ["30 Min", "60 Min"]

export const PACKAGE_TYPE_BADGE: Record<PackageType, string> = {
  Training: "bg-blue-50 text-blue-500",
  Consultation: "bg-green-100 text-green-700",
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

/* ---------- context ---------- */

type TrainerFormValue = {
  fullName: string
  setFullName: (v: string) => void
  email: string
  setEmail: (v: string) => void
  phone: string
  setPhone: (v: string) => void

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

  packages: TrainerPackage[]
  pkgName: string
  setPkgName: (v: string) => void
  pkgType: PackageType
  setPkgType: (v: PackageType) => void
  pkgDuration: PackageDuration
  setPkgDuration: (v: PackageDuration) => void
  pkgPrice: string
  setPkgPrice: (v: string) => void
  addPackage: () => void
  removePackage: (id: string) => void

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

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const [salary, setSalary] = useState("")
  const [workHours, setWorkHours] = useState(WORK_HOURS_OPTIONS[2])
  const [workDays, setWorkDays] = useState(WORK_DAYS_OPTIONS[1])
  const [shift, setShift] = useState(SHIFT_OPTIONS[0])
  const [joiningDate, setJoiningDate] = useState("")

  const [packages, setPackages] = useState<TrainerPackage[]>([])
  const [pkgName, setPkgName] = useState("")
  const [pkgType, setPkgTypeState] = useState<PackageType>("Training")
  const [pkgDuration, setPkgDuration] = useState<PackageDuration>("60 Min")
  const [pkgPrice, setPkgPrice] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const salaryAmount = Number(salary) || 0

  /* Type drives duration: consultations are open-ended, trainings are slotted. */
  const setPkgType = (next: PackageType) => {
    setPkgTypeState(next)
    setPkgDuration(next === "Consultation" ? "-" : "60 Min")
  }

  const addPackage = () => {
    const name = pkgName.trim()
    const price = Number(pkgPrice) || 0

    if (!name) {
      toast.error("Enter a package name.")
      return
    }
    if (packages.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`"${name}" is already added.`)
      return
    }
    if (price <= 0) {
      toast.error("Enter a package price greater than zero.")
      return
    }

    setPackages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, type: pkgType, duration: pkgDuration, price },
    ])
    setPkgName("")
    setPkgPrice("")
  }

  const removePackage = (id: string) =>
    setPackages((prev) => prev.filter((p) => p.id !== id))

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
    if (salaryAmount <= 0) {
      toast.error("Enter a monthly salary greater than zero.")
      return
    }
    if (!joiningDate) {
      toast.error("Pick a joining date.")
      return
    }
    if (packages.length === 0) {
      toast.error("Add at least one package.")
      return
    }

    /* No trainer API exists yet — the form validates and returns to the list. */
    setIsSubmitting(true)
    toast.success(`${fullName.trim()} saved.`)
    router.push("/dashboard/trainers")
  }

  const value = useMemo<TrainerFormValue>(
    () => ({
      fullName,
      setFullName,
      email,
      setEmail,
      phone,
      setPhone,
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
      packages,
      pkgName,
      setPkgName,
      pkgType,
      setPkgType,
      pkgDuration,
      setPkgDuration,
      pkgPrice,
      setPkgPrice,
      addPackage,
      removePackage,
      salaryAmount,
      handleSubmit,
      isSubmitting,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      fullName,
      email,
      phone,
      salary,
      workHours,
      workDays,
      shift,
      joiningDate,
      packages,
      pkgName,
      pkgType,
      pkgDuration,
      pkgPrice,
      isSubmitting,
    ],
  )

  return (
    <TrainerFormContext.Provider value={value}>
      {children}
    </TrainerFormContext.Provider>
  )
}
