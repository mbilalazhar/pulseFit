"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { logout } from "../../lib/services/auth.services"
import { toast } from "sonner"
import LoadingOverlay from "@/components/LoadingOverlay"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Home,
  Users,
  User,
  ClipboardList,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react"
import logo from "@/assets/logo.svg"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Members", href: "/dashboard/members", icon: Users },
  { label: "Trainers", href: "/dashboard/trainers", icon: User },
  { label: "Plans", href: "/dashboard/plans", icon: ClipboardList },
  { label: "Memberships", href: "/dashboard/memberships", icon: Wallet },
  { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

const bottomNav: NavItem[] = [
  { label: "Help & Support", href: "/support", icon: HelpCircle },
]

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-5 rounded-xl px-3 py-4 text-sm font-medium transition-colors duration-200",
        active
          ? "text-accent"
          : "text-foreground/70 hover:bg-muted hover:text-foreground",
      )}
    >
      {/* Sliding active pill (shared across all items via layoutId) */}
      {active ? (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 z-0 rounded-xl bg-accent/10"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}

      <Icon
        className={cn(
          "relative z-10 size-5 shrink-0 transition-transform duration-200",
          active && "scale-110",
        )}
      />
      <span className="relative z-10">{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const router = useRouter();
  const [logoutError, setLogoutError] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      return logout()
    },
    onSuccess: () => {
      // Toaster lives in the root layout, so the toast survives the redirect.
      toast.success("Logged out successfully.")
      router.push("/login")
      router.refresh();
    },
    onError: () => {
      setLogoutError(true)
    },
  })

  function handleLogout() {
    if (logoutMutation.isPending) return
    setConfirmLogout(false)
    logoutMutation.mutate()
  }
  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const activeHref = useMemo(() => {
    const items = [...mainNav, ...bottomNav]
    let best: string | undefined
    for (const item of items) {
      const matches =
        pathname === item.href || pathname?.startsWith(`${item.href}/`)
      if (matches && (!best || item.href.length > best.length)) {
        best = item.href
      }
    }
    return best
  }, [pathname])
  return (
    <>
      {/* Mobile trigger — sits where the sidebar would be, below lg only */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="fixed left-4 top-3.5 z-50 flex size-9 items-center justify-center rounded-lg bg-white text-foreground/70 transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {/* Backdrop — below lg only */}
      <AnimatePresence>
        {open ? (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      {/* Sidebar: static on lg+, sliding drawer below lg */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-svh w-64 flex-col border-r bg-white transition-transform duration-300 ease-in-out",
          "lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo (+ close button on mobile) */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/dashboard" aria-label="PulseFit home">
            <Image src={logo} alt="PulseFit" priority className="h-7 w-auto" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex size-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Primary navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item.href === activeHref}
            />
          ))}
        </nav>

        {/* Bottom navigation */}
        <div className="space-y-1 border-t px-3 py-4">
          {bottomNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={item.href === activeHref}
            />
          ))}
          <button
            type="button"
            onClick={() => setConfirmLogout(true)}
            className="flex w-full items-center gap-5 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Full-screen loading state while logging out (3s hold + request) */}
      {logoutMutation.isPending ? <LoadingOverlay /> : null}

      {/* Confirmation modal shown before the logout request fires */}
      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              You&apos;ll need to sign in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error modal shown when the logout request fails */}
      <Dialog open={logoutError} onOpenChange={setLogoutError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout failed</DialogTitle>
            <DialogDescription>
              Error while logging out please try again later...
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogoutError(false)}>
              Dismiss
            </Button>
            <Button
              onClick={() => {
                setLogoutError(false)
                logoutMutation.mutate()
              }}
            >
              Try again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}