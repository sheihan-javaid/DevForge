// ── Types ─────────────────────────────────────────────────────────────────────

export type CronResult =
  | { ok: true;  data: CronData }
  | { ok: false; error: string; hint: string; field?: CronField }

export type CronField =
  | "minute"
  | "hour"
  | "day"
  | "month"
  | "weekday"

export type CronData = {
  expression:  string
  fields:      CronFields
  description: string
  summary:     string        // short one-liner
  nextRuns:    Date[]        // next 5 upcoming run times
  isValid:     boolean
  preset?:     string        // matched preset label if any
}

export type CronFields = {
  minute:  CronFieldData
  hour:    CronFieldData
  day:     CronFieldData
  month:   CronFieldData
  weekday: CronFieldData
}

export type CronFieldData = {
  raw:         string
  type:        CronFieldType
  description: string
  values?:     number[]      // resolved concrete values
}

export type CronFieldType =
  | "wildcard"     // *
  | "value"        // 5
  | "list"         // 1,2,3
  | "range"        // 1-5
  | "step"         // */5
  | "range-step"   // 1-5/2

// ── Field metadata ────────────────────────────────────────────────────────────

type FieldMeta = {
  name:    CronField
  label:   string
  min:     number
  max:     number
  names?:  string[]
}

const FIELDS: FieldMeta[] = [
  {
    name:  "minute",
    label: "Minute",
    min:   0,
    max:   59,
  },
  {
    name:  "hour",
    label: "Hour",
    min:   0,
    max:   23,
  },
  {
    name:  "day",
    label: "Day of month",
    min:   1,
    max:   31,
  },
  {
    name:  "month",
    label: "Month",
    min:   1,
    max:   12,
    names: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  },
  {
    name:  "weekday",
    label: "Day of week",
    min:   0,
    max:   6,
    names: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
  },
]

// ── Presets ───────────────────────────────────────────────────────────────────

export type CronPreset = {
  label:      string
  expression: string
  description: string
}

export const PRESETS: CronPreset[] = [
  { label: "Every minute",        expression: "* * * * *",    description: "Runs every minute"                        },
  { label: "Every 5 minutes",     expression: "*/5 * * * *",  description: "Runs every 5 minutes"                     },
  { label: "Every 15 minutes",    expression: "*/15 * * * *", description: "Runs every 15 minutes"                    },
  { label: "Every 30 minutes",    expression: "*/30 * * * *", description: "Runs every 30 minutes"                    },
  { label: "Every hour",          expression: "0 * * * *",    description: "Runs at the start of every hour"          },
  { label: "Every 6 hours",       expression: "0 */6 * * *",  description: "Runs every 6 hours"                       },
  { label: "Every day at noon",   expression: "0 12 * * *",   description: "Runs at 12:00 every day"                  },
  { label: "Every day midnight",  expression: "0 0 * * *",    description: "Runs at midnight every day"               },
  { label: "Every weekday",       expression: "0 9 * * 1-5",  description: "Runs at 9am Monday through Friday"        },
  { label: "Every weekend",       expression: "0 10 * * 0,6", description: "Runs at 10am on Saturday and Sunday"      },
  { label: "Every Monday",        expression: "0 9 * * 1",    description: "Runs at 9am every Monday"                 },
  { label: "Every month",         expression: "0 0 1 * *",    description: "Runs at midnight on the 1st of the month" },
  { label: "Every quarter",       expression: "0 0 1 */3 *",  description: "Runs at midnight every 3 months"          },
  { label: "Every year",          expression: "0 0 1 1 *",    description: "Runs at midnight on January 1st"          },
  { label: "Every Sunday night",  expression: "0 23 * * 0",   description: "Runs at 11pm every Sunday"                },
]

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseCron(expression: string): CronResult {
  const trimmed = expression.trim()

  if (!trimmed) {
    return {
      ok:    false,
      error: "Expression is empty",
      hint:  "Enter a cron expression like \"*/5 * * * *\"",
    }
  }

  // Handle @shortcuts
  const expanded = expandShorthand(trimmed)
  if (!expanded) {
    return {
      ok:    false,
      error: `Unknown shorthand: "${trimmed}"`,
      hint:  "Valid shorthands: @yearly, @monthly, @weekly, @daily, @hourly, @midnight",
    }
  }

  const parts = expanded.split(/\s+/)

  if (parts.length !== 5) {
    return {
      ok:    false,
      error: `Expected 5 fields, got ${parts.length}`,
      hint:  "A cron expression must have exactly 5 space-separated fields: minute hour day month weekday",
    }
  }

  // Parse each field
  const fieldResults: Partial<CronFields> = {}

  for (let i = 0; i < FIELDS.length; i++) {
    const meta   = FIELDS[i]
    const raw    = parts[i]
    const result = parseField(raw, meta)

    if (!result.ok) {
      return {
        ok:    false,
        error: result.error,
        hint:  result.hint,
        field: meta.name,
      }
    }

    fieldResults[meta.name] = result.data
  }

  const fields      = fieldResults as CronFields
  const description = describeExpression(fields)
  const summary     = summarise(fields)
  const nextRuns    = getNextRuns(fields, 5)
  const preset      = PRESETS.find((p) => p.expression === expanded)?.label

  return {
    ok: true,
    data: {
      expression: expanded,
      fields,
      description,
      summary,
      nextRuns,
      isValid: true,
      preset,
    },
  }
}

