BEGIN;
ALTER TABLE "MemberSubscription" ADD COLUMN "additionalChargeMinor" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_amounts_check";
ALTER TABLE "MemberSubscription" ADD CONSTRAINT "MemberSubscription_amounts_check" CHECK (
  "priceMinor" >= 0 AND "discountMinor" >= 0 AND "additionalChargeMinor" >= 0
  AND "discountMinor" <= "priceMinor"
  AND "finalMinor" = "priceMinor"::bigint + "additionalChargeMinor" - "discountMinor"
  AND "finalMinor" >= 0 AND "durationMonths" > 0
);
COMMIT;
