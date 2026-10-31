import { shiftDate } from "@/lib/attendance"
import { dateInTimeZone } from "@/lib/member-status"
import { mondayOf } from "@/lib/trainer-scheduling"

export function formatProfileDate(value: string | null, short = false) {
  if (!value) return "—"
  return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(short ? {} : { year: "numeric" }), timeZone: "UTC" })
}

export function sessionLength(minutes: number) {
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h${minutes % 60 ? ` ${minutes % 60}m` : ""}` : `${minutes}m`
}

type Attendance = { id: string; attendanceDate: Date; checkInAt: Date; checkOutAt: Date | null; durationMinutes: number | null }

export function buildMemberAttendance(records: Attendance[], timeZone: string, joinedDate: string, now = new Date()) {
  const today = dateInTimeZone(timeZone, now)
  const firstDay = shiftDate(mondayOf(today), -51 * 7)
  const clock = (date: Date) => date.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone })
  const visits = records.filter((record) => record.attendanceDate.toISOString().slice(0, 10) <= today && record.checkInAt <= now).map((record) => {
    const minutes = record.checkOutAt ? Math.max(0, record.durationMinutes ?? Math.floor((record.checkOutAt.getTime() - record.checkInAt.getTime()) / 60_000)) : null
    return {
      id: record.id, date: record.attendanceDate.toISOString().slice(0, 10), minutes,
      time: `${clock(record.checkInAt)} – ${record.checkOutAt ? clock(record.checkOutAt) : "Check-out not recorded"}`,
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
  const byDate = new Map(visits.map((visit) => [visit.date, visit]))
  let currentStreak = 0
  const streakEnd = byDate.has(today) ? today : shiftDate(today, -1)
  while (byDate.has(shiftDate(streakEnd, -currentStreak))) currentStreak++
  let bestStreak = 0
  let run = 0
  let previous = ""
  for (const date of [...byDate.keys()].sort()) {
    run = previous && shiftDate(previous, 1) === date ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
    previous = date
  }
  const monthStart = `${today.slice(0, 7)}-01`
  const eligibleStart = joinedDate > monthStart ? joinedDate : monthStart
  const monthDays = Math.max(0, Math.round((new Date(today).getTime() - new Date(eligibleStart).getTime()) / 86_400_000) + 1)
  const monthVisits = visits.filter((visit) => visit.date >= eligibleStart && visit.date <= today).length
  const completed = visits.filter((visit) => visit.minutes !== null)
  const days = Array.from({ length: 364 }, (_, index) => {
    const date = shiftDate(firstDay, index)
    return { date, visited: byDate.has(date), minutes: byDate.get(date)?.minutes ?? null, future: date > today }
  })
  return {
    today, firstDay, lastDay: days[days.length - 1].date,
    weeks: Array.from({ length: 52 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    recentVisits: visits.slice(-5).reverse(),
    summary: {
      total: visits.filter((visit) => visit.date >= firstDay).length,
      currentStreak, bestStreak, monthVisits, monthDays,
      rate: monthDays ? Math.round(monthVisits / monthDays * 100) : 0,
      averageMinutes: completed.length ? Math.round(completed.reduce((sum, visit) => sum + visit.minutes!, 0) / completed.length) : null,
      lastVisit: visits.at(-1)?.date ?? null,
    },
  }
}

export type MemberAttendance = ReturnType<typeof buildMemberAttendance>

export function membershipBalance(subscription: { finalMinor: number; currency: string; payments: { amountMinor: number; kind: string; currency: string }[] }) {
  const paidMinor = subscription.payments.filter((payment) => payment.currency === subscription.currency)
    .reduce((sum, payment) => sum + (payment.kind === "REFUND" ? -payment.amountMinor : payment.amountMinor), 0)
  const balanceMinor = Math.max(0, subscription.finalMinor - paidMinor)
  return { paidMinor, balanceMinor, status: balanceMinor === 0 ? "Paid" : paidMinor > 0 ? "Partial" : "Unpaid" }
}
