"use client"

import { useState } from "react"
import { Search, Bell, ChevronDown } from "lucide-react"

type NavbarUser = {
  name: string
  role: string
  avatarUrl?: string
}

type NavbarProps = {
  title?: string
  notificationCount?: number
  user?: NavbarUser
}

const DEFAULT_USER: NavbarUser = {
  name: "Admin",
  role: "Super Admin",
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function Navbar({
  title = "Dashboard",
  notificationCount = 3,
  user = DEFAULT_USER,
}: NavbarProps) {
  const [query, setQuery] = useState("")

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white pl-16 pr-4 lg:px-6">
      {/* Left: page title (mobile menu trigger is rendered by the Sidebar) */}
      <h1 className="font-heading text-xl font-bold tracking-tight">{title}</h1>

      {/* Center: search */}
      <div className="hidden flex-1 justify-center md:flex">
        <div className="relative w-full max-w-md">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search anything..."
            aria-label="Search"
            className="h-10 w-full rounded-full border border-transparent bg-muted/60 pl-4 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent/30 focus:bg-white"
          />
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-4">
        <button
          type="button"
          aria-label={`Notifications${notificationCount ? `, ${notificationCount} unread` : ""}`}
          className="relative flex size-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="size-5" />
          {notificationCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-4 text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          className="flex items-center gap-2.5 rounded-full p-1 pr-2 transition-colors hover:bg-muted"
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              {initials(user.name)}
            </span>
          )}
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold">{user.name}</span>
            <span className="block text-xs text-muted-foreground">
              {user.role}
            </span>
          </span>
          <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
        </button>
      </div>
    </header>
  )
}