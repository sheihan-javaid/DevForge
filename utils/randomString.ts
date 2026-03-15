// ── Types ─────────────────────────────────────────────────────────────────────

export type StringCharset =
  | "alphanumeric"
  | "alphabetic"
  | "numeric"
  | "hex"
  | "base64url"
  | "ascii"
  | "custom"

export type StringFormat =
  | "plain"
  | "array"       // ["abc", "def", ...]
  | "json"        // ["abc","def"]
  | "csv"         // abc,def,ghi
  | "lines"       // one per line

export type StringOptions = {
  length:       number
  count:        number
  charset:      StringCharset
  customChars:  string
  format:       StringFormat
  unique:       boolean        // no duplicate strings in batch
  noDuplicateChars: boolean    // no repeated chars within a single string
  prefix:       string
  suffix:       string
}

export type StringResult = {
  strings: string[]
  output:  string
  stats:   StringStats
}

export type StringStats = {
  count:       number
  length:      number
  poolSize:    number
  entropy:     number
  unique:      boolean
}

export const DEFAULT_OPTIONS: StringOptions = {
  length:           12,
  count:            1,
  charset:          "alphanumeric",
  customChars:      "",
  format:           "lines",
  unique:           false,
  noDuplicateChars: false,
  prefix:           "",
  suffix:           "",
}

// ── Charset pools ─────────────────────────────────────────────────────────────

const POOLS: Record<Exclude<StringCharset, "custom">, string> = {
  alphanumeric: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  alphabetic:   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numeric:      "0123456789",
  hex:          "0123456789abcdef",
  base64url:    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  ascii:        "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~",
}

export const CHARSET_META: Record<StringCharset, { label: string; example: string }> = {
  alphanumeric:     { label: "Alphanumeric",  example: "A–Z a–z 0–9"          },
  alphabetic:       { label: "Alphabetic",    example: "A–Z a–z"               },
  numeric:          { label: "Numeric",       example: "0–9"                   },
  hex:              { label: "Hex",           example: "0–9 a–f"               },
  base64url:        { label: "Base64URL",     example: "A–Z a–z 0–9 - _"      },
  ascii:            { label: "Printable ASCII", example: "All printable chars" },
  custom:           { label: "Custom",        example: "Define your own chars" },
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateRandomString(
  options: Partial<StringOptions> = {}
): StringResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Clamp
  opts.length = Math.max(1,   Math.min(opts.length, 4096))
  opts.count  = Math.max(1,   Math.min(opts.count,  1000))

  const pool = buildPool(opts)

  if (!pool) {
    return {
      strings: [],
      output:  "",
      stats:   { count: 0, length: opts.length, poolSize: 0, entropy: 0, unique: false },
    }
  }

  const strings = generateBatch(pool, opts)
  const output  = formatOutput(strings, opts)
  const entropy = calcEntropy(pool.length, opts.length)

  return {
    strings,
    output,
    stats: {
      count:    strings.length,
      length:   opts.length,
      poolSize: pool.length,
      entropy:  Math.round(entropy),
      unique:   opts.unique,
    },
  }
}

// ── Batch builder ─────────────────────────────────────────────────────────────

function generateBatch(pool: string, opts: StringOptions): string[] {
  const results  = new Set<string>()
  const maxTries = opts.count * 10
  let   tries    = 0

  while (results.size < opts.count && tries < maxTries) {
    const s = generateOne(pool, opts)
    if (opts.unique) {
      results.add(s)
    } else {
      results.add(s + `__${results.size}`)  // allow dupes via unique key
    }
    tries++
  }

  // Strip the dedup keys if not using unique mode
  return opts.unique
    ? [...results]
    : [...results].map((s) => s.replace(/__\d+$/, ""))
}

function generateOne(pool: string, opts: StringOptions): string {
  const chars  = [...new Set(pool)].join("")   // deduplicate pool chars
  let   result = ""
  const used   = new Set<string>()
  const target = opts.noDuplicateChars
    ? Math.min(opts.length, chars.length)
    : opts.length

  for (let i = 0; i < target; i++) {
    let char: string

    if (opts.noDuplicateChars) {
      const available = chars.split("").filter((c) => !used.has(c))
      if (available.length === 0) break
      char = pickRandom(available.join(""))
      used.add(char)
    } else {
      char = pickRandom(chars)
    }

    result += char
  }

  return `${opts.prefix}${result}${opts.suffix}`
}

// ── Pool builder ──────────────────────────────────────────────────────────────

function buildPool(opts: StringOptions): string {
  if (opts.charset === "custom") {
    return [...new Set(opts.customChars)].join("")
  }
  return POOLS[opts.charset]
}

// ── Output formatter ──────────────────────────────────────────────────────────

function formatOutput(strings: string[], opts: StringOptions): string {
  switch (opts.format) {
    case "array":
      return `[${strings.map((s) => `"${s}"`).join(", ")}]`

    case "json":
      return JSON.stringify(strings, null, 2)

    case "csv":
      return strings.join(",")

    case "lines":
    default:
      return strings.join("\n")
  }
}

// ── Entropy ───────────────────────────────────────────────────────────────────

function calcEntropy(poolSize: number, length: number): number {
  if (poolSize <= 0) return 0
  return length * Math.log2(poolSize)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickRandom(charset: string): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return charset[buf[0] % charset.length]
}

// ── Presets ───────────────────────────────────────────────────────────────────

export type StringPreset = {
  label:   string
  options: Partial<StringOptions>
}

export const PRESETS: StringPreset[] = [
  {
    label:   "API key",
    options: { length: 32, count: 1, charset: "alphanumeric" },
  },
  {
    label:   "Secret token",
    options: { length: 64, count: 1, charset: "base64url" },
  },
  {
    label:   "Hex color",
    options: { length: 6, count: 5, charset: "hex", prefix: "#" },
  },
  {
    label:   "OTP code",
    options: { length: 6, count: 1, charset: "numeric" },
  },
  {
    label:   "Session ID",
    options: { length: 40, count: 1, charset: "alphanumeric" },
  },
  {
    label:   "Short code",
    options: { length: 8, count: 10, charset: "alphanumeric" },
  },
  {
    label:   "PIN",
    options: { length: 4, count: 1, charset: "numeric", noDuplicateChars: false },
  },
  {
    label:   "Passphrase chars",
    options: { length: 20, count: 3, charset: "ascii" },
  },
]