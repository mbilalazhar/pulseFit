import assert from "node:assert/strict"
import { test } from "node:test"
import { MEMBER_IMPORT_HEADERS, validateMemberImport, type ImportSheetRow } from "./member-import"

const plans = [{ id: "plan-1", name: "Premium", currency: "PKR", status: "ACTIVE" }, { id: "draft", name: "Draft", currency: "PKR", status: "DRAFT" }]
const trainers = [{ id: "trainer-1", fullName: "Ayesha Khan", status: "ACTIVE" }]
const sheet = (...rows: unknown[][]): ImportSheetRow[] => [{ row: 1, cells: [...MEMBER_IMPORT_HEADERS] }, ...rows.map((cells, index) => ({ row: index + 2, cells }))]
const validate = (rows: ImportSheetRow[]) => validateMemberImport(rows, plans, trainers, "2026-10-16")

test("accepts gym names and IDs, optional trainer, paid and unpaid members", () => {
  const result = validate(sheet(["Ali", "ayesha khan", " premium ", 1250.50, "2026-10-15"], ["Sara", "", "plan-1", "", ""], ["Hamza", "trainer-1", "plan-1", 0, ""]))
  assert.deepEqual(result.issues, [])
  assert.equal(result.members.length, 3)
  assert.equal(result.members[0].trainerId, "trainer-1")
  assert.equal(result.members[1].paymentAmount, null)
})

test("headers may be reordered but must be complete and unique", () => {
  const rows = sheet(["Ali", "", "Premium", "", ""])
  rows.forEach((row) => row.cells.reverse())
  assert.equal(validate(rows).members[0].name, "Ali")
  rows[0].cells[0] = "Member Name"
  assert.equal(validate(rows).members.length, 0)
  assert(validate(rows).issues.some((issue) => issue.message.includes("Duplicate")))
  assert(validate(rows).issues.some((issue) => issue.message.includes("Missing")))
})

test("rejects unknown or inactive plans and unknown trainers", () => {
  const result = validate(sheet(["Ali", "", "Other Gym Plan", "", ""], ["Sara", "", "Draft", "", ""], ["Hamza", "Other Gym Trainer", "Premium", "", ""]))
  assert.equal(result.members.length, 0)
  assert.deepEqual(result.issues.map((issue) => issue.row), [2, 3, 4])
})

test("duplicate reference names require an unambiguous ID", () => {
  const duplicatePlans = [...plans, { ...plans[0], id: "plan-2" }]
  const duplicateTrainers = [...trainers, { ...trainers[0], id: "trainer-2" }]
  assert.equal(validateMemberImport(sheet(["Ali", "Ayesha Khan", "Premium", "", ""]), duplicatePlans, duplicateTrainers).issues.length, 2)
  assert.equal(validateMemberImport(sheet(["Ali", "trainer-1", "plan-1", "", ""]), duplicatePlans, duplicateTrainers).members.length, 1)
})

test("rejects malformed amounts and missing payment dates", () => {
  for (const amount of [-1, "1,000", "PKR 100", "no", 1.234, Infinity, true]) {
    assert(validate(sheet(["Ali", "", "Premium", amount, "2026-10-15"])).issues.some((issue) => issue.message.includes("Last Payment Amount")))
  }
  assert(validate(sheet(["Ali", "", "Premium", 100, ""])).issues.some((issue) => issue.message.includes("Date is required")))
  assert(validate(sheet(["Ali", "", "Premium", "", "2026-10-15"])).issues.some((issue) => issue.message.includes("positive payment amount")))
})

test("validates actual calendar dates, future dates, and Excel date cells", () => {
  for (const date of ["2026-02-30", "2026-13-01", "10/15/2026", "2026-10-17", 46310, new Date("invalid")]) {
    assert(validate(sheet(["Ali", "", "Premium", 100, date])).issues.length > 0)
  }
  assert.equal(validate(sheet(["Ali", "", "Premium", 100, new Date("2026-10-15T00:00:00Z")])).members[0].paymentDate, "2026-10-15")
})

test("rejects formulas instead of using cached results", () => {
  assert(validate(sheet(["Ali", "", "Premium", { formula: "1+1", result: 2 }, "2026-10-15"])).issues.some((issue) => issue.message.includes("formulas")))
})

test("detects exact duplicate entries but allows different people with the same name", () => {
  const result = validate(sheet(["Ali", "", "Premium", "", ""], ["Ali", "", "Premium", "", ""], ["Ali", "trainer-1", "Premium", "", ""]))
  assert.equal(result.members.length, 2)
  assert.equal(result.issues[0].row, 3)
})

test("rejects empty files, blank names, excess columns, and more than 1000 rows", () => {
  assert(validate(sheet([])).issues.some((issue) => issue.message.includes("No members")))
  assert(validate(sheet(["  ", "", "Premium", "", ""])).issues.some((issue) => issue.message.includes("Member Name")))
  assert(validate(sheet(["Ali", "", "Premium", "", "", "extra"])).issues.some((issue) => issue.message.includes("Unexpected data")))
  const tooMany = sheet(...Array.from({ length: 1001 }, (_, i) => [`Member ${i}`, "", "Premium", "", ""]))
  assert.equal(validate(tooMany).members.length, 0)
  assert(validate(tooMany).issues.some((issue) => issue.message.includes("1000")))
})
