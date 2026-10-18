import { AttendanceContent } from "./attendance-content"

export default function AttendancePage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">Track daily check-ins, monitor member presence, and review attendance across your gym.</p>
      </header>
      <AttendanceContent />
    </div>
  )
}
