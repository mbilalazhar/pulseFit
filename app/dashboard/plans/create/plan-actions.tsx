"use client"

import Link from "next/link"
import { Loader2Icon } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePlanForm } from "./plan-form-context"

export function PlanActions() {
  const { handleSubmit, isSubmitting } = usePlanForm()

  return (
    <div className="flex items-center justify-end gap-2 p-4">
      <Link
        href="/dashboard/plans"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        Cancel
      </Link>
      <Button
        type="button"
        size="lg"
        onClick={() => handleSubmit(false)}
        disabled={isSubmitting}
        className="gap-1.5"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Creating
          </>
        ) : (
          "Create Plan"
        )}
      </Button>
    </div>
  )
}
