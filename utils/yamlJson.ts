import yaml from "js-yaml"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversionDirection = "yaml-to-json" | "json-to-yaml"

export type ConversionResult =
  | { ok: true;  output: string; direction: ConversionDirection; stats: ConversionStats }
  | { ok: false; error: string;  hint: string;  line?: number }

export type ConversionStats = {
  inputLines:   number
  outputLines:  number
  inputBytes:   number
  outputBytes:  number
  keys:         number
  depth:        number
}

export type YAMLStyle = "block" | "flow" | "compact"

export type JSONIndent = 2 | 4 | "tab"

export type ConvertOptions = {
  direction:   ConversionDirection
  yamlStyle:   YAMLStyle      // only used for json-to-yaml
  jsonIndent:  JSONIndent     // only used for yaml-to-json
  sortKeys:    boolean
}

export const DEFAULT_OPTIONS: ConvertOptions = {
  direction:  "yaml-to-json",
  yamlStyle:  "block",
  jsonIndent: 2,
  sortKeys:   false,
}

// ── Main converter ────────────────────────────────────────────────────────────

export function convert(
  input:   string,
  options: Partial<ConvertOptions> = {}
): ConversionResult {
  const opts    = { ...DEFAULT_OPTIONS, ...options }
  const trimmed = input.trim()

  if (!trimmed) {
    return {
      ok:    false,
      error: "Input is empty",
      hint:  opts.direction === "yaml-to-json"
        ? "Paste some YAML above to convert it to JSON."
        : "Paste some JSON above to convert it to YAML.",
    }
  }

  return opts.direction === "yaml-to-json"
    ? yamlToJson(trimmed, opts)
    : jsonToYaml(trimmed, opts)
}

// ── YAML → JSON ───────────────────────────────────────────────────────────────

function yamlToJson(input: string, opts: ConvertOptions): ConversionResult {
  let parsed: unknown

  try {
    parsed = yaml.load(input, { json: true })
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "Failed to parse YAML",
      hint:  getYAMLErrorHint(err, input),
      line:  extractYAMLLine(err),
    }
  }

  if (parsed === undefined) {
    return {
      ok:    false,
      error: "YAML parsed to undefined",
      hint:  "The input may be empty or contain only comments.",
    }
  }

  try {
    const sortedParsed = opts.sortKeys ? sortObjectKeys(parsed) : parsed
    const indent       = opts.jsonIndent === "tab" ? "\t" : opts.jsonIndent
    const output       = JSON.stringify(sortedParsed, null, indent)

    return {
      ok:        true,
      output,
      direction: "yaml-to-json",
      stats:     buildStats(input, output, parsed),
    }
  } catch (err) {
    return {
      ok:    false,
      error: "Failed to serialise to JSON",
      hint:  "The YAML may contain types that cannot be represented in JSON (e.g. functions, undefined).",
    }
  }
}

// ── JSON → YAML ───────────────────────────────────────────────────────────────

function jsonToYaml(input: string, opts: ConvertOptions): ConversionResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(input)
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "Failed to parse JSON",
      hint:  getJSONErrorHint(err, input),
    }
  }

  try {
    const sortedParsed = opts.sortKeys ? sortObjectKeys(parsed) : parsed
    const dumpOptions  = buildDumpOptions(opts)
    const output       = yaml.dump(sortedParsed, dumpOptions).trimEnd()

    return {
      ok:        true,
      output,
      direction: "json-to-yaml",
      stats:     buildStats(input, output, parsed),
    }
  } catch (err) {
    return {
      ok:    false,
      error: "Failed to serialise to YAML",
      hint:  "Check the JSON for circular references or unsupported value types.",
    }
  }
}

// ── YAML dump options ─────────────────────────────────────────────────────────

function buildDumpOptions(opts: ConvertOptions): yaml.DumpOptions {
  switch (opts.yamlStyle) {
    case "flow":
      return { flowLevel: 0, indent: 2 }
    case "compact":
      return { flowLevel: 2, indent: 2, condenseFlow: true }
    case "block":
    default:
      return { indent: 2, lineWidth: 120, noRefs: true }
  }
}

// ── Auto-detect direction ─────────────────────────────────────────────────────

export function detectDirection(input: string): ConversionDirection {
  const trimmed = input.trim()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json-to-yaml"
  return "yaml-to-json"
}

// ── Validator ─────────────────────────────────────────────────────────────────

