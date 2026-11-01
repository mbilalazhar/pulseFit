"use client"

import { Select } from "@base-ui/react/select"
import { Check, ChevronDown, Clock3, Users } from "lucide-react"
import type { TrainerSummary } from "@/lib/services/trainer.services"
import { workloadLevel } from "@/lib/trainer-workload"
import { cn } from "@/lib/utils"
import { TrainerAvatar } from "../trainers/trainer-avatar"

function WorkloadBadge({ trainer }: { trainer: TrainerSummary }) {
  const percent = trainer.workload.workloadPercent
  const level = workloadLevel(percent)
  return <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full bg-current/5 px-2 py-1 text-[10px] font-semibold", level.colorClass)}>
    <span className="size-1.5 rounded-full bg-current" />
    {percent == null ? "Not configured" : `${percent}% · ${level.label}`}
  </span>
}

function WorkloadBar({ trainer }: { trainer: TrainerSummary }) {
  return <div aria-hidden="true" className={cn("h-1 overflow-hidden rounded-full bg-muted", workloadLevel(trainer.workload.workloadPercent).colorClass)}>
    <div className="h-full rounded-full bg-current transition-[width]" style={{ width: `${Math.max(0, Math.min(100, trainer.workload.workloadPercent ?? 0))}%` }} />
  </div>
}

export function TrainerSelect({ trainers, value, onValueChange, required, disabled, placeholder }: {
  trainers: TrainerSummary[]
  value: string
  onValueChange: (value: string) => void
  required: boolean
  disabled: boolean
  placeholder: string
}) {
  const selected = trainers.find((trainer) => trainer.id === value)
  return <div className="space-y-2">
    <Select.Root name="trainerId" value={value || null} onValueChange={(next) => onValueChange(next ?? "")} required={required} disabled={disabled} items={trainers.map((trainer) => ({ value: trainer.id, label: trainer.fullName }))}>
      <Select.Trigger id="member-trainer" aria-describedby={required ? "member-trainer-help" : undefined} className="group flex h-11 w-full min-w-0 items-center gap-3 rounded-sm border border-input bg-card px-3.5 text-left text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-3 focus:ring-ring/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground/80 disabled:opacity-100">
        <Select.Value placeholder={placeholder} className="min-w-0 flex-1 truncate" />
        <Select.Icon className="shrink-0 text-muted-foreground"><ChevronDown className="size-4 transition-transform group-data-popup-open:rotate-180" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} align="start" alignItemWithTrigger={false} className="z-50 outline-none">
          <Select.Popup className="w-[max(var(--anchor-width),22rem)] max-w-[var(--available-width)] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl shadow-black/10 outline-none transition-[opacity,transform] data-starting-style:translate-y-1 data-starting-style:opacity-0 data-ending-style:opacity-0">
            <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
              <div><p className="text-xs font-semibold">Choose your trainer</p><p className="mt-0.5 text-[10px] text-muted-foreground">Workload for the current week</p></div>
              <span className="rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">{trainers.length} available</span>
            </div>
            <Select.List className="max-h-[min(22rem,calc(var(--available-height)-5rem))] space-y-1 overflow-y-auto p-1.5 outline-none">
              {trainers.map((trainer) => <Select.Item key={trainer.id} value={trainer.id} label={trainer.fullName} className="group cursor-pointer rounded-xl border border-transparent p-3 outline-none transition-colors data-highlighted:bg-muted/70 data-selected:border-accent/20 data-selected:bg-accent/5">
                <div className="flex items-center gap-3">
                  <TrainerAvatar src={trainer.profilePhotoUrl} alt="" size={38} className="size-[38px] ring-2 ring-background" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><Select.ItemText className="truncate text-sm font-semibold">{trainer.fullName}</Select.ItemText><Select.ItemIndicator className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-white"><Check className="size-3" /></Select.ItemIndicator></div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{trainer.specializations.map((item) => item.name).join(" · ") || "Personal trainer"}</p>
                  </div>
                  <WorkloadBadge trainer={trainer} />
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3" />{trainer.workload.actualWorkHours} / {trainer.workload.totalWorkHours} hrs assigned</span><span className="flex items-center gap-1"><Users className="size-3" />{trainer.memberCount} members</span></div>
                  <WorkloadBar trainer={trainer} />
                </div>
              </Select.Item>)}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
    {selected && !disabled && <div role="status" className="space-y-2.5 rounded-xl border bg-muted/20 px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[11px] font-medium text-muted-foreground">This week&apos;s workload</span><WorkloadBadge trainer={selected} /></div>
      <WorkloadBar trainer={selected} />
      <div className="flex flex-wrap justify-between gap-1 text-[10px] text-muted-foreground"><span>{selected.workload.actualWorkHours} of {selected.workload.totalWorkHours} hours assigned</span><span>{selected.unallocatedMemberCount} awaiting sessions</span></div>
    </div>}
  </div>
}
