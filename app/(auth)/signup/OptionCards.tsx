"use client"

import type { Tier } from "@/lib/services/auth.services"
import { PLANS, USER_LIMITS } from "./plans"

const CARD_BASE =
  "relative flex cursor-pointer flex-col items-center rounded-xl border p-4 transition-colors"

function cardClass(selected: boolean) {
  return `${CARD_BASE} ${
    selected
      ? "border-accent bg-accent/5"
      : "border-border bg-white hover:bg-muted"
  }`
}

export function PlanSelector({
  value,
  onChange,
}: {
  value: Tier
  onChange: (value: Tier) => void
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium">Choose Your Plan</legend>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {PLANS.map(({ value: planValue, label, icon: Icon }) => {
          const selected = value === planValue
          return (
            <label key={planValue} className={`${cardClass(selected)} gap-1.5`}>
              <input
                type="radio"
                name="plan"
                value={planValue}
                checked={selected}
                onChange={() => onChange(planValue)}
                className="absolute left-3 top-3 size-4 accent-accent"
              />
              <Icon className="size-5 text-muted-foreground" />
              <span className="text-sm font-semibold">{label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function UserLimitSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium">Max Allowed Users</legend>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {USER_LIMITS.map((limit) => {
          const selected = value === limit
          return (
            <label key={limit} className={`${cardClass(selected)} gap-0.5`}>
              <input
                type="radio"
                name="maxUsers"
                value={limit}
                checked={selected}
                onChange={() => onChange(limit)}
                className="absolute left-3 top-3 size-4 accent-accent"
              />
              <span className="text-lg font-bold">{limit}</span>
              <span className="text-xs text-muted-foreground">Users</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
