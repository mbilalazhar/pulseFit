// Static preview data. No payment or expense records are written to the server.
export const previewDate = "2026-10-18"
export const money = (amount: number) => `PKR ${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
export const dateLabel = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })

export type Payment = { name: string; description: string; amount: number; dueDate: string }
export type Expense = { id: string; title: string; category: string; amount: number; date: string; status: "Paid" | "Pending"; method: string }

export const receivables: Payment[] = [
  { name: "Ali Khan", description: "Monthly Membership", amount: 25000, dueDate: "2026-10-16" },
  { name: "Sara Ahmed", description: "Personal Training", amount: 18000, dueDate: "2026-10-18" },
  { name: "Usman Malik", description: "Annual Plan", amount: 60000, dueDate: "2026-10-22" },
  { name: "Fatima Noor", description: "Monthly Membership", amount: 12000, dueDate: "2026-10-25" },
  { name: "Hassan Raza", description: "Monthly Membership", amount: 15000, dueDate: "2026-10-28" },
  { name: "Ayesha Shah", description: "Personal Training", amount: 30000, dueDate: "2026-10-12" },
  { name: "Bilal Ahmed", description: "Quarterly Plan", amount: 45000, dueDate: "2026-10-15" },
  { name: "Zain Ali", description: "Monthly Membership", amount: 15000, dueDate: "2026-10-30" },
]

export const payables: Payment[] = [
  { name: "Gym Space Ltd.", description: "Monthly Rent", amount: 120000, dueDate: "2026-10-18" },
  { name: "Ahmed Trainers", description: "Trainer Salaries", amount: 40000, dueDate: "2026-10-20" },
  { name: "KE (Utilities)", description: "Electricity Bill", amount: 25000, dueDate: "2026-10-22" },
  { name: "FitEquip Co.", description: "Equipment EMI", amount: 10000, dueDate: "2026-10-25" },
]

export const initialExpenses: Expense[] = [
  { id: "exp-1", title: "Gym Rent", category: "Rent", amount: 120000, date: "2026-10-16", status: "Paid", method: "Bank Transfer" },
  { id: "exp-2", title: "Trainer Salaries", category: "Salaries", amount: 200000, date: "2026-10-10", status: "Paid", method: "Bank Transfer" },
  { id: "exp-3", title: "Electricity Bill", category: "Utilities", amount: 35000, date: "2026-10-08", status: "Paid", method: "Bank Transfer" },
  { id: "exp-4", title: "Marketing Campaign", category: "Marketing", amount: 50000, date: "2026-10-05", status: "Paid", method: "JazzCash" },
  { id: "exp-5", title: "Equipment Maintenance", category: "Maintenance", amount: 18000, date: "2026-10-02", status: "Paid", method: "Cash" },
  { id: "exp-6", title: "Staff Salaries", category: "Salaries", amount: 120000, date: "2026-10-01", status: "Paid", method: "Bank Transfer" },
  { id: "exp-7", title: "Fitness Equipment", category: "Equipment", amount: 137000, date: "2026-10-01", status: "Paid", method: "Bank Transfer" },
]

export const categories = ["Rent", "Salaries", "Utilities", "Marketing", "Maintenance", "Equipment", "Other"]
export const cashFlow = [
  { month: "May 2026", income: 760000, expenses: 380000 },
  { month: "Jun 2026", income: 800000, expenses: 490000 },
  { month: "Jul 2026", income: 880000, expenses: 560000 },
  { month: "Aug 2026", income: 890000, expenses: 580000 },
  { month: "Sep 2026", income: 1112000, expenses: 630000 },
  { month: "Oct 2026", income: 1245000, expenses: 680000 },
]

export const budgetMonths = [
  { label: "October 2026", budget: 1000000, spent: 680000, incoming: 350000, outgoing: 195000, balance: 565000 },
  { label: "September 2026", budget: 950000, spent: 630000, incoming: 290000, outgoing: 180000, balance: 482000 },
  { label: "August 2026", budget: 900000, spent: 580000, incoming: 260000, outgoing: 170000, balance: 310000 },
]

export function paymentStatus(date: string) {
  return date < previewDate ? "Overdue" : date === previewDate ? "Due Today" : "Upcoming"
}
