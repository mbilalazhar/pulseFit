"use client"

import Link from "next/link"
import { Loader2Icon, Save } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTrainerForm } from "./trainer-form-context"

export function TrainerActions() {
  const { handleSubmit, isSubmitting } = useTrainerForm()

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href="/dashboard/trainers"
        className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
      >
        Cancel
      </Link>
      <Button
        type="button"
        size="lg"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="gap-1.5"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Saving
          </>
        ) : (
          <>
            <Save className="size-4" />
            Save Trainer
          </>
        )}
      </Button>
    </div>
  )
}
