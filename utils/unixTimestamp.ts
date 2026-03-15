// ── Types ─────────────────────────────────────────────────────────────────────

export type TimestampResult =
  | { ok: true;  data: TimestampData }
  | { ok: false; error: string; hint: string }

export type TimestampData = {
  unix:      number
  unixMs:    number
  utc:       string
  local:     string
  iso:       string
  relative:  string
  parts:     DateParts
  isFuture:  boolean
  isMsInput: boolean
}

export type DateParts = {
  year:        number
  month:       number
  day:         number
  hour:        number
  minute:      number
  second:      number
  weekday:     string
  monthName:   string
  timezone:    string
  offsetLabel: string
}

export type ConvertResult =
  | { ok: true;  unix: number; unixMs: number }
  | { ok: false; error: string; hint: string }

export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const

export type CommonTimezone = (typeof COMMON_TIMEZONES)[number]

// ── Unix → Date ───────────────────────────────────────────────────────────────

export function unixToDate(input: string | number): TimestampResult {
  const raw = String(input).trim()

  if (!raw) {
    return {
      ok: false,
      error: "Input is empty",
      hint:  "Enter a Unix timestamp to convert.",
    }
  }

  if (!/^-?\d+$/.test(raw)) {
    return {
      ok: false,
      error: "Not a valid integer",
      hint:  "Unix timestamps are whole numbers — no decimals or letters.",
    }
  }

  const num       = Number(raw)
  const isMsInput = raw.length >= 13 && num > 0
  const seconds   = isMsInput ? Math.floor(num / 1000) : num

  // Sanity range: year 1000 → year 3000
  const MIN_S = -30_610_224_000
  const MAX_S =  32_503_680_000

  if (seconds < MIN_S || seconds > MAX_S) {
    return {
      ok: false,
      error: "Timestamp out of reasonable range",
      hint:  "Expected a Unix timestamp between year 1000 and 3000.",
    }
  }

  const date = new Date(seconds * 1000)

  if (isNaN(date.getTime())) {
    return {
      ok: false,
      error: "Could not construct a valid date",
      hint:  "Check the timestamp value and try again.",
    }
  }

  return {
    ok:   true,
    data: buildTimestampData(date, seconds, isMsInput),
  }
}

// ── Date → Unix ───────────────────────────────────────────────────────────────

export function dateToUnix(input: string): ConvertResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return {
      ok: false,
      error: "Input is empty",
      hint:  "Enter a date string to convert to Unix.",
    }
  }

  const date = new Date(trimmed)

  if (isNaN(date.getTime())) {
    return {
      ok: false,
      error: "Could not parse date string",
      hint:  'Try ISO 8601 format: "2024-01-15T12:00:00Z" or "Jan 15 2024".',
    }
  }

  return {
    ok:     true,
    unix:   Math.floor(date.getTime() / 1000),
    unixMs: date.getTime(),
  }
}

// ── Now ───────────────────────────────────────────────────────────────────────

export function nowTimestamp(): TimestampData {
  const now = new Date()
  return buildTimestampData(now, Math.floor(now.getTime() / 1000), false)
}

// ── Timezone formatter ────────────────────────────────────────────────────────

export function formatInTimezone(unix: number, tz: string): string {
  try {
    return new Date(unix * 1000).toLocaleString("en-US", {
      timeZone:  tz,
      dateStyle: "full",
      timeStyle: "long",
    })
  } catch {
    return "Invalid timezone"
  }
}

// ── Internal builders ─────────────────────────────────────────────────────────

function buildTimestampData(
  date: Date,
  seconds: number,
  isMsInput: boolean
): TimestampData {
  const now = Date.now() / 1000

  return {
    unix:      seconds,
    unixMs:    seconds * 1000,
    utc:       date.toUTCString(),
    local:     date.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" }),
    iso:       date.toISOString(),
    relative:  formatRelative(seconds),
    parts:     buildDateParts(date),
    isFuture:  seconds > now,
    isMsInput,
  }
}

function buildDateParts(date: Date): DateParts {
  return {
    year:        date.getFullYear(),
    month:       date.getMonth() + 1,
    day:         date.getDate(),
    hour:        date.getHours(),
    minute:      date.getMinutes(),
    second:      date.getSeconds(),
    weekday:     date.toLocaleDateString(undefined, { weekday: "long" }),
    monthName:   date.toLocaleDateString(undefined, { month: "long" }),
    timezone:    Intl.DateTimeFormat().resolvedOptions().timeZone,
    offsetLabel: formatOffset(date.getTimezoneOffset()),
  }
}

// ── Private utils ─────────────────────────────────────────────────────────────

function formatOffset(offsetMinutes: number): string {
  const sign    = offsetMinutes <= 0 ? "+" : "-"
  const abs     = Math.abs(offsetMinutes)
  const hours   = String(Math.floor(abs / 60)).padStart(2, "0")
  const minutes = String(abs % 60).padStart(2, "0")
  return `UTC${sign}${hours}:${minutes}`
}

function formatRelative(seconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - seconds
  const abs  = Math.abs(diff)
  const past = diff >= 0

  if (abs < 60)         return past ? "just now"                         : "in a few seconds"
  if (abs < 3_600)      return past ? `${Math.floor(abs / 60)}m ago`     : `in ${Math.floor(abs / 60)}m`
  if (abs < 86_400)     return past ? `${Math.floor(abs / 3_600)}h ago`  : `in ${Math.floor(abs / 3_600)}h`
  if (abs < 2_592_000)  return past ? `${Math.floor(abs / 86_400)}d ago` : `in ${Math.floor(abs / 86_400)}d`
  if (abs < 31_536_000) return past ? `${Math.floor(abs / 2_592_000)}mo ago` : `in ${Math.floor(abs / 2_592_000)}mo`
  return past
    ? `${Math.floor(abs / 31_536_000)}y ago`
    : `in ${Math.floor(abs / 31_536_000)}y`
}