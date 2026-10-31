type Assignment = { trainerId: string; memberId: string }

/** Inputs are active assignments and upcoming scheduled sessions in the same gym. */
export function unallocatedMemberCounts(assignments: Assignment[], upcomingSessions: Assignment[]) {
  const allocated = new Map<string, Set<string>>()
  for (const session of upcomingSessions) {
    if (!allocated.has(session.trainerId)) allocated.set(session.trainerId, new Set())
    allocated.get(session.trainerId)!.add(session.memberId)
  }
  const pending = new Map<string, Set<string>>()
  for (const assignment of assignments) {
    if (allocated.get(assignment.trainerId)?.has(assignment.memberId)) continue
    if (!pending.has(assignment.trainerId)) pending.set(assignment.trainerId, new Set())
    pending.get(assignment.trainerId)!.add(assignment.memberId)
  }
  return new Map([...pending].map(([trainerId, members]) => [trainerId, members.size]))
}

export function prioritizeTrainers<T extends { unallocatedMemberCount: number }>(trainers: T[]): T[] {
  return [...trainers].sort((a, b) => b.unallocatedMemberCount - a.unallocatedMemberCount)
}
