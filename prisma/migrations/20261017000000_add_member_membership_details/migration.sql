-- Keep existing members intact; their new membership fields can be populated later.
ALTER TABLE "Member"
    ALTER COLUMN "status" SET DEFAULT 'INACTIVE',
    ADD COLUMN "planId" TEXT,
    ADD COLUMN "startDate" DATE,
    ADD COLUMN "durationMonths" INTEGER,
    ADD COLUMN "trainerId" TEXT;

CREATE INDEX "Member_planId_idx" ON "Member"("planId");
CREATE INDEX "Member_trainerId_idx" ON "Member"("trainerId");

ALTER TABLE "Member" ADD CONSTRAINT "Member_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Member" ADD CONSTRAINT "Member_trainerId_fkey"
    FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
