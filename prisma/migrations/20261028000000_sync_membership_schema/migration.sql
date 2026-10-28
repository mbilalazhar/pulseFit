-- Synchronize the latest schema while retaining existing amounts and relationships.
-- Run transactionally: a failed preflight or constraint rolls back all changes.
BEGIN;

-- CreateEnum
CREATE TYPE "MemberPaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('PAYMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('FAT_LOSS', 'LEAN_MUSCLE', 'ENDURANCE', 'CONSISTENCY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAST_DUE';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'CANCELED';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANAGER';

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_planId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_memberId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_planId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_trainerId_fkey";

-- DropIndex
DROP INDEX "MemberSubscription_gymId_memberId_idx";

-- DropIndex
DROP INDEX "Member_planId_idx";

-- DropIndex
DROP INDEX "Member_trainerId_idx";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "MemberSubscription" ADD COLUMN     "durationMonths" INTEGER,
ADD COLUMN     "finalMinor" INTEGER,
ADD COLUMN     "paymentDueDate" DATE,
ADD COLUMN     "paymentStatus" "MemberPaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "planNameSnapshot" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "kind" "PaymentKind" NOT NULL DEFAULT 'PAYMENT',
ADD COLUMN     "memberSubscriptionId" TEXT,
ADD COLUMN     "recordedByUserId" TEXT,
ADD COLUMN     "reference" TEXT;

-- Retain unrecognized free-text methods in the reference before converting the enum.
UPDATE "Payment" SET "reference" = 'Legacy payment method: ' || "method"
WHERE lower("method") NOT IN ('cash', 'card', 'bank_transfer', 'online', 'other');
ALTER TABLE "Payment" ALTER COLUMN "method" TYPE "PaymentMethod" USING (
  CASE lower("method")
    WHEN 'cash' THEN 'CASH' WHEN 'card' THEN 'CARD'
    WHEN 'bank_transfer' THEN 'BANK_TRANSFER'
    WHEN 'upi' THEN 'ONLINE' WHEN 'mobile_wallet' THEN 'ONLINE'
    WHEN 'online' THEN 'ONLINE' ELSE 'OTHER'
  END::"PaymentMethod"
);

-- Existing gym subscription prices are already minor units; only rename them.
ALTER TABLE "GymSubscription" RENAME COLUMN "price" TO "priceMinor";

-- Trainer/package amounts were major-unit floats; convert rather than drop values.
ALTER TABLE "Trainer" RENAME COLUMN "monthlySalary" TO "monthlySalaryMinor";
ALTER TABLE "Trainer"
  ALTER COLUMN "monthlySalaryMinor" TYPE INTEGER USING round("monthlySalaryMinor"::numeric * 100)::integer,
  ALTER COLUMN "fixedFeeAmount" TYPE INTEGER USING round("fixedFeeAmount"::numeric * 100)::integer,
  ALTER COLUMN "sessionRate" TYPE INTEGER USING round("sessionRate"::numeric * 100)::integer,
  ADD COLUMN "userId" TEXT;
ALTER TABLE "TrainingPackage" RENAME COLUMN "price" TO "priceMinor";
ALTER TABLE "TrainingPackage" ALTER COLUMN "priceMinor" TYPE INTEGER USING round("priceMinor"::numeric * 100)::integer;
ALTER TABLE "Member" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL,
    "weightKg" DECIMAL(5,2),
    "bodyFatPct" DECIMAL(4,1),
    "muscleMassKg" DECIMAL(5,2),

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberGoal" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "description" TEXT,
    "achievedAt" TIMESTAMP(3),

    CONSTRAINT "MemberGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberNote" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberTrainerAssignment" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "MemberTrainerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainerAvailability" (
    "id" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,

    CONSTRAINT "TrainerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- Recover subscription duration from its actual dates (same month-end rule as the app).
UPDATE "MemberSubscription" s SET
  "durationMonths" = (
    SELECT months FROM generate_series(1, 1200) AS months
    WHERE (s."startDate"::date + make_interval(months => months) - interval '1 day')::date = s."endDate"::date
    LIMIT 1
  ),
  "planNameSnapshot" = p."name",
  "finalMinor" = s."priceMinor",
  "priceMinor" = s."priceMinor" + s."discountMinor"
FROM "Plan" p WHERE p."id" = s."planId" AND p."gymId" = s."gymId";

-- Do not guess which purchase an old payment belongs to. Ambiguous accounts must
-- be reconciled explicitly before deploying this migration.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM "Payment" p WHERE
      (SELECT count(*) FROM "MemberSubscription" s WHERE s."memberId" = p."memberId" AND s."gymId" = p."gymId") <> 1
  ) THEN
    RAISE EXCEPTION 'Migration stopped: legacy payments need exactly one matching subscription. Reconcile ambiguous or unlinked payments before migrating.';
  END IF;
  IF EXISTS (SELECT 1 FROM "MemberSubscription" WHERE "durationMonths" IS NULL OR "planNameSnapshot" IS NULL) THEN
    RAISE EXCEPTION 'Migration stopped: a subscription has an invalid plan or a non-monthly date range. Reconcile its duration before migrating.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Member" m WHERE
      (m."planId" IS NOT NULL OR m."startDate" IS NOT NULL OR m."durationMonths" IS NOT NULL)
      AND NOT EXISTS (
        SELECT 1 FROM "MemberSubscription" s WHERE s."memberId" = m."id" AND s."gymId" = m."gymId"
        AND (m."planId" IS NULL OR s."planId" = m."planId")
        AND (m."startDate" IS NULL OR s."startDate"::date = m."startDate")
        AND (m."durationMonths" IS NULL OR s."durationMonths" = m."durationMonths")
      )
  ) THEN
    RAISE EXCEPTION 'Migration stopped: member membership fields are not represented by a subscription. Reconcile these records before migrating.';
  END IF;
END $$;

UPDATE "Payment" p SET "memberSubscriptionId" = s."id", "currency" = s."currency"
FROM "MemberSubscription" s WHERE s."memberId" = p."memberId" AND s."gymId" = p."gymId";
UPDATE "MemberSubscription" s SET "paymentStatus" = (
  CASE WHEN COALESCE((SELECT sum(p."amountMinor") FROM "Payment" p WHERE p."memberSubscriptionId" = s."id"), 0) >= s."finalMinor" THEN 'PAID'
       WHEN EXISTS (SELECT 1 FROM "Payment" p WHERE p."memberSubscriptionId" = s."id" AND p."amountMinor" > 0) THEN 'PARTIAL'
       ELSE 'UNPAID' END
)::"MemberPaymentStatus";

INSERT INTO "MemberTrainerAssignment" ("id", "gymId", "memberId", "trainerId", "startedAt")
SELECT 'legacy_assignment_' || "id", "gymId", "id", "trainerId", COALESCE("startDate"::timestamp, "joinedAt")
FROM "Member" WHERE "trainerId" IS NOT NULL;

UPDATE "Attendance" SET "durationMinutes" = greatest(0, floor(extract(epoch FROM ("checkOutAt" - "checkInAt")) / 60))::integer
WHERE "checkOutAt" IS NOT NULL;

ALTER TABLE "MemberSubscription"
  ALTER COLUMN "durationMonths" SET NOT NULL,
  ALTER COLUMN "finalMinor" SET NOT NULL,
  ALTER COLUMN "planNameSnapshot" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "memberSubscriptionId" SET NOT NULL;
ALTER TABLE "Member" DROP COLUMN "durationMonths", DROP COLUMN "planId", DROP COLUMN "startDate", DROP COLUMN "trainerId";

-- CreateIndex
CREATE INDEX "MemberGoal_memberId_idx" ON "MemberGoal"("memberId");

-- CreateIndex
CREATE INDEX "MemberNote_memberId_createdAt_idx" ON "MemberNote"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "MemberTrainerAssignment_gymId_trainerId_endedAt_idx" ON "MemberTrainerAssignment"("gymId", "trainerId", "endedAt");

-- CreateIndex
CREATE INDEX "MemberTrainerAssignment_memberId_endedAt_idx" ON "MemberTrainerAssignment"("memberId", "endedAt");

