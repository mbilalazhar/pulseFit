export type PlanStatus = "DRAFT" | "ACTIVE" | "INACTIVE"

export type CreatePlanPayload = {
  name: string
  shortDesc: string
  longDesc?: string
  basePriceMinor: number
  currency: string
  status: PlanStatus
  features: { label: string }[]
  durations: {
    label?: string
    durationMonths: number
    discountPercent: number
  }[]
}

export type CreatePlanResponse = {
  message: string
  plan: {
    id: string
    name: string
    status: PlanStatus
    basePriceMinor: number
    currency: string
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message ?? "Something went wrong. Please try again.")
  }

  return data as T
}

export async function createPlan(
  payload: CreatePlanPayload,
): Promise<CreatePlanResponse> {
  const response = await fetch("/api/plan/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  return parseResponse<CreatePlanResponse>(response)
}

/* ---------- reading plans ---------- */

export type PlanSummary = {
  id: string
  name: string
  shortDesc: string
  longDesc: string | null
  basePriceMinor: number
  currency: string
  status: PlanStatus
  features: { id: string; label: string }[]
  durations: {
    id: string
    label: string | null
    durationMonths: number
    discountPercent: number
  }[]
  memberCount: number
}

export type GetPlansResponse = {
  plans: PlanSummary[]
}

export async function getPlans(): Promise<GetPlansResponse> {
  const response = await fetch("/api/plan", { method: "GET" })

  return parseResponse<GetPlansResponse>(response)
}

/* ---------- updating plan status ---------- */

export type UpdatePlanStatusResponse = {
  message: string
  status: PlanStatus
}

export async function updatePlanStatus(
  id: string,
  status: PlanStatus,
): Promise<UpdatePlanStatusResponse> {
  const response = await fetch(`/api/plan/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })

  return parseResponse<UpdatePlanStatusResponse>(response)
}

/* ---------- deleting a plan ---------- */

export type DeletePlanResponse = {
  message: string
}

export async function deletePlan(id: string): Promise<DeletePlanResponse> {
  const response = await fetch(`/api/plan/${id}`, { method: "DELETE" })

  return parseResponse<DeletePlanResponse>(response)
}
