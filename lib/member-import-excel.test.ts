import assert from "node:assert/strict"
import { test } from "node:test"
import ExcelJS from "exceljs"
import { createMemberTemplate, readMemberWorkbook } from "./member-import-excel"
import { MEMBER_IMPORT_HEADERS, validateMemberImport } from "./validators/member-import"

const plans = [{ id: "plan-1", name: "Premium", currency: "PKR", status: "ACTIVE" }]
const trainers = [{ id: "trainer-1", fullName: "Ayesha Khan", status: "ACTIVE" }]

test("template contains real gym references and examples separately from member data", async () => {
  const buffer = await createMemberTemplate(plans, trainers)
  const book = new ExcelJS.Workbook()
  await book.xlsx.load(buffer)
  assert.equal(book.getWorksheet("Plans")?.getCell("B2").value, "plan-1")
  assert.equal(book.getWorksheet("Trainers")?.getCell("B2").value, "trainer-1")
  assert.equal(book.getWorksheet("Members")?.actualRowCount, 1)
  assert.equal(book.getWorksheet("Examples")?.actualRowCount, 3)
  const sheet = book.getWorksheet("Members")!
  sheet.getRow(2).values = ["Ali Raza", "trainer-1", "plan-1", 1500, new Date("2026-10-15T00:00:00Z")]
  const parsed = await readMemberWorkbook(new File([await book.xlsx.writeBuffer()], "members.xlsx"))
  const result = validateMemberImport(parsed, plans, trainers, "2026-10-16")
  assert.deepEqual(result.issues, [])
  assert.equal(result.members[0].paymentDate, "2026-10-15")
})

test("rejects wrong extensions, empty, oversized, and corrupt workbooks", async () => {
  await assert.rejects(() => readMemberWorkbook(new File(["x"], "members.csv")), /\.xlsx/)
  await assert.rejects(() => readMemberWorkbook(new File([], "members.xlsx")), /empty/)
  await assert.rejects(() => readMemberWorkbook(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "members.xlsx")), /5 MB/)
  await assert.rejects(() => readMemberWorkbook(new File(["not an Excel file"], "members.xlsx")), /could not be read/)
})

test("accepts a single custom sheet, preserves Excel row numbers, and rejects merged cells", async () => {
  const book = new ExcelJS.Workbook()
  const sheet = book.addWorksheet("Sheet1")
  sheet.addRow([...MEMBER_IMPORT_HEADERS])
  sheet.getRow(5).values = ["Ali", "", "Premium", "", ""]
  const parsed = await readMemberWorkbook(new File([await book.xlsx.writeBuffer()], "members.xlsx"))
  assert.equal(parsed[1].row, 5)
  sheet.mergeCells("A5:B5")
  await assert.rejects(() => readMemberWorkbookFromBook(book), /merged/)
})

async function readMemberWorkbookFromBook(book: ExcelJS.Workbook) {
  return readMemberWorkbook(new File([await book.xlsx.writeBuffer()], "members.xlsx"))
}
