export const PLAN_CATEGORIES = ["Basic", "Medium", "Premium", "Luxury"] as const
export const PLAN_ICON_IDS = ["dumbbell", "heart", "zap", "flame", "star", "trophy", "crown", "gem"] as const
export const PLAN_COLOR_IDS = ["slate", "blue", "teal", "green", "cyan", "orange", "violet", "indigo", "rose", "gold", "purple", "onyx"] as const
export const PLAN_ICONS = [
  { id: "dumbbell", label: "Dumbbell", category: "Basic" },
  { id: "heart", label: "Heart", category: "Basic" },
  { id: "zap", label: "Energy", category: "Medium" },
  { id: "flame", label: "Flame", category: "Medium" },
  { id: "star", label: "Star", category: "Premium" },
  { id: "trophy", label: "Trophy", category: "Premium" },
  { id: "crown", label: "Crown", category: "Luxury" },
  { id: "gem", label: "Diamond", category: "Luxury" },
] as const
export const PLAN_COLORS = [
  { id: "slate", label: "Slate", category: "Basic", background: "#475569", foreground: "#ffffff" },
  { id: "blue", label: "Blue", category: "Basic", background: "#2563eb", foreground: "#ffffff" },
  { id: "teal", label: "Teal", category: "Basic", background: "#0f766e", foreground: "#ffffff" },
  { id: "green", label: "Green", category: "Medium", background: "#15803d", foreground: "#ffffff" },
  { id: "cyan", label: "Cyan", category: "Medium", background: "#0e7490", foreground: "#ffffff" },
  { id: "orange", label: "Orange", category: "Medium", background: "#c2410c", foreground: "#ffffff" },
  { id: "violet", label: "Violet", category: "Premium", background: "#7c3aed", foreground: "#ffffff" },
  { id: "indigo", label: "Indigo", category: "Premium", background: "#4338ca", foreground: "#ffffff" },
  { id: "rose", label: "Rose", category: "Premium", background: "#be123c", foreground: "#ffffff" },
  { id: "gold", label: "Gold", category: "Luxury", background: "#d4af37", foreground: "#241b05" },
  { id: "purple", label: "Royal Purple", category: "Luxury", background: "#581c87", foreground: "#ffffff" },
  { id: "onyx", label: "Onyx", category: "Luxury", background: "#18181b", foreground: "#f5d77f" },
] as const
export function planColor(id?: string) {
  return PLAN_COLORS.find((color) => color.id === id) ?? PLAN_COLORS[1]
}
