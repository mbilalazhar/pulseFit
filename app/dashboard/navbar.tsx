"use client"

import { useState } from "react"
import { Search, Clock3, Globe2 } from "lucide-react"

type NavbarProps = {
  title?: string
}

export function Navbar({ title = "Dashboard" }: NavbarProps) {
  const [query, setQuery] = useState("")

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background pl-16 pr-4 sm:gap-4 lg:px-6">
      <h1 className="min-w-0 truncate font-heading text-base font-bold tracking-tight sm:text-xl">{title}</h1>

      <div className="hidden min-w-0 flex-1 justify-center md:flex">
        <div className="relative w-full max-w-md">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search anything..."
            aria-label="Search"
            className="h-10 w-full rounded-full border border-transparent bg-muted/60 pl-4 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent/30 focus:bg-card"
          />
          <Search aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Fixed preview values keep the clock identical on server and client. */}
      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4" aria-label="Timezone and time, static preview">
        <div className="hidden items-center gap-2.5 sm:flex">
          <Globe2 aria-hidden="true" className="size-4 text-muted-foreground" />
          <div className="leading-tight">
            <p className="text-xs font-medium">Asia/Karachi</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Pakistan · UTC+05:00</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:border-l sm:border-border sm:pl-4">
          <Clock3 aria-hidden="true" className="hidden size-4 text-accent sm:block" />
          <div className="text-right leading-tight">
            <time dateTime="2026-10-20T00:12:00+05:00" title="Static time preview" className="block text-sm font-semibold tabular-nums">12:12 AM</time>
            <span className="mt-1 block text-[10px] text-muted-foreground sm:hidden">PKT · UTC+05:00</span>
            <span className="mt-1 hidden text-[10px] text-muted-foreground sm:block">Tue, 20 Oct 2026</span>
          </div>
        </div>
      </div>
    </header>
  )
}