-- CreateIndex
CREATE INDEX "TrainerAvailability_trainerId_dayOfWeek_idx" ON "TrainerAvailability"("trainerId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TrainingSession_gymId_trainerId_startsAt_idx" ON "TrainingSession"("gymId", "trainerId", "startsAt");

-- CreateIndex
CREATE INDEX "TrainingSession_memberId_startsAt_idx" ON "TrainingSession"("memberId", "startsAt");

-- CreateIndex
CREATE INDEX "MemberSubscription_gymId_paymentStatus_paymentDueDate_idx" ON "MemberSubscription"("gymId", "paymentStatus", "paymentDueDate");

-- CreateIndex
CREATE INDEX "MemberSubscription_memberId_status_idx" ON "MemberSubscription"("memberId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MemberSubscription_id_gymId_key" ON "MemberSubscription"("id", "gymId");

-- CreateIndex
CREATE INDEX "Payment_memberSubscriptionId_idx" ON "Payment"("memberSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_id_gymId_key" ON "Member"("id", "gymId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_id_gymId_key" ON "Plan"("id", "gymId");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_userId_key" ON "Trainer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_id_gymId_key" ON "Trainer"("id", "gymId");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_gymId_fkey" FOREIGN KEY ("memberId", "gymId") REFERENCES "Member"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD CONSTRAINT "MemberSubscription_memberId_gymId_fkey" FOREIGN KEY ("memberId", "gymId") REFERENCES "Member"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD CONSTRAINT "MemberSubscription_planId_gymId_fkey" FOREIGN KEY ("planId", "gymId") REFERENCES "Plan"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_memberId_gymId_fkey" FOREIGN KEY ("memberId", "gymId") REFERENCES "Member"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_memberSubscriptionId_gymId_fkey" FOREIGN KEY ("memberSubscriptionId", "gymId") REFERENCES "MemberSubscription"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BodyMeasurement" ADD CONSTRAINT "BodyMeasurement_memberId_gymId_fkey" FOREIGN KEY ("memberId", "gymId") REFERENCES "Member"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberGoal" ADD CONSTRAINT "MemberGoal_memberId_gymId_fkey" FOREIGN KEY ("memberId", "gymId") REFERENCES "Member"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberNote" ADD CONSTRAINT "MemberNote_memberId_gymId_fkey" FOREIGN KEY ("memberId", "gymId") REFERENCES "Member"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trainer" ADD CONSTRAINT "Trainer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberTrainerAssignment" ADD CONSTRAINT "MemberTrainerAssignment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberTrainerAssignment" ADD CONSTRAINT "MemberTrainerAssignment_memberId_gymId_fkey" FOREIGN KEY ("memberId", "gymId") REFERENCES "Member"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberTrainerAssignment" ADD CONSTRAINT "MemberTrainerAssignment_trainerId_gymId_fkey" FOREIGN KEY ("trainerId", "gymId") REFERENCES "Trainer"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainerAvailability" ADD CONSTRAINT "TrainerAvailability_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_trainerId_gymId_fkey" FOREIGN KEY ("trainerId", "gymId") REFERENCES "Trainer"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_memberId_gymId_fkey" FOREIGN KEY ("memberId", "gymId") REFERENCES "Member"("id", "gymId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep one open visit per member (the existing partial index remains in place).
-- Monetary and timing constraints complement API validation.
ALTER TABLE "MemberSubscription" ADD CONSTRAINT "MemberSubscription_amounts_check"
  CHECK ("priceMinor" >= 0 AND "discountMinor" >= 0 AND "finalMinor" = "priceMinor" - "discountMinor" AND "finalMinor" >= 0 AND "durationMonths" > 0);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_check" CHECK ("amountMinor" > 0);
ALTER TABLE "TrainerAvailability" ADD CONSTRAINT "TrainerAvailability_time_check"
  CHECK ("dayOfWeek" BETWEEN 0 AND 6 AND "startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_time_check" CHECK ("endsAt" > "startsAt");
COMMIT;
