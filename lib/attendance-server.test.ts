import assert from "node:assert/strict"
import { readFile, readdir } from "node:fs/promises"
import { mock, test } from "node:test"
import { PGlite } from "@electric-sql/pglite"

const db = new PGlite()
mock.module("@/lib/prisma", { namedExports: { prisma: {
  $executeRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = strings.reduce((query, part, index) => query + (index ? `$${index}` : "") + part, "")
    const result = await db.query(sql, values)
    return result.affectedRows
  },
} } })
const { closeOverdueAttendance } = await import("./attendance-server")

test("automatic checkout persists exact six-hour exits, catches up after downtime, and preserves manual exits", async () => {
  try {
    const root = new URL("../prisma/migrations/", import.meta.url)
    const dirs = (await readdir(root, { withFileTypes: true })).filter((item) => item.isDirectory()).map((item) => item.name).sort()
    for (const dir of dirs) await db.exec(await readFile(new URL(`${dir}/migration.sql`, root), "utf8"))
    await db.exec(`
      INSERT INTO "Gym" (id, "organizationName", slug) VALUES ('gym-1', 'One', 'one'), ('gym-2', 'Two', 'two');
      INSERT INTO "Member" (id, "gymId", name, phone) VALUES ('member-1', 'gym-1', 'One', '123'), ('member-2', 'gym-2', 'Two', '456');
      INSERT INTO "Attendance" (id, "gymId", "memberId", "attendanceDate", "checkInAt", "checkOutAt", "durationMinutes", "overdueAcknowledgedAt") VALUES
        ('due', 'gym-1', 'member-1', '2026-11-01', '2026-11-01 00:00:00', NULL, NULL, '2026-11-01 03:01:00'),
        ('other', 'gym-2', 'member-2', '2026-11-01', '2026-11-01 00:00:00', NULL, NULL, NULL),
        ('manual', 'gym-1', 'member-1', '2026-10-30', '2026-10-30 00:00:00', '2026-10-30 01:00:00', 60, NULL);
    `)
    assert.equal(await closeOverdueAttendance("gym-1", new Date("2026-11-01T05:59:59.999Z")), 0)
    assert.equal(await closeOverdueAttendance("gym-1", new Date("2026-11-01T06:00:00Z")), 1)
    // Compare database timestamps directly: PGlite decodes timestamp-without-time-zone
    // using the test process's local timezone, whereas Prisma uses UTC.
    const get = async (id: string) => (await db.query<{ checkOutAt: string | null; durationMinutes: number | null }>(`SELECT "checkOutAt"::text AS "checkOutAt", "durationMinutes" FROM "Attendance" WHERE id = $1`, [id])).rows[0]
    assert.equal((await get("due")).checkOutAt, "2026-11-01 06:00:00")
    assert.equal((await get("due")).durationMinutes, 360)
    assert.equal((await get("other")).checkOutAt, null)
    assert.equal(await closeOverdueAttendance(undefined, new Date("2026-11-02T12:00:00Z")), 1)
    assert.equal((await get("other")).checkOutAt, "2026-11-01 06:00:00")
    assert.equal((await get("manual")).checkOutAt, "2026-10-30 01:00:00")
    assert.equal((await get("manual")).durationMinutes, 60)
    assert.equal(await closeOverdueAttendance(undefined, new Date("2026-11-02T12:00:00Z")), 0)
  } finally {
    await db.close()
  }
})
