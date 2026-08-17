import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TrainerFormProvider } from "./trainer-form-context"
import { TrainerInformation } from "./trainer-information"
import { WorkSalaryDetails } from "./work-salary-details"
import { TrainerPackages } from "./trainer-packages"
import { TrainerPreview } from "./trainer-preview"
import { TrainerActions } from "./trainer-actions"

export default function CreateTrainerPage() {
  return (
    <div className="mx-auto max-w-8xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/trainers"
            aria-label="Back to trainers"
            className="group inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 hover:bg-primary"
          >
            <ArrowLeft className="size-5 text-foreground transition-colors duration-300 group-hover:text-primary-foreground" />
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Add New Trainer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Add trainer details, work information and create training packages.
        </p>
      </div>

      {/* Form — client sections share state through the provider */}
      <TrainerFormProvider>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <TrainerInformation />
            <WorkSalaryDetails />
            <TrainerPackages />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <TrainerPreview />
            <TrainerActions />
          </div>
        </div>
      </TrainerFormProvider>
    </div>
  )
}
