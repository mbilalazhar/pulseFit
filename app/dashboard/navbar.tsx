"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, Bell, ChevronDown, Moon, Sun } from "lucide-react"
import { Popover } from "@base-ui/react/popover"
import { useTheme } from "next-themes"
import adminAvatar from "@/assets/admin.png"

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

export function Navbar({
  title = "Dashboard",
  notificationCount = 3,
  user = DEFAULT_USER,
}: NavbarProps) {
  const [query, setQuery] = useState("")
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background pl-16 pr-4 lg:px-6">
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
            className="h-10 w-full rounded-full border border-transparent bg-muted/60 pl-4 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-accent/30 focus:bg-card"
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

        <Popover.Root>
        <Popover.Trigger
          aria-label="Open admin appearance settings"
          className="group flex items-center gap-2.5 rounded-full p-1 pr-2 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="relative block size-10 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
            <Image
              src={user.avatarUrl || adminAvatar}
              alt={user.name}
              width={160}
              height={160}
              quality={90}
              unoptimized={Boolean(user.avatarUrl)}
              className={user.avatarUrl ? "size-10 object-cover" : "absolute -top-1 left-1/2 size-20 max-w-none -translate-x-1/2 object-cover object-top"}
            />
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold">{user.name}</span>
            <span className="block text-xs text-muted-foreground">
              {user.role}
            </span>
          </span>
          <ChevronDown className="hidden size-4 text-muted-foreground transition-transform group-data-open:rotate-180 sm:block" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner align="end" sideOffset={10} className="z-50">
            <Popover.Popup className="w-64 max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-2 text-popover-foreground shadow-xl outline-none">
              <div className="border-b px-3 pb-3 pt-2">
                <Popover.Title className="text-sm font-semibold">{user.name}</Popover.Title>
                <Popover.Description className="mt-0.5 text-xs text-muted-foreground">{user.role} · Appearance</Popover.Description>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                aria-label="Dark mode"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent"
              >
                {isDark ? <Moon className="size-4 text-accent" /> : <Sun className="size-4 text-muted-foreground" />}
                <span className="flex-1 text-left">Dark mode</span>
                <span aria-hidden="true" className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${isDark ? "bg-accent" : "bg-muted-foreground/40"}`}>
                  <span className={`size-4 rounded-full bg-white shadow-sm transition-transform ${isDark ? "translate-x-4" : "translate-x-0"}`} />
                </span>
              </button>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
        </Popover.Root>
      </div>
    </header>
  )
}
