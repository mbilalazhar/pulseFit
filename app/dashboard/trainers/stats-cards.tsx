import { getTrainerStats } from "./data"

export function StatsCards() {
  const stats = getTrainerStats()

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {/* Total Trainers */}
      <div className="min-h-28 min-w-0 rounded-xl border border-border/80 bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Total Trainers
        </p>
        <div className="mt-1 flex flex-col items-start gap-2">
          <span className="text-2xl font-bold leading-none tracking-tight text-foreground">{stats.totalTrainers}</span>
          <span className="text-[11px] text-green-600 dark:text-green-400">↑ 12.5%</span>
        </div>
      </div>

      {/* Active */}
      <div className="min-h-28 min-w-0 rounded-xl border border-border/80 bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">Active</p>
        <div className="mt-1 flex flex-col items-start gap-2">
          <span className="text-2xl font-bold leading-none tracking-tight text-foreground">{stats.activeTrainers}</span>
          <span className="text-[11px] text-muted-foreground">{stats.activePercent}% of total</span>
        </div>
      </div>

      {/* On Leave */}
      <div className="min-h-28 min-w-0 rounded-xl border border-border/80 bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">
          On Leave
        </p>
        <div className="mt-1 flex flex-col items-start gap-2">
          <span className="text-2xl font-bold leading-none tracking-tight text-foreground">{stats.onLeaveTrainers}</span>
          <span className="text-[11px] text-muted-foreground">{stats.onLeavePercent}% of total</span>
        </div>
      </div>

      {/* Applied Leave */}
      <div className="min-h-28 min-w-0 rounded-xl border border-border/80 bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Applied Leave
        </p>
        <div className="mt-1 flex flex-col items-start gap-2">
          <span className="text-2xl font-bold leading-none tracking-tight text-blue-400">{stats.appliedLeaveTrainers}</span>
          <span className="text-[11px] text-muted-foreground">{stats.appliedLeavePercent}% of total</span>
        </div>
      </div>

      {/* Total Members Handled */}
      <div className="min-h-28 min-w-0 rounded-xl border border-border/80 bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Total Members Handled
        </p>
        <div className="mt-1 flex flex-col items-start gap-2">
          <span className="text-2xl font-bold leading-none tracking-tight text-foreground">{stats.totalMembers}</span>
          <span className="text-[11px] text-green-600 dark:text-green-400">↑ 8.4%</span>
        </div>
      </div>
    </div>
  )
}
