import type { AttendanceData } from "@/lib/attendance"

export type AttendanceAction = { action: "present"; memberId: string } | { action: "left"; attendanceId: string }

async function read<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message ?? "Could not load attendance. Please try again.")
  return data as T
}
export async function getAttendance(date?: string) {
  return read<AttendanceData>(await fetch(`/api/attendance${date ? `?date=${encodeURIComponent(date)}` : ""}`, { cache: "no-store" }))
}
export async function markAttendance(action: AttendanceAction) {
  return read<{ message: string }>(await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) }))
}
