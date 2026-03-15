export type JSONFormatResult =
  | { ok: true;  output: string; type: JSONValueType; stats: JSONStats }
  | { ok: false; error: string;  hint:  string;       line?: number; col?: number }

export type JSONValueType = "object" | "array" | "string" | "number" | "boolean" | "null"

export type JSONStats = {
  keys:       number
  depth:      number
  characters: number
  lines:      number
}

// ── Main formatter ────────────────────────────────────────────────────────────

export function formatJSON(input: string, indent: 2 | 4 | "tab" = 2): JSONFormatResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: "Input is empty", hint: "Paste some JSON above to get started." }
  }

  try {
    const parsed  = JSON.parse(trimmed)
    const indentArg = indent === "tab" ? "\t" : indent
    const output  = JSON.stringify(parsed, null, indentArg)

    return {
      ok: true,
      output,
      type:  getJSONType(parsed),
      stats: getJSONStats(parsed, output),
    }
  } catch (err) {
    return {
      ok: false,
      ...parseJSONError(err, trimmed),
    }
  }
}

// ── Minifier ─────────────────────────────────────────────────────────────────

export function minifyJSON(input: string): JSONFormatResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ok: false, error: "Input is empty", hint: "Paste some JSON above." }
  }

  try {
    const parsed = JSON.parse(trimmed)
    const output = JSON.stringify(parsed)
    return {
      ok: true,
      output,
      type:  getJSONType(parsed),
      stats: getJSONStats(parsed, output),
    }
  } catch (err) {
    return { ok: false, ...parseJSONError(err, trimmed) }
  }
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateJSON(input: string): { valid: boolean; message: string } {
  const trimmed = input.trim()
  if (!trimmed) return { valid: false, message: "Input is empty." }

  try {
    JSON.parse(trimmed)
    return { valid: true, message: "Valid JSON" }
  } catch (err) {
    const { error, line, col } = parseJSONError(err, trimmed)
    const location = line != null ? ` (line ${line}, col ${col})` : ""
    return { valid: false, message: `${error}${location}` }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getJSONType(value: unknown): JSONValueType {
  if (value === null)              return "null"
  if (Array.isArray(value))        return "array"
  switch (typeof value) {
    case "object":                 return "object"
    case "string":                 return "string"
    case "number":                 return "number"
    case "boolean":                return "boolean"
    default:                       return "null"
  }
}

function getJSONStats(parsed: unknown, serialized: string): JSONStats {
  return {
    keys:       countKeys(parsed),
    depth:      getDepth(parsed),
    characters: serialized.length,
    lines:      serialized.split("\n").length,
  }
}

function countKeys(value: unknown): number {
  if (typeof value !== "object" || value === null) return 0
  if (Array.isArray(value)) return value.reduce<number>((sum, v) => sum + countKeys(v), 0)
  return Object.keys(value).length +
    Object.values(value).reduce<number>((sum, v) => sum + countKeys(v), 0)
}

function getDepth(value: unknown): number {
  if (typeof value !== "object" || value === null) return 0
  const children = Array.isArray(value) ? value : Object.values(value)
  if (children.length === 0) return 1
  return 1 + Math.max(...children.map(getDepth))
}

function parseJSONError(
  err: unknown,
  input: string
): { error: string; hint: string; line?: number; col?: number } {
  const raw = err instanceof Error ? err.message : "Unknown error"

  // Most engines include "at position N" or "line N column N"
  const posMatch  = raw.match(/at position (\d+)/)
  const lineMatch = raw.match(/line (\d+) column (\d+)/)

  let line: number | undefined
  let col:  number | undefined

  if (lineMatch) {
    line = parseInt(lineMatch[1])
    col  = parseInt(lineMatch[2])
  } else if (posMatch) {
    const pos    = parseInt(posMatch[1])
    const before = input.slice(0, pos)
    line = before.split("\n").length
    col  = pos - before.lastIndexOf("\n")
  }

  // Friendlier messages for the most common mistakes
  const hint = getFriendlyHint(raw, input)

  return { error: raw, hint, line, col }
}

function getFriendlyHint(errorMsg: string, input: string): string {
  const lower = errorMsg.toLowerCase()

  if (lower.includes("unexpected token '}'"))   return "Remove the trailing comma before the closing brace."
  if (lower.includes("unexpected token ']'"))   return "Remove the trailing comma before the closing bracket."
  if (lower.includes("unexpected token"))       return "Check for missing quotes around keys or unescaped special characters."
  if (lower.includes("unterminated string"))    return "A string is missing its closing quote."
  if (lower.includes("expected property name")) return "Object keys must be quoted strings."

  if (input.trimStart().startsWith("'"))        return "JSON requires double quotes, not single quotes."
  if (/\/\/|\/\*/.test(input))                  return "JSON doesn't support comments. Remove them first."
  if (/,\s*[}\]]/.test(input))                  return "JSON doesn't allow trailing commas."

  return "Check your JSON for syntax errors and try again."
}