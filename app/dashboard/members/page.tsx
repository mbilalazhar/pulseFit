import Link from "next/link"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
          <Link href="/dashboard/members/create" className={cn(buttonVariants({ size: "lg" }), "h-10 gap-2 bg-primary px-5 text-primary-foreground hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/20")}>
            <Plus aria-hidden="true" className="size-4" />Add Member
          </Link>
        </div>
      </header>

      <MembersContent />
    </div>
  )
}
