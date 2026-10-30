"use client"

import { CalendarClock, Clock3, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UnallocatedTrainerMember } from "@/lib/trainer-unallocated-members"

export function UnallocatedMembers({ members, onAllocate }: { members: UnallocatedTrainerMember[]; onAllocate: (member: UnallocatedTrainerMember) => void }) {
  return (
    <section aria-labelledby="unallocated-members-title" className="min-w-0 overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <h2 id="unallocated-members-title" className="flex items-center gap-2 font-heading text-base font-semibold">
            <CalendarClock className="size-4 text-accent" aria-hidden="true" />
            Members Awaiting Time Allocation
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Assigned members with no upcoming scheduled sessions. Allocate each member&apos;s full weekly allowance together.
          </p>
        </div>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border-t px-5 py-8 text-center">
          <Users className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">No members awaiting time allocation.</p>
          <p className="text-xs text-muted-foreground">Assigned members without scheduled sessions will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Assigned members without session times, their full weekly session allowance and allowed session length.</caption>
            <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3 text-left font-medium">Member</th>
                <th scope="col" className="px-5 py-3 text-left font-medium">Membership Plan</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 text-left font-medium">Sessions to Allocate</th>
                <th scope="col" className="whitespace-nowrap px-5 py-3 text-left font-medium">Allowed Session Length</th>
                <th scope="col" className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => (
                <tr key={member.id}>
                  <th scope="row" className="px-5 py-4 text-left font-normal">
                    <p className="font-medium">{member.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{member.email || member.phone}</p>
                  </th>
                  <td className="px-5 py-4 text-muted-foreground">{member.planName ?? "No current membership"}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {member.sessionsPerWeek == null ? <span className="text-xs text-muted-foreground">Not configured</span> : (
                      <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                        {member.sessionsPerWeek} {member.sessionsPerWeek === 1 ? "session" : "sessions"} / week
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {member.sessionDurationMinutes == null ? <span className="text-xs text-muted-foreground">Not configured</span> : (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        {member.sessionDurationMinutes} {member.sessionDurationMinutes === 1 ? "minute" : "minutes"} / session
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button type="button" variant="outline" onClick={() => onAllocate(member)} aria-label={`Assign sessions to ${member.name}`}><CalendarClock className="size-3.5" />Assign sessions</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
