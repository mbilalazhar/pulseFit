"use client"
import { useQuery } from "@tanstack/react-query"
import {
  Layers,
  CheckCircle2,
  Loader2Icon,
  OctagonAlert,
} from "lucide-react"
import { getPlans } from "@/lib/services/subscription.services"
import { EmptyState } from "./empty-state"
import { PlanCard } from "./plan-card"

export function PlanList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["plans"],
    queryFn: getPlans,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white py-16 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        Loading plans...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <OctagonAlert className="mt-0.5 size-4 shrink-0" />
        <span>{(error as Error).message}</span>
      </div>
    )
  }

  const plans = data?.plans ?? []

  if (plans.length === 0) {
    return <EmptyState />
  }
  const totalPlans = plans.length
  const activePlans = plans.filter((p) => p.status === "ACTIVE").length

  const stats = [
    { label: "Total Plans", value: totalPlans.toString(), hint: "All subscription plans", icon: Layers },
    { label: "Active Plans", value: activePlans.toString(), hint: "Currently active plans", icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-start gap-3 rounded-2xl border bg-white p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plan grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  )
}
