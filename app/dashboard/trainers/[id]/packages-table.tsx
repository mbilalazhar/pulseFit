import { ArrowRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  formatMinutes,
  formatPkr,
  NOT_TRACKED,
  type TrainerDetail,
} from "./trainer-detail-logic"

const TYPE_BADGE: Record<TrainerDetail["packages"][number]["type"], string> = {
  TRAINING: "bg-blue-100 text-blue-700",
  CONSULTATION: "bg-green-100 text-green-700",
}

const TYPE_LABEL: Record<TrainerDetail["packages"][number]["type"], string> = {
  TRAINING: "Training",
  CONSULTATION: "Consultation",
}

const ROW_GRID =
  "grid items-center gap-3 grid-cols-[minmax(120px,2fr)_minmax(90px,1fr)_minmax(60px,0.8fr)_minmax(80px,1fr)_minmax(60px,0.7fr)]"

export function PackagesTable({ trainer }: { trainer: TrainerDetail }) {
  const { packages } = trainer

  return (
    <section className="flex flex-col rounded-2xl border bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold">Trainer Packages</h3>
        {/* No package creation flow yet — placeholder for the design. */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add Package
        </button>
      </div>

      {packages.length > 0 ? (
        <>
          <div
            className={cn(
              ROW_GRID,
              "border-b px-1 pb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
            )}
          >
            <span>Package</span>
            <span>Type</span>
            <span>Duration</span>
            <span>Price</span>
            <span>Bookings</span>
          </div>

          <div className="divide-y">
            {packages.map((pkg) => (
              <div key={pkg.id} className={cn(ROW_GRID, "px-1 py-3 text-sm")}>
                <span className="truncate font-medium text-foreground">{pkg.name}</span>
                <span>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                      TYPE_BADGE[pkg.type],
                    )}
                  >
                    {TYPE_LABEL[pkg.type]}
                  </span>
                </span>
                <span className="text-muted-foreground">{formatMinutes(pkg.duration)}</span>
                <span className="text-foreground">{formatPkr(pkg.price)}</span>
                {/* Bookings need a session model that does not exist yet. */}
                <span className="text-muted-foreground">{NOT_TRACKED}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-medium text-accent transition-opacity hover:opacity-80"
          >
            View All Packages
            <ArrowRight className="size-3.5" />
          </button>
        </>
      ) : (
        <p className="flex flex-1 items-center justify-center px-4 py-10 text-center text-sm text-muted-foreground">
          No packages added for this trainer yet.
        </p>
      )}
    </section>
  )
}
