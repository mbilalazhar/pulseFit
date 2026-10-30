"use client"

import { TimePicker } from "@/components/ui/date-time-picker"
import { WORKING_DAYS } from "@/lib/trainer-availability"
import { cn } from "@/lib/utils"
import { areaClass, useTrainerForm } from "./trainer-form-context"
import { FieldLabel } from "./form-fields"

export function WorkingDaysFields() {
  const { workingDays, toggleWorkingDay, updateWorkingTime } = useTrainerForm()

  return (
    <fieldset className="space-y-3 border-t pt-4 sm:col-span-2 lg:col-span-3">
      <legend className="px-1 text-sm font-medium">Working Days &amp; Hours <span className="text-destructive">*</span></legend>
      <p id="working-hours-help" className="text-xs text-muted-foreground">
        Select working days and set one continuous time range per day. Hours can differ each day, in the gym&apos;s local time.
      </p>
      <div className="divide-y rounded-lg border px-3">
        {WORKING_DAYS.map(({ value, label }) => {
          const day = workingDays.find((entry) => entry.dayOfWeek === value)
          const invalid = Boolean(day && (!day.startTime || !day.endTime || day.endTime <= day.startTime))
          const errorId = `working-day-${value}-error`
          return (
            <div key={value} className="grid items-center gap-3 py-3 sm:grid-cols-[minmax(120px,1fr)_minmax(0,2fr)]">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                <input type="checkbox" checked={Boolean(day)} onChange={() => toggleWorkingDay(value)} className="size-4 accent-primary" />
                {label}
              </label>
              {day ? (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-3">
                    {(["startTime", "endTime"] as const).map((field) => (
                      <div key={field} className="min-w-0 space-y-1">
                        <FieldLabel htmlFor={`working-day-${value}-${field}`}>
                          {field === "startTime" ? "From" : "To"}
                        </FieldLabel>
                        <TimePicker
                          id={`working-day-${value}-${field}`}
                          aria-label={`${label} ${field === "startTime" ? "start" : "end"} time`}
                          required
                          allowEndOfDay={field === "endTime"}
                          value={day[field]}
                          onValueChange={(time) => updateWorkingTime(value, field, time)}
                          aria-invalid={invalid}
                          aria-describedby={invalid ? errorId : "working-hours-help"}
                          className={cn(areaClass, "h-11 min-w-0 py-0", invalid && "border-destructive")}
                        />
                      </div>
                    ))}
                  </div>
                  {invalid && <p id={errorId} className="text-xs text-destructive">Enter both times, with the end after the start on the same day.</p>}
                </div>
              ) : <span className="text-sm text-muted-foreground">Day off</span>}
            </div>
          )
        })}
      </div>
      {workingDays.length === 0 && <p className="text-xs text-destructive">Select at least one working day.</p>}
    </fieldset>
  )
}
