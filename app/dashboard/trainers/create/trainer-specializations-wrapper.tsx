"use client"

import { useTrainerForm } from "./trainer-form-context"
import { TrainerSpecializations } from "./trainer-specializations"

export function TrainerSpecializationsWrapper() {
  const { trainerType } = useTrainerForm()

  if (trainerType === "contractor") {
    return null
  }

  return <TrainerSpecializations />
}
