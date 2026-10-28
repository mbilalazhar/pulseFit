// Fixed October 2026 preview. These insights are sample data, not AI predictions.
export const money = (value: number) => `PKR ${value.toLocaleString("en-US")}`

export const riskMembers = [
  { name: "Ali Khan", plan: "Basic Plan", score: 92, reason: "Low attendance", active: 12, type: "attendance" },
  { name: "Sara Ahmed", plan: "Pro Plan", score: 78, reason: "Payment overdue", active: 8, type: "payment" },
  { name: "Usman Malik", plan: "Basic Plan", score: 71, reason: "Expiring membership", active: 15, type: "expiry" },
  { name: "Fatima Noor", plan: "Pro Plan", score: 68, reason: "No trainer assigned", active: 14, type: "trainer" },
  { name: "Hassan Raza", plan: "Premium Plan", score: 62, reason: "Long inactivity", active: 21, type: "inactive" },
  { name: "Ayesha Shah", plan: "Basic Plan", score: 61, reason: "Low attendance", active: 10, type: "attendance" },
  { name: "Bilal Ahmed", plan: "Pro Plan", score: 60, reason: "Payment overdue", active: 9, type: "payment" },
  { name: "Zara Ali", plan: "Premium Plan", score: 59, reason: "Expiring membership", active: 7, type: "expiry" },
  { name: "Hamza Qureshi", plan: "Basic Plan", score: 58, reason: "Low attendance", active: 11, type: "attendance" },
  { name: "Noor Ulain", plan: "Pro Plan", score: 57, reason: "No trainer assigned", active: 6, type: "trainer" },
  { name: "Danish Iqbal", plan: "Basic Plan", score: 56, reason: "Long inactivity", active: 18, type: "inactive" },
  { name: "Maryam Khan", plan: "Pro Plan", score: 55, reason: "Expiring membership", active: 8, type: "expiry" },
  { name: "Omar Farooq", plan: "Basic Plan", score: 54, reason: "Payment overdue", active: 5, type: "payment" },
  { name: "Hina Aslam", plan: "Premium Plan", score: 53, reason: "Low attendance", active: 9, type: "attendance" },
  { name: "Saad Ahmed", plan: "Pro Plan", score: 52, reason: "No trainer assigned", active: 7, type: "trainer" },
  { name: "Iqra Hassan", plan: "Basic Plan", score: 51, reason: "Long inactivity", active: 16, type: "inactive" },
  { name: "Fahad Shah", plan: "Pro Plan", score: 50, reason: "Expiring membership", active: 6, type: "expiry" },
  { name: "Sana Malik", plan: "Basic Plan", score: 49, reason: "Low attendance", active: 8, type: "attendance" },
] as const

export const opportunities = [
  { title: "Basic plan has high drop-off after 30 days.", description: "Consider adding more value or a check-in program.", impact: "High", type: "basic", detail: "Introduce a day-7 welcome check-in and a day-25 progress review for Basic Plan members. A guided first-month routine can help members build a consistent habit." },
  { title: "Add trainer intro session to improve retention.", description: "Members with trainer sessions stay 40% longer.", impact: "High", type: "trainer", detail: "Offer a complimentary 20-minute trainer introduction with each new membership. Use the session to discuss goals, demonstrate equipment, and suggest a weekly routine." },
  { title: "Premium plan has the highest renewal rate.", description: "Consider highlighting premium features in marketing.", impact: "Medium", type: "premium", detail: "The sample Premium Plan renewal rate is 91%. Highlight its coaching and class benefits in renewal conversations and give Pro Plan members a preview of those benefits." },
  { title: "Introduce a mid-tier 3-month transformation plan.", description: "Targets members between basic and premium.", impact: "Medium", type: "growth", detail: "Package a three-month membership with an initial assessment, monthly progress reviews, and a small number of trainer sessions. Track interest before adding it to the plan catalog." },
  { title: "Offer evening attendance perks to improve engagement.", description: "Evening slots have 30% lower attendance.", impact: "Low", type: "perks", detail: "Trial a weekly evening group class or a bring-a-friend session in quieter slots. Compare participation and repeat visits before making the offer permanent." },
] as const

export const revenue = [
  { month: "May 2026", income: 960000, expenses: 650000 },
  { month: "Jun 2026", income: 1050000, expenses: 660000 },
  { month: "Jul 2026", income: 1150000, expenses: 760000 },
  { month: "Aug 2026", income: 1260000, expenses: 870000 },
  { month: "Sep 2026", income: 1380000, expenses: 860000 },
  { month: "Oct 2026", income: 1345000, expenses: 980000 },
]

export const plans = [
  { name: "Basic Plan", members: 189, inactive: 24, percent: 45, renewal: 68, revenue: 378000, color: "var(--color-chart-plan-basic)" },
  { name: "Pro Plan", members: 134, inactive: 12, percent: 32, renewal: 82, revenue: 536000, color: "var(--color-chart-plan-pro)" },
  { name: "Premium Plan", members: 76, inactive: 5, percent: 18, renewal: 91, revenue: 608000, color: "var(--color-chart-plan-premium)" },
  { name: "Trial Plan", members: 21, inactive: 9, percent: 5, renewal: 26, revenue: 63000, color: "var(--color-chart-plan-trial)" },
]

export const expiringMembers = [
  { name: "Ayesha Khan", plan: "Basic Plan", date: "12 Oct 2026", days: 3 },
  { name: "Bilal Ahmed", plan: "Pro Plan", date: "16 Oct 2026", days: 7 },
  { name: "Zara Ali", plan: "Premium Plan", date: "20 Oct 2026", days: 11 },
  { name: "Hamza Qureshi", plan: "Basic Plan", date: "24 Oct 2026", days: 15 },
  { name: "Noor Ulain", plan: "Pro Plan", date: "28 Oct 2026", days: 19 },
  { name: "Danish Iqbal", plan: "Basic Plan", date: "28 Oct 2026", days: 19 },
  { name: "Maryam Khan", plan: "Pro Plan", date: "29 Oct 2026", days: 20 },
  { name: "Omar Farooq", plan: "Basic Plan", date: "29 Oct 2026", days: 20 },
  { name: "Hina Aslam", plan: "Premium Plan", date: "30 Oct 2026", days: 21 },
  { name: "Saad Ahmed", plan: "Pro Plan", date: "30 Oct 2026", days: 21 },
  { name: "Iqra Hassan", plan: "Basic Plan", date: "31 Oct 2026", days: 22 },
  { name: "Fahad Shah", plan: "Pro Plan", date: "31 Oct 2026", days: 22 },
]

export const attendance = {
  "30": { peak: 128, low: 42, minutes: 56, change: 12, uplift: 34 },
  "7": { peak: 34, low: 12, minutes: 52, change: 8, uplift: 28 },
}
