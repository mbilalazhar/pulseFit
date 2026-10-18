"use client"

import { useState } from "react"
import Image from "next/image"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BarChart3, CalendarDays, Check, CircleCheck, Clock3, Flame, Lightbulb, Loader2, LogOut, Search, TrendingUp, Users } from "lucide-react"
import defaultAvatar from "@/assets/User_Default.png"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getAttendance, markAttendance } from "@/lib/services/attendance.services"
import type { AttendanceRow } from "@/lib/attendance"
import { AttendanceOverview, PeakHours } from "./attendance-charts"

const tabs = ["Present", "Checked Out", "Absent"] as const
const badge = { Present: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400", "Checked Out": "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400", Absent: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" }
const elapsed = (start: string | null, end: string | null, now: number) => {
  if (!start) return "—"
  const minutes = Math.max(0, Math.floor(((end ? new Date(end).getTime() : now) - new Date(start).getTime()) / 60000))
  return `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ""}${minutes % 60}m`
}

export function AttendanceContent() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState("")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<(typeof tabs)[number]>("Present")
  const [message, setMessage] = useState("")
  const query = useQuery({ queryKey: ["attendance", date], queryFn: () => getAttendance(date || undefined), refetchInterval: 30_000, refetchOnWindowFocus: true })
  const mutation = useMutation({
    mutationFn: markAttendance,
    retry: false,
    onSuccess: async (result, action) => {
      setMessage(result.message)
      if (action.action === "present") { setSearch(""); setDate(""); setTab("Present") }
      await queryClient.invalidateQueries({ queryKey: ["attendance"] })
    },
    onError: () => { void queryClient.invalidateQueries({ queryKey: ["attendance"] }) },
  })
  const data = query.data
  const time = (value: string | null) => value && data ? new Date(value).toLocaleTimeString("en-US", { timeZone: data.timeZone, hour: "2-digit", minute: "2-digit" }) : "—"
  const markLeft = (row: AttendanceRow) => { if (row.attendanceId) mutation.mutate({ action: "left", attendanceId: row.attendanceId }) }
  const term = search.trim().toLowerCase()
  const results = data?.members.filter((member) => `${member.name} ${member.email ?? ""} ${member.phone}`.toLowerCase().includes(term)) ?? []

  if (!data) return query.isError ? (
    <div role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/50 p-4 text-sm text-rose-700 dark:text-rose-400">{query.error.message}<Button type="button" variant="outline" className="ml-3" onClick={() => void query.refetch()}>Try again</Button></div>
  ) : <p role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading attendance…</p>

  const cards = [
    { label: data.date === data.today ? "Present Today" : "Checked In", value: data.summary.present, icon: Users, tone: "bg-rose-50 dark:bg-rose-950/50 text-rose-500", note: "Members checked in on this date" },
    { label: "Checked Out", value: data.summary.checkedOut, icon: CircleCheck, tone: "bg-blue-50 dark:bg-blue-950/50 text-blue-500", note: "Visits completed" },
    { label: "Currently Inside", value: data.summary.inside, icon: Clock3, tone: "bg-orange-50 dark:bg-orange-950/50 text-orange-500", note: "Visits awaiting check-out" },
    { label: "Attendance Rate", value: `${data.summary.rate}%`, icon: TrendingUp, tone: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500", note: "Of eligible members on this date" },
  ]
  const rows = data.rows.filter((row) => row.status === tab)
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone, note }) => <section key={label} className="flex min-h-28 items-start gap-3 rounded-xl border border-border/80 bg-card p-4">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", tone)}><Icon className="size-5" strokeWidth={1.8} /></span>
          <div><h2 className="text-xs font-medium text-muted-foreground">{label}</h2><p className="mt-1 text-2xl font-bold leading-none tracking-tight">{value}</p><p className="mt-2 text-[11px] text-muted-foreground">{note}</p></div>
        </section>)}
      </div>

      <div className="grid items-stretch gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,1.1fr)_minmax(200px,.75fr)]">
        <AttendanceOverview data={data} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-xl border border-border/80 bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold"><span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_#ecfdf5]" />{data.date === data.today ? "Live Check-ins" : "Recent Check-ins"}</h2>
            <div className="mt-3 divide-y divide-border">
              {data.live.map((row) => <div key={row.memberId} className="flex items-center gap-2 py-2">
                <Image src={defaultAvatar} alt="" width={26} height={26} className="size-[26px] rounded-full object-cover" />
                <p className="min-w-0 flex-1 truncate text-[11px] font-medium">{row.name}</p>
                <span className="text-[10px] text-muted-foreground">{time(row.checkInAt)}</span>
                <span title={row.status} className={cn("size-1.5 rounded-full", row.status === "Present" ? "bg-emerald-500" : "bg-blue-400")} />
              </div>)}
              {!data.live.length ? <p className="py-8 text-center text-xs text-muted-foreground">No check-ins yet.</p> : null}
            </div>
          </section>
          <PeakHours data={data} />
        </div>
        <aside className="rounded-xl border border-border/80 bg-card p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Lightbulb className="size-4 text-rose-500" />Attendance Insights</h2>
          <div className="mt-5 space-y-5 text-xs leading-relaxed text-muted-foreground">
            <p className="flex gap-3"><Users className="mt-0.5 size-4 shrink-0" /><span><strong className="font-semibold text-foreground">{data.summary.inside} {data.summary.inside === 1 ? "member" : "members"}</strong> still need to be marked as left.</span></p>
            <p className="flex gap-3"><LogOut className="mt-0.5 size-4 shrink-0" /><span>Check-out time is recorded when you confirm a member has left.</span></p>
            <p className="flex gap-3"><Flame className="mt-0.5 size-4 shrink-0" /><span>Attendance streaks count consecutive days with a check-in.</span></p>
            <p className="flex gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0" /><span>Use the date selector to review earlier attendance.</span></p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="member-check-in-title" className="rounded-xl border border-border/80 bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 id="member-check-in-title" className="text-sm font-bold">Check in a member</h2><p className="mt-1 text-xs text-muted-foreground">Search your gym&apos;s members and mark them present for today. One check-in per member each day.</p></div>
          <div className="relative w-full sm:max-w-md"><Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input type="search" aria-label="Search members to mark present" placeholder="Search by name, email or phone…" value={search} onChange={(event) => { setSearch(event.target.value); setMessage("") }} className="h-10 w-full rounded-full border border-border bg-muted/70 pl-10 pr-4 text-xs outline-none placeholder:text-muted-foreground focus:border-rose-400 focus:ring-2 focus:ring-rose-100" /></div>
        </div>
        {term ? <div className="mt-3 max-h-72 divide-y divide-border overflow-y-auto border-t border-border">
          {results.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-3 py-3">
            <Image src={defaultAvatar} alt="" width={34} height={34} className="size-[34px] rounded-full object-cover" />
            <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.email || member.phone}{member.plan ? ` · ${member.plan}` : ""}</p></div>
            {member.state === "Present" ? <div className="flex items-center gap-3"><span className="text-xs text-emerald-600 dark:text-emerald-400">Present</span><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => { if (member.attendanceId) mutation.mutate({ action: "left", attendanceId: member.attendanceId }) }} className="h-8 gap-1.5 px-3 text-xs"><LogOut className="size-3.5" />Mark Left</Button></div> : member.state === "Checked Out" ? <span className="text-xs text-blue-600 dark:text-blue-400">Checked out today</span> : !member.eligible ? <span className="text-xs text-muted-foreground">Membership inactive</span> : <Button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "present", memberId: member.id })} className="h-8 gap-1.5 bg-primary px-3 text-xs text-primary-foreground hover:bg-primary/90"><Check className="size-3.5" />Mark Present</Button>}
          </div>)}
          {!results.length ? <p className="py-5 text-center text-xs text-muted-foreground">No members match your search.</p> : null}
        </div> : null}
        {message ? <p role="status" className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{message}</p> : null}
        {mutation.isError ? <p role="alert" className="mt-3 text-xs text-rose-600 dark:text-rose-400">{mutation.error.message}</p> : null}
      </section>

      <section aria-labelledby="member-attendance-title" className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border/80">
          <h2 id="member-attendance-title" className="flex items-center gap-2 text-sm font-bold"><BarChart3 className="size-4 text-rose-500" />Member Attendance</h2>
          <div className="flex gap-1">{tabs.map((value) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={cn("whitespace-nowrap border-b-2 px-3 py-3 text-xs transition-colors", tab === value ? "border-rose-500 font-semibold text-rose-600 dark:text-rose-400" : "border-transparent text-muted-foreground hover:text-foreground")}>{value} ({data.rows.filter((row) => row.status === value).length})</button>)}</div>
          <label className="mb-1 flex items-center gap-2 sm:ml-auto"><CalendarDays className="size-3.5 text-muted-foreground" /><span className="sr-only">Attendance date</span><input type="date" min="1900-01-01" max={data.today} value={data.date} onChange={(event) => setDate(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-xs outline-none focus:border-rose-400" /></label>
        </div>
        {query.isError ? <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">Could not refresh attendance. <button type="button" onClick={() => void query.refetch()} className="underline">Try again</button></p> : null}
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full min-w-[900px] border-separate border-spacing-x-0 border-spacing-y-1 text-left">
            <caption className="sr-only">Member attendance on {data.date}</caption>
            <thead><tr className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{["Member", "Membership / Plan", "Check-in", "Check-out", "Duration", "Status", "Attendance Streak", "Actions"].map((label) => <th key={label} scope="col" className="px-4 pb-1.5 font-medium">{label}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.memberId} className="transition-colors hover:bg-muted/80">
              <td className="px-4 py-4"><div className="flex items-center gap-3"><Image src={defaultAvatar} alt="" width={38} height={38} className="size-[38px] rounded-full object-cover" /><div><p className="text-[13px] font-semibold">{row.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{row.email || row.phone}</p></div></div></td>
              <td className="px-4 py-4 text-xs"><span className="rounded-md bg-violet-50 dark:bg-violet-950/50 px-2 py-1 text-violet-600 dark:text-violet-400">{row.plan ?? "No plan"}</span></td>
              <td className="whitespace-nowrap px-4 py-4 text-xs text-foreground/80">{time(row.checkInAt)}</td>
              <td className="whitespace-nowrap px-4 py-4 text-xs text-foreground/80">{time(row.checkOutAt)}</td>
              <td className="whitespace-nowrap px-4 py-4 text-xs text-foreground/80">{elapsed(row.checkInAt, row.checkOutAt, query.dataUpdatedAt)}</td>
              <td className="px-4 py-4"><span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", badge[row.status])}>{row.status}</span></td>
              <td className="px-4 py-4"><span className="flex items-center gap-1.5 whitespace-nowrap text-xs"><Flame className={cn("size-3.5", row.streak ? "text-orange-500" : "text-muted-foreground")} />{row.streak} {row.streak === 1 ? "day" : "days"}</span></td>
              <td className="px-4 py-4">{row.status === "Present" ? <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => markLeft(row)} className="h-8 gap-1.5 whitespace-nowrap px-3 text-xs"><LogOut className="size-3.5" />Mark Left</Button> : <span className="text-xs text-muted-foreground">—</span>}</td>
            </tr>)}
            {!rows.length ? <tr><td colSpan={8} className="rounded-xl border border-dashed py-10 text-center"><p className="text-sm font-medium">No {tab === "Present" ? "members currently present" : tab === "Checked Out" ? "check-outs recorded" : "absent members"}</p><p className="mt-1 text-xs text-muted-foreground">{tab === "Present" && data.date === data.today ? "Search for a member above to mark them present." : "Attendance will appear here for the selected date."}</p></td></tr> : null}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">Showing {rows.length} {tab.toLowerCase()} {rows.length === 1 ? "member" : "members"} · Times in {data.timeZone}</p>
      </section>
    </>
  )
}
