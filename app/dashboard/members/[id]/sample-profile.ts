// Fixed sample data for the member detail design. No member records are fetched.
const firstDay = new Date("2025-10-20T00:00:00Z")

export const attendanceDays = Array.from({ length: 364 }, (_, index) => {
  const day = new Date(firstDay)
  day.setUTCDate(day.getUTCDate() + index)
  const attended = index >= 352 || (index >= 196 && index <= 222)
    || (index !== 351 && index !== 195 && index !== 223 && index % 7 !== 6 && (index * 7 + Math.floor(index / 7)) % 11 < 6)
  return {
    date: day.toISOString().slice(0, 10),
    minutes: attended ? 30 + (index * 17 % 76) : 0,
  }
})

export const attendanceWeeks = Array.from({ length: 52 }, (_, index) => attendanceDays.slice(index * 7, index * 7 + 7))
const visits = attendanceDays.filter((day) => day.minutes > 0)
let bestStreak = 0
let currentStreak = 0
for (const day of attendanceDays) {
  currentStreak = day.minutes ? currentStreak + 1 : 0
  bestStreak = Math.max(bestStreak, currentStreak)
}
const month = attendanceDays.filter((day) => day.date.startsWith("2026-10"))
export const attendanceSummary = {
  total: visits.length,
  currentStreak,
  bestStreak,
  monthVisits: month.filter((day) => day.minutes > 0).length,
  monthDays: month.length,
  rate: Math.round(month.filter((day) => day.minutes > 0).length / month.length * 100),
  averageMinutes: Math.round(visits.reduce((total, day) => total + day.minutes, 0) / visits.length),
  lastVisit: visits[visits.length - 1].date,
}
export const recentVisits = visits.slice(-5).reverse().map((day, index) => {
  const start = 18 * 60 + [12, 5, 21, 18, 40][index]
  const clock = (minutes: number) => `${Math.floor(minutes / 60) % 12 || 12}:${String(minutes % 60).padStart(2, "0")} PM`
  return { ...day, time: `${clock(start)} – ${clock(start + day.minutes)}` }
})

export function formatSampleDate(value: string, short = false) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(short ? {} : { year: "numeric" }), timeZone: "UTC" })
}
export function sessionLength(minutes: number) {
  return `${minutes >= 60 ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60}m`
}
