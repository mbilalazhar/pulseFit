import { getTrainerStats } from "./data"

export function StatsCards() {
  const stats = getTrainerStats()

  return (
    <div className="flex divide-x divide-border rounded-2xl border bg-[#F6FAFE] overflow-hidden">
      {/* Total Trainers */}
      <div className="flex-1 px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Total Trainers
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{stats.totalTrainers}</span>
          <span className="text-xs text-green-600">↑ 12.5%</span>
        </div>
      </div>

      {/* Active */}
      <div className="flex-1 px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{stats.activeTrainers}</span>
          <span className="text-xs text-muted-foreground">{stats.activePercent}% of total</span>
        </div>
      </div>

      {/* On Leave */}
      <div className="flex-1 px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          On Leave
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">{stats.onLeaveTrainers}</span>
          <span className="text-xs text-muted-foreground">{stats.onLeavePercent}% of total</span>
        </div>
      </div>

      {/* Applied Leave */}
      <div className="flex-1 px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Applied Leave
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-blue-400">{stats.appliedLeaveTrainers}</span>
          <span className="text-xs text-muted-foreground">{stats.appliedLeavePercent}% of total</span>
        </div>
      </div>

      {/* Total Members Handled */}
      <div className="flex-1 px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Total Members Handled
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{stats.totalMembers}</span>
          <span className="text-xs text-green-600">↑ 8.4%</span>
        </div>
      </div>
    </div>
  )
}
