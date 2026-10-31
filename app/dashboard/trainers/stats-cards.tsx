"use client"

import { useQuery } from "@tanstack/react-query"
import { getTrainers } from "@/lib/services/trainer.services"

export function StatsCards() {
  const { data, isPending, isError } = useQuery({ queryKey: ["trainers"], queryFn: getTrainers })
  const trainers = data?.trainers ?? []
  const totalHours = trainers.reduce((total, trainer) => total + trainer.workload.totalWorkHours, 0)
  const actualHours = trainers.reduce((total, trainer) => total + trainer.workload.actualWorkHours, 0)
  const unavailable = isPending || !data
  const cards = [
    { label: "Total Trainers", value: String(trainers.length), note: "All trainers" },
    { label: "Active Trainers", value: String(trainers.filter((trainer) => trainer.status === "ACTIVE").length), note: "Currently active" },
    { label: "Total Work Hours", value: `${Number(totalHours.toFixed(2))}h`, note: "Weekly availability" },
    { label: "Actual Working Hours", value: `${Number(actualHours.toFixed(2))}h`, note: "Assigned sessions · current week" },
    { label: "Workload", value: totalHours > 0 ? `${Number((actualHours / totalHours * 100).toFixed(1))}%` : "—", note: "Assigned hours ÷ total hours" },
  ]

  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-busy={isPending}>
    {cards.map((card) => <div key={card.label} className="min-h-28 min-w-0 rounded-xl border border-border/80 bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
      <div className="mt-1 flex flex-col items-start gap-2">
        <span className="text-2xl leading-none font-bold tracking-tight text-foreground">{unavailable ? "—" : card.value}</span>
        <span className="text-[11px] text-muted-foreground">{isPending ? "Loading…" : isError ? "Could not refresh metrics" : card.note}</span>
      </div>
    </div>)}
  </div>
}
