"use client"

import { useEffect, useRef, useState, type AriaAttributes, type KeyboardEvent, type ReactNode } from "react"
import { Popover } from "@base-ui/react/popover"
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { calendarDays, dateInRange, displayTime, localDateValue, parseDateValue, shiftCalendarMonth, timeParts, timeValue } from "@/lib/date-time"

type PickerProps = AriaAttributes & {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  min?: string
  max?: string
  className?: string
  placeholder?: string
}

const smallButton = "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-30"
const actionButton = "rounded-lg px-3 py-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-30"

function PickerField({ kind, children, ...props }: PickerProps & {
  kind: "date" | "time"
  children: (value: string, commit: (value: string) => void, close: () => void) => ReactNode
}) {
  const { value: controlled, defaultValue = "", onValueChange, id, name, disabled, required, min, max, className, placeholder, ...aria } = props
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const nativeRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const value = controlled ?? uncontrolled
  const Icon = kind === "date" ? CalendarDays : Clock3
  const date = kind === "date" ? parseDateValue(value) : null
  const display = value ? (kind === "time" ? displayTime(value) : date?.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })) : ""

  useEffect(() => {
    const form = nativeRef.current?.form
    const reset = () => { setUncontrolled(defaultValue); setOpen(false) }
    form?.addEventListener("reset", reset)
    return () => form?.removeEventListener("reset", reset)
  }, [defaultValue])

  function commit(next: string) {
    if (controlled === undefined) setUncontrolled(next)
    onValueChange?.(next)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      {/* Keep native form submission and constraint validation without its browser popup. */}
      <input ref={nativeRef} type={value === "24:00" ? "text" : kind} name={name} value={value} onChange={() => {}} disabled={disabled} required={required} min={min} max={max} tabIndex={-1} aria-hidden="true" className="sr-only" onInvalid={(event) => { event.preventDefault(); triggerRef.current?.focus(); setOpen(true) }} />
      <Popover.Trigger
        ref={triggerRef} id={id} disabled={disabled} aria-required={required || undefined}
        {...aria}
        className={cn("flex h-11 w-full min-w-0 items-center gap-2.5 rounded-lg border border-input bg-card px-3 text-left text-sm text-foreground outline-none transition-colors hover:border-ring/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive", className)}
      >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("flex-1 truncate tabular-nums", !display && "text-muted-foreground")}>{display || placeholder || (kind === "date" ? "Select date" : "Select time")}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={8} className="z-[100]">
          <Popover.Popup
            ref={popupRef}
            initialFocus={() => popupRef.current?.querySelector<HTMLElement>('[data-date][tabindex="0"], [role="radio"][aria-checked="true"]') ?? true}
            className="w-[304px] max-w-[calc(100vw-2rem)] origin-[var(--transform-origin)] max-h-[var(--available-height)] overflow-y-auto rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl shadow-black/10 outline-none dark:shadow-black/40 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
          >
            {children(value, commit, () => setOpen(false))}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

