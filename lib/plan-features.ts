export const PLAN_FEATURE_MAX = 100
export const TRAINER_FEATURE_LABEL = "Trainer guidance included"

export function hasTrainerGuidance(features: readonly { label: string }[]) {
  return features.some((feature) => feature.label.trim().toLowerCase() === TRAINER_FEATURE_LABEL.toLowerCase())
}

export const PLAN_FACILITIES = [
  { id: "trainer", label: TRAINER_FEATURE_LABEL },
  { id: "locker-room", label: "Locker room access" },
  { id: "changing-area", label: "Changing area access" },
  { id: "treadmill", label: "Treadmill access" },
  { id: "shower", label: "Shower access" },
  { id: "spa", label: "Spa room access" },
  { id: "weights", label: "Free weights and strength equipment" },
  { id: "group-classes", label: "Group fitness classes" },
] as const

export type PlanFacility = (typeof PLAN_FACILITIES)[number]["id"]

/** Restore the facility checkboxes and custom benefits from saved labels. */
export function splitPlanFeatures(features: readonly { label: string }[]) {
  const facilities: PlanFacility[] = []
  const custom: string[] = []
  for (const feature of features) {
    const facility = PLAN_FACILITIES.find((item) => item.label === feature.label)
    if (facility) facilities.push(facility.id)
    else custom.push(feature.label)
  }
  return { facilities, customFeatures: custom.join("\n") }
}

/** Preserve the existing label-based API and remove duplicates across both sections. */
export function buildPlanFeatures(selected: readonly PlanFacility[], custom: string) {
  const labels = [
    ...PLAN_FACILITIES.filter((feature) => selected.includes(feature.id)).map((feature) => feature.label),
    ...custom.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
  ]
  const seen = new Set<string>()
  return labels.filter((label) => {
    const key = label.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map((label) => ({ label }))
}
