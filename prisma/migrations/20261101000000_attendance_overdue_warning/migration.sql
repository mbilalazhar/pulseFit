ALTER TABLE "Attendance" ADD COLUMN "overdueAcknowledgedAt" TIMESTAMP(3);

CREATE INDEX "Attendance_open_checkInAt_idx" ON "Attendance" ("checkInAt") WHERE "checkOutAt" IS NULL;
