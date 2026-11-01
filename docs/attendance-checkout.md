# Attendance checkout

Open visits trigger an attendance-page warning after three hours. “Mark exit”
records the current time; “Leave as they are” saves the acknowledgement for that
visit, shared across administrators and page reloads. Acknowledgement does not
extend the six-hour limit. All visits still open at six hours automatically close.

Apply migrations with `npx prisma migrate deploy`, then run `npx prisma generate`
and restart the application.

On a continuously running Node server (`npm run dev` / `npm start`), Next.js
instrumentation starts an immediate sweep followed by a sweep every 15 seconds.
The attendance API also reconciles overdue visits before reads and actions.
The page refreshes every 15 seconds. The persisted exit time is always check-in
plus exactly six hours (duration 360 minutes), even if processing happens later.
Manual exits are never overwritten. This also handles overnight visits and
catch-up after a server restart.

For serverless hosting, background timers may stop when there are no requests.
Configure an external scheduler to call `GET /api/cron/attendance` every minute
with `Authorization: Bearer <CRON_SECRET>`, and set the same `CRON_SECRET` on the
application. This endpoint is disabled without a secret. Without a running
server or configured scheduler, overdue visits are reconciled on the next
attendance request. Concurrent sweeps are safe.
