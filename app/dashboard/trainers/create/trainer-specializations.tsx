"use client"

import { Plus, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useTrainerForm,
  SPECIALIZATIONS,
  MAX_SPECIALIZATIONS,
  CERTIFICATION_MAX,
  inputClass,
} from "./trainer-form-context"
import { StepHeading, FieldLabel } from "./form-fields"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function TrainerSpecializations() {
  const {
    specializations,
    toggleSpecialization,
    certifications,
    certDraft,
    setCertDraft,
    addCertification,
    removeCertification,
  } = useTrainerForm()

  const atLimit = specializations.length >= MAX_SPECIALIZATIONS

  return (
    <section className="space-y-5 rounded-2xl border bg-white p-5">
      <StepHeading step={3} title="Specializations &amp; Certifications" />

      {/* Specializations — capped so a trainer reads as a specialist, not a list. */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <FieldLabel htmlFor="specializations" required>
            Specializations
          </FieldLabel>
          <span
            className={cn(
              "text-xs font-medium",
              atLimit ? "text-warning" : "text-muted-foreground",
            )}
          >
            {specializations.length} / {MAX_SPECIALIZATIONS} selected
          </span>
        </div>

        <div id="specializations" className="flex flex-wrap gap-2">
          {SPECIALIZATIONS.map((name) => {
            const selected = specializations.includes(name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleSpecialization(name)}
                aria-pressed={selected}
                disabled={!selected && atLimit}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-input bg-white text-foreground hover:border-accent hover:bg-accent/5",
                  !selected && atLimit && "cursor-not-allowed opacity-40 hover:border-input hover:bg-white",
                )}
              >
                {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Certifications — one entry per credential. */}
      <div className="space-y-2.5 border-t pt-5">
        <FieldLabel htmlFor="certification-draft">Certifications (optional)</FieldLabel>

        <div className="flex gap-2">
          <Input
            id="certification-draft"
            value={certDraft}
            onChange={(e) => setCertDraft(e.target.value.slice(0, CERTIFICATION_MAX))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addCertification()
              }
            }}
            placeholder="e.g. NASM Certified Personal Trainer"
            className={inputClass}
          />
          <Button
            type="button"
            onClick={addCertification}
            disabled={!certDraft.trim()}
            className="h-11 shrink-0 gap-1.5"
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>

        {certifications.length === 0 ? (
          <p className="rounded-xl bg-muted/40 p-3 text-center text-xs text-muted-foreground">
            No certifications added yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {certifications.map((cert) => (
              <li
                key={cert.id}
                className="group flex items-start gap-2.5 rounded-xl border bg-muted/20 p-3"
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-success"
                  strokeWidth={3}
                />
                <span className="flex-1 text-sm leading-snug">{cert.text}</span>
                <button
                  type="button"
                  onClick={() => removeCertification(cert.id)}
                  aria-label={`Remove ${cert.text}`}
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
