import { MEMBER_IMPORT_HEADERS, MAX_MEMBER_IMPORT_BYTES, MAX_MEMBER_IMPORT_ROWS, localDateString, type ImportPlan, type ImportTrainer, type ImportSheetRow } from "./validators/member-import"

async function workbook() {
  const { default: ExcelJS } = await import("exceljs")
  return new ExcelJS.Workbook()
}

export async function createMemberTemplate(plans: ImportPlan[], trainers: ImportTrainer[]) {
  const book = await workbook()
  const activePlans = plans.filter((plan) => plan.status === "ACTIVE")
  const activeTrainers = trainers.filter((trainer) => trainer.status === "ACTIVE")
  const members = book.addWorksheet("Members", { views: [{ state: "frozen", ySplit: 1 }] })
  members.addRow([...MEMBER_IMPORT_HEADERS])
  members.columns.forEach((column, index) => { column.width = [28, 30, 32, 24, 24][index] })
  members.getColumn(5).numFmt = "yyyy-mm-dd"
  const instructions = book.addWorksheet("Instructions")
  instructions.getColumn(1).width = 115
  const instructionLines = [
    "PulseFit — bulk member upload",
    "Enter your members in the Members sheet. Keep all five column headers in row 1.",
    "The Examples sheet is for reference only. Do not copy the sample names into your real member list.",
    "Member Name is required. Assigned Trainer is optional; leave it blank if unassigned.",
    "Use an active plan from the Plans sheet and an active trainer from the Trainers sheet (name or ID).",
    "If names are duplicated, use the ID instead. Plan and trainer lists are checked again when you upload.",
    "Last Payment Amount is in the selected plan's currency. Enter a number without symbols or commas.",
    "Last Payment Date must be an Excel date or YYYY-MM-DD, and cannot be in the future.",
    "If no payment has been taken, leave both payment fields blank (or enter 0 with no date).",
    "Use plain values, not formulas. Maximum 1,000 members and 5 MB. Save as .xlsx.",
    "Only Members is validated. Reference sheets are not imported. This is a preview; members are not saved.",
  ]
  instructionLines.forEach((line) => instructions.addRow([line]))
  const planSheet = book.addWorksheet("Plans")
  planSheet.addRow(["Plan name", "Plan ID", "Currency"])
  activePlans.forEach((plan) => planSheet.addRow([plan.name, plan.id, plan.currency]))
  const trainerSheet = book.addWorksheet("Trainers")
  trainerSheet.addRow(["Trainer name", "Trainer ID"])
  activeTrainers.forEach((trainer) => trainerSheet.addRow([trainer.fullName, trainer.id]))
  const examples = book.addWorksheet("Examples")
  examples.addRow([...MEMBER_IMPORT_HEADERS])
  examples.addRow(["Sample Member — replace with real member", activeTrainers[0]?.id ?? "", activePlans[0]?.id ?? "", 1000, localDateString()])
  examples.addRow(["Unpaid Member — example only", "", activePlans[0]?.id ?? "", "", ""])
  for (let row = 2; row <= MAX_MEMBER_IMPORT_ROWS + 1; row++) {
    if (activePlans.length) members.getCell(row, 3).dataValidation = { type: "list", allowBlank: false, formulae: [`'Plans'!$B$2:$B$${activePlans.length + 1}`], showErrorMessage: true, errorTitle: "Choose a gym plan", error: "Use a plan ID from the Plans sheet." }
    if (activeTrainers.length) members.getCell(row, 2).dataValidation = { type: "list", allowBlank: true, formulae: [`'Trainers'!$B$2:$B$${activeTrainers.length + 1}`] }
  }
  book.eachSheet((sheet) => {
    if (["Plans", "Trainers", "Examples"].includes(sheet.name)) sheet.columns.forEach((column) => { column.width = 38 })
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } }
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDB174F" } }
    sheet.getRow(1).height = 26
  })
  return book.xlsx.writeBuffer()
}

export async function readMemberWorkbook(file: File): Promise<ImportSheetRow[]> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Choose an Excel .xlsx file. CSV, .xls, and other formats are not supported.")
  if (file.size === 0) throw new Error("This file is empty. Download and fill in the template first.")
  if (file.size > MAX_MEMBER_IMPORT_BYTES) throw new Error("The file exceeds 5 MB. Split your members into smaller files.")
  const book = await workbook()
  try { await book.xlsx.load(await file.arrayBuffer()) }
  catch { throw new Error("This file could not be read as an Excel workbook. Save it as an unprotected .xlsx file and try again.") }
  const sheet = book.getWorksheet("Members") ?? (book.worksheets.length === 1 ? book.worksheets[0] : undefined)
  if (!sheet) throw new Error('The workbook must contain a sheet named "Members". Use the downloaded template.')
  if (sheet.actualRowCount > MAX_MEMBER_IMPORT_ROWS + 1) throw new Error(`Upload no more than ${MAX_MEMBER_IMPORT_ROWS} members at a time.`)
  if (sheet.columnCount > MEMBER_IMPORT_HEADERS.length) throw new Error("The Members sheet contains extra columns. Keep only the five template columns.")
  const rows: ImportSheetRow[] = []
  sheet.eachRow((row, rowNumber) => {
    const cells: unknown[] = []
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      if (cell.isMerged) throw new Error(`Row ${rowNumber}: merged cells are not supported. Unmerge them and try again.`)
      const value = cell.value
      cells[column - 1] = value && typeof value === "object" && "richText" in value ? value.richText.map((part) => part.text).join("") : value
    })
    rows.push({ row: rowNumber, cells })
  })
  return rows
}
