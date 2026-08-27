import type { TrainerStatus } from "@/lib/services/trainer.services"

/* Shared by the trainers list and the trainer detail page so a status never
   renders in two different colours. */

export const STATUS_BADGE: Record<TrainerStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  ON_LEAVE: "bg-orange-100 text-orange-700",
  INACTIVE: "bg-muted text-muted-foreground",
}

export const STATUS_LABEL: Record<TrainerStatus, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  INACTIVE: "Inactive",
}

export const STATUS_DOT: Record<TrainerStatus, string> = {
  ACTIVE: "bg-green-600",
  ON_LEAVE: "bg-orange-500",
  INACTIVE: "bg-muted-foreground",
}
