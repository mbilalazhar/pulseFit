"use client"

import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMembers } from "@/lib/services/member.services"
import { MembersOverview } from "./members-overview"
import { MembersTable } from "./members-table"

export function MembersContent() {
  const query = useQuery({
    queryKey: ["members"], queryFn: getMembers,
    refetchOnMount: "always", refetchOnWindowFocus: true, refetchInterval: 60_000,
  })
  return (
    <>
      <MembersOverview stats={query.data?.stats} />
      {query.isPending ? <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading members…</p> : null}
      {query.isError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 p-4 text-sm text-rose-700 dark:text-rose-400">
          <p>{query.data ? "Could not refresh members. Showing the last loaded data." : query.error.message}</p>
          <Button type="button" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Try again</Button>
        </div>
      ) : null}
      {query.data ? <MembersTable members={query.data.members} plans={query.data.plans} /> : null}
    </>
  )
}
