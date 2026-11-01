import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('plan appearance migration preserves existing plans and stores independent choices', async () => {
  const db = new PGlite()
  const root = new URL('./migrations/', import.meta.url)
  const latest = '20261031010000_add_plan_appearance'
  try {
    const dirs = (await readdir(root, { withFileTypes: true })).filter((item) => item.isDirectory() && item.name < latest).map((item) => item.name).sort()
    for (const dir of dirs) await db.exec(await readFile(new URL(`${dir}/migration.sql`, root), 'utf8'))
    await db.exec(`INSERT INTO "Gym" (id, "organizationName", slug) VALUES ('gym', 'Test', 'test');
      INSERT INTO "Plan" (id, "gymId", name, "shortDesc", "basePriceMinor", "updatedAt") VALUES ('plan', 'gym', 'Pro', 'Test', 100000, now());`)
    await db.exec(await readFile(new URL(`${latest}/migration.sql`, root), 'utf8'))
    assert.deepEqual((await db.query(`SELECT name, "basePriceMinor", icon, color, category FROM "Plan"`)).rows[0], { name: 'Pro', basePriceMinor: 100000, icon: 'dumbbell', color: 'blue', category: 'Basic' })
    await db.exec(`UPDATE "Plan" SET icon = 'gem', color = 'teal', category = 'Medium' WHERE id = 'plan'`)
    assert.deepEqual((await db.query(`SELECT icon, color, category FROM "Plan"`)).rows[0], { icon: 'gem', color: 'teal', category: 'Medium' })
  } finally { await db.close() }
})
