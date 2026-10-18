/** Membership expiry is the last included day before the next renewal. */
export function membershipExpiry(startDate: string, months: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isInteger(months) || months < 1) return ""
  const start = new Date(`${startDate}T00:00:00Z`)
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== startDate) return ""
  const renewal = new Date(start)
  renewal.setUTCDate(1)
  renewal.setUTCMonth(renewal.getUTCMonth() + months)
  const lastDay = new Date(renewal)
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0)
  renewal.setUTCDate(Math.min(start.getUTCDate(), lastDay.getUTCDate()))
  renewal.setUTCDate(renewal.getUTCDate() - 1)
  if (renewal.getUTCFullYear() > 9999) return ""
  return renewal.toISOString().slice(0, 10)
}

export function membershipAmounts(basePriceMinor: number, months: number, discountPercent: number, specialDiscount: string, received: string) {
  const planAmount = Math.round(basePriceMinor * months * (100 - discountPercent) / 100)
  const discount = Math.max(0, Math.round((Number(specialDiscount) || 0) * 100))
  const finalAmount = Math.max(0, planAmount - discount)
  const amountReceived = Math.max(0, Math.round((Number(received) || 0) * 100))
  const balance = Math.max(0, finalAmount - amountReceived)
  const status = balance === 0 ? "Paid" : amountReceived > 0 ? "Partial" : "Pending"
  return { planAmount, discount, finalAmount, amountReceived, balance, status }
}
