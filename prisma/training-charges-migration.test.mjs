import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('training charges preserve existing totals and enforce the new price breakdown', async () => {
  const db = new PGlite()
  const migrations = new URL('./migrations/', import.meta.url)
  const latest = '20261029010000_add_training_charges'
  try {
    const directories = (await readdir(migrations, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name < latest).map((entry) => entry.name).sort()
    for (const directory of directories) await db.exec(await readFile(new URL(`${directory}/migration.sql`, migrations), 'utf8'))
    await db.exec(`
      INSERT INTO "Gym" (id, "organizationName", slug) VALUES ('gym', 'Test', 'test');
      INSERT INTO "Plan" (id, "gymId", name, "shortDesc", "basePriceMinor", "updatedAt") VALUES ('plan', 'gym', 'Pro', 'Test', 100000, now());
      INSERT INTO "Member" (id, "gymId", name, phone) VALUES ('member', 'gym', 'Test', '1234567');
      INSERT INTO "MemberSubscription" (id, "gymId", "memberId", "planId", "planNameSnapshot", "durationMonths", "priceMinor", "discountMinor", "finalMinor", "startDate", "endDate")
      VALUES ('sub', 'gym', 'member', 'plan', 'Pro', 1, 100000, 10000, 90000, '2026-10-01', '2026-10-31');
    `)
    await db.exec(await readFile(new URL(`${latest}/migration.sql`, migrations), 'utf8'))
    assert.deepEqual((await db.query(`SELECT "additionalChargeMinor", "finalMinor" FROM "MemberSubscription"`)).rows[0], { additionalChargeMinor: 0, finalMinor: 90000 })
    await db.exec(`UPDATE "MemberSubscription" SET "additionalChargeMinor" = 25000, "finalMinor" = 115000`)
    assert.deepEqual((await db.query(`SELECT "priceMinor", "additionalChargeMinor", "discountMinor", "finalMinor" FROM "MemberSubscription"`)).rows[0], { priceMinor: 100000, additionalChargeMinor: 25000, discountMinor: 10000, finalMinor: 115000 })
    await assert.rejects(db.exec(`UPDATE "MemberSubscription" SET "additionalChargeMinor" = -1`), /check constraint/)
    await assert.rejects(db.exec(`UPDATE "MemberSubscription" SET "finalMinor" = 90000`), /check constraint/)
    await assert.rejects(db.exec(`UPDATE "MemberSubscription" SET "discountMinor" = 110000, "finalMinor" = 15000`), /check constraint/)
    await db.exec(`UPDATE "MemberSubscription" SET "priceMinor" = 2147483647, "additionalChargeMinor" = 1, "discountMinor" = 1, "finalMinor" = 2147483647`)
  } finally { await db.close() }
})
