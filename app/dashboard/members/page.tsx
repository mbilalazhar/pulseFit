import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Plus } from "lucide-react"
import { MembersContent } from "./members-content"
import { BulkMemberDialog } from "./bulk-member-dialog"

export default function MembersPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Monitor, manage, and understand everyone in your gym community.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BulkMemberDialog />
          <DashboardHeaderButton icon={Plus} text="Add Member" bgColor="primary" href="/dashboard/members/create" />
        </div>
      </header>

      <MembersContent />
    </div>
  )
}
