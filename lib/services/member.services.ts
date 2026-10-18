import type { CreateMemberInput } from "@/lib/validators/member"
import type { MemberStats, MemberSummary } from "@/lib/member-directory"

export type GetMembersResponse = {
  members: MemberSummary[]
  stats: MemberStats
  plans: { id: string; name: string }[]
}

export async function getMembers(): Promise<GetMembersResponse> {
  const response = await fetch("/api/member", { cache: "no-store" })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message ?? "Could not load members. Please try again.")
  return data as GetMembersResponse
}

export type CreateMemberResponse = {
  message: string
  member: {
    id: string
    name: string
    status: "ACTIVE" | "INACTIVE"
    planId: string
    startDate: string
    durationMonths: number
    trainerId: string | null
  }
}

export async function createMember(payload: CreateMemberInput): Promise<CreateMemberResponse> {
  const response = await fetch("/api/member/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const fields = data?.error && typeof data.error === "object" ? Object.values(data.error).flat().filter((value): value is string => typeof value === "string") : []
    throw new Error(fields.length ? fields.join(" ") : data?.message ?? "Could not save the member. Please try again.")
  }
  return data as CreateMemberResponse
}
