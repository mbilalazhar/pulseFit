export const plans = [
  {
    name: "Basic", price: 8000, description: "Perfect for small gyms just getting started.",
    features: ["Up to 100 members", "Up to 5 trainers", "1 branch", "2 admin accounts", "Basic reports", "Email support"],
  },
  {
    name: "Pro", price: 18000, description: "Ideal for growing gyms with multiple staff.",
    features: ["Up to 400 members", "Up to 20 trainers", "Up to 2 branches", "5 admin accounts", "Advanced reports", "Priority email support"],
  },
  {
    name: "Premium", price: 35000, description: "For multi-branch gyms that want to scale faster.",
    features: ["Up to 1,000 members", "Unlimited trainers", "Up to 10 branches", "10 admin accounts", "Advanced analytics & AI insights", "Priority support", "White-label mobile app (optional)"],
  },
] as const

export const invoices = [
  { date: "Jan 15, 2025", number: "INV-2025-0012", amount: 18000, status: "Paid" },
  { date: "Dec 15, 2024", number: "INV-2024-0123", amount: 18000, status: "Paid" },
  { date: "Nov 15, 2024", number: "INV-2024-0114", amount: 18000, status: "Paid" },
  { date: "Oct 15, 2024", number: "INV-2024-0108", amount: 18000, status: "Paid" },
  { date: "Sep 15, 2024", number: "INV-2024-0091", amount: 18000, status: "Overdue" },
]

export const addons = [
  { name: "Extra Admin Accounts", description: "Add additional admin users to your account.", price: 2000 },
  { name: "Extra Branches", description: "Manage additional gym branches.", price: 5000 },
  { name: "White-Label Mobile App", description: "Get your own branded mobile app.", price: 15000 },
  { name: "Advanced AI Reporting", description: "Get AI-powered insights and custom reports.", price: 10000 },
]

export function money(amount: number) {
  return `PKR ${amount.toLocaleString("en-US")}`
}
