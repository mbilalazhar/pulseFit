import { closeOverdueAttendance } from "@/lib/attendance-server"

const state = globalThis as typeof globalThis & { attendanceWorkerStarted?: boolean }

export function startAttendanceWorker() {
  if (state.attendanceWorkerStarted) return
  state.attendanceWorkerStarted = true
  const sweep = async () => {
    try {
      await closeOverdueAttendance()
    } catch (error) {
      console.error("Automatic attendance checkout failed:", error)
    } finally {
      // Schedule after completion to avoid overlapping sweeps on a slow database.
      setTimeout(() => void sweep(), 15_000).unref()
    }
  }
  void sweep()
}
