type SessionAllowance = {
  sessionsPerWeek: number | null
  sessionDurationMinutes: number | null
}

/** Call only when a trainer is being assigned. Each limit is checked separately. */
export function requiresAdditionalTrainingCharge(
  guidanceIncluded: boolean,
  plan: SessionAllowance,
  requested: SessionAllowance,
) {
  return !guidanceIncluded
    || (requested.sessionsPerWeek ?? 0) > (plan.sessionsPerWeek ?? 0)
    || (requested.sessionDurationMinutes ?? 0) > (plan.sessionDurationMinutes ?? 0)
}
