import { leaveRequestsData } from "./data"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export function LeaveRequests() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-4">
        <h3 className="font-semibold text-foreground">Leave Requests</h3>
        <button type="button" className="text-sm text-accent hover:underline">
          View All
        </button>
      </div>

      {/* Requests */}
      <div className="divide-y">
        {leaveRequestsData.map((request) => (
          <div key={request.id} className="space-y-3 px-4 py-4">
            {/* Trainer */}
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{request.trainerName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{request.leaveDetail}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  request.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {request.status}
              </span>
            </div>

            {/* Actions */}
            {request.status === "Pending" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  Decline
                </Button>
                <Button size="sm" className="flex-1 text-xs">
                  Approve
                </Button>
              </div>
            ) : null}

            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
