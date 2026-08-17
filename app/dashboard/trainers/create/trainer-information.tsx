"use client"

import { Input } from "@/components/ui/input"
import { useTrainerForm, inputClass } from "./trainer-form-context"
import { StepHeading, FieldLabel } from "./form-fields"

export function TrainerInformation() {
  const { fullName, setFullName, email, setEmail, phone, setPhone } = useTrainerForm()

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <StepHeading step={1} title="Trainer Information" />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <FieldLabel htmlFor="trainer-name" required>
            Full Name
          </FieldLabel>
          <Input
            id="trainer-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter full name"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="trainer-email" required>
            Email Address
          </FieldLabel>
          <Input
            id="trainer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="trainer-phone" required>
            Phone Number
          </FieldLabel>
          <div className="flex h-11 items-center rounded-sm border border-input bg-white px-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
            <span className="mr-2 shrink-0 border-r pr-2.5 text-sm text-muted-foreground">
              PK +92
            </span>
            <input
              id="trainer-phone"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s]/g, ""))}
              placeholder="312 4567890"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
