"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { areaClass } from "./trainer-form-context"

/* Numbered section heading — the "1 Trainer Information" pattern. */
export function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
        {step}
      </span>
      <h2 className="font-heading text-base font-semibold">{title}</h2>
    </div>
  )
}

/* Marks a field as required in the label. */
export function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
      {required ? <span className="ml-0.5 text-accent">*</span> : null}
    </label>
  )
}

/* Native select styled to match the form's inputs, with the chevron overlaid. */
export function SelectField({
  id,
  value,
  onChange,
  options,
  disabled,
  className,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  disabled?: boolean
  className?: string
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          areaClass,
          "h-11 appearance-none py-0 pr-10 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60",
          className,
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
