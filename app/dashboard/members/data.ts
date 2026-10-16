export type MemberStatus = "Active" | "Expiring Soon" | "Inactive" | "Frozen"
export type PaymentStatus = "Auto-pay" | "Paid" | "Payment paused" | "Payment due"

export type Member = {
  id: string
  name: string
  email: string
  phone: string
  plan: "Premium" | "Pro" | "Basic" | "Student Plan"
  monthlyPrice: number
  durationMonths: number
  status: MemberStatus
  payment: PaymentStatus
  paymentNote: string
  joinedThisMonth: boolean
}

export const MEMBERS: Member[] = [
  { id: "member-1", name: "Ali Raza", email: "ali.raza@gmail.com", phone: "+92 300 1234567", plan: "Premium", monthlyPrice: 10000, durationMonths: 12, status: "Active", payment: "Auto-pay", paymentNote: "Next billing: Nov 10, 2026", joinedThisMonth: false },
  { id: "member-2", name: "Sarah Khan", email: "sarah.khan@gmail.com", phone: "+92 321 2345678", plan: "Pro", monthlyPrice: 8000, durationMonths: 6, status: "Active", payment: "Paid", paymentNote: "Next billing: Nov 5, 2026", joinedThisMonth: true },
  { id: "member-3", name: "Hamza Ali", email: "hamza.ali@gmail.com", phone: "+92 333 3456789", plan: "Basic", monthlyPrice: 5000, durationMonths: 3, status: "Expiring Soon", payment: "Auto-pay", paymentNote: "Expires: Oct 28, 2026", joinedThisMonth: false },
  { id: "member-4", name: "Ayesha Noor", email: "ayesha.noor@gmail.com", phone: "+92 302 4567890", plan: "Premium", monthlyPrice: 10000, durationMonths: 12, status: "Active", payment: "Paid", paymentNote: "Next billing: Nov 20, 2026", joinedThisMonth: false },
  { id: "member-5", name: "Zain Malik", email: "zain.malik@gmail.com", phone: "+92 312 5678901", plan: "Student Plan", monthlyPrice: 4000, durationMonths: 3, status: "Frozen", payment: "Payment paused", paymentNote: "Resumes: Oct 25, 2026", joinedThisMonth: false },
  { id: "member-6", name: "Hira Ahmed", email: "hira.ahmed@gmail.com", phone: "+92 301 6789012", plan: "Pro", monthlyPrice: 8000, durationMonths: 6, status: "Active", payment: "Auto-pay", paymentNote: "Next billing: Nov 8, 2026", joinedThisMonth: false },
  { id: "member-7", name: "Usman Tariq", email: "usman.tariq@gmail.com", phone: "+92 322 7890123", plan: "Basic", monthlyPrice: 5000, durationMonths: 1, status: "Inactive", payment: "Payment due", paymentNote: "Overdue by 5 days", joinedThisMonth: false },
  { id: "member-8", name: "Fatima Saeed", email: "fatima.saeed@gmail.com", phone: "+92 334 8901234", plan: "Pro", monthlyPrice: 8000, durationMonths: 6, status: "Active", payment: "Paid", paymentNote: "Next billing: Nov 18, 2026", joinedThisMonth: true },
]

export const MEMBER_TABS = ["All Members", "Active", "Expiring Soon", "Inactive", "Frozen"] as const
export type MemberTab = (typeof MEMBER_TABS)[number]

export const STATUS_STYLES: Record<MemberStatus, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  "Expiring Soon": "bg-amber-50 text-amber-600",
  Inactive: "bg-slate-100 text-slate-500",
  Frozen: "bg-blue-50 text-blue-600",
}

export const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  "Auto-pay": "text-slate-700",
  Paid: "text-emerald-600",
  "Payment paused": "text-blue-600",
  "Payment due": "text-rose-600",
}
