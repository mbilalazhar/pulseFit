import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const migrations = new URL('./migrations/', import.meta.url)
const latest = '20261028000000_sync_membership_schema'
const sql = await readFile(new URL(`${latest}/migration.sql`, migrations), 'utf8')

async function previousDatabase() {
  const db = new PGlite()
  const directories = (await readdir(migrations, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name < latest).map((entry) => entry.name).sort()
  for (const directory of directories) await db.exec(await readFile(new URL(`${directory}/migration.sql`, migrations), 'utf8'))
  return db
}

const fixture = `
INSERT INTO "Gym" (id, "organizationName", slug) VALUES ('gym', 'Test Gym', 'test');
INSERT INTO "GymSubscription" (id, "gymId", tier, "memberLimit", price, "endDate") VALUES ('gym-sub', 'gym', 'BASIC', 500, 500000, '2026-12-31');
INSERT INTO "Plan" (id, "gymId", name, "shortDesc", "basePriceMinor", "updatedAt", "maxHoursPerDay") VALUES ('plan', 'gym', 'Pro', 'Test', 100000, now(), 2.5);
INSERT INTO "PlanFeature" (id, "planId", label) VALUES ('feature', 'plan', 'Locker room access');
INSERT INTO "Trainer" (id, "gymId", "fullName", email, "contactNumber", "trainerType", "monthlySalary", "fixedFeeAmount", "sessionRate", "updatedAt") VALUES ('trainer', 'gym', 'Coach', 'coach@example.test', '1234567', 'STAFF', 1000.25, 500.50, 50.75, now());
INSERT INTO "TrainingPackage" (id, name, type, duration, price, "trainerId", "updatedAt") VALUES ('package', 'Session', 'TRAINING', 60, 100.50, 'trainer', now());
INSERT INTO "Member" (id, "gymId", name, phone, "planId", "startDate", "durationMonths", "trainerId") VALUES ('member', 'gym', 'Member', '1234567', 'plan', '2026-01-01', 6, 'trainer');
INSERT INTO "MemberSubscription" (id, "gymId", "memberId", "planId", "priceMinor", "discountMinor", "startDate", "endDate") VALUES ('sub', 'gym', 'member', 'plan', 500000, 40000, '2026-01-01', '2026-06-30');
INSERT INTO "Payment" (id, "gymId", "memberId", "amountMinor", method) VALUES ('payment', 'gym', 'member', 200000, 'mobile_wallet');
INSERT INTO "Attendance" (id, "gymId", "memberId", "attendanceDate", "checkInAt", "checkOutAt") VALUES ('visit', 'gym', 'member', '2026-01-02', '2026-01-02 10:00:00', '2026-01-02 11:30:00');
`

test('latest migration replays on an empty database', async () => {
  const db = await previousDatabase()
  try {
    await db.exec(sql)
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM "MemberTrainerAssignment"`)).rows[0].n, 0)
  } finally { await db.close() }
})

test('migration preserves amounts, assignments, plan features, and payment links', async () => {
  const db = await previousDatabase()
  try {
    await db.exec(fixture)
    await db.exec(sql)
    assert.deepEqual((await db.query(`SELECT "durationMonths", "priceMinor", "discountMinor", "finalMinor", "planNameSnapshot", "paymentStatus" FROM "MemberSubscription"`)).rows[0], {
      durationMonths: 6, priceMinor: 540000, discountMinor: 40000, finalMinor: 500000, planNameSnapshot: 'Pro', paymentStatus: 'PARTIAL',
    })
    assert.deepEqual((await db.query(`SELECT "memberSubscriptionId", method, currency, reference FROM "Payment"`)).rows[0], {
      memberSubscriptionId: 'sub', method: 'ONLINE', currency: 'PKR', reference: 'Legacy payment method: mobile_wallet',
    })
    assert.deepEqual((await db.query(`SELECT "monthlySalaryMinor", "fixedFeeAmount", "sessionRate" FROM "Trainer"`)).rows[0], { monthlySalaryMinor: 100025, fixedFeeAmount: 50050, sessionRate: 5075 })
    assert.equal((await db.query(`SELECT "priceMinor" FROM "GymSubscription"`)).rows[0].priceMinor, 500000)
    assert.equal((await db.query(`SELECT "priceMinor" FROM "TrainingPackage"`)).rows[0].priceMinor, 10050)
    assert.equal((await db.query(`SELECT "trainerId" FROM "MemberTrainerAssignment"`)).rows[0].trainerId, 'trainer')
    assert.equal((await db.query(`SELECT "durationMinutes" FROM "Attendance"`)).rows[0].durationMinutes, 90)
    assert.equal((await db.query(`SELECT label FROM "PlanFeature"`)).rows[0].label, 'Locker room access')
    assert.equal((await db.query(`SELECT "maxHoursPerDay" FROM "Plan"`)).rows[0].maxHoursPerDay, 2.5)
    await assert.rejects(db.exec(`INSERT INTO "Attendance" (id, "gymId", "memberId", "attendanceDate") VALUES ('duplicate', 'gym', 'member', '2026-01-02')`), /unique constraint/)
  } finally { await db.close() }
})

test('ambiguous historical payments abort without losing the original fields', async () => {
  const db = await previousDatabase()
  try {
    await db.exec(fixture)
    await db.exec(`INSERT INTO "MemberSubscription" (id, "gymId", "memberId", "planId", "priceMinor", "startDate", "endDate") VALUES ('sub-2', 'gym', 'member', 'plan', 100000, '2026-07-01', '2026-07-31')`)
    await assert.rejects(db.exec(sql), /legacy payments need exactly one matching subscription/)
    await db.exec('ROLLBACK')
    assert.equal((await db.query(`SELECT "trainerId" FROM "Member"`)).rows[0].trainerId, 'trainer')
    assert.equal((await db.query(`SELECT method FROM "Payment"`)).rows[0].method, 'mobile_wallet')
  } finally { await db.close() }
})
