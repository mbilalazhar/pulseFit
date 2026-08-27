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
    trainerType,
    setTrainerType,
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
    pricingModel,
    setPricingModel,
    contractorPrice,
    setContractorPrice,
    sessionsPerWeek,
    setSessionsPerWeek,
    contractorStartDate,
    setContractorStartDate,
  } = useTrainerForm()

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-5">
      <StepHeading step={2} title="Work &amp; Compensation Details" />

      {/* Trainer Type Selector */}
      <div className="space-y-3 border-b pb-4">
        <FieldLabel htmlFor="trainer-type-group" required>
          Trainer Type
        </FieldLabel>
        <div id="trainer-type-group" className="flex gap-4">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="radio"
              name="trainer-type"
              value="staff"
              checked={trainerType === "staff"}
              onChange={(e) => setTrainerType(e.target.value as "staff")}
              className="size-4 cursor-pointer accent-primary"
            />
            <span className="text-sm font-medium">Staff Trainer</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="radio"
              name="trainer-type"
              value="contractor"
              checked={trainerType === "contractor"}
              onChange={(e) => setTrainerType(e.target.value as "contractor")}
              className="size-4 cursor-pointer accent-primary"
            />
            <span className="text-sm font-medium">Private Contractor</span>
          </label>
        </div>
      </div>

      {/* Staff Trainer Section */}
      {trainerType === "staff" && (
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
      )}

      {/* Contractor Section */}
      {trainerType === "contractor" && (
        <div className="space-y-4">
          {/* Pricing Model Selection */}
          <div className="space-y-3 border-b pb-4">
            <FieldLabel htmlFor="pricing-model-group" required>
              Pricing Model
            </FieldLabel>
            <div id="pricing-model-group" className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="pricing-model"
                  value="fixed"
                  checked={pricingModel === "fixed"}
                  onChange={(e) => setPricingModel(e.target.value as "fixed")}
                  className="size-4 cursor-pointer accent-primary"
                />
                <span className="text-sm font-medium">Fixed Monthly Fee</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  name="pricing-model"
                  value="session"
                  checked={pricingModel === "session"}
                  onChange={(e) => setPricingModel(e.target.value as "session")}
                  className="size-4 cursor-pointer accent-primary"
                />
                <span className="text-sm font-medium">Session-based Pricing</span>
              </label>
            </div>
          </div>

          {/* Contractor Fields Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="contractor-price" required>
                {pricingModel === "fixed" ? "Monthly Fee (PKR)" : "Price per Session (PKR)"}
              </FieldLabel>
              <div className="flex h-11 items-center rounded-sm border border-input bg-white px-3.5 focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/20">
                <span className="mr-2 text-sm text-muted-foreground">PKR</span>
                <input
                  id="contractor-price"
                  inputMode="numeric"
                  value={contractorPrice}
                  onChange={(e) => setContractorPrice(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={pricingModel === "fixed" ? "Enter monthly fee" : "Enter price per session"}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="sessions-per-week" required>
                Sessions per Week
              </FieldLabel>
              <input
                id="sessions-per-week"
                inputMode="numeric"
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 3"
                className={cn(areaClass, "h-11 py-0")}
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="contractor-start-date" required>
                Start Date
              </FieldLabel>
              <input
                id="contractor-start-date"
                type="date"
                value={contractorStartDate}
                onChange={(e) => setContractorStartDate(e.target.value)}
                className={cn(areaClass, "h-11 py-0")}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
