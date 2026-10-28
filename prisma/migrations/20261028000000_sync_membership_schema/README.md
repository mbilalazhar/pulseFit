# Latest schema migration

This migration brings the existing migration history up to the current Prisma schema. Plan facilities and custom benefits use the existing `PlanFeature.label` records; daily access uses the existing `Plan.maxHoursPerDay` field.

The SQL preserves subscription totals, converts trainer/package prices from major to minor units, copies trainer assignments, links payments, and fills subscription snapshots and durations before removing the redundant member columns. Gym subscription prices already use minor units and are only renamed. Existing daily/open-visit attendance uniqueness is retained.

The migration is transactional. It stops if a legacy payment has zero or multiple possible subscriptions, a subscription has a non-monthly date range, or legacy membership fields do not match a subscription. Resolve those records with an explicit data mapping before deploying; the migration deliberately does not guess historical billing relationships.

The migration has been tested locally against empty and populated databases using `node --test prisma/migrations.test.mjs`. It has not been applied to the configured database.

Apply the reviewed migration with `npx prisma migrate deploy`, then regenerate with `npx prisma generate` before starting the updated application.
