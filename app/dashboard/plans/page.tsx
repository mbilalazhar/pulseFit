import Link from "next/link"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Plans() {
  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Membership Plans
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage the membership plans your members can subscribe to.
          </p>
        </div>

        <Link
          href="/dashboard/plans/create"
          className={cn(buttonVariants({ size: "lg" }), "gap-2 self-start sm:self-auto")}
        >
          <Plus className="size-4" />
          Create Plan
        </Link>
      </header>
    </div>
  )
}
