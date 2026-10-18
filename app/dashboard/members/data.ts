import type { MemberSummary } from "@/lib/member-directory"

export const MEMBER_TABS = ["All Members", "Active", "Expiring Soon", "Inactive", "Frozen"] as const
export type MemberTab = (typeof MEMBER_TABS)[number]

export function matchesMemberTab(member: MemberSummary, tab: MemberTab) {
  return tab === "All Members" || (tab === "Expiring Soon" ? member.expiringSoon : member.status === tab)
}

export const STATUS_STYLES = {
  Active: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
  "Expiring Soon": "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",
  Inactive: "bg-muted text-muted-foreground",
  Frozen: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
}

export const PAYMENT_STYLES: Record<MemberSummary["payment"], string> = {
  Paid: "text-emerald-600 dark:text-emerald-400",
  Partial: "text-amber-600 dark:text-amber-400",
  Pending: "text-rose-600 dark:text-rose-400",
  "Not recorded": "text-muted-foreground",
}
