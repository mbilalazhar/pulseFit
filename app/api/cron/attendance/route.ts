import { timingSafeEqual } from "node:crypto"
import { closeOverdueAttendance } from "@/lib/attendance-server"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return Response.json({ message: "Attendance scheduler is not configured" }, { status: 503 })
  const actual = Buffer.from(request.headers.get("authorization") ?? "")
  const expected = Buffer.from(`Bearer ${secret}`)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ message: "Not authenticated" }, { status: 401 })
  }
  const checkedOut = await closeOverdueAttendance()
  return Response.json({ checkedOut }, { headers: { "Cache-Control": "no-store" } })
}
