"use client"

import { useState, type FormEvent } from "react"
import { NotebookPen, ListTodo, Megaphone, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type Entry = { id: number; title: string; text: string; type: string; audience: string; done: boolean }
const initialEntries: Entry[] = [
  { id: 1, type: "Notes", title: "Ideas for next month", text: "Introduce a beginner strength class and review weekend sauna hours.", audience: "Admins", done: false },
  { id: 2, type: "Tasks", title: "Check treadmill maintenance", text: "Review the service schedule with the maintenance team before Friday.", audience: "Staff", done: false },
  { id: 3, type: "Tasks", title: "Prepare the weekly staff rota", text: "Confirm reception and security coverage for the weekend.", audience: "Staff", done: true },
  { id: 4, type: "Announcements", title: "Gym closure for a team event", text: "The gym will be closed on October 25 for our annual team event. Regular hours resume on October 26. Thank you for your understanding!", audience: "All members & staff", done: false },
]
const fieldClass = "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
export default function WorkspacePage() {
  const [entries, setEntries] = useState(initialEntries)
  const [tab, setTab] = useState("Notes")
  const [open, setOpen] = useState(false)
  const filtered = entries.filter(entry => entry.type === tab)
  function createEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get("title") ?? "").trim()
    const text = String(data.get("text") ?? "").trim()
    if (!title || !text) return
    setEntries(current => [...current, { id: Math.max(0, ...current.map(entry => entry.id)) + 1, title, text, type: tab, audience: String(data.get("audience") ?? "Admins"), done: false }])
    setOpen(false)
  }
  return <div className="mx-auto max-w-6xl space-y-5"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">Workspace</h1><p className="mt-1 text-xs text-muted-foreground">A shared place for gym notes, team tasks, and member announcements.</p></div><DashboardHeaderButton icon={Plus} text={tab === "Notes" ? "Create Note" : tab === "Tasks" ? "Create Task" : "Draft Announcement"} bgColor="primary" aria-haspopup="dialog" onClick={() => setOpen(true)} /></header>
    <div className="flex flex-wrap gap-2 border-b border-border pb-3">{[{ label: "Notes", icon: NotebookPen }, { label: "Tasks", icon: ListTodo }, { label: "Announcements", icon: Megaphone }].map(({ label, icon: Icon }) => <button type="button" key={label} aria-pressed={tab === label} onClick={() => setTab(label)} className={cn("flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium", tab === label ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted")}><Icon className="size-4" />{label}<span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{entries.filter(entry => entry.type === label).length}</span></button>)}</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(entry => <article key={entry.id} className="flex flex-col rounded-xl border border-border bg-card p-5"><div className="flex items-start gap-2">{entry.type === "Tasks" && <input type="checkbox" aria-label={`Mark ${entry.title} complete`} checked={entry.done} onChange={() => setEntries(current => current.map(item => item.id === entry.id ? { ...item, done: !item.done } : item))} className="mt-1 size-4 accent-accent" />}<h2 className={cn("flex-1 text-sm font-semibold", entry.done && "text-muted-foreground line-through")}>{entry.title}</h2><button type="button" aria-label={`Delete ${entry.title}`} onClick={() => setEntries(current => current.filter(item => item.id !== entry.id))} className="rounded p-1 text-muted-foreground hover:bg-accent/10 hover:text-accent"><Trash2 className="size-3.5" /></button></div><p className="mt-3 flex-1 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">{entry.text}</p><div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-[10px]"><span className="text-muted-foreground">{entry.audience}</span><span className="rounded bg-accent/5 px-2 py-1 text-accent">{entry.type === "Announcements" ? "Draft · Not sent" : entry.type === "Tasks" ? entry.done ? "Completed" : "To do" : "Internal note"}</span></div></article>)}</div>
    {!filtered.length && <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No {tab.toLowerCase()} yet. Create your first one above.</div>}
    <p className="text-[10px] text-muted-foreground">Static preview. Entries reset when you leave this page. Announcement drafts do not notify users.</p>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{tab === "Notes" ? "Create a note" : tab === "Tasks" ? "Create a task" : "Draft an announcement"}</DialogTitle><DialogDescription>{tab === "Announcements" ? "Prepare a message about closures, holidays, events, or schedule changes. This preview does not send notifications." : "Add details for your team. This entry is kept in the current page preview."}</DialogDescription></DialogHeader><form onSubmit={createEntry} className="space-y-4"><label className="block text-xs font-medium">Title<input name="title" required maxLength={120} className={fieldClass} placeholder={tab === "Announcements" ? "Gym closure for an upcoming event" : "Give it a clear title"} /></label><label className="block text-xs font-medium">{tab === "Announcements" ? "Message" : "Details"}<textarea name="text" required rows={5} maxLength={3000} className={fieldClass} placeholder="Write the details here…" /></label><label className="block text-xs font-medium">{tab === "Announcements" ? "Notify audience" : "Team"}<select name="audience" className={fieldClass}>{(tab === "Announcements" ? ["All members & staff", "All members", "Staff", "Admins"] : ["Admins", "Staff", "Managers"]).map(audience => <option key={audience}>{audience}</option>)}</select></label><Button type="submit" className="w-full bg-accent text-white hover:bg-accent/90">{tab === "Announcements" ? "Save Preview Draft" : "Create in Preview"}</Button></form></DialogContent></Dialog>
  </div>
}
