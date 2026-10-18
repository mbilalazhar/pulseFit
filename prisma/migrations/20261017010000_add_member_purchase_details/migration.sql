ALTER TYPE "MemberSubStatus" ADD VALUE 'INACTIVE';

ALTER TABLE "MemberSubscription"
    ADD COLUMN "discountMinor" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'PKR';

-- Existing subscriptions use their plan's currency.
UPDATE "MemberSubscription" AS subscription
SET "currency" = plan."currency"
FROM "Plan" AS plan
WHERE subscription."planId" = plan."id";
