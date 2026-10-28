"use client"

import { useState } from "react"
import Image from "next/image"
import { Popover } from "@base-ui/react/popover"
import { useTheme } from "next-themes"
import { ChevronsUpDown, LogOut, Moon, Sun } from "lucide-react"
import adminAvatar from "@/assets/admin.png"
import { cn } from "@/lib/utils"

export function SidebarAccountMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label="Open admin menu"
        className="flex min-h-20 w-full items-center gap-3 rounded-xl bg-muted/50 px-3 py-3 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-accent/40 data-open:bg-muted"
      >
        <span className="relative block size-14 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border/60">
          <Image
            src={adminAvatar}
            alt="Gym owner"
            width={224}
            height={224}
            unoptimized
            loading="eager"
            className="absolute -top-1.5 left-1/2 size-28 max-w-none -translate-x-1/2 object-cover object-top"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Admin</span>
          <span className="mt-1 block text-[11px] text-muted-foreground">Gym Owner</span>
        </span>
        <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={10} className="z-[60]">
          <Popover.Popup className="w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-xl outline-none">
            <div className="px-1 pb-3">
              <Popover.Title className="text-sm font-semibold">Your account</Popover.Title>
              <Popover.Description className="mt-1 text-[11px] text-muted-foreground">Admin · Gym Owner</Popover.Description>
            </div>
            <div className="border-y border-border/70 py-3">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
              <div className="grid grid-cols-2 gap-2">
                {([{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={resolvedTheme === value}
                    onClick={() => setTheme(value)}
                    className={cn("flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40", resolvedTheme === value ? "border-accent/30 bg-accent/10 text-accent" : "border-border hover:bg-muted")}
                  >
                    <Icon aria-hidden="true" className="size-4" />{label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout() }}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-accent outline-none transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <LogOut aria-hidden="true" className="size-4" />Logout
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
