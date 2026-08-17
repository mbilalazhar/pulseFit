import { Layers } from "lucide-react"
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
        <Layers className="size-7" />
      </span>

      <h2 className="mt-5 font-heading text-lg font-semibold">
        No subscription plans yet
      </h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        You haven&apos;t added any subscription plans for your gym. Add your
        first plan now so your members can subscribe and purchase the
        memberships you offer.
      </p>
    </div>
  )
}
