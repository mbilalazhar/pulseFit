"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, CreditCard, Users, CalendarClock, ShieldCheck, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { cn } from "@/lib/utils"

const sampleNotifications = [
  { id: 1, icon: CreditCard, title: "Payment received", description: "Bilal Ahmed’s monthly membership payment of PKR 8,000 was received.", time: "10 minutes ago", category: "Payments", href: "/dashboard/payments" },
  { id: 2, icon: Users, title: "New member joined", description: "Ayesha Malik joined the Premium Plan. Review her member profile.", time: "35 minutes ago", category: "Members", href: "/dashboard/members" },
  { id: 3, icon: CalendarClock, title: "Memberships expiring soon", description: "15 memberships are due to expire in the next seven days.", time: "1 hour ago", category: "Members", href: "/dashboard/members" },
  { id: 4, icon: ShieldCheck, title: "Daily backup completed", description: "Your sample gym data backup completed successfully.", time: "3 hours ago", category: "System", href: "/dashboard/settings" },
  { id: 5, icon: Bell, title: "Team schedule reminder", description: "Review tomorrow’s staff coverage before the end of the day.", time: "Yesterday", category: "Team", href: "/dashboard/staff" },
]
export default function NotificationsPage() {
  const [read, setRead] = useState<number[]>([4, 5])
  const [filter, setFilter] = useState("All")
  const unread = sampleNotifications.filter(item => !read.includes(item.id)).length
  const visible = sampleNotifications.filter(item => filter === "All" || (filter === "Unread" ? !read.includes(item.id) : item.category === filter))
  return <div className="mx-auto max-w-5xl space-y-5"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Notifications</h1><p className="mt-1 text-xs text-muted-foreground">The latest updates from your gym. {unread} unread notifications.</p></div><DashboardHeaderButton icon={CheckCheck} text="Mark all as read" bgColor="primary" disabled={!unread} onClick={() => setRead(sampleNotifications.map(item => item.id))} /></header>
    <div className="flex flex-wrap gap-2">{["All", "Unread", "Payments", "Members", "System", "Team"].map(tab => <button key={tab} type="button" aria-pressed={filter === tab} onClick={() => setFilter(tab)} className={cn("rounded-lg px-4 py-2 text-xs font-medium", filter === tab ? "bg-accent text-white" : "bg-muted text-muted-foreground hover:text-foreground")}>{tab}</button>)}</div>
    <section aria-label="Notifications" className="overflow-hidden rounded-xl border border-border bg-card">{visible.length ? visible.map(item => <div key={item.id} className={cn("flex items-start gap-4 border-b border-border/60 p-5 last:border-0", !read.includes(item.id) && "bg-accent/3")}><span className="rounded-xl bg-accent/10 p-2.5 text-accent"><item.icon className="size-5" /></span><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><Link href={item.href} className="text-sm font-semibold hover:text-accent">{item.title}</Link>{!read.includes(item.id) && <span className="size-1.5 rounded-full bg-accent" />}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p><p className="mt-2 text-[10px] text-muted-foreground">{item.category} · {item.time}</p></div>{!read.includes(item.id) && <Button variant="ghost" size="xs" onClick={() => setRead([...read, item.id])}>Mark read</Button>}</div>) : <p className="p-10 text-center text-sm text-muted-foreground">You’re all caught up. No notifications here.</p>}</section><p className="text-[10px] text-muted-foreground">Static preview. Read status resets when you leave this page.</p>
  </div>
}
