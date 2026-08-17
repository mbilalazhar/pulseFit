"use client"

import {
  useTrainerForm,
  areaClass,
  WORK_HOURS_OPTIONS,
  WORK_DAYS_OPTIONS,
  SHIFT_OPTIONS,
} from "./trainer-form-context"
import { StepHeading, FieldLabel, SelectField } from "./form-fields"
import { cn } from "@/lib/utils"

export function WorkSalaryDetails() {
  const {
    salary,
    setSalary,
    workHours,
    setWorkHours,
    workDays,
    setWorkDays,
    shift,
    setShift,
    joiningDate,
    setJoiningDate,
  } = useTrainerForm()

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <StepHeading step={2} title="Work &amp; Salary Details" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <FieldLabel htmlFor="trainer-salary" required>
            Monthly Salary (PKR)
          </FieldLabel>
          <div className="flex h-11 items-center rounded-sm border border-input bg-white px-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
            <span className="mr-2 text-sm text-muted-foreground">PKR</span>
            <input
              id="trainer-salary"
              inputMode="numeric"
              value={salary}
              onChange={(e) => setSalary(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Enter monthly salary"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="trainer-hours" required>
            Work Hours / Day
          </FieldLabel>
          <SelectField
            id="trainer-hours"
            value={workHours}
            onChange={setWorkHours}
            options={WORK_HOURS_OPTIONS}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="trainer-days">Work Days</FieldLabel>
          <SelectField
            id="trainer-days"
            value={workDays}
            onChange={setWorkDays}
            options={WORK_DAYS_OPTIONS}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="trainer-shift">Shift / Time</FieldLabel>
          <SelectField
            id="trainer-shift"
            value={shift}
            onChange={setShift}
            options={SHIFT_OPTIONS}
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="trainer-joining" required>
            Joining Date
          </FieldLabel>
          <input
            id="trainer-joining"
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            className={cn(areaClass, "h-11 py-0")}
          />
        </div>
      </div>
    </section>
  )
}
