import { CircleCheck, Pencil } from "lucide-react"
import { NOT_TRACKED, type TrainerDetail } from "./trainer-detail-logic"

function Panel({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col rounded-2xl border bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

/* No edit flow exists yet, so these are placeholders matching the design. */
function EditButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Pencil className="size-3.5" />
      Edit
    </button>
  )
}

export function AboutPanels({ trainer }: { trainer: TrainerDetail }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* About — no edit control, by request. */}
      <Panel title="About Trainer">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {trainer.bio?.trim() || "No bio has been added for this trainer yet."}
        </p>
      </Panel>

      <Panel title="Tags & Specialties" action={<EditButton label="Edit specialties" />}>
        {trainer.specializations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trainer.specializations.map((spec) => (
              <span
                key={spec.id}
                className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
              >
                {spec.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No specialties added yet.</p>
        )}
      </Panel>

      <Panel title="Certifications" action={<EditButton label="Edit certifications" />}>
        {trainer.certifications.length > 0 ? (
          <ul className="space-y-2.5">
            {trainer.certifications.map((cert) => (
              <li key={cert} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <CircleCheck className="size-4 shrink-0 text-success" />
                  <span className="truncate text-muted-foreground">{cert}</span>
                </span>
                {/* Certifications are stored as plain names — no year on record. */}
                <span className="shrink-0 text-xs text-muted-foreground">{NOT_TRACKED}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No certifications added yet.</p>
        )}
      </Panel>
    </div>
  )
}
