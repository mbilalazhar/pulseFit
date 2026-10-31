"use client"

import { useState, type ReactNode } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTrainerSchedule } from "@/lib/services/trainer-schedule.services"
import type { UnallocatedTrainerMember } from "@/lib/trainer-unallocated-members"
import { UnallocatedMembers } from "./unallocated-members"
import { WeeklySchedule } from "./weekly-schedule"
import { AllocateSessionsDialog } from "./allocate-sessions-dialog"
import { MetricsStrip } from "./metrics-strip"
import type { TrainerDetail } from "./trainer-detail-logic"

export function TrainerScheduling({ trainerId, trainerName, trainerMetrics, initialWeek, children }: {
  trainerId: string
  trainerName: string
  trainerMetrics: Pick<TrainerDetail, "trainerType" | "monthlySalary" | "workDaysPerWeek">
  initialWeek: string
  children: ReactNode
}) {
  const [week, setWeek] = useState(initialWeek)
  const [member, setMember] = useState<UnallocatedTrainerMember | null>(null)
  const query = useQuery({ queryKey: ["trainer-schedule", trainerId, week], queryFn: () => getTrainerSchedule(trainerId, week), placeholderData: keepPreviousData })
  if (!query.data) return <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">{query.isError ? <p role="alert">{query.error.message} <Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></p> : <p className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Loading members and weekly schedule…</p>}</div>
  return <div className="space-y-6">
    {query.isError && <p role="alert" className="text-sm text-destructive">{query.error.message} <button type="button" className="underline" onClick={() => void query.refetch()}>Retry</button></p>}
    <div aria-busy={query.isFetching}><MetricsStrip trainer={trainerMetrics} data={query.data} /></div>
    <UnallocatedMembers members={query.data.members} onAllocate={setMember} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
      <WeeklySchedule trainerName={trainerName} data={query.data} onWeekChange={setWeek} loading={query.isFetching} />
      {children}
    </div>
    {member && <AllocateSessionsDialog key={`${member.id}-${query.data.weekStart}`} trainerId={trainerId} member={member} data={query.data} loading={query.isFetching || query.isPlaceholderData || query.isError} onWeekChange={setWeek} onClose={() => setMember(null)} />}
  </div>
}
