import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { TrainerFormData } from "@/lib/trainer-form-data"
import { TrainerFormProvider } from "./trainer-form-context"
import { TrainerInformation } from "./trainer-information"
import { WorkSalaryDetails } from "./work-salary-details"
import { TrainerPreview } from "./trainer-preview"
import { TrainerActions } from "./trainer-actions"
import { TrainerSpecializationsWrapper } from "./trainer-specializations-wrapper"

export function TrainerForm({ initialTrainer }: { initialTrainer?: TrainerFormData }) {
  const backHref = initialTrainer ? `/dashboard/trainers/${initialTrainer.id}` : "/dashboard/trainers"
  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link href={backHref} aria-label={initialTrainer ? "Back to trainer details" : "Back to trainers"} className="group inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 hover:bg-primary">
            <ArrowLeft className="size-5 text-foreground transition-colors duration-300 group-hover:text-primary-foreground" />
          </Link>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{initialTrainer ? "Edit Trainer" : "Add New Trainer"}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{initialTrainer ? "Update trainer details, qualifications, work hours and compensation." : "Add trainer details, work information and create training packages."}</p>
      </div>
      <TrainerFormProvider key={initialTrainer?.id ?? "create"} initialTrainer={initialTrainer}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <TrainerInformation />
            <TrainerSpecializationsWrapper />
            <WorkSalaryDetails />
          </div>
          <div className="space-y-6">
            <TrainerPreview />
            <TrainerActions />
          </div>
        </div>
      </TrainerFormProvider>
    </div>
  )
}
