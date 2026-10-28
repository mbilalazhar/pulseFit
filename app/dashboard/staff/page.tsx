"use client"

import { useState } from "react"
import { Search, UsersRound, UserCheck, Clock, BriefcaseBusiness } from "lucide-react"
import { Metric, Avatar } from "../overview/overview-ui"
import { Badge, tableClass } from "../reports/report-ui"

const staff = [
  { name: "Sarah Khan", initials: "SK", role: "Gym Manager", department: "Management", shift: "08:00 AM – 04:00 PM", status: "On duty", email: "sarah@corefitgym.com" },
  { name: "Ali Raza", initials: "AR", role: "Head Trainer", department: "Training", shift: "06:00 AM – 02:00 PM", status: "On duty", email: "ali@corefitgym.com" },
  { name: "Fatima Noor", initials: "FN", role: "Front Desk Officer", department: "Reception", shift: "08:00 AM – 04:00 PM", status: "On duty", email: "fatima@corefitgym.com" },
  { name: "Hassan Ali", initials: "HA", role: "Janitor", department: "Housekeeping", shift: "06:00 AM – 02:00 PM", status: "On duty", email: "hassan@corefitgym.com" },
  { name: "Usman Ahmed", initials: "UA", role: "Security Guard", department: "Security", shift: "02:00 PM – 10:00 PM", status: "Off duty", email: "usman@corefitgym.com" },
  { name: "Zara Malik", initials: "ZM", role: "Sauna Attendant", department: "Wellness", shift: "10:00 AM – 06:00 PM", status: "On duty", email: "zara@corefitgym.com" },
  { name: "Omar Farooq", initials: "OF", role: "Maintenance Technician", department: "Maintenance", shift: "09:00 AM – 05:00 PM", status: "On leave", email: "omar@corefitgym.com" },
  { name: "Ayesha Noor", initials: "AN", role: "Massage Therapist", department: "Wellness", shift: "02:00 PM – 10:00 PM", status: "Off duty", email: "ayesha@corefitgym.com" },
]
export default function StaffPage() {
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState("All departments")
  const departments = [...new Set(staff.map(person => person.department))]
  const filtered = staff.filter(person => (department === "All departments" || department === person.department) && `${person.name} ${person.role} ${person.email}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="mx-auto max-w-[1600px] space-y-5"><header><h1 className="text-2xl font-bold tracking-tight">Staff</h1><p className="mt-1 text-xs text-muted-foreground">Your whole gym team, from managers and trainers to housekeeping, security, and wellness.</p></header><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={UsersRound} title="Total Staff" value={String(staff.length)} detail="Across every gym department" /><Metric icon={UserCheck} title="On Duty" value={String(staff.filter(person => person.status === "On duty").length)} detail="Working today" tone="green" /><Metric icon={Clock} title="On Leave" value="1" detail="Scheduled time away" tone="amber" /><Metric icon={BriefcaseBusiness} title="Departments" value={String(departments.length)} detail="One connected team" tone="blue" /></div>
    <section className="rounded-xl border border-border bg-card p-4"><div className="mb-5 flex flex-wrap justify-between gap-3"><label data-slot="input-group" className="flex min-w-60 items-center gap-2 rounded-lg border border-border px-3"><Search className="size-4 text-muted-foreground" /><input aria-label="Search staff" placeholder="Search name, role, or email…" value={query} onChange={event => setQuery(event.target.value)} className="h-9 w-full bg-transparent text-xs outline-none" /></label><select aria-label="Filter by department" value={department} onChange={event => setDepartment(event.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-xs">{["All departments", ...departments].map(item => <option key={item}>{item}</option>)}</select></div><div className="overflow-x-auto"><table className={tableClass}><thead><tr>{["Staff Member", "Role", "Department", "Shift", "Status"].map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>{filtered.map(person => <tr key={person.email}><td><div className="flex items-center gap-3"><Avatar initials={person.initials} tone="blue" /><div><p className="font-medium">{person.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{person.email}</p></div></div></td><td>{person.role}</td><td className="text-muted-foreground">{person.department}</td><td>{person.shift}</td><td><Badge tone={person.status === "On duty" ? "green" : person.status === "On leave" ? "amber" : "neutral"}>{person.status}</Badge></td></tr>)}{!filtered.length && <tr><td colSpan={5} className="text-center text-muted-foreground">No staff match your search.</td></tr>}</tbody></table></div></section><p className="text-[10px] text-muted-foreground">Static preview with sample staff records.</p></div>
}
