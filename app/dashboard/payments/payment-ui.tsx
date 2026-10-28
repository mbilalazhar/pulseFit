import type { ComponentProps, ReactNode } from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export const panelClass = "min-w-0 rounded-xl border border-border/80 bg-card p-4"
const tones = {
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  pink: "bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400",
  amber: "bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-500 dark:bg-blue-950/50 dark:text-blue-400",
  neutral: "bg-muted text-foreground",
}

export function IconTile({ icon: Icon, tone = "neutral", large = false }: { icon: LucideIcon; tone?: keyof typeof tones; large?: boolean }) {
  return <span className={cn("flex shrink-0 items-center justify-center rounded-xl", large ? "size-12" : "size-9", tones[tone])}><Icon aria-hidden="true" className={large ? "size-6" : "size-5"} strokeWidth={1.8} /></span>
}

export function PanelHeading({ icon, title, description, tone, action }: { icon: LucideIcon; title: string; description: string; tone?: keyof typeof tones; action?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex items-start gap-3">
      <IconTile icon={icon} tone={tone} />
      <div><h2 className="text-sm font-semibold tracking-tight">{title}</h2><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p></div>
    </div>
    {action}
  </div>
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return <div className="relative">
    <select {...props} className={cn("h-8 w-full appearance-none rounded-lg border bg-card py-1 pl-3 pr-8 text-xs outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20", className)}>{children}</select>
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
  </div>
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium leading-none", {
    "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400": status === "Overdue",
    "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400": status === "Due Today" || status === "Pending",
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400": status === "Paid",
    "bg-muted text-muted-foreground": status === "Upcoming",
  })}>{status}</span>
}
