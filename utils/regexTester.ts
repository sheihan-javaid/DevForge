// ── Types ─────────────────────────────────────────────────────────────────────

export type RegexResult =
  | { ok: true;  data: RegexData }
  | { ok: false; error: string;  hint: string }

export type RegexData = {
  pattern:     string
  flags:       RegexFlags
  matches:     RegexMatch[]
  groups:      RegexGroup[]
  highlighted: HighlightChunk[]
  stats:       RegexStats
  isGlobal:    boolean
}

export type RegexFlags = {
  global:      boolean   // g
  ignoreCase:  boolean   // i
  multiline:   boolean   // m
  dotAll:      boolean   // s
  unicode:     boolean   // u
  sticky:      boolean   // y
}

export type RegexMatch = {
  index:       number
  value:       string
  length:      number
  groups:      Record<string, string | undefined>
  namedGroups: Record<string, string>
  line:        number
  col:         number
}

export type RegexGroup = {
  index:    number    // group index (1-based)
  name?:    string    // if named group
  values:   string[]  // all captured values across all matches
}

export type HighlightChunk = {
  text:      string
  matched:   boolean
  matchIndex?: number
  groupName?:  string
}

export type RegexStats = {
  matchCount:    number
  totalChars:    number
  coveredChars:  number
  coveragePercent: number
  uniqueMatches: number
}

export type RegexFlags_str = string  // "gim" etc.

// ── Flags ─────────────────────────────────────────────────────────────────────

export const FLAG_META: Record<keyof RegexFlags, { flag: string; label: string; description: string }> = {
  global:     { flag: "g", label: "Global",      description: "Find all matches, not just the first" },
  ignoreCase: { flag: "i", label: "Ignore case", description: "Case-insensitive matching"             },
  multiline:  { flag: "m", label: "Multiline",   description: "^ and $ match line boundaries"        },
  dotAll:     { flag: "s", label: "Dot all",     description: ". matches newlines too"                },
  unicode:    { flag: "u", label: "Unicode",     description: "Full Unicode support"                  },
  sticky:     { flag: "y", label: "Sticky",      description: "Match only from lastIndex position"   },
}

// ── Main tester ───────────────────────────────────────────────────────────────

export function testRegex(
  pattern: string,
  text:    string,
  flags:   Partial<RegexFlags> = {}
): RegexResult {
  if (!pattern) {
    return { ok: false, error: "Pattern is empty", hint: "Enter a regular expression to test." }
  }

  const flagStr  = buildFlagString(flags)
  let   regex: RegExp

  try {
    regex = new RegExp(pattern, flagStr)
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "Invalid regular expression",
      hint:  getRegexErrorHint(pattern, err),
    }
  }

  // Guard against catastrophic backtracking
  const timeoutMs = 500
  const timedOut  = checkTimeout(regex, text, timeoutMs)

  if (timedOut) {
    return {
      ok:    false,
      error: "Pattern timed out",
      hint:  "This pattern may cause catastrophic backtracking. Try simplifying nested quantifiers.",
    }
  }

  const matches     = extractMatches(regex, text, pattern, flags)
  const groups      = extractGroups(regex, matches, pattern)
  const highlighted = buildHighlight(text, matches)
  const stats       = buildStats(text, matches)

  return {
    ok: true,
    data: {
      pattern,
      flags:    { global: false, ignoreCase: false, multiline: false, dotAll: false, unicode: false, sticky: false, ...flags },
      matches,
      groups,
      highlighted,
      stats,
      isGlobal: flags.global ?? false,
    },
  }
}

// ── Match extractor ───────────────────────────────────────────────────────────

