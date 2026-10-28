import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowUpRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { IconTile, PanelHeading, panelClass, tones, type Tone } from "../reports/report-ui"

export function Panel({ title, description, icon, children, action, className }: { title: string; description: string; icon: LucideIcon; children: ReactNode; action?: ReactNode; className?: string }) {
  return <section className={cn(panelClass, className)}><PanelHeading icon={icon} tone="pink" title={title} description={description} action={action} /><div className="mt-4">{children}</div></section>
}
export function ViewLink({ href, children = "View All" }: { href: string; children?: ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-1 rounded py-1 text-[10px] font-medium text-accent hover:underline focus-visible:outline-accent">{children}<ArrowUpRight className="size-3" /></Link>
}
export function Avatar({ initials, tone = "pink" }: { initials: string; tone?: Tone }) {
  return <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", tones[tone])}>{initials}</span>
}
export function Metric({ icon, title, value, detail, tone = "pink" }: { icon: LucideIcon; title: string; value: string; detail: string; tone?: Tone }) {
  return <div className="min-w-0 rounded-xl border border-border/70 bg-card p-3.5"><div className="flex items-start gap-3"><IconTile icon={icon} tone={tone} /><div className="min-w-0"><p className="text-[10px] text-muted-foreground">{title}</p><p className={cn("mt-1 font-bold tracking-tight", value.length > 8 ? "text-lg" : "text-2xl")}>{value}</p><p className="mt-1 text-[9px] text-muted-foreground">{detail}</p></div></div></div>
}
export function Ring({ value, label }: { value: number; label: string }) {
  return <div className="relative size-12 shrink-0"><svg viewBox="0 0 44 44" className="size-full -rotate-90" role="img" aria-label={`${label}: ${value}%`}><circle cx="22" cy="22" r="18" fill="none" stroke="var(--muted)" strokeWidth="4" /><circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-chart-progress)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${value / 100 * 113.1} 113.1`} /></svg><span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{value}%</span></div>
}
export function Progress({ value, label, green = false }: { value: number; label: string; green?: boolean }) {
  return <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", green ? "bg-emerald-500" : "bg-accent")} style={{ width: `${value}%` }} /></div>
}
