import type { ComponentProps, ReactNode } from "react"
import { ChevronDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export const panelClass = "min-w-0 rounded-xl border border-border/80 bg-card p-3.5"
export const tableClass = "w-full whitespace-nowrap text-left text-[11px] [&_th]:px-2 [&_th]:py-2 [&_th]:font-medium [&_th]:text-muted-foreground [&_td]:border-b [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-2 [&_tr:last-child_td]:border-0"
export const tones = {
  green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  pink: "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  violet: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  neutral: "bg-muted text-foreground/80",
}
export type Tone = keyof typeof tones

export function IconTile({ icon: Icon, tone = "neutral", className }: { icon: LucideIcon; tone?: Tone; className?: string }) {
  return <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl", tones[tone], className)}><Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} /></span>
}

export function PanelHeading({ icon, tone, title, description, action }: { icon: LucideIcon; tone?: Tone; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-2">
    <div className="flex min-w-0 items-start gap-2.5"><IconTile icon={icon} tone={tone} /><div><h2 className="text-sm font-semibold tracking-tight">{title}</h2><p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p></div></div>
    {action}
  </div>
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return <div className="relative"><select {...props} className={cn("h-8 w-full appearance-none rounded-lg border bg-card pl-3 pr-8 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-accent/40", className)}>{children}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" /></div>
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-medium", tones[tone])}>{children}</span>
}