// ── Shorthand expander ────────────────────────────────────────────────────────

function expandShorthand(expr: string): string | null {
  const map: Record<string, string> = {
    "@yearly":   "0 0 1 1 *",
    "@annually": "0 0 1 1 *",
    "@monthly":  "0 0 1 * *",
    "@weekly":   "0 0 * * 0",
    "@daily":    "0 0 * * *",
    "@midnight": "0 0 * * *",
    "@hourly":   "0 * * * *",
  }
  return map[expr.toLowerCase()] ?? (expr.includes("@") ? null : expr)
}

// ── Field parser ──────────────────────────────────────────────────────────────

type FieldParseResult =
  | { ok: true;  data: CronFieldData }
  | { ok: false; error: string; hint: string }

function parseField(raw: string, meta: FieldMeta): FieldParseResult {
  const part = raw.trim()

  // Wildcard
  if (part === "*") {
    return {
      ok: true,
      data: {
        raw,
        type:        "wildcard",
        description: `every ${meta.label.toLowerCase()}`,
        values:      range(meta.min, meta.max),
      },
    }
  }

  // Step: */n or n/n
  if (part.includes("/")) {
    const [rangeStr, stepStr] = part.split("/")
    const step = parseInt(stepStr)

    if (isNaN(step) || step < 1) {
      return {
        ok:    false,
        error: `Invalid step value "${stepStr}" in ${meta.label} field`,
        hint:  "Step value must be a positive integer (e.g. */5 or 1-30/2)",
      }
    }

    let start = meta.min
    let end   = meta.max

    if (rangeStr !== "*") {
      const [a, b] = rangeStr.split("-").map(Number)
      if (!isNaN(a) && !isNaN(b)) {
        start = a; end = b
      } else if (!isNaN(a)) {
        start = a
      }
    }

    if (!inRange(start, meta.min, meta.max) || !inRange(end, meta.min, meta.max)) {
      return {
        ok:    false,
        error: `Value out of range in ${meta.label} field`,
        hint:  `${meta.label} must be between ${meta.min} and ${meta.max}`,
      }
    }

    const values = []
    for (let v = start; v <= end; v += step) values.push(v)

    const type = rangeStr.includes("-") ? "range-step" : "step"
    const desc = rangeStr === "*"
      ? `every ${step} ${meta.label.toLowerCase()}${step > 1 ? "s" : ""}`
      : `every ${step} ${meta.label.toLowerCase()}${step > 1 ? "s" : ""} from ${formatValue(start, meta)} to ${formatValue(end, meta)}`

    return { ok: true, data: { raw, type, description: desc, values } }
  }

  // List: 1,2,3
  if (part.includes(",")) {
    const items  = part.split(",")
    const values: number[] = []

    for (const item of items) {
      const n = resolveValue(item.trim(), meta)
      if (n === null || !inRange(n, meta.min, meta.max)) {
        return {
          ok:    false,
          error: `Invalid value "${item}" in ${meta.label} field`,
          hint:  `${meta.label} values must be between ${meta.min} and ${meta.max}${meta.names ? ` or ${meta.names.slice(0, 3).join(", ")}...` : ""}`,
        }
      }
      values.push(n)
    }

    values.sort((a, b) => a - b)
    const desc = values.map((v) => formatValue(v, meta)).join(", ")
    return { ok: true, data: { raw, type: "list", description: desc, values } }
  }

  // Range: 1-5
  if (part.includes("-")) {
    const [aStr, bStr] = part.split("-")
    const a = resolveValue(aStr, meta)
    const b = resolveValue(bStr, meta)

    if (a === null || b === null || !inRange(a, meta.min, meta.max) || !inRange(b, meta.min, meta.max)) {
      return {
        ok:    false,
        error: `Invalid range "${part}" in ${meta.label} field`,
        hint:  `${meta.label} must be between ${meta.min} and ${meta.max}`,
      }
    }

    if (a > b) {
      return {
        ok:    false,
        error: `Range start (${a}) must be less than end (${b})`,
        hint:  `Reverse the range: ${b}-${a} → ${a}-${b}`,
      }
    }

    const values = range(a, b)
    const desc   = `${formatValue(a, meta)} through ${formatValue(b, meta)}`
    return { ok: true, data: { raw, type: "range", description: desc, values } }
  }

  // Single value
  const n = resolveValue(part, meta)
  if (n === null || !inRange(n, meta.min, meta.max)) {
    return {
      ok:    false,
      error: `Invalid value "${part}" in ${meta.label} field`,
      hint:  `${meta.label} must be between ${meta.min} and ${meta.max}${meta.names ? ` or a name like ${meta.names[1]}` : ""}`,
    }
  }

  return {
    ok: true,
    data: {
      raw,
      type:        "value",
      description: formatValue(n, meta),
      values:      [n],
    },
  }
}

