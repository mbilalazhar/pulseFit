export const members = [
  { name: "Sarah Khan", initials: "SK", plan: "Pro Plan", joined: "Oct 18, 2026", time: "09:42 AM", color: "pink" },
  { name: "Bilal Ahmed", initials: "BA", plan: "Pro Plan", joined: "Oct 18, 2026", time: "09:38 AM", color: "blue" },
  { name: "Ayesha Malik", initials: "AM", plan: "Premium Plan", joined: "Oct 17, 2026", time: "09:35 AM", color: "amber" },
  { name: "Hassan Sheikh", initials: "HS", plan: "Basic Plan", joined: "Oct 16, 2026", time: "09:31 AM", color: "violet" },
  { name: "Omar Farooq", initials: "OF", plan: "Pro Plan", joined: "Oct 15, 2026", time: "09:28 AM", color: "green" },
] as const

export const trainers = [
  { name: "Ali Raza", initials: "AR", members: 28, workload: 92 },
  { name: "Ahmed Khan", initials: "AK", members: 25, workload: 85 },
  { name: "Sara Ahmed", initials: "SA", members: 23, workload: 78 },
  { name: "Usman Tariq", initials: "UT", members: 21, workload: 65 },
  { name: "Ayesha Malik", initials: "AM", members: 19, workload: 58 },
]

export const revenue = [
  { month: "May 2026", income: 760000, expenses: 500000, attendance: 68 },
  { month: "Jun 2026", income: 830000, expenses: 580000, attendance: 72 },
  { month: "Jul 2026", income: 810000, expenses: 600000, attendance: 75 },
  { month: "Aug 2026", income: 920000, expenses: 620000, attendance: 79 },
  { month: "Sep 2026", income: 1050000, expenses: 680000, attendance: 84 },
  { month: "Oct 2026", income: 1120000, expenses: 740000, attendance: 88 },
]

export const renewals = [
  { name: "Ayesha Malik", plan: "Premium", date: "Oct 20, 2026", days: "1 day" },
  { name: "Bilal Ahmed", plan: "Pro", date: "Oct 21, 2026", days: "2 days" },
  { name: "Sarah Khan", plan: "Pro", date: "Oct 22, 2026", days: "3 days" },
  { name: "Hassan Sheikh", plan: "Basic", date: "Oct 24, 2026", days: "5 days" },
  { name: "Omar Farooq", plan: "Pro", date: "Oct 25, 2026", days: "6 days" },
]

export const money = (value: number) => `PKR ${value.toLocaleString("en-US")}`
