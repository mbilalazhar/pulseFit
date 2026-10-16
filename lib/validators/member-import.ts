export const MEMBER_IMPORT_HEADERS = ["Member Name", "Assigned Trainer", "Subscription Plan", "Last Payment Amount", "Last Payment Date"] as const
export const MAX_MEMBER_IMPORT_ROWS = 1000
export const MAX_MEMBER_IMPORT_BYTES = 5 * 1024 * 1024

export type ImportPlan = { id: string; name: string; currency: string; status: string }
export type ImportTrainer = { id: string; fullName: string; status: string }
export type ImportSheetRow = { row: number; cells: unknown[] }
export type ImportIssue = { row: number; message: string }
export type ImportedMember = {
  row: number
  name: string
  trainerId: string | null
  trainerName: string | null
  planId: string
  planName: string
  currency: string
  paymentAmount: number | null
  paymentDate: string | null
}

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase()
const blank = (value: unknown) => value == null || (typeof value === "string" && !value.trim())
const text = (value: unknown) => typeof value === "string" ? value.trim() : ""

export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function paymentDate(value: unknown): string | null {
  const candidate = value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString().slice(0, 10) : text(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) return null
  const parsed = new Date(`${candidate}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate || candidate < "1900-01-01") return null
  return candidate
}

export function validateMemberImport(sheet: ImportSheetRow[], plans: ImportPlan[], trainers: ImportTrainer[], today = localDateString()) {
  const issues: ImportIssue[] = []
  const members: ImportedMember[] = []
  const header = sheet.find((row) => row.row === 1)?.cells ?? []
  const headers = header.map((cell) => normalize(text(cell)))
  const expected = MEMBER_IMPORT_HEADERS.map(normalize)
  for (const label of MEMBER_IMPORT_HEADERS) {
    const count = headers.filter((value) => value === normalize(label)).length
    if (count !== 1) issues.push({ row: 1, message: count === 0 ? `Missing column: ${label}.` : `Duplicate column: ${label}.` })
  }
  headers.forEach((value, index) => {
    if (!expected.includes(value)) issues.push({ row: 1, message: `Unexpected or blank column ${index + 1}. Use the template's five columns.` })
  })
  if (issues.length) return { members, issues, totalRows: 0 }
  const positions = expected.map((label) => headers.indexOf(label))
  const rows = sheet.filter((row) => row.row !== 1 && row.cells.some((cell) => !blank(cell)))
  if (rows.length === 0) issues.push({ row: 0, message: "No members found. Add your members below the header row." })
  if (rows.length > MAX_MEMBER_IMPORT_ROWS) {
    issues.push({ row: 0, message: `Upload no more than ${MAX_MEMBER_IMPORT_ROWS} members at a time.` })
    return { members, issues, totalRows: rows.length }
  }
  const activePlans = plans.filter((plan) => plan.status === "ACTIVE")
  const activeTrainers = trainers.filter((trainer) => trainer.status === "ACTIVE")
  const seen = new Map<string, number>()
  for (const { row, cells } of rows) {
    const initialIssues = issues.length
    const problem = (message: string) => issues.push({ row, message })
    if (cells.slice(headers.length).some((cell) => !blank(cell))) problem("Unexpected data beyond the template's five columns.")
    const [nameValue, trainerValue, planValue, amountValue, dateValue] = positions.map((position) => cells[position])
    if (positions.some((position) => typeof cells[position] === "object" && cells[position] !== null && !(cells[position] instanceof Date))) {
      problem("Use plain values, not formulas, links, or Excel errors.")
      continue
    }
    const name = text(nameValue)
    if (!name || name.length > 120) problem("Member Name must contain 1–120 characters.")
    const planText = text(planValue)
    const matchingPlans = activePlans.filter((plan) => plan.id === planText || normalize(plan.name) === normalize(planText))
    const plan = matchingPlans.length === 1 ? matchingPlans[0] : undefined
    if (!plan) problem(matchingPlans.length > 1 ? "Subscription Plan matches multiple plans. Use its ID from the Plans sheet." : "Subscription Plan must match an active plan from your gym (name or ID).")
    const trainerText = text(trainerValue)
    const matchingTrainers = activeTrainers.filter((trainer) => trainer.id === trainerText || normalize(trainer.fullName) === normalize(trainerText))
    const trainer = matchingTrainers.length === 1 ? matchingTrainers[0] : undefined
    if (!blank(trainerValue) && !trainer) problem(matchingTrainers.length > 1 ? "Assigned Trainer matches multiple trainers. Use their ID from the Trainers sheet." : "Assigned Trainer must match an active trainer from your gym, or be blank.")
    let amount: number | null = null
    let date: string | null = null
    if (!blank(amountValue)) {
      const numeric = typeof amountValue === "number" || (typeof amountValue === "string" && /^\d+(\.\d+)?$/.test(amountValue.trim()))
      amount = numeric ? Number(amountValue) : NaN
      // Match the application's price storage: amounts are stored in hundredths.
      const decimals = 2
      const scaled = amount * 10 ** decimals
      if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(Math.round(scaled)) || Math.abs(scaled - Math.round(scaled)) > 0.000001) {
        problem(`Last Payment Amount must be a non-negative number with at most ${decimals} decimal places, without currency symbols or commas.`)
      }
    }
    if (!blank(dateValue)) {
      date = paymentDate(dateValue)
      if (!date) problem("Last Payment Date must be a valid Excel date or YYYY-MM-DD.")
      else if (date > today) problem("Last Payment Date cannot be in the future.")
      if (amount === null || amount === 0) problem("Enter a positive payment amount with the payment date, or leave both fields blank.")
    } else if (amount !== null && amount > 0) problem("Last Payment Date is required when a payment amount is entered.")
    if (issues.length !== initialIssues || !plan) continue
    const key = JSON.stringify([normalize(name), trainer?.id ?? null, plan.id, amount || null, date])
    const previous = seen.get(key)
    if (previous) { problem(`Duplicate member entry: identical to row ${previous}.`); continue }
    seen.set(key, row)
    members.push({ row, name, trainerId: trainer?.id ?? null, trainerName: trainer?.fullName ?? null, planId: plan.id, planName: plan.name, currency: plan.currency, paymentAmount: amount || null, paymentDate: date })
  }
  return { members, issues, totalRows: rows.length }
}
