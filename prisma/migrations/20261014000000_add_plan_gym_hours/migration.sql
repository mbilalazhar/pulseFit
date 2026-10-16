ALTER TABLE "Plan" ADD COLUMN "maxHoursPerDay" DOUBLE PRECISION;

ALTER TABLE "Plan" ADD CONSTRAINT "Plan_maxHoursPerDay_check"
CHECK ("maxHoursPerDay" > 0 AND "maxHoursPerDay" <= 24);
