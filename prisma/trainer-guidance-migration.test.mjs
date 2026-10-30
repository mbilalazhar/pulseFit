import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('guidance migration preserves existing records and keeps member overrides separate from plan defaults', async () => {
  const db = new PGlite()
  const migrations = new URL('./migrations/', import.meta.url)
  const latest = '20261029000000_add_plan_trainer_guidance'
  try {
    const directories = (await readdir(migrations, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && entry.name < latest).map((entry) => entry.name).sort()
    for (const directory of directories) await db.exec(await readFile(new URL(`${directory}/migration.sql`, migrations), 'utf8'))
    await db.exec(`
      INSERT INTO "Gym" (id, "organizationName", slug) VALUES ('gym', 'Test', 'test');
      INSERT INTO "Plan" (id, "gymId", name, "shortDesc", "basePriceMinor", "updatedAt") VALUES ('plan', 'gym', 'Pro', 'Test', 100000, now());
      INSERT INTO "Member" (id, "gymId", name, phone) VALUES ('member', 'gym', 'Test', '1234567');
      INSERT INTO "MemberSubscription" (id, "gymId", "memberId", "planId", "planNameSnapshot", "durationMonths", "priceMinor", "finalMinor", "startDate", "endDate")
      VALUES ('sub', 'gym', 'member', 'plan', 'Pro', 1, 100000, 100000, '2026-10-01', '2026-10-31');
    `)
    await db.exec(await readFile(new URL(`${latest}/migration.sql`, migrations), 'utf8'))
    for (const table of ['Plan', 'MemberSubscription']) {
      assert.deepEqual((await db.query(`SELECT "sessionsPerWeek", "sessionDurationMinutes" FROM "${table}"`)).rows[0], { sessionsPerWeek: null, sessionDurationMinutes: null })
      await assert.rejects(db.exec(`UPDATE "${table}" SET "sessionsPerWeek" = 3`), /check constraint/)
      await assert.rejects(db.exec(`UPDATE "${table}" SET "sessionsPerWeek" = 0, "sessionDurationMinutes" = 60`), /check constraint/)
    }
    await db.exec(`UPDATE "Plan" SET "sessionsPerWeek" = 3, "sessionDurationMinutes" = 60`)
    await db.exec(`UPDATE "MemberSubscription" SET "sessionsPerWeek" = 5, "sessionDurationMinutes" = 45`)
    assert.deepEqual((await db.query(`SELECT "sessionsPerWeek", "sessionDurationMinutes" FROM "Plan"`)).rows[0], { sessionsPerWeek: 3, sessionDurationMinutes: 60 })
    assert.deepEqual((await db.query(`SELECT "sessionsPerWeek", "sessionDurationMinutes", "finalMinor" FROM "MemberSubscription"`)).rows[0], { sessionsPerWeek: 5, sessionDurationMinutes: 45, finalMinor: 100000 })
  } finally { await db.close() }
})
