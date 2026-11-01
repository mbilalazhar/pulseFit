import { createHash } from "node:crypto"
import type { Prisma } from "@/lib/generated/prisma/client"
import { formatWorkTime, type TrainerAvailability } from "@/lib/trainer-availability"
import type { ScheduleChangeReview, ScheduleConfirmation } from "@/lib/trainer-schedule-change"
import { dateInTimeZone } from "@/lib/member-status"
import { gymInstant, gymMinute, mondayOf, overlaps } from "@/lib/trainer-scheduling"
import { bookingFitsWorkingHours } from "@/lib/trainer-update"

export class ScheduleChangeError extends Error {
  review?: ScheduleChangeReview
  constructor(message: string, review?: ScheduleChangeReview) { super(message); this.review = review }
}

/** Called inside the trainer update transaction. Nothing is written until every choice is valid. */
export async function reassignTrainerSchedule(tx: Prisma.TransactionClient, options: {
  gymId: string
  trainer: { id: string; fullName: string; status: string; updatedAt: Date }
  hours: TrainerAvailability[]
  timeZone: string
  confirmation?: ScheduleConfirmation
}) {
  const { gymId, trainer, hours, timeZone, confirmation } = options
  const now = new Date()
  const bookings = await tx.trainingSession.findMany({
    where: { gymId, trainerId: trainer.id, status: "SCHEDULED", endsAt: { gt: now } },
    include: { member: { include: {
      assignments: { where: { gymId, endedAt: null }, orderBy: { id: "asc" } },
      subscriptions: { where: { gymId, status: { in: ["ACTIVE", "INACTIVE"] } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
    } } },
    orderBy: { id: "asc" },
  })
  if (!bookings.length && !confirmation) return
  const alternatives = await tx.trainer.findMany({
    where: { gymId, id: { not: trainer.id }, status: "ACTIVE" },
    select: { id: true, fullName: true, availability: { select: { dayOfWeek: true, startMinute: true, endMinute: true } } },
    orderBy: { fullName: "asc" },
  })
  // Include the proposed hours too: a confirmation cannot be reused for a different edit.
  const revision = createHash("sha256").update(JSON.stringify({
    trainer: trainer.updatedAt, hours, bookings: bookings.map((booking) => ({
      id: booking.id, memberId: booking.memberId, startsAt: booking.startsAt, endsAt: booking.endsAt,
      assignments: booking.member.assignments,
    })),
  })).digest("hex")
  const review: ScheduleChangeReview = {
    revision, trainerId: trainer.id, timeZone,
    trainers: [{ id: trainer.id, fullName: trainer.fullName, availability: hours }, ...alternatives],
    sessions: bookings.map((booking) => ({
      id: booking.id, memberId: booking.memberId, memberName: booking.member.name,
      canTransfer: booking.member.assignments.length === 1 && booking.member.assignments[0].trainerId === trainer.id,
      startsAt: booking.startsAt.toISOString(), endsAt: booking.endsAt.toISOString(),
      date: dateInTimeZone(timeZone, booking.startsAt), startMinute: gymMinute(booking.startsAt, timeZone),
      duration: (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000,
      needsNewTime: !bookingFitsWorkingHours(booking, hours, timeZone),
    })),
  }
  if (!confirmation || confirmation.revision !== revision) {
    throw new ScheduleChangeError(confirmation
      ? "The schedule changed. Review the latest sessions before confirming again."
      : "Review member sessions and confirm their reassignment before saving working hours.", review)
  }
  const choices = new Map(confirmation.sessions.map((choice) => [choice.sessionId, choice]))
  if (choices.size !== bookings.length || confirmation.sessions.length !== bookings.length || bookings.some((booking) => !choices.has(booking.id))) {
    throw new ScheduleChangeError("Choose a trainer and time for every session before confirming.")
  }
  const memberTrainers = new Map<string, string>()
  const proposed = bookings.map((booking) => {
    const choice = choices.get(booking.id)!
    const target = review.trainers.find((item) => item.id === choice.trainerId)
    if (!target) throw new ScheduleChangeError("Choose an active trainer in your gym.")
    if (memberTrainers.has(booking.memberId) && memberTrainers.get(booking.memberId) !== target.id) {
      throw new ScheduleChangeError("Assign all of a member's upcoming sessions to the same trainer.")
    }
    memberTrainers.set(booking.memberId, target.id)
    const original = review.sessions.find((item) => item.id === booking.id)!
    const timeChanged = choice.date !== original.date || choice.startMinute !== original.startMinute
    const transferred = target.id !== trainer.id
    if (transferred && !original.canTransfer) throw new ScheduleChangeError(`${booking.member.name} is no longer assigned to this trainer. Refresh their assignment first.`)
    if ((timeChanged || transferred) && booking.startsAt <= now) throw new ScheduleChangeError("A session already in progress cannot be reassigned. Keep its working hours until it finishes.")
    if ((timeChanged || transferred) && (booking.member.deletedAt || booking.member.status === "FROZEN")) throw new ScheduleChangeError(`${booking.member.name} is unavailable for reassignment.`)
    if ((timeChanged || transferred) && target.id === trainer.id && trainer.status !== "ACTIVE") throw new ScheduleChangeError("Choose an active trainer for reassigned sessions.")
    let startsAt = booking.startsAt
    let endsAt = booking.endsAt
    if (timeChanged) {
      if (mondayOf(choice.date) !== mondayOf(original.date)) throw new ScheduleChangeError("Keep each session in its original week to preserve the member's weekly allowance.")
      const subscription = booking.member.subscriptions.find((item) => item.status === "ACTIVE") ?? booking.member.subscriptions[0]
      if (!subscription || choice.date < mondayOf(subscription.startDate.toISOString().slice(0, 10)) || choice.date >= subscription.endDate.toISOString().slice(0, 10)) {
        throw new ScheduleChangeError(`${booking.member.name}'s new session must be within their purchased membership weeks and before expiry.`)
      }
      if (choice.startMinute + original.duration > 1440) throw new ScheduleChangeError("Each session must end by midnight within the trainer's working hours.")
      try {
        startsAt = gymInstant(choice.date, choice.startMinute, timeZone)
        endsAt = gymInstant(choice.date, choice.startMinute + original.duration, timeZone)
      }
      catch (error) { throw new ScheduleChangeError(error instanceof Error ? error.message : "Choose a valid session time.") }
      if (endsAt.getTime() - startsAt.getTime() !== original.duration * 60_000) throw new ScheduleChangeError("A session cannot cross a daylight-saving clock change.")
      if (startsAt <= now) throw new ScheduleChangeError("Choose a future time for reassigned sessions.")
    }
    if (!bookingFitsWorkingHours({ startsAt, endsAt }, target.availability, timeZone)) {
      throw new ScheduleChangeError(`${booking.member.name}'s session must fit within ${target.fullName}'s working hours.`)
    }
    return { id: booking.id, memberId: booking.memberId, trainerId: target.id, startsAt, endsAt }
  })
  if (!proposed.length) return
  const otherBookings = await tx.trainingSession.findMany({ where: {
    gymId, id: { notIn: bookings.map((booking) => booking.id) }, status: { not: "CANCELED" },
    OR: [{ trainerId: { in: [...new Set(proposed.map((booking) => booking.trainerId))] } }, { memberId: { in: [...memberTrainers.keys()] } }],
    startsAt: { lt: new Date(Math.max(...proposed.map((booking) => booking.endsAt.getTime()))) },
    endsAt: { gt: new Date(Math.min(...proposed.map((booking) => booking.startsAt.getTime()))) },
  } })
  for (const [index, booking] of proposed.entries()) {
    if ([...otherBookings, ...proposed.slice(index + 1)].some((other) =>
      (other.trainerId === booking.trainerId || other.memberId === booking.memberId) && overlaps(booking, other))) {
      const original = review.sessions.find((item) => item.id === booking.id)!
      throw new ScheduleChangeError(`${original.memberName}'s session on ${dateInTimeZone(timeZone, booking.startsAt)} at ${formatWorkTime(gymMinute(booking.startsAt, timeZone))} overlaps another trainer or member session. Choose another time.`)
    }
  }
  const changes = proposed.filter((booking) => {
    const original = bookings.find((item) => item.id === booking.id)!
    return booking.trainerId !== original.trainerId || booking.startsAt.getTime() !== original.startsAt.getTime() || booking.endsAt.getTime() !== original.endsAt.getTime()
  })
  // Release the old slots together so swapping two booked times works with exclusion constraints.
  if (changes.length) await tx.trainingSession.updateMany({ where: { gymId, id: { in: changes.map((booking) => booking.id) } }, data: { status: "CANCELED" } })
  for (const booking of changes) {
    await tx.trainingSession.update({ where: { id: booking.id, gymId }, data: {
      trainerId: booking.trainerId, startsAt: booking.startsAt, endsAt: booking.endsAt, status: "SCHEDULED",
    } })
  }
  for (const [memberId, targetId] of memberTrainers) {
    if (targetId === trainer.id) continue
    await tx.memberTrainerAssignment.updateMany({ where: { gymId, memberId, trainerId: trainer.id, endedAt: null }, data: { endedAt: now } })
    await tx.memberTrainerAssignment.create({ data: { gymId, memberId, trainerId: targetId, startedAt: now } })
  }
}