function extractMatches(
  regex:   RegExp,
  text:    string,
  pattern: string,
  flags:   Partial<RegexFlags>
): RegexMatch[] {
  const matches: RegexMatch[] = []
  const lines    = text.split("\n")

  // For non-global, just find the first match
  if (!flags.global) {
    const m = regex.exec(text)
    if (!m) return []

    const { line, col } = indexToLineCol(text, m.index)
    matches.push(buildMatch(m, line, col))
    return matches
  }

  // Global — find all matches
  const globalRegex = new RegExp(pattern, buildFlagString(flags))
  let   m: RegExpExecArray | null
  let   lastIndex   = -1

  while ((m = globalRegex.exec(text)) !== null) {
    // Guard infinite loop on zero-length matches
    if (m.index === lastIndex) {
      globalRegex.lastIndex++
      continue
    }
    lastIndex = m.index

    const { line, col } = indexToLineCol(text, m.index)
    matches.push(buildMatch(m, line, col))

    if (matches.length >= 1000) break  // safety cap
  }

  return matches
}

function buildMatch(m: RegExpExecArray, line: number, col: number): RegexMatch {
  const namedGroups: Record<string, string> = {}

  if (m.groups) {
    for (const [key, val] of Object.entries(m.groups)) {
      if (val !== undefined) namedGroups[key] = val
    }
  }

  return {
    index:       m.index,
    value:       m[0],
    length:      m[0].length,
    groups:      m.groups ?? {},
    namedGroups,
    line,
    col,
  }
}

// ── Group extractor ───────────────────────────────────────────────────────────

function extractGroups(
  regex:   RegExp,
  matches: RegexMatch[],
  pattern: string
): RegexGroup[] {
  const groupCount = countGroups(pattern)
  if (groupCount === 0) return []

  const namedGroupNames = [...pattern.matchAll(/\(\?<([^>]+)>/g)].map((m) => m[1])
  const groups: RegexGroup[] = []

  for (let i = 1; i <= groupCount; i++) {
    const name   = namedGroupNames[i - 1]
    const values = matches
      .map((m) => {
        const exec = new RegExp(regex.source, regex.flags).exec(m.value)
        return exec?.[i]
      })
      .filter((v): v is string => v !== undefined)

    groups.push({ index: i, name, values })
  }

  return groups
}

function countGroups(pattern: string): number {
  // Count capturing groups, not non-capturing (?:...) or lookaheads
  let count = 0
  let i     = 0
  while (i < pattern.length) {
    if (pattern[i] === "\\") { i += 2; continue }
    if (pattern[i] === "(" && pattern[i + 1] !== "?") count++
    if (pattern[i] === "(" && pattern[i + 1] === "?" && pattern[i + 2] === "<" && pattern[i + 3] !== "=" && pattern[i + 3] !== "!") count++
    i++
  }
  return count
}

// ── Highlight builder ─────────────────────────────────────────────────────────

function buildHighlight(text: string, matches: RegexMatch[]): HighlightChunk[] {
  if (matches.length === 0) {
    return [{ text, matched: false }]
  }

  const chunks: HighlightChunk[] = []
  let   cursor = 0

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]

    // Text before this match
    if (m.index > cursor) {
      chunks.push({ text: text.slice(cursor, m.index), matched: false })
    }

    // The match itself
    chunks.push({
      text:       m.value,
      matched:    true,
      matchIndex: i,
    })

    cursor = m.index + m.length
  }

  // Remaining text
  if (cursor < text.length) {
    chunks.push({ text: text.slice(cursor), matched: false })
  }

  return chunks
}

// ── Stats ─────────────────────────────────────────────────────────────────────

function buildStats(text: string, matches: RegexMatch[]): RegexStats {
  const coveredChars  = matches.reduce((sum, m) => sum + m.length, 0)
  const uniqueMatches = new Set(matches.map((m) => m.value)).size

  return {
    matchCount:      matches.length,
    totalChars:      text.length,
    coveredChars,
    coveragePercent: text.length > 0
      ? Math.round((coveredChars / text.length) * 100)
      : 0,
    uniqueMatches,
  }
}

// ── Timeout guard ─────────────────────────────────────────────────────────────

function checkTimeout(regex: RegExp, text: string, ms: number): boolean {
  const start = performance.now()
  try {
    new RegExp(regex.source, "").test(text.slice(0, 500))
    return performance.now() - start > ms
  } catch {
    return false
  }
}

// ── Error hints ───────────────────────────────────────────────────────────────

