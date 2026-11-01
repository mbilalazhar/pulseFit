import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

test('expense migration replays, persists paid and pending records, and enforces gym and positive amount', async () => {
  const db = new PGlite()
  try {
    const root = new URL('./migrations/', import.meta.url)
    const dirs = (await readdir(root, { withFileTypes: true })).filter((item) => item.isDirectory()).map((item) => item.name).sort()
    for (const dir of dirs) await db.exec(await readFile(new URL(`${dir}/migration.sql`, root), 'utf8'))
    await db.exec(`INSERT INTO "Gym" (id, "organizationName", slug) VALUES ('gym', 'Expense Test Gym', 'expense-test');`)
    await db.exec(`INSERT INTO "Expense" (id, "gymId", title, category, "amountMinor", date, status, method, "recordedByUserId") VALUES
      ('paid', 'gym', 'Rent', 'Rent', 25000, '2026-10-31', 'PAID', 'Cash', 'admin'),
      ('pending', 'gym', 'Power', 'Utilities', 5000, '2026-11-01', 'PENDING', 'Cash', 'admin');`)
    assert.deepEqual((await db.query(`SELECT status, "amountMinor", currency FROM "Expense" ORDER BY id`)).rows, [
      { status: 'PAID', amountMinor: 25000, currency: 'PKR' }, { status: 'PENDING', amountMinor: 5000, currency: 'PKR' },
    ])
    await assert.rejects(db.exec(`INSERT INTO "Expense" (id, "gymId", title, category, "amountMinor", date, status, method, "recordedByUserId") VALUES ('bad', 'gym', 'Bad', 'Other', 0, '2026-10-31', 'PAID', 'Cash', 'admin')`), /Expense_amount_check/)
    await assert.rejects(db.exec(`INSERT INTO "Expense" (id, "gymId", title, category, "amountMinor", date, status, method, "recordedByUserId") VALUES ('bad-gym', 'missing', 'Bad', 'Other', 100, '2026-10-31', 'PAID', 'Cash', 'admin')`), /Expense_gymId_fkey/)
  } finally { await db.close() }
})
