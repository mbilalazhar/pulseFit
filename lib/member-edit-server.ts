import { createHash } from "node:crypto"
import type { Prisma } from "@/lib/generated/prisma/client"
import { dateInTimeZone } from "@/lib/member-status"
import type { MemberEditData } from "@/lib/member-edit"

export function readMemberForEdit(tx: Prisma.TransactionClient, gymId: string, id: string) {
  return tx.member.findFirst({ where: { id, gymId, deletedAt: null }, include: {
    gym: { select: { timeZone: true } },
    assignments: { where: { gymId, endedAt: null }, orderBy: { id: "asc" }, include: { trainer: { select: { fullName: true } } } },
    subscriptions: { where: { gymId, status: { not: "CANCELLED" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: {
      payments: { where: { gymId }, orderBy: { id: "asc" } },
    } },
    trainingSessions: { where: { gymId, status: "SCHEDULED" }, orderBy: { id: "asc" } },
  } })
}
export type EditableMember = NonNullable<Awaited<ReturnType<typeof readMemberForEdit>>>
export const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex")
export const calendarDate = (date: Date) => date.toISOString().slice(0, 10)
export const currentMembership = (member: EditableMember) => member.subscriptions.find((item) => item.status === "ACTIVE") ?? member.subscriptions[0] ?? null
export function memberEditData(member: EditableMember, now = new Date()): MemberEditData {
  const sub = currentMembership(member)
  return {
    id: member.id, revision: fingerprint(member), name: member.name, phone: member.phone, email: member.email ?? "", status: member.status,
    today: dateInTimeZone(member.gym.timeZone, now), trainerId: member.assignments[0]?.trainerId ?? null, trainerName: member.assignments[0]?.trainer.fullName ?? null,
    membership: sub ? {
      id: sub.id, planId: sub.planId, planName: sub.planNameSnapshot, priceMinor: sub.priceMinor, finalMinor: sub.finalMinor, currency: sub.currency,
      durationMonths: sub.durationMonths, startDate: calendarDate(sub.startDate), endDate: calendarDate(sub.endDate),
      discountMinor: sub.discountMinor, additionalChargeMinor: sub.additionalChargeMinor, paymentDueDate: sub.paymentDueDate ? calendarDate(sub.paymentDueDate) : null,
      sessionsPerWeek: sub.sessionsPerWeek, sessionDurationMinutes: sub.sessionDurationMinutes,
    } : null,
    payments: sub?.payments.map((payment) => ({ id: payment.id, amountMinor: payment.amountMinor, currency: payment.currency, kind: payment.kind, date: calendarDate(payment.paidAt), method: payment.method })) ?? [],
  }
}
