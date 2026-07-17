"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Menu, X } from "lucide-react"
import logo from "@/assets/logo.svg"

type NavItem = {
  label: string
  href: string
  hasDropdown?: boolean
}

const navItems: NavItem[] = [
  { label: "Home", href: "#" },
  { label: "Solutions", href: "#", hasDropdown: true },
  { label: "Clients", href: "#", hasDropdown: true },
  { label: "Pricing", href: "#" },
  { label: "Resources", href: "#", hasDropdown: true },
  { label: "Career", href: "#" },
]

export function GlassNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className=" mx-20 sticky top-0 z-50 border-b border-black/5 bg-white/80 shadow-lg shadow-black/5 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60">
      <nav className="relative mx-auto h-16 max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Subtle top highlight for the glass edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/70 to-transparent"
        />

        <div className="relative z-10 flex h-full items-center gap-6">
          {/* Logo */}
          <Link href="/" aria-label="Home" className="flex shrink-0 items-center">
            <Image src={logo} alt="PulseFit" priority className="h-7 w-auto" />
          </Link>

          {/* Desktop links */}
          <ul className="ml-4 hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-black/5 hover:text-foreground"
                >
                  {item.label}
                  {item.hasDropdown ? (
                    <ChevronDown className="size-4 opacity-70" />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop auth buttons */}
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-medium text-foreground/80 ring-1 ring-inset ring-black/10 transition-colors hover:bg-black/5 hover:text-foreground"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent/90"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="ml-auto flex size-9 items-center justify-center rounded-lg text-foreground/80 transition-colors hover:bg-black/5 hover:text-foreground lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open ? (
        <div className="border-t border-black/5 bg-white/90 px-4 py-4 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-black/5 hover:text-foreground"
                >
                  {item.label}
                  {item.hasDropdown ? (
                    <ChevronDown className="size-4 opacity-70" />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-2 border-t border-black/5 pt-4">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full px-4 py-2.5 text-center text-sm font-medium text-foreground/80 ring-1 ring-inset ring-black/10 transition-colors hover:bg-black/5 hover:text-foreground"
            >
              Login
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              Sign up
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}