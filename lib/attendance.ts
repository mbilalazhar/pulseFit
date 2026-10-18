import { dateInTimeZone } from "./member-status"

export type AttendanceMember = {
  id: string; name: string; email: string | null; phone: string
  status: "ACTIVE" | "INACTIVE" | "FROZEN"; startDate: Date | null; createdAt: Date
  plan: { name: string } | null
}
export type AttendanceRecord = {
  id: string; memberId: string; attendanceDate: Date; checkInAt: Date; checkOutAt: Date | null
}
export type AttendanceRow = {
  memberId: string; name: string; email: string | null; phone: string; plan: string | null
  attendanceId: string | null; checkInAt: string | null; checkOutAt: string | null
  status: "Present" | "Checked Out" | "Absent"; streak: number
}

export function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function eligibleForAttendance(member: Pick<AttendanceMember, "status" | "startDate">, date: string) {
  return member.status !== "FROZEN" && (member.startDate ? member.startDate.toISOString().slice(0, 10) <= date : member.status === "ACTIVE")
}

export function buildAttendance(members: AttendanceMember[], records: AttendanceRecord[], timeZone: string, selectedDate?: string, now = new Date()) {
  const today = dateInTimeZone(timeZone, now)
  const date = selectedDate ?? today
  const recordsByDate = new Map<string, AttendanceRecord[]>()
  const datesByMember = new Map<string, Set<string>>()
  for (const record of records) {
    const day = record.attendanceDate.toISOString().slice(0, 10)
    const visits = recordsByDate.get(day) ?? []
    visits.push(record)
    recordsByDate.set(day, visits)
    const dates = datesByMember.get(record.memberId) ?? new Set<string>()
    dates.add(day)
    datesByMember.set(record.memberId, dates)
  }
  const forDay = (day: string) => recordsByDate.get(day) ?? []
  const selected = forDay(date)
  const memberMap = new Map(members.map((member) => [member.id, member]))
  const createdDates = new Map(members.map((member) => [member.id, dateInTimeZone(timeZone, member.createdAt)]))
  const eligible = (day: string) => members.filter((member) => eligibleForAttendance(member, day) && createdDates.get(member.id)! <= day)
  const streak = (memberId: string) => {
    const dates = datesByMember.get(memberId)
    let count = 0
    while (dates?.has(shiftDate(date, -count))) count++
    return count
  }
  const row = (member: AttendanceMember, record?: AttendanceRecord): AttendanceRow => ({
    memberId: member.id, name: member.name, email: member.email, phone: member.phone, plan: member.plan?.name ?? null,
    attendanceId: record?.id ?? null, checkInAt: record?.checkInAt.toISOString() ?? null, checkOutAt: record?.checkOutAt?.toISOString() ?? null,
    status: record ? record.checkOutAt ? "Checked Out" : "Present" : "Absent", streak: record ? streak(member.id) : 0,
  })
  const selectedMap = new Map(selected.map((record) => [record.memberId, record]))
  if (date === today) {
    for (const record of records) {
      if (!record.checkOutAt && !selectedMap.has(record.memberId)) selectedMap.set(record.memberId, record)
    }
  }
  const eligibleIds = new Set(eligible(date).map((member) => member.id))
  const rows = members.filter((member) => selectedMap.has(member.id) || eligibleIds.has(member.id))
    .map((member) => row(member, selectedMap.get(member.id)))
    .sort((a, b) => (b.checkInAt ?? "").localeCompare(a.checkInAt ?? "") || a.name.localeCompare(b.name))
  const days = Array.from({ length: 30 }, (_, index) => {
    const day = shiftDate(date, index - 29)
    const visits = forDay(day)
    const count = eligible(day).length
    return { date: day, checkIns: visits.length, checkOuts: visits.filter((visit) => visit.checkOutAt).length, rate: count ? Math.min(100, Math.round(visits.length / count * 100)) : 0 }
  })
  const hour = (value: Date) => Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(value))
  const hours = Array.from({ length: 24 }, (_, value) => ({ hour: value, checkIns: selected.filter((record) => hour(record.checkInAt) === value).length }))
  const todayMap = new Map(forDay(today).map((record) => [record.memberId, record]))
  const openMap = new Map(records.filter((record) => !record.checkOutAt).map((record) => [record.memberId, record]))
  return {
    today, date, timeZone, rows, days, hours,
    summary: { present: selected.length, checkedOut: selected.filter((record) => record.checkOutAt).length, inside: rows.filter((row) => row.status === "Present").length, rate: days[29].rate },
    live: [...selected].sort((a, b) => b.checkInAt.getTime() - a.checkInAt.getTime()).slice(0, 5).flatMap((record) => {
      const member = memberMap.get(record.memberId)
      return member ? [row(member, record)] : []
    }),
    members: members.map((member) => ({
      id: member.id, name: member.name, email: member.email, phone: member.phone, plan: member.plan?.name ?? null,
      eligible: eligibleForAttendance(member, today),
      attendanceId: (openMap.get(member.id) ?? todayMap.get(member.id))?.id ?? null,
      state: openMap.has(member.id) ? "Present" as const : todayMap.has(member.id) ? "Checked Out" as const : "Not checked in" as const,
    })),
  }
}
export type AttendanceData = ReturnType<typeof buildAttendance>
