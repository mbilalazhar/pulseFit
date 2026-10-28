"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeaderButton } from "@/components/dashboard-header-button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getPlans } from "@/lib/services/subscription.services"
import { getTrainers } from "@/lib/services/trainer.services"
import { MEMBER_IMPORT_HEADERS, validateMemberImport, type ImportSheetRow } from "@/lib/validators/member-import"

function BulkMemberPanel({ onClose }: { onClose: () => void }) {
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: getPlans, refetchOnMount: "always" })
  const trainersQuery = useQuery({ queryKey: ["trainers"], queryFn: getTrainers, refetchOnMount: "always" })
  const [rows, setRows] = useState<ImportSheetRow[] | null>(null)
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<"download" | "upload" | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const loading = plansQuery.isFetching || trainersQuery.isFetching
  const failed = plansQuery.isError || trainersQuery.isError
  const hasPlans = plansQuery.data?.plans.some((plan) => plan.status === "ACTIVE") ?? false
  const ready = !loading && !failed && hasPlans
  const result = useMemo(() => rows && plansQuery.data && trainersQuery.data ? validateMemberImport(rows, plansQuery.data.plans, trainersQuery.data.trainers) : null, [rows, plansQuery.data, trainersQuery.data])

  async function downloadTemplate() {
    if (!ready || busy || !plansQuery.data || !trainersQuery.data) return
    setBusy("download")
    setError("")
    try {
      const { createMemberTemplate } = await import("@/lib/member-import-excel")
      const buffer = await createMemberTemplate(plansQuery.data.plans, trainersQuery.data.trainers)
      const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }))
      const link = document.createElement("a")
      link.href = url
      link.download = "PulseFit-Members-Template.xlsx"
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { setError("The template could not be downloaded. Please try again.") }
    finally { setBusy(null) }
  }

  async function verifyFile(files: FileList | null) {
    if (!ready || busy || !files?.length) return
    setRows(null)
    setError("")
    setFileName("")
    if (files.length !== 1) { setError("Upload one Excel file at a time."); return }
    const file = files[0]
    setFileName(file.name)
    setBusy("upload")
    try {
      const { readMemberWorkbook } = await import("@/lib/member-import-excel")
      setRows(await readMemberWorkbook(file))
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The file could not be checked. Please try again.") }
    finally { setBusy(null); if (inputRef.current) inputRef.current.value = "" }
  }

  return (
    <div className="min-w-0 space-y-5">
      {loading ? <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading your gym&apos;s plans and trainers...</p> : failed ? (
        <div role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/50 p-3 text-sm text-rose-700 dark:text-rose-400">Couldn&apos;t load your gym&apos;s plans or trainers. <button type="button" className="font-semibold underline" onClick={() => { void plansQuery.refetch(); void trainersQuery.refetch() }}>Try again</button></div>
      ) : !hasPlans ? <p className="rounded-xl bg-amber-50 dark:bg-amber-950/50 p-3 text-sm text-amber-800 dark:text-amber-400">An active subscription plan is needed first. <Link href="/dashboard/plans" className="font-semibold underline">Manage plans</Link></p> : null}

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">1. Download the Excel template</h3>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">Includes examples and your gym&apos;s active plans and trainers. Add your members to the Members sheet.</p>
        </div>
        <Button type="button" variant="outline" disabled={!ready || busy !== null} onClick={downloadTemplate} className="shrink-0 gap-2 bg-card">
          {busy === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}Download sample Excel
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Required columns</h3>
        <div className="flex flex-wrap gap-1.5">{MEMBER_IMPORT_HEADERS.map((header) => <span key={header} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground/80">{header}</span>)}</div>
        <p className="text-xs leading-relaxed text-muted-foreground">Trainer is optional. Use a plan or trainer name or ID from the template. Payment amount uses the plan&apos;s currency; dates use YYYY-MM-DD or Excel dates. Leave both payment fields blank if unpaid.</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">2. Upload and check your file</h3>
        <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void verifyFile(event.dataTransfer.files) }} className="rounded-xl border-2 border-dashed border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/50 p-6 text-center">
          <FileSpreadsheet className="mx-auto size-8 text-rose-500" />
          <p className="mt-2 text-sm font-medium">Drop your Excel file here</p>
          <p id="bulk-file-help" className="mt-1 text-xs text-muted-foreground">.xlsx only · Up to 5 MB · Maximum 1,000 members</p>
          <input ref={inputRef} id="bulk-member-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="Upload members Excel file" aria-describedby="bulk-file-help" disabled={!ready || busy !== null} className="sr-only" onChange={(event) => void verifyFile(event.target.files)} />
          <Button type="button" variant="outline" disabled={!ready || busy !== null} className="mt-4 gap-2 bg-card" onClick={() => inputRef.current?.click()}>
            {busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{busy === "upload" ? "Checking file..." : "Choose Excel file"}
          </Button>
          {fileName ? <p className="mt-3 break-all text-xs text-muted-foreground">{fileName}</p> : null}
        </div>
      </div>

      {error ? <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 p-3 text-sm text-rose-700 dark:text-rose-400"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</p> : null}

      {result && ready ? (
        <div className="space-y-3" aria-live="polite">
          {result.issues.length ? (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400"><AlertCircle className="size-4" />Fix {result.issues.length} {result.issues.length === 1 ? "issue" : "issues"} before continuing</h3>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">Update the Excel file and upload it again. Nothing has been imported.</p>
              <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto text-xs text-rose-800 dark:text-rose-400">{result.issues.slice(0, 50).map((issue, index) => <li key={index}><strong>{issue.row ? `Row ${issue.row}: ` : "File: "}</strong>{issue.message}</li>)}</ul>
              {result.issues.length > 50 ? <p className="mt-2 text-xs text-rose-700 dark:text-rose-400">Showing the first 50 issues.</p> : null}
            </div>
          ) : (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 p-3 text-sm text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />File verified: {result.members.length} {result.members.length === 1 ? "member" : "members"} ready for preview. No members have been saved.</p>
          )}
          {result.members.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Valid rows ({result.members.length} of {result.totalRows})</h3>
              <div className="max-h-64 overflow-auto rounded-xl border border-border">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="sticky top-0 bg-muted text-muted-foreground"><tr>{["Row", "Member", "Trainer", "Plan", "Last payment", "Payment date"].map((label) => <th key={label} scope="col" className="px-3 py-2.5 font-medium">{label}</th>)}</tr></thead>
                  <tbody>{result.members.slice(0, 20).map((member) => <tr key={member.row} className="border-t border-border"><td className="px-3 py-2.5 text-muted-foreground">{member.row}</td><td className="px-3 py-2.5 font-medium">{member.name}</td><td className="px-3 py-2.5">{member.trainerName ?? "Unassigned"}</td><td className="px-3 py-2.5">{member.planName}</td><td className="whitespace-nowrap px-3 py-2.5">{member.paymentAmount === null ? "Unpaid" : `${member.currency} ${member.paymentAmount.toLocaleString("en-US")}`}</td><td className="whitespace-nowrap px-3 py-2.5">{member.paymentDate ?? "—"}</td></tr>)}</tbody>
                </table>
              </div>
              {result.members.length > 20 ? <p className="text-xs text-muted-foreground">Showing the first 20 valid rows. All {result.totalRows} rows were checked.</p> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">Preview only. Your file is checked in your browser; members aren&apos;t saved.</p>
        <Button type="button" variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  )
}

export function BulkMemberDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<DashboardHeaderButton icon={Upload} text="Bulk Import Members" bgColor="transparent" />} />
      <DialogContent className="max-h-[calc(100svh-2rem)] gap-5 overflow-y-auto p-6 sm:max-w-3xl">
        <DialogHeader className="pr-6"><DialogTitle className="text-xl font-bold">Bulk upload members</DialogTitle><DialogDescription>Prepare your Excel file, check the details, and review your members together.</DialogDescription></DialogHeader>
        {open ? <BulkMemberPanel onClose={() => setOpen(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}