function Calendar({ value, commit, min, max }: { value: string; commit: (value: string) => void; min?: string; max?: string }) {
  const today = localDateValue(new Date())
  const initial = value || (min && today < min ? min : max && today > max ? max : today)
  const [focused, setFocused] = useState(initial)
  const [month, setMonth] = useState(() => parseDateValue(initial) ?? new Date())
  const gridRef = useRef<HTMLDivElement>(null)
  const focusAfterRender = useRef(false)
  const days = calendarDays(month)
  const monthLabel = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  useEffect(() => {
    if (focusAfterRender.current) {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus()
      focusAfterRender.current = false
    }
  }, [focused, month])

  function navigate(date: Date, focus = false) {
    let next = localDateValue(date)
    if (min && next < min) next = min
    if (max && next > max) next = max
    const bounded = parseDateValue(next)
    if (!bounded) return
    focusAfterRender.current = focus
    setFocused(next)
    setMonth(bounded)
  }

  function onDayKey(event: KeyboardEvent<HTMLButtonElement>, day: Date) {
    const next = new Date(day)
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -((day.getDay() + 6) % 7), End: 6 - ((day.getDay() + 6) % 7) }
    if (event.key in steps) next.setDate(day.getDate() + steps[event.key])
    else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault()
      navigate(shiftCalendarMonth(day, (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1)), true)
      return
    } else return
    event.preventDefault()
    navigate(next, true)
  }

  const minDate = min ? parseDateValue(min) : null
  const maxDate = max ? parseDateValue(max) : null
  const monthIndex = month.getFullYear() * 12 + month.getMonth()
  return (
    <>
      <Popover.Title className="mb-3 flex items-center gap-2 text-sm font-semibold"><CalendarDays className="size-4 text-accent" />Choose a date</Popover.Title>
      <Popover.Description className="sr-only">Use arrow keys to move between days, Page Up or Page Down to change months, and Enter to select.</Popover.Description>
      <span className="sr-only" aria-live="polite">{monthLabel}</span>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous month" className={smallButton} disabled={!!minDate && monthIndex <= minDate.getFullYear() * 12 + minDate.getMonth()} onClick={() => navigate(shiftCalendarMonth(month, -1))}><ChevronLeft className="size-4" /></button>
        <div className="flex items-center gap-1">
          <select aria-label="Month" value={month.getMonth()} onChange={(event) => navigate(new Date(month.getFullYear(), Number(event.target.value), 1, 12))} className="max-w-32 rounded-md bg-popover px-1 py-1.5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {Array.from({ length: 12 }, (_, index) => <option key={index} value={index}>{new Date(2026, index, 1).toLocaleDateString("en-GB", { month: "long" })}</option>)}
          </select>
          <input aria-label="Year" type="number" key={month.getFullYear()} defaultValue={month.getFullYear()} min={minDate?.getFullYear() ?? 1} max={maxDate?.getFullYear() ?? 9999} onBlur={(event) => { const year = Number(event.target.value); if (year >= 1000 && year <= 9999) navigate(new Date(year, month.getMonth(), 1, 12)); else event.target.value = String(month.getFullYear()) }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur() } }} className="w-[4.5rem] rounded-md bg-muted/60 py-1.5 pl-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
        <button type="button" aria-label="Next month" className={smallButton} disabled={!!maxDate && monthIndex >= maxDate.getFullYear() * 12 + maxDate.getMonth()} onClick={() => navigate(shiftCalendarMonth(month, 1))}><ChevronRight className="size-4" /></button>
      </div>
      <div ref={gridRef} role="grid" aria-label={monthLabel}>
        <div role="row" className="mb-1 grid grid-cols-7">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span role="columnheader" key={day} className="py-2 text-center text-[10px] font-medium text-muted-foreground">{day}</span>)}</div>
        {Array.from({ length: 6 }, (_, row) => <div role="row" key={row} className="grid grid-cols-7 gap-y-1">{days.slice(row * 7, row * 7 + 7).map((day) => {
          const iso = localDateValue(day)
          return <div role="gridcell" aria-selected={iso === value} key={iso} className="p-0.5"><button type="button" data-date={iso} tabIndex={iso === focused ? 0 : -1} disabled={!dateInRange(iso, min, max)} aria-label={day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} aria-current={iso === today ? "date" : undefined} onKeyDown={(event) => onDayKey(event, day)} onFocus={() => setFocused(iso)} onClick={() => commit(iso)} className={cn("flex aspect-square w-full items-center justify-center rounded-lg text-xs font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-25", iso === value ? "bg-accent text-white shadow-sm" : "hover:bg-muted", day.getMonth() !== month.getMonth() && iso !== value && "text-muted-foreground", iso === today && iso !== value && "bg-accent/10 text-accent ring-1 ring-inset ring-accent/30")}>{day.getDate()}</button></div>
        })}</div>)}
      </div>
      <div className="mt-3 flex items-center justify-between border-t pt-3"><button type="button" className={actionButton} onClick={() => commit("")}>Clear</button><button type="button" disabled={!dateInRange(today, min, max)} className={cn(actionButton, "text-accent")} onClick={() => commit(today)}>Today</button></div>
    </>
  )
}