// ── Human-readable description ────────────────────────────────────────────────

function describeExpression(fields: CronFields): string {
  const { minute, hour, day, month, weekday } = fields
  const parts: string[] = []

  // Time
  if (minute.type === "wildcard" && hour.type === "wildcard") {
    parts.push("every minute")
  } else if (minute.type === "step" && hour.type === "wildcard") {
    parts.push(minute.description)
  } else if (minute.type === "wildcard" && hour.type !== "wildcard") {
    parts.push(`every minute of ${hour.description}`)
  } else {
    const m = minute.type === "value" ? minute.description.padStart(2, "0") : minute.description
    const h = hour.type   === "value" ? hour.description                     : hour.description
    parts.push(`at ${m} past ${h}`)
  }

  // Day / weekday
  if (day.type !== "wildcard" && weekday.type !== "wildcard") {
    parts.push(`on day ${day.description} of the month and on ${weekday.description}`)
  } else if (day.type !== "wildcard") {
    parts.push(`on day ${day.description} of the month`)
  } else if (weekday.type !== "wildcard") {
    parts.push(`on ${weekday.description}`)
  }

  // Month
  if (month.type !== "wildcard") {
    parts.push(`in ${month.description}`)
  }

  return capitalise(parts.join(", ")) + "."
}

function summarise(fields: CronFields): string {
  const { minute, hour, day, month, weekday } = fields

  if (allWildcard([minute, hour, day, month, weekday])) return "Every minute"
  if (isStep(minute, 5)  && allWildcard([hour, day, month, weekday])) return "Every 5 minutes"
  if (isStep(minute, 15) && allWildcard([hour, day, month, weekday])) return "Every 15 minutes"
  if (isStep(minute, 30) && allWildcard([hour, day, month, weekday])) return "Every 30 minutes"
  if (isValue(minute, 0) && allWildcard([day, month, weekday]))       return `Every hour at :00`
  if (isValue(minute, 0) && isValue(hour, 0) && allWildcard([day, month, weekday])) return "Daily at midnight"
  if (isValue(minute, 0) && isValue(hour, 12) && allWildcard([day, month, weekday])) return "Daily at noon"
  if (isValue(minute, 0) && isValue(hour, 0) && isValue(day, 1) && allWildcard([month, weekday])) return "Monthly on the 1st"
  if (isValue(minute, 0) && isValue(hour, 0) && isValue(day, 1) && isValue(month, 1)) return "Yearly on Jan 1st"

  return describeExpression(fields).replace(/\.$/, "")
}

// ── Next run calculator ───────────────────────────────────────────────────────

function getNextRuns(fields: CronFields, count: number): Date[] {
  const results: Date[] = []
  const now    = new Date()
  const cursor = new Date(now)
  cursor.setSeconds(0, 0)
  cursor.setMinutes(cursor.getMinutes() + 1)

  const maxIter = 60 * 24 * 366  // up to a year of minutes

  for (let i = 0; i < maxIter && results.length < count; i++) {
    if (matchesCron(cursor, fields)) {
      results.push(new Date(cursor))
    }
    cursor.setMinutes(cursor.getMinutes() + 1)
  }

  return results
}

function matchesCron(date: Date, fields: CronFields): boolean {
  const minute  = date.getMinutes()
  const hour    = date.getHours()
  const day     = date.getDate()
  const month   = date.getMonth() + 1
  const weekday = date.getDay()

  return (
    matchesField(minute,  fields.minute)  &&
    matchesField(hour,    fields.hour)    &&
    matchesField(day,     fields.day)     &&
    matchesField(month,   fields.month)   &&
    matchesField(weekday, fields.weekday)
  )
}

function matchesField(value: number, field: CronFieldData): boolean {
  return field.values?.includes(value) ?? true
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function resolveValue(raw: string, meta: FieldMeta): number | null {
  const n = parseInt(raw)
  if (!isNaN(n)) return n

  // Named month/weekday (case-insensitive)
  if (meta.names) {
    const idx = meta.names.findIndex(
      (name) => name.toLowerCase() === raw.toLowerCase()
    )
    if (idx !== -1) return meta.min + idx
  }

  return null
}

function formatValue(n: number, meta: FieldMeta): string {
  if (meta.names) {
    const name = meta.names[n - meta.min]
    if (name) return name
  }
  if (meta.name === "hour") {
    const suffix = n >= 12 ? "pm" : "am"
    const h      = n % 12 === 0 ? 12 : n % 12
    return `${h}${suffix}`
  }
  return String(n)
}

function range(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i)
}

function inRange(n: number, min: number, max: number): boolean {
  return n >= min && n <= max
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function allWildcard(fields: CronFieldData[]): boolean {
  return fields.every((f) => f.type === "wildcard")
}

function isStep(field: CronFieldData, step: number): boolean {
  return field.type === "step" && field.raw === `*/${step}`
}

function isValue(field: CronFieldData, val: number): boolean {
  return field.type === "value" && field.values?.[0] === val
}