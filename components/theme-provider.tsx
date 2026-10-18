"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { usePathname } from "next/navigation"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="pulsefit-theme"
      forcedTheme={isDashboard ? undefined : "light"}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  )
}
