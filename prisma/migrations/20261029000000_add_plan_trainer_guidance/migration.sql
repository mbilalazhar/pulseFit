-- Plan defaults and the session allowance purchased by each member.
-- Existing records remain unset rather than receiving an invented allowance.
BEGIN;
ALTER TABLE "Plan"
  ADD COLUMN "sessionsPerWeek" INTEGER,
  ADD COLUMN "sessionDurationMinutes" INTEGER;
ALTER TABLE "MemberSubscription"
  ADD COLUMN "sessionsPerWeek" INTEGER,
  ADD COLUMN "sessionDurationMinutes" INTEGER;

ALTER TABLE "Plan" ADD CONSTRAINT "Plan_trainer_guidance_check" CHECK (
  ("sessionsPerWeek" IS NULL AND "sessionDurationMinutes" IS NULL) OR
  ("sessionsPerWeek" IS NOT NULL AND "sessionDurationMinutes" IS NOT NULL
   AND "sessionsPerWeek" BETWEEN 1 AND 21 AND "sessionDurationMinutes" BETWEEN 1 AND 1440)
);
ALTER TABLE "MemberSubscription" ADD CONSTRAINT "MemberSubscription_trainer_guidance_check" CHECK (
  ("sessionsPerWeek" IS NULL AND "sessionDurationMinutes" IS NULL) OR
  ("sessionsPerWeek" IS NOT NULL AND "sessionDurationMinutes" IS NOT NULL
   AND "sessionsPerWeek" BETWEEN 1 AND 21 AND "sessionDurationMinutes" BETWEEN 1 AND 1440)
);
COMMIT;
