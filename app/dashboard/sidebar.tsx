"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  Bell,
  UsersRound,
  NotebookPen,
  Users,
  User,
  ClipboardList,
  CalendarCheck,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  Crown,
  MapPin,
  type LucideIcon,
} from "lucide-react"
import logo from "@/assets/logo.svg"
import darkLogo from "@/assets/logo-dark.svg"
import gymImage from "@/assets/signup.png"
import { SidebarAccountMenu } from "./sidebar-account-menu"
import { cn } from "@/lib/utils"

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

const navGroups: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  ] },
  { label: "Membership", items: [
    { label: "Members", href: "/dashboard/members", icon: Users },
    { label: "Trainers", href: "/dashboard/trainers", icon: User },
    { label: "Plans", href: "/dashboard/plans", icon: ClipboardList },
    { label: "Memberships", href: "/dashboard/memberships", icon: Wallet },
    { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
  ] },
  { label: "Business", items: [
    { label: "Staff", href: "/dashboard/staff", icon: UsersRound },
    { label: "Workspace", href: "/dashboard/workspace", icon: NotebookPen },
    { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  ] },
]

const accountItems: NavItem[] = [
  { label: "Help & Support", href: "/support", icon: HelpCircle },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3.5 border-b border-border/60 px-2.5 text-xs font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        active
          ? "text-accent"
          : "text-foreground/70 hover:bg-muted hover:text-foreground",
      )}
    >
      {/* Sliding active pill (shared across all items via layoutId) */}
      {active ? (
        <motion.span
          layoutId="sidebar-active-pill"
          className="absolute inset-0 z-0 bg-accent/10"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      ) : null}

      <Icon
        className={cn(
          "relative z-10 size-5 shrink-0 transition-transform duration-200",
          active && "scale-110",
        )}
      />
      <span className="relative z-10 flex-1">{item.label}</span>
    </Link>
  )
}

export function Sidebar({ gymName }: { gymName?: string | null }) {
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

  // Close the mobile drawer on navigation — handled in the click, not an
  // effect, so it doesn't trigger a cascading render on every route change.
  const closeDrawer = useCallback(() => setOpen(false), [])
  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = open ? "hidden" : ""
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    if (open) document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const activeHref = useMemo(() => {
    const items = [...navGroups.flatMap((group) => group.items), ...accountItems]
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
        className="fixed left-4 top-3.5 z-50 flex size-9 items-center justify-center rounded-lg bg-card text-foreground/70 transition-colors hover:bg-muted hover:text-foreground lg:hidden"
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
          "fixed inset-y-0 left-0 z-50 flex h-svh w-64 shrink-0 flex-col border-r border-border/80 bg-sidebar transition-transform duration-300 ease-in-out",
          "lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo (+ close button on mobile) */}
        <div className="flex h-12 shrink-0 items-center justify-between px-6">
          <Link
            href="/dashboard"
            onClick={closeDrawer}
            aria-label="PulseFit home"
          >
            <Image src={logo} alt="PulseFit" preload className="h-6 w-auto dark:hidden" />
            <Image src={darkLogo} alt="PulseFit" preload className="hidden h-6 w-auto dark:block" />
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

        {/* Grouped navigation scrolls independently on shorter screens. */}
        <nav aria-label="Dashboard navigation" className="scrollbar-hide min-h-0 flex-1 flex flex-col justify-between overflow-y-auto px-4 py-3">
          {navGroups.map((group) => <div key={group.label}>
            <div className="mb-1.5 flex items-center gap-2 px-1"><h2 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.label}</h2><span className="h-px flex-1 bg-border/60" /></div>
            <div className="p-0.5">
              {group.items.map((item) => <NavLink key={item.href} item={item} active={item.href === activeHref} onNavigate={closeDrawer} />)}
            </div>
          </div>)}
        </nav>

        <div className="mx-4 shrink-0 border-t border-border/70 pb-3 pt-3">
          <div className="mb-1.5 flex items-center gap-2 px-1"><h2 className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Account</h2><span className="h-px flex-1 bg-border/60" /></div>
          <nav aria-label="Account navigation" className="p-0.5">
            {accountItems.map((item) => <NavLink key={item.href} item={item} active={item.href === activeHref} onNavigate={closeDrawer} />)}
          </nav>
          <Link href="/dashboard/settings" onClick={closeDrawer} aria-label="Open gym settings" className="mt-3 flex shrink-0 items-center gap-3 rounded-xl border border-border/70 bg-gradient-to-br from-card to-muted/40 p-3 outline-none transition-colors hover:border-accent/25 focus-visible:ring-2 focus-visible:ring-accent/40">
            <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={gymImage} alt="" fill sizes="112px" className="scale-[1.8] object-cover object-center" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{gymName || "CoreFit Gym"}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[9px] text-muted-foreground"><MapPin className="size-2.5 shrink-0" /><span className="truncate">{gymName ? "Gym workspace" : "Downtown, New York"}</span></span>
              <span title="Sample subscription plan" className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[9px] font-semibold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"><Crown className="size-2.5 fill-current" />Pro Plan</span>
            </span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          </Link>
        </div>
        <div className="mx-4 shrink-0 pb-3">
          <SidebarAccountMenu onLogout={() => setConfirmLogout(true)} />
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
