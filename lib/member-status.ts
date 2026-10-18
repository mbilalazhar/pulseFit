/** Membership dates are calendar dates in the gym's timezone, not the server's. */
export function dateInTimeZone(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value
  return `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`
}

export function memberStatusFromStartDate(startDate: string, timeZone: string, now = new Date()): "ACTIVE" | "INACTIVE" {
  const today = dateInTimeZone(timeZone, now)

  // Expiry and frozen memberships are intentionally outside this initial rule.
  return startDate <= today ? "ACTIVE" : "INACTIVE"
}