function TimeColumn({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (value: string) => void }) {
  const selectedRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { selectedRef.current?.scrollIntoView({ block: "nearest" }) }, [value])
  return (
    <div className="min-w-0">
      <p className="mb-2 text-center text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <div role="radiogroup" aria-label={label} className="max-h-48 space-y-1 overflow-y-auto overscroll-contain rounded-xl bg-muted/50 p-1 [scrollbar-width:thin]">
        {values.map((option, index) => <button key={option} type="button" role="radio" aria-checked={option === value} tabIndex={option === value ? 0 : -1} ref={option === value ? selectedRef : undefined} onClick={() => onChange(option)} onKeyDown={(event) => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? values.length - 1 : (index + (["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1) + values.length) % values.length; onChange(values[next]); (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus() } }} className={cn("h-9 w-full rounded-lg text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring", option === value ? "bg-accent text-white shadow-sm" : "text-muted-foreground hover:bg-card hover:text-foreground")}>{option}</button>)}
      </div>
    </div>
  )
}

function Clock({ value, commit, close, min, max, allowEndOfDay }: { value: string; commit: (value: string) => void; close: () => void; min?: string; max?: string; allowEndOfDay?: boolean }) {
  const initial = timeParts(value)
  const [hour, setHour] = useState(String(initial.hour).padStart(2, "0"))
  const [minute, setMinute] = useState(String(initial.minute).padStart(2, "0"))
  const [period, setPeriod] = useState(initial.period)
  const [endOfDay, setEndOfDay] = useState(value === "24:00")
  const next = endOfDay ? "24:00" : timeValue(Number(hour), Number(minute), period)
  const valid = (!min || next >= min) && (!max || next <= max)
  return (
    <>
      <Popover.Title className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="size-4 text-accent" />Choose a time</Popover.Title>
      <p aria-live="polite" className="my-4 text-center text-2xl font-semibold tracking-tight tabular-nums">{displayTime(next)}</p>
      <div className="grid grid-cols-3 gap-3">
        <TimeColumn label="Hour" values={Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"))} value={hour} onChange={(value) => { setHour(value); setEndOfDay(false) }} />
        <TimeColumn label="Minute" values={Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"))} value={minute} onChange={(value) => { setMinute(value); setEndOfDay(false) }} />
        <TimeColumn label="Period" values={["AM", "PM"]} value={period} onChange={(value) => { setPeriod(value); setEndOfDay(false) }} />
      </div>
      {allowEndOfDay && <button type="button" aria-pressed={endOfDay} onClick={() => { setEndOfDay(true); setHour("12"); setMinute("00"); setPeriod("AM") }} className={cn(actionButton, "mt-3 w-full", endOfDay && "bg-accent/10 text-accent")}>Midnight at end of day</button>}
      {!valid && <p className="mt-3 text-xs text-destructive">Choose a time {min ? `after ${displayTime(min)}` : ""}{min && max ? " and " : ""}{max ? `before ${displayTime(max)}` : ""}.</p>}
      <div className="mt-4 flex items-center justify-between border-t pt-3"><button type="button" className={actionButton} onClick={() => commit("")}>Clear</button><div className="flex gap-1"><button type="button" className={actionButton} onClick={close}>Cancel</button><button type="button" disabled={!valid} className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40" onClick={() => commit(next)}><Check className="size-3.5" />Done</button></div></div>
    </>
  )
}

export function DatePicker(props: PickerProps) {
  return <PickerField {...props} kind="date">{(value, commit) => <Calendar value={value} commit={commit} min={props.min} max={props.max} />}</PickerField>
}

export function TimePicker({ allowEndOfDay, ...props }: PickerProps & { allowEndOfDay?: boolean }) {
  return <PickerField {...props} kind="time">{(value, commit, close) => <Clock allowEndOfDay={allowEndOfDay} value={value} commit={commit} close={close} min={props.min} max={props.max} />}</PickerField>
}
