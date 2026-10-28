import type { ReactNode } from "react"
import { Check, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function Panel({ icon: Icon, title, description, action, children, className }: {
  icon: LucideIcon; title: string; description: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return <section className={cn("min-w-0 rounded-xl border border-border/70 bg-card p-4", className)}>
    <div className="mb-4 flex flex-wrap items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.8} />
      <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold tracking-tight">{title}</h2><p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{description}</p></div>
      {action}
    </div>
    {children}
  </section>
}

export function Features({ items }: { items: readonly string[] }) {
  return <ul className="space-y-1.5">{items.map(item => <li key={item} className="flex items-start gap-2 text-[11px] leading-4"><Check className="mt-0.5 size-3.5 shrink-0 text-accent" strokeWidth={2.5} />{item}</li>)}</ul>
}

export function Status({ children, overdue = false }: { children: ReactNode; overdue?: boolean }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium", overdue ? "bg-accent/10 text-accent" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}><span className="size-1.5 rounded-full bg-current" />{children}</span>
}
