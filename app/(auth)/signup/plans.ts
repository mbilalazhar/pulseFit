import { Star, ShieldCheck, Gem } from "lucide-react"
import type { Tier } from "@/lib/services/auth.services"

/**
 * `value` must match the Tier enum in prisma/schema.prisma — the signup route
 * rejects anything else and derives the member limit from it server-side.
 */
export const PLANS: { value: Tier; label: string; icon: typeof Star }[] = [
  { value: "BASIC", label: "Basic", icon: Star },
  { value: "PRO", label: "Pro", icon: ShieldCheck },
  { value: "PREMIUM", label: "Premium", icon: Gem },
]

export const USER_LIMITS = [200, 400, 1000]
