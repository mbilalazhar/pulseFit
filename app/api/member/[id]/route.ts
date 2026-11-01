import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/lib/generated/prisma/client"
import { memberEditSchema, type MemberChange } from "@/lib/member-edit"
import { calendarDate, currentMembership, fingerprint, memberEditData, readMemberForEdit } from "@/lib/member-edit-server"
import { membershipAmounts, membershipExpiry } from "@/lib/membership"
import { hasTrainerGuidance } from "@/lib/plan-features"
import { requiresAdditionalTrainingCharge } from "@/lib/training-charges"
import { bookingFitsWorkingHours } from "@/lib/trainer-update"
import { mondayOf, overlaps } from "@/lib/trainer-scheduling"
import { dateInTimeZone, memberStatusFromStartDate } from "@/lib/member-status"

class EditError extends Error {
  status: number
  constructor(message: string, status = 400) { super(message); this.status = status }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || session.role !== "ADMIN") return NextResponse.json({ message: "Not Authenticated" }, { status: 401 })
    const { id } = await params
    const parsed = memberEditSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
    const input = parsed.data
    const result = await prisma.$transaction(async (tx) => {
      const member = await readMemberForEdit(tx, session.gymId, id)
      if (!member) throw new EditError("Member not found", 404)
      const before = memberEditData(member)
      if (input.revision !== before.revision) throw new EditError("This member's details, payments or sessions changed. Reload the saved details before editing again.", 409)
      const changes: MemberChange[] = []
      const diff = (field: string, oldValue: string | number | null, newValue: string | number | null) => {
        if (oldValue !== newValue) changes.push({ field, before: oldValue == null || oldValue === "" ? "Not set" : String(oldValue), after: newValue == null || newValue === "" ? "Not set" : String(newValue) })
      }
      diff("Full name", member.name, input.name)
      diff("Phone", member.phone, input.phone)
      diff("Email", member.email, input.email)
      const now = new Date()
      const today = dateInTimeZone(member.gym.timeZone, now)
      const upcoming = member.trainingSessions.filter((booking) => booking.endsAt > now)
      const trainerChanged = before.trainerId !== input.trainerId
      let targetTrainer = null
      if (trainerChanged) {
        if (member.assignments.length > 1) throw new EditError("This member has multiple current trainer assignments. Resolve those before changing their trainer.", 409)
        if (input.trainerId) {
          targetTrainer = await tx.trainer.findFirst({ where: { id: input.trainerId, gymId: session.gymId, status: "ACTIVE" }, include: { availability: true } })
          if (!targetTrainer) throw new EditError("Choose an active trainer in your gym.")
        }
        if (!input.trainerId && upcoming.length) throw new EditError("This member has upcoming sessions. Choose another trainer who can take these sessions before removing the current assignment.", 409)
        const sameName = before.trainerName != null && before.trainerName === targetTrainer?.fullName
        diff("Assigned trainer", sameName ? `${before.trainerName} (${before.trainerId})` : before.trainerName,
          sameName ? `${targetTrainer!.fullName} (${targetTrainer!.id})` : targetTrainer?.fullName ?? null)
      }
      const sub = currentMembership(member)
      if (!!sub !== !!input.membership) throw new EditError("The saved membership must be included. Reload this member and try again.", 409)
      if (input.payments.length !== before.payments.length || new Set(input.payments.map((item) => item.id)).size !== before.payments.length || before.payments.some((item) => !input.payments.some((payment) => payment.id === item.id))) {
        throw new EditError("Include every saved payment exactly once. Payments cannot be added or removed through this edit form.")
      }
      for (const [index, payment] of input.payments.entries()) {
        const original = before.payments.find((item) => item.id === payment.id)!
        if (payment.date !== original.date && payment.date > today) throw new EditError("Payment dates cannot be in the future.")
        const money = (amount: number) => `${original.currency} ${(amount / 100).toFixed(2)}`
        const label = `${original.kind === "REFUND" ? "Refund" : "Payment"} ${index + 1}`
        diff(`${label} amount`, money(original.amountMinor), money(payment.amountMinor))
        diff(`${label} date`, original.date, payment.date)
        diff(`${label} method`, original.method.replaceAll("_", " "), payment.method.replaceAll("_", " "))
      }
      let subscriptionUpdate: Prisma.MemberSubscriptionUncheckedUpdateInput | undefined
      let memberStatus = member.status
      if (sub && input.membership) {
        const next = input.membership
        const reprice = sub.planId !== next.planId || sub.durationMonths !== next.durationMonths
        const trainingChanged = trainerChanged || sub.sessionsPerWeek !== next.sessionsPerWeek || sub.sessionDurationMinutes !== next.sessionDurationMinutes
        const plan = await tx.plan.findFirst({ where: { id: next.planId, gymId: session.gymId }, include: { features: true, durations: true } })
        if (!plan || (reprice && plan.status !== "ACTIVE")) throw new EditError("Choose an active membership plan from your gym.")
        const guidance = hasTrainerGuidance(plan.features)
        if ((trainingChanged || sub.planId !== next.planId) && guidance && !input.trainerId) throw new EditError("This plan includes trainer guidance. Assign a trainer.")
        if (input.trainerId && (!next.sessionsPerWeek || !next.sessionDurationMinutes)) throw new EditError("Set weekly sessions and session length for the assigned trainer.")
        if (!input.trainerId && (next.sessionsPerWeek != null || next.sessionDurationMinutes != null)) throw new EditError("Assign a trainer or clear the training session settings.")
        if ((trainingChanged || reprice || next.additionalChargeMinor !== sub.additionalChargeMinor) && next.additionalChargeMinor > 0 && (!input.trainerId || !requiresAdditionalTrainingCharge(guidance, plan, next))) throw new EditError("Additional training charges apply only to training outside the plan allowance.")
        if (upcoming.length && (sub.sessionsPerWeek !== next.sessionsPerWeek || sub.sessionDurationMinutes !== next.sessionDurationMinutes)) throw new EditError("This member has upcoming allocated sessions. Keep their weekly allowance and session length until those sessions are completed or reassigned.", 409)
        const priceMinor = reprice ? membershipAmounts(plan.basePriceMinor, next.durationMonths, plan.durations.find((item) => item.durationMonths === next.durationMonths)?.discountPercent ?? 0, "0", "0").planAmount : sub.priceMinor
        const currency = reprice ? plan.currency : sub.currency
        if (currency !== sub.currency && sub.payments.length) throw new EditError("A membership with recorded payments must keep its original currency.")
        const finalMinor = priceMinor + next.additionalChargeMinor - next.discountMinor
        if (next.discountMinor > priceMinor || finalMinor < 0 || finalMinor > 2147483647 || priceMinor > 2147483647) throw new EditError("Check the discount and additional charges against the membership price.")
        const paidMinor = input.payments.reduce((total, item) => {
          const original = before.payments.find((payment) => payment.id === item.id)!
          return total + (original.currency === currency ? item.amountMinor * (original.kind === "REFUND" ? -1 : 1) : 0)
        }, 0)
        if (paidMinor < 0 || paidMinor > finalMinor) throw new EditError("Net recorded payments must be between zero and the membership total. Check payment amounts and refunds.")
        const datesChanged = calendarDate(sub.startDate) !== next.startDate || sub.durationMonths !== next.durationMonths
        const expiry = datesChanged ? membershipExpiry(next.startDate, next.durationMonths) : calendarDate(sub.endDate)
        if (!expiry || expiry.length !== 10 || expiry > "9998-12-31") throw new EditError("Choose dates with a valid membership expiry.")
        if (datesChanged && upcoming.some((booking) => {
          const date = dateInTimeZone(member.gym.timeZone, booking.startsAt)
          return date < mondayOf(next.startDate) || date >= expiry
        })) throw new EditError("The new membership dates would exclude an upcoming session. Keep dates that cover all allocated sessions.", 409)
        const status = datesChanged ? expiry <= today ? "EXPIRED" : memberStatusFromStartDate(next.startDate, member.gym.timeZone, now) : sub.status
        if (datesChanged && member.status !== "FROZEN") memberStatus = memberStatusFromStartDate(next.startDate, member.gym.timeZone, now)
        const planName = sub.planId !== next.planId ? plan.name : sub.planNameSnapshot
        const money = (amount: number, code = currency) => `${code} ${(amount / 100).toFixed(2)}`
        // IDs also matter when a renamed plan happens to share the original snapshot name.
        if (sub.planId !== next.planId) changes.push({ field: "Membership plan", before: sub.planNameSnapshot, after: planName })
        diff("Duration (months)", sub.durationMonths, next.durationMonths)
        diff("Membership start", calendarDate(sub.startDate), next.startDate)
        diff("Membership expiry", calendarDate(sub.endDate), expiry)
        diff("Membership price", money(sub.priceMinor, sub.currency), money(priceMinor))
        diff("Special discount", money(sub.discountMinor, sub.currency), money(next.discountMinor))
        diff("Additional training charge", money(sub.additionalChargeMinor, sub.currency), money(next.additionalChargeMinor))
        diff("Membership total", money(sub.finalMinor, sub.currency), money(finalMinor))
        const previousPaid = sub.payments.filter((payment) => payment.currency === sub.currency).reduce((total, payment) => total + payment.amountMinor * (payment.kind === "REFUND" ? -1 : 1), 0)
        diff("Net payments received", money(previousPaid, sub.currency), money(paidMinor))
        diff("Outstanding balance", money(Math.max(0, sub.finalMinor - previousPaid), sub.currency), money(Math.max(0, finalMinor - paidMinor)))
        diff("Payment due date", sub.paymentDueDate ? calendarDate(sub.paymentDueDate) : null, next.paymentDueDate)
        diff("Weekly sessions", sub.sessionsPerWeek, next.sessionsPerWeek)
        diff("Session length (minutes)", sub.sessionDurationMinutes, next.sessionDurationMinutes)
        diff("Member status", member.status, memberStatus)
        diff("Membership status", sub.status, status)
        const paymentStatus = paidMinor === finalMinor ? "PAID" : paidMinor > 0 ? "PARTIAL" : "UNPAID"
        diff("Payment status", sub.paymentStatus, paymentStatus)
        subscriptionUpdate = { planId: next.planId, planNameSnapshot: planName, priceMinor, currency, finalMinor, discountMinor: next.discountMinor, additionalChargeMinor: next.additionalChargeMinor,
          durationMonths: next.durationMonths,
          startDate: next.startDate === calendarDate(sub.startDate) ? sub.startDate : new Date(`${next.startDate}T00:00:00Z`),
          endDate: expiry === calendarDate(sub.endDate) ? sub.endDate : new Date(`${expiry}T00:00:00Z`),
          sessionsPerWeek: next.sessionsPerWeek, sessionDurationMinutes: next.sessionDurationMinutes,
          paymentDueDate: next.paymentDueDate ? new Date(`${next.paymentDueDate}T00:00:00Z`) : null, status, paymentStatus }
      }
      if (trainerChanged && targetTrainer && upcoming.length) {
        if (upcoming.some((booking) => booking.startsAt <= now)) throw new EditError("A session is in progress. Change the trainer after it finishes.", 409)
        if (upcoming.some((booking) => !bookingFitsWorkingHours(booking, targetTrainer.availability, member.gym.timeZone))) throw new EditError("The selected trainer's hours do not cover all upcoming sessions. Choose a trainer who can take the existing session times.", 409)
        const conflicts = await tx.trainingSession.findMany({ where: {
          gymId: session.gymId, trainerId: targetTrainer.id, status: { not: "CANCELED" }, id: { notIn: upcoming.map((booking) => booking.id) },
          startsAt: { lt: new Date(Math.max(...upcoming.map((booking) => booking.endsAt.getTime()))) },
          endsAt: { gt: new Date(Math.min(...upcoming.map((booking) => booking.startsAt.getTime()))) },
        } })
        if (upcoming.some((booking) => conflicts.some((other) => overlaps(booking, other)))) throw new EditError("The selected trainer has a booking at one of this member's session times. Choose another trainer.", 409)
        changes.push({ field: `${upcoming.length} upcoming sessions`, before: "Current trainer assignments", after: `Move to ${targetTrainer.fullName} at the same dates and times` })
      }
      if (!changes.length) return { unchanged: true } as const
      const { confirmed, reviewToken: suppliedToken, ...values } = input
      const reviewToken = fingerprint({ revision: before.revision, values, changes })
      if (!confirmed) return { requiresConfirmation: true, reviewToken, changes } as const
      if (suppliedToken !== reviewToken) throw new EditError("The details changed since review. Review the changes again before saving.", 409)
      await tx.member.update({ where: { id, gymId: session.gymId }, data: { name: input.name, email: input.email, phone: input.phone, status: memberStatus } })
      if (sub && subscriptionUpdate) await tx.memberSubscription.update({ where: { id: sub.id, gymId: session.gymId }, data: subscriptionUpdate })
      for (const payment of input.payments) {
        const original = before.payments.find((item) => item.id === payment.id)!
        if (payment.amountMinor !== original.amountMinor || payment.date !== original.date || payment.method !== original.method) {
          await tx.payment.update({ where: { id: payment.id, gymId: session.gymId, memberId: id }, data: {
            amountMinor: payment.amountMinor, method: payment.method,
            ...(payment.date !== original.date ? { paidAt: new Date(`${payment.date}T00:00:00Z`) } : {}),
          } })
        }
      }
      if (trainerChanged) {
        await tx.memberTrainerAssignment.updateMany({ where: { gymId: session.gymId, memberId: id, endedAt: null }, data: { endedAt: now } })
        if (input.trainerId) await tx.memberTrainerAssignment.create({ data: { gymId: session.gymId, memberId: id, trainerId: input.trainerId, startedAt: now } })
        if (targetTrainer && upcoming.length) await tx.trainingSession.updateMany({ where: { gymId: session.gymId, memberId: id, id: { in: upcoming.map((booking) => booking.id) } }, data: { trainerId: targetTrainer.id } })
      }
      return { saved: true } as const
    }, { isolationLevel: "Serializable" })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof EditError) return NextResponse.json({ message: error.message }, { status: error.status })
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") return NextResponse.json({ message: "A member with this email already exists in your gym." }, { status: 409 })
      if (["P2034", "P2025", "P2003"].includes(String(error.code))) return NextResponse.json({ message: "The member or related records changed while saving. Reload and review the changes again." }, { status: 409 })
    }
    console.error("Update member:", error)
    return NextResponse.json({ message: "Could not update this member. Please try again." }, { status: 500 })
  }
}