function getRegexErrorHint(pattern: string, err: unknown): string {
  const msg = err instanceof Error ? err.message.toLowerCase() : ""

  if (msg.includes("unterminated"))           return "Check for unclosed brackets, parentheses, or character classes."
  if (msg.includes("unmatched"))              return "Every opening ( or [ needs a matching closing ) or ]."
  if (msg.includes("nothing to repeat"))      return "A quantifier like * or + must follow a valid token — not another quantifier."
  if (msg.includes("invalid escape"))         return "In Unicode mode, only valid escape sequences are allowed. Try removing the \\ before the character."
  if (msg.includes("invalid group"))          return "Check your group syntax — (?:...), (?=...), (?!...), (?<name>...) are valid."
  if (pattern.endsWith("\\"))                 return "Pattern ends with a lone backslash — escape it as \\\\ or complete the escape sequence."
  if ((pattern.match(/\(/g)?.length ?? 0) >
      (pattern.match(/\)/g)?.length ?? 0))    return "You have more opening ( than closing ) parentheses."
  if ((pattern.match(/\[/g)?.length ?? 0) >
      (pattern.match(/\]/g)?.length ?? 0))    return "You have an unclosed character class — add the missing ]."

  return "Check the pattern syntax and try again."
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildFlagString(flags: Partial<RegexFlags>): string {
  return [
    flags.global     ? "g" : "",
    flags.ignoreCase ? "i" : "",
    flags.multiline  ? "m" : "",
    flags.dotAll     ? "s" : "",
    flags.unicode    ? "u" : "",
    flags.sticky     ? "y" : "",
  ].join("")
}

function indexToLineCol(text: string, index: number): { line: number; col: number } {
  const before = text.slice(0, index)
  const line   = before.split("\n").length
  const col    = index - before.lastIndexOf("\n")
  return { line, col }
}

// ── Presets ───────────────────────────────────────────────────────────────────

export type RegexPreset = {
  label:       string
  pattern:     string
  flags:       Partial<RegexFlags>
  description: string
  testValue:   string
}

export const PRESETS: RegexPreset[] = [
  {
    label:       "Email address",
    pattern:     "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}",
    flags:       { global: true, ignoreCase: true },
    description: "Matches standard email addresses",
    testValue:   "Contact us at hello@devforge.io or support@example.com",
  },
  {
    label:       "URL",
    pattern:     "https?:\\/\\/[^\\s/$.?#].[^\\s]*",
    flags:       { global: true, ignoreCase: true },
    description: "Matches http and https URLs",
    testValue:   "Visit https://devforge.io or http://example.com/path?q=1",
  },
  {
    label:       "IPv4 address",
    pattern:     "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
    flags:       { global: true },
    description: "Matches valid IPv4 addresses",
    testValue:   "Server IPs: 192.168.1.1 and 10.0.0.255",
  },
  {
    label:       "Hex color",
    pattern:     "#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\\b",
    flags:       { global: true },
    description: "Matches 3 or 6 digit hex color codes",
    testValue:   "Colors: #ff0000 #abc #1a2b3c",
  },
  {
    label:       "Date (YYYY-MM-DD)",
    pattern:     "\\b\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b",
    flags:       { global: true },
    description: "Matches ISO 8601 date format",
    testValue:   "Events on 2024-01-15 and 2024-12-31",
  },
  {
    label:       "JWT token",
    pattern:     "eyJ[A-Za-z0-9_\\-]+\\.eyJ[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]+",
    flags:       { global: true },
    description: "Matches JWT bearer tokens",
    testValue:   "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c3IxIn0.abc123",
  },
  {
    label:       "Semantic version",
    pattern:     "\\bv?(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)(?:-[\\w.]+)?(?:\\+[\\w.]+)?\\b",
    flags:       { global: true },
    description: "Matches semver strings like 1.2.3 or v2.0.0-beta.1",
    testValue:   "Released v1.0.0, v2.3.1-beta.1, and 3.0.0+build.42",
  },
  {
    label:       "Named groups",
    pattern:     "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
    flags:       { global: true },
    description: "Demonstrates named capture groups",
    testValue:   "Dates: 2024-01-15 and 2024-12-31",
  },
]