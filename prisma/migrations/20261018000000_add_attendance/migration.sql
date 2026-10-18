CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "attendanceDate" DATE NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Attendance_memberId_attendanceDate_key" ON "Attendance"("memberId", "attendanceDate");
-- Also prevent a new visit while a previous day's visit is still open.
CREATE UNIQUE INDEX "Attendance_member_open_key" ON "Attendance"("memberId") WHERE "checkOutAt" IS NULL;
CREATE INDEX "Attendance_gymId_attendanceDate_idx" ON "Attendance"("gymId", "attendanceDate");
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
