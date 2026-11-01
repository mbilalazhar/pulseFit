import { Crown, Dumbbell, Flame, Gem, Heart, Star, Trophy, Zap } from "lucide-react"
import { planColor } from "@/lib/plan-appearance"
import { cn } from "@/lib/utils"

const icons = { dumbbell: Dumbbell, heart: Heart, zap: Zap, flame: Flame, star: Star, trophy: Trophy, crown: Crown, gem: Gem }
export function PlanIcon({ icon = "dumbbell", color = "blue", className }: { icon?: string; color?: string; className?: string }) {
  const Icon = icons[icon as keyof typeof icons] ?? Dumbbell
  const palette = planColor(color)
  return <span aria-hidden="true" className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/10", className)} style={{ backgroundColor: palette.background, color: palette.foreground }}><Icon className="size-5" strokeWidth={1.8} /></span>
}