export function validateYAML(input: string): { valid: boolean; message: string } {
  if (!input.trim()) return { valid: false, message: "Input is empty." }
  try {
    yaml.load(input, { json: true })
    return { valid: true, message: "Valid YAML" }
  } catch (err) {
    const line = extractYAMLLine(err)
    const msg  = err instanceof Error ? err.message : "Invalid YAML"
    return {
      valid:   false,
      message: line ? `${msg} (line ${line})` : msg,
    }
  }
}

export function validateJSON(input: string): { valid: boolean; message: string } {
  if (!input.trim()) return { valid: false, message: "Input is empty." }
  try {
    JSON.parse(input)
    return { valid: true, message: "Valid JSON" }
  } catch (err) {
    return {
      valid:   false,
      message: err instanceof Error ? err.message : "Invalid JSON",
    }
  }
}

// ── Stats builder ─────────────────────────────────────────────────────────────

function buildStats(
  input:  string,
  output: string,
  parsed: unknown
): ConversionStats {
  return {
    inputLines:  input.split("\n").length,
    outputLines: output.split("\n").length,
    inputBytes:  new TextEncoder().encode(input).length,
    outputBytes: new TextEncoder().encode(output).length,
    keys:        countKeys(parsed),
    depth:       getDepth(parsed),
  }
}

// ── Key sorter ────────────────────────────────────────────────────────────────

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys)
  if (typeof value === "object" && value !== null) {
    return Object.keys(value as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObjectKeys((value as Record<string, unknown>)[key])
        return acc
      }, {})
  }
  return value
}

// ── Error hints ───────────────────────────────────────────────────────────────

function getYAMLErrorHint(err: unknown, input: string): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : ""

  if (msg.includes("tab"))              return "YAML does not allow tab characters for indentation — use spaces instead."
  if (msg.includes("duplicate key"))    return "Remove duplicate keys — YAML objects must have unique keys."
  if (msg.includes("unexpected end"))   return "The YAML appears to be incomplete or truncated."
  if (msg.includes("bad indentation"))  return "Check your indentation — YAML is whitespace-sensitive."
  if (msg.includes("cannot read"))      return "Check that all strings with special characters are quoted."
  if (input.includes("\t"))             return "Replace tab characters with spaces — YAML requires space indentation."
  if (/:\s*$/.test(input.split("\n")[0])) return "A key with no value — add a value or use 'null' explicitly."

  return "Check the YAML syntax — pay attention to indentation and special characters."
}

function getJSONErrorHint(err: unknown, input: string): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : ""

  if (msg.includes("unexpected token"))     return "Check for missing quotes around keys or invalid values."
  if (msg.includes("unterminated string"))  return "A string is missing its closing quote."
  if (msg.includes("expected property"))    return "Object keys must be quoted strings."
  if (/,\s*[}\]]/.test(input))             return "JSON does not allow trailing commas."
  if (input.trimStart().startsWith("'"))   return "JSON requires double quotes, not single quotes."
  if (/\/\/|\/\*/.test(input))             return "JSON does not support comments — remove them first."

  return "Check the JSON syntax and try again."
}

function extractYAMLLine(err: unknown): number | undefined {
  if (err instanceof yaml.YAMLException) {
    return err.mark?.line ? err.mark.line + 1 : undefined
  }
  return undefined
}

// ── Tree utilities ────────────────────────────────────────────────────────────

function countKeys(value: unknown): number {
  if (typeof value !== "object" || value === null) return 0
  if (Array.isArray(value)) return value.reduce<number>((s, v) => s + countKeys(v), 0)
  return (
    Object.keys(value).length +
    Object.values(value).reduce<number>((s, v) => s + countKeys(v), 0)
  )
}

function getDepth(value: unknown): number {
  if (typeof value !== "object" || value === null) return 0
  const children = Array.isArray(value) ? value : Object.values(value)
  if (children.length === 0) return 1
  return 1 + Math.max(...children.map(getDepth))
}

// ── Sample data ───────────────────────────────────────────────────────────────

export const SAMPLES: Record<ConversionDirection, string> = {
  "yaml-to-json": `name: DevForge
version: 1.0.0
description: Free developer tools
features:
  - name: JSON Formatter
    free: true
  - name: JWT Decoder
    free: true
meta:
  author: DevForge Team
  license: MIT
  tags:
    - developer
    - tools
    - free`,

  "json-to-yaml": `{
  "name": "DevForge",
  "version": "1.0.0",
  "description": "Free developer tools",
  "features": [
    { "name": "JSON Formatter", "free": true },
    { "name": "JWT Decoder",    "free": true }
  ],
  "meta": {
    "author": "DevForge Team",
    "license": "MIT",
    "tags": ["developer", "tools", "free"]
  }
}`,
}