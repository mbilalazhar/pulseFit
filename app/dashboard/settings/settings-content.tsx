"use client"

import { useState, type ReactNode } from "react"
import Image from "next/image"
import {
  Store, Globe, Users, CreditCard, Bell, ShieldCheck, Database,
  Camera, ChevronRight, Plus, UserRoundPlus, Info, MoreHorizontal,
  CalendarCheck, Mail, BarChart3, LockKeyhole, KeyRound, Clock,
  FileText, Download, Upload, Archive, House, Wallet,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import gymImage from "@/assets/signup.png"
import adminAvatar from "@/assets/admin.png"
import { cn } from "@/lib/utils"

const controlClass = "h-8 w-full rounded-md border border-border bg-background px-3 text-[11px] text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/10"

function Field({ label, value, options, hint, type = "text" }: {
  label: string; value: string; options?: string[]; hint?: string; type?: string
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-[11px] font-medium">{label}</span>
      {options ? (
        <select aria-label={label} defaultValue={value} className={controlClass}>
          {options.map(option => <option key={option}>{option}</option>)}
        </select>
      ) : <input type={type} defaultValue={value} className={controlClass} />}
      {hint && <span className="block text-[10px] leading-relaxed text-muted-foreground">{hint}</span>}
    </label>
  )
}

function Card({ title, description, icon: Icon, children, action, className }: {
  title: string; description: string; icon: LucideIcon; children: ReactNode; action?: ReactNode; className?: string
}) {
  return (
    <section className={cn("min-w-0 rounded-xl border border-border/70 bg-card p-4 shadow-xs", className)}>
      <div className="mb-4 flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Toggle({ label, initial = false }: { label: string; initial?: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  return (
    <button type="button" role="switch" aria-checked={enabled} aria-label={label}
      onClick={() => setEnabled(!enabled)}
      className={cn("relative h-[18px] w-9 shrink-0 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card", enabled ? "bg-accent" : "bg-slate-300 dark:bg-neutral-700")}>
      <span className={cn("absolute top-0.5 size-3.5 rounded-full bg-white shadow-sm transition-transform", enabled ? "left-0.5 translate-x-[18px]" : "left-0.5")} />
    </button>
  )
}

function SettingRow({ icon: Icon, label, description, children }: {
  icon: LucideIcon; label: string; description?: string; children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-foreground/70" strokeWidth={1.7} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium leading-4">{label}</p>
        {description && <p className="text-[10px] leading-4 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

const admins = [
  { name: "Alex Carter", email: "alex@corefitgym.com", role: "Owner", status: "Active", initials: "AC", color: "bg-rose-100 text-rose-700" },
  { name: "Sarah Khan", email: "sarah@corefitgym.com", role: "Admin", status: "Active", initials: "SK", color: "bg-violet-100 text-violet-700" },
  { name: "Mike Johnson", email: "mike@corefitgym.com", role: "Manager", status: "Active", initials: "MJ", color: "bg-sky-100 text-sky-700" },
  { name: "Emma Wilson", email: "emma@corefitgym.com", role: "Admin", status: "Pending", initials: "EW", color: "bg-orange-100 text-orange-700" },
]
const notifications = [
  { icon: CalendarCheck, label: "Membership Expiry Reminders", description: "Get notified when a member’s plan is about to expire.", initial: true },
  { icon: CreditCard, label: "Payment Due Reminders", description: "Get notified about pending or failed payments.", initial: true },
  { icon: Users, label: "Attendance Alerts", description: "Receive alerts for unusual attendance activity.", initial: false },
  { icon: Mail, label: "Daily Summary Email", description: "Get a daily overview of your gym’s activity.", initial: true },
  { icon: BarChart3, label: "Weekly Business Report", description: "Receive a weekly report with key insights.", initial: false },
]

export function SettingsContent() {
  const [dialog, setDialog] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState("Mon")
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => [day, { open: day === "Sat" ? "08:00" : "06:00", close: day === "Sat" ? "20:00" : "22:00", closed: day === "Sun" }]))
  )
  const previewNotice = () => toast.info("This is a static preview. Changes are not saved.")
  const smallSelect = (label: string, values: string[]) => (
    <select aria-label={label} className={cn(controlClass, "h-7 w-28 shrink-0 px-2 text-[10px]")}>{values.map(value => <option key={value}>{value}</option>)}</select>
  )

  return (
    <div className="mx-auto max-w-[1600px] space-y-3">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-xs text-muted-foreground">Manage gym preferences, localization, admin, and system controls.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <DashboardHeaderButton icon={UserRoundPlus} text="Invite Admin" bgColor="transparent" aria-haspopup="dialog" onClick={() => setDialog("Invite Admin")} />
          <DashboardHeaderButton icon={ChevronRight} text="Save Changes" bgColor="primary" onClick={previewNotice} />
        </div>
      </header>

      <div className="grid items-stretch gap-3 xl:grid-cols-[1fr_1.08fr]">
        <Card title="Gym Profile" description="Update your gym’s basic information and contact details." icon={Store}>
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border shadow-sm">
              <Image src={gymImage} alt="CoreFit gym interior" fill sizes="112px" className="scale-[1.7] object-cover" />
              <button type="button" aria-label="Change gym photo" onClick={() => setDialog("Gym Photo")} className="absolute bottom-1.5 right-1.5 rounded-md bg-white p-1.5 text-neutral-700 shadow-sm hover:bg-neutral-100"><Camera className="size-4" /></button>
            </div>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <Field label="Gym Name" value="CoreFit Gym" />
              <Field label="Branch Name" value="Downtown" />
              <Field label="Contact Email" value="hello@corefitgym.com" type="email" />
              <Field label="Support Phone" value="+92 300 1234567" type="tel" />
              <div className="sm:col-span-2"><Field label="Address" value="123 Fitness Street, Downtown, New York, NY 10001" /></div>
            </div>
          </div>
        </Card>

        <Card title="Localization & Preferences" description="Set your location, language and regional preferences." icon={Globe}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Timezone" value="Asia/Karachi" options={["Asia/Karachi", "Asia/Dubai", "Europe/London", "America/New_York"]} />
            <Field label="Country" value="Pakistan" options={["Pakistan", "United States", "United Kingdom", "United Arab Emirates"]} />
            <Field label="Currency" value="PKR (RS)" options={["PKR (RS)", "USD ($)", "GBP (£)", "AED"]} />
            <Field label="Date Format" value="DD/MM/YYYY" options={["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]} />
            <Field label="Week Starts On" value="Monday" options={["Monday", "Sunday", "Saturday"]} />
            <Field label="Language" value="English" options={["English", "Urdu", "Arabic"]} />
          </div>
          <div className="mt-4 border-t border-border/50 pt-3">
            <div className="mb-2 flex gap-2"><House className="size-4 text-foreground/70" /><div><p className="text-[11px] font-medium">Business Hours</p><p className="text-[10px] text-muted-foreground">Set your gym’s operating hours.</p></div></div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {Object.entries(hours).map(([day, schedule]) => <button type="button" key={day} onClick={() => { setSelectedDay(day); setDialog("Business Hours") }} className={cn("rounded-md border px-1 py-2 text-center transition-colors hover:border-accent/50", selectedDay === day ? "border-accent/20 bg-accent/5 text-accent" : "border-border text-foreground/80")}><span className="block text-[10px] font-semibold">{day}</span><span className="mt-1 block whitespace-nowrap text-[8px]">{schedule.closed ? "Closed" : `${schedule.open} – ${schedule.close}`}</span></button>)}
            </div>
          </div>
        </Card>

        <Card title="Admin Accounts & Roles" description="Manage administrator accounts and their access levels." icon={Users}
          action={<Button variant="outline" size="sm" className="border-accent/25 text-[10px] text-accent hover:bg-accent/5 hover:text-accent" onClick={() => setDialog("Invite Admin")}><Plus className="size-3" /><span className="hidden sm:inline">Invite New Admin</span></Button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] whitespace-nowrap">
              <thead className="bg-muted/50 text-muted-foreground"><tr>{["Name", "Email", "Role", "Status", "Actions"].map(label => <th key={label} className="px-2 py-2 font-medium">{label}</th>)}</tr></thead>
              <tbody>{admins.map((admin, index) => <tr key={admin.email} className="border-b border-border/50 last:border-0">
                <td className="px-2 py-1.5"><span className="flex items-center gap-2">{index === 0 ? <Image src={adminAvatar} alt="" width={28} height={28} className="size-7 rounded-full object-cover" /> : <span className={cn("flex size-7 items-center justify-center rounded-full text-[9px] font-semibold", admin.color)}>{admin.initials}</span>}<span className="font-medium">{admin.name}</span></span></td>
                <td className="px-2 py-1.5 text-muted-foreground">{admin.email}</td>
                <td className="px-2 py-1.5"><span className={cn("rounded-md px-2 py-1 text-[9px]", admin.role === "Owner" ? "bg-accent/10 text-accent" : admin.role === "Manager" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400" : "bg-muted text-muted-foreground")}>{admin.role}</span></td>
                <td className="px-2 py-1.5"><span className={cn("inline-flex items-center gap-1", admin.status === "Active" ? "text-emerald-600 dark:text-emerald-400" : "text-orange-500")}><span className="size-1.5 rounded-full bg-current" />{admin.status}</span></td>
                <td className="px-2 py-1.5"><button type="button" aria-label={`Manage ${admin.name}`} onClick={() => setDialog(admin.name)} className="rounded p-1 hover:bg-muted"><MoreHorizontal className="size-4" /></button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <button type="button" onClick={() => setDialog("Roles & Permissions")} className="mt-2 flex w-full items-center gap-3 rounded-lg border border-border/50 bg-muted/40 p-2.5 text-left hover:bg-muted">
            <Info className="size-4 shrink-0 text-blue-500" /><span className="flex-1"><span className="block text-[11px] font-medium">Roles & Permissions</span><span className="block text-[10px] leading-relaxed text-muted-foreground">Owners have full access. Admins can manage members, payments and staff. Managers have limited access.</span></span><ChevronRight className="size-3.5 shrink-0" />
          </button>
        </Card>

        <Card title="Payment & Billing Preferences" description="Configure payment settings, reminders and invoicing options." icon={CreditCard}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-5 sm:border-r sm:border-border/50 sm:pr-5">
              <div className="flex gap-3"><Wallet className="mt-1 size-4 shrink-0 text-foreground/70" /><div className="flex-1"><Field label="Default Payment Method" value="Bank Transfer" options={["Bank Transfer", "Cash", "Credit Card", "Mobile Wallet"]} /></div></div>
              <SettingRow icon={Archive} label="Auto-payment Reminders" description="Send reminder before auto-debit."><Toggle label="Auto-payment Reminders" initial /></SettingRow>
              <SettingRow icon={CalendarCheck} label="Due Date Reminders" description="Notify members about upcoming due dates."><Toggle label="Due Date Reminders" initial /></SettingRow>
            </div>
            <div className="space-y-3">
              <Field label="Tax / VAT (%)" value="0" type="number" hint="Applied to invoices and receipts." />
              <Field label="Grace Period (Days)" value="3" type="number" hint="Days after due date before marking overdue." />
              <Field label="Invoice / Receipt Preference" value="Email Receipt" options={["Email Receipt", "Printed Receipt", "Email & Printed Receipt"]} hint="Send receipts via email after successful payment." />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_0.9fr]">
        <Card title="Notifications & Alerts" description="Choose what notifications you want to receive." icon={Bell}>
          {notifications.map(item => <SettingRow key={item.label} {...item}><Toggle label={item.label} initial={item.initial} /></SettingRow>)}
        </Card>
        <Card title="Security & Access" description="Manage security settings and access controls." icon={ShieldCheck}>
          <SettingRow icon={LockKeyhole} label="Two-Factor Authentication (2FA)" description="Require 2FA for all admin accounts."><Toggle label="Two-Factor Authentication" initial /></SettingRow>
          <SettingRow icon={KeyRound} label="Password Reset Policy" description="Force admins to reset their password periodically.">{smallSelect("Password Reset Policy", ["Every 90 days", "Every 30 days", "Every 60 days", "Never"])}</SettingRow>
          <SettingRow icon={Clock} label="Session Timeout" description="Automatically log out inactive sessions.">{smallSelect("Session Timeout", ["30 minutes", "15 minutes", "60 minutes"])}</SettingRow>
          <SettingRow icon={Mail} label="Login Alerts" description="Get notified of new login attempts."><Toggle label="Login Alerts" initial /></SettingRow>
          <SettingRow icon={FileText} label="View Audit Logs" description="See a record of important account changes."><Button variant="outline" size="xs" onClick={() => setDialog("Audit Logs")}>Open Logs<ChevronRight className="size-3" /></Button></SettingRow>
        </Card>
        <Card title="Data & Backup" description="Manage your data and backups." icon={Database} className="md:col-span-2 xl:col-span-1">
          <SettingRow icon={Archive} label="Automatic Backups" description="Automatically back up your data."><Toggle label="Automatic Backups" initial /></SettingRow>
          <div className="my-2 flex items-center justify-between gap-3 pl-7"><span className="text-[11px] font-medium">Backup Frequency</span>{smallSelect("Backup Frequency", ["Daily", "Weekly", "Monthly"])}</div>
          <SettingRow icon={CalendarCheck} label="Last Backup"><span className="text-[9px] text-muted-foreground">Jan 15, 2026, 03:20 AM</span><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] text-emerald-600 dark:text-emerald-400">Successful</span></SettingRow>
          <div className="mt-2 border-t border-border/50 pt-2">
            <SettingRow icon={Download} label="Export Data" description="Download your gym data (members, payments, etc)."><Button variant="outline" size="xs" onClick={() => setDialog("Export Data")}>Export</Button></SettingRow>
            <SettingRow icon={Upload} label="Restore Data" description="Restore data from a previous backup."><Button variant="outline" size="xs" onClick={() => setDialog("Restore Data")}>Restore</Button></SettingRow>
          </div>
        </Card>
      </div>
      <p className="pt-1 text-right text-[10px] text-muted-foreground">Preview with sample data. Changes apply to this page only.</p>

      <Dialog open={dialog !== null} onOpenChange={open => { if (!open) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{dialog}</DialogTitle><DialogDescription>{dialog === "Invite Admin" ? "Invite a team member to help manage your gym." : "Static preview — no account or system changes will be made."}</DialogDescription></DialogHeader>
          {dialog === "Invite Admin" ? <form className="space-y-4" onSubmit={event => { event.preventDefault(); toast.info("Preview only. No invitation was sent."); setDialog(null) }}>
            <Field label="Full Name" value="" /><Field label="Email Address" value="" type="email" /><Field label="Role" value="Admin" options={["Admin", "Manager"]} /><Button type="submit" className="w-full bg-accent text-white hover:bg-accent/90">Send Invitation</Button>
          </form> : dialog === "Business Hours" ? <div className="space-y-4"><p className="text-sm font-medium">{selectedDay} operating hours</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hours[selectedDay].closed} onChange={event => setHours({ ...hours, [selectedDay]: { ...hours[selectedDay], closed: event.target.checked } })} className="accent-accent" />Closed</label><div className="grid grid-cols-2 gap-3">{(["open", "close"] as const).map(key => <label key={key} className="space-y-2 text-xs"><span>{key === "open" ? "Opening time" : "Closing time"}</span><input aria-label={key === "open" ? "Opening time" : "Closing time"} type="time" disabled={hours[selectedDay].closed} value={hours[selectedDay][key]} onChange={event => setHours({ ...hours, [selectedDay]: { ...hours[selectedDay], [key]: event.target.value } })} className={controlClass} /></label>)}</div><Button onClick={() => setDialog(null)}>Done</Button></div>
          : dialog === "Roles & Permissions" ? <div className="space-y-3 text-sm">{[["Owner", "Full access to gym settings, billing, team management, and all reports."], ["Admin", "Manage members, payments, attendance, and staff."], ["Manager", "Manage daily gym operations and view member attendance."]].map(([role, description]) => <div key={role} className="rounded-lg border border-border p-3"><p className="font-medium">{role}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div>)}</div>
          : dialog === "Audit Logs" ? <div className="space-y-3">{["Alex Carter updated gym profile", "Sarah Khan updated a membership", "Daily backup completed"].map((entry, index) => <div key={entry} className="flex gap-3 border-b border-border pb-3 text-xs"><Clock className="size-4 text-muted-foreground" /><span className="flex-1">{entry}</span><span className="text-muted-foreground">{index + 1}h ago</span></div>)}</div>
          : admins.some(admin => admin.name === dialog) ? <div className="space-y-4"><Field label="Role" value={admins.find(admin => admin.name === dialog)?.role ?? "Admin"} options={["Owner", "Admin", "Manager"]} /><Button onClick={previewNotice}>Update Role</Button></div>
          : <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{dialog === "Gym Photo" ? "Gym photo uploads will be available when storage is connected." : dialog === "Export Data" ? "Data exports will be available when live gym data is connected." : "Backup restoration will be available when backup storage is connected."}</div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}
