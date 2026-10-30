export function localDateValue(date: Date) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function parseDateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(2000, month - 1, day, 12)
  date.setFullYear(year)
  return localDateValue(date) === value ? date : null
}

export function dateInRange(value: string, min?: string, max?: string) {
  return !!parseDateValue(value) && (!min || value >= min) && (!max || value <= max)
}

export function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12)
  const offset = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(first)
    day.setDate(1 - offset + index)
    return day
  })
}

export function shiftCalendarMonth(date: Date, amount: number) {
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1, 12)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(date.getDate(), lastDay))
  return next
}

export function timeParts(value: string) {
  if (value === "24:00") return { hour: 12, minute: 0, period: "AM" }
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  const [hours, minutes] = valid ? value.split(":").map(Number) : [12, 0]
  return { hour: hours % 12 || 12, minute: minutes, period: hours < 12 ? "AM" : "PM" }
}

export function timeValue(hour: number, minute: number, period: string) {
  return `${String(hour % 12 + (period === "PM" ? 12 : 0)).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function displayTime(value: string) {
  if (value === "24:00") return "12:00 AM · end of day"
  const { hour, minute, period } = timeParts(value)
  return `${hour}:${String(minute).padStart(2, "0")} ${period}`
}
