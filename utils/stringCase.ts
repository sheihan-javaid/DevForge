// ── Types ─────────────────────────────────────────────────────────────────────

export type CaseType =
  | "upper"
  | "lower"
  | "title"
  | "sentence"
  | "camel"
  | "pascal"
  | "snake"
  | "screaming_snake"
  | "kebab"
  | "train"
  | "dot"
  | "path"
  | "constant"
  | "inverse"
  | "alternating"
  | "slug"

export type CaseResult = {
  input:   string
  output:  string
  case:    CaseType
  changed: boolean
  stats:   CaseStats
}

export type CaseStats = {
  characters: number
  words:      number
  changed:    number   // characters that changed
}

export type CaseMeta = {
  label:       string
  description: string
  example:     string
  group:       CaseGroup
}

export type CaseGroup =
  | "Basic"
  | "Code"
  | "Special"

export const CASE_META: Record<CaseType, CaseMeta> = {
  upper: {
    label:       "UPPER CASE",
    description: "All characters uppercase",
    example:     "HELLO WORLD",
    group:       "Basic",
  },
  lower: {
    label:       "lower case",
    description: "All characters lowercase",
    example:     "hello world",
    group:       "Basic",
  },
  title: {
    label:       "Title Case",
    description: "First letter of each word capitalised",
    example:     "Hello World",
    group:       "Basic",
  },
  sentence: {
    label:       "Sentence case",
    description: "First letter of each sentence capitalised",
    example:     "Hello world. This is a sentence.",
    group:       "Basic",
  },
  camel: {
    label:       "camelCase",
    description: "No spaces, each word capitalised except the first",
    example:     "helloWorld",
    group:       "Code",
  },
  pascal: {
    label:       "PascalCase",
    description: "No spaces, each word capitalised",
    example:     "HelloWorld",
    group:       "Code",
  },
  snake: {
    label:       "snake_case",
    description: "Words separated by underscores, all lowercase",
    example:     "hello_world",
    group:       "Code",
  },
  screaming_snake: {
    label:       "SCREAMING_SNAKE",
    description: "Words separated by underscores, all uppercase",
    example:     "HELLO_WORLD",
    group:       "Code",
  },
  kebab: {
    label:       "kebab-case",
    description: "Words separated by hyphens, all lowercase",
    example:     "hello-world",
    group:       "Code",
  },
  train: {
    label:       "Train-Case",
    description: "Words separated by hyphens, each word capitalised",
    example:     "Hello-World",
    group:       "Code",
  },
  dot: {
    label:       "dot.case",
    description: "Words separated by dots, all lowercase",
    example:     "hello.world",
    group:       "Code",
  },
  path: {
    label:       "path/case",
    description: "Words separated by forward slashes",
    example:     "hello/world",
    group:       "Code",
  },
  constant: {
    label:       "CONSTANT_CASE",
    description: "Like screaming snake — used for constants",
    example:     "HELLO_WORLD",
    group:       "Code",
  },
  inverse: {
    label:       "iNVERSE cASE",
    description: "Uppercase becomes lowercase and vice versa",
    example:     "hELLO wORLD",
    group:       "Special",
  },
  alternating: {
    label:       "aLtErNaTiNg",
    description: "Alternates between lower and upper case",
    example:     "hElLo wOrLd",
    group:       "Special",
  },
  slug: {
    label:       "url-slug",
    description: "URL-safe lowercase slug, special chars stripped",
    example:     "hello-world",
    group:       "Special",
  },
}

export const CASE_GROUPS: CaseGroup[] = ["Basic", "Code", "Special"]

export const ALL_CASES = Object.keys(CASE_META) as CaseType[]

// ── Single converter ──────────────────────────────────────────────────────────

export function convertCase(input: string, to: CaseType): CaseResult {
  const output  = applyCase(input, to)
  const changed = [...input].filter((c, i) => c !== output[i]).length

  return {
    input,
    output,
    case:    to,
    changed: output !== input,
    stats: {
      characters: input.length,
      words:      countWords(input),
      changed,
    },
  }
}

// ── Convert all at once ───────────────────────────────────────────────────────

export function convertAll(input: string): Record<CaseType, string> {
  return Object.fromEntries(
    ALL_CASES.map((c) => [c, applyCase(input, c)])
  ) as Record<CaseType, string>
}

// ── Core transform ────────────────────────────────────────────────────────────

function applyCase(input: string, to: CaseType): string {
  if (!input) return ""

  switch (to) {
    case "upper":
      return input.toUpperCase()

    case "lower":
      return input.toLowerCase()

    case "title":
      return input.replace(/\w\S*/g, (w) =>
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      )

    case "sentence":
      return input
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())

    case "camel": {
      const words = splitWords(input)
      return words
        .map((w, i) => i === 0 ? w.toLowerCase() : capitalize(w))
        .join("")
    }

    case "pascal":
      return splitWords(input).map(capitalize).join("")

    case "snake":
      return splitWords(input).map((w) => w.toLowerCase()).join("_")

    case "screaming_snake":
    case "constant":
      return splitWords(input).map((w) => w.toUpperCase()).join("_")

    case "kebab":
      return splitWords(input).map((w) => w.toLowerCase()).join("-")

    case "train":
      return splitWords(input).map(capitalize).join("-")

    case "dot":
      return splitWords(input).map((w) => w.toLowerCase()).join(".")

    case "path":
      return splitWords(input).map((w) => w.toLowerCase()).join("/")

    case "inverse":
      return [...input]
        .map((c) =>
          c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
        )
        .join("")

    case "alternating":
      return [...input]
        .map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())
        .join("")

    case "slug":
      return input
        .normalize("NFD")                      // decompose accented chars
        .replace(/[\u0300-\u036f]/g, "")       // strip accent marks
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")          // strip non-alphanumeric
        .trim()
        .replace(/[\s_]+/g, "-")               // spaces/underscores → hyphens
        .replace(/-+/g, "-")                   // collapse multiple hyphens
        .replace(/^-|-$/g, "")                 // strip leading/trailing hyphens

    default:
      return input
  }
}

// ── Word splitter ─────────────────────────────────────────────────────────────
// Handles: spaces, hyphens, underscores, dots, slashes,
//          camelCase, PascalCase, SCREAMING_SNAKE

function splitWords(input: string): string[] {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Insert space before uppercase letters following lowercase (camel/pascal)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Insert space before sequences of uppercase followed by lowercase (ABCDef → ABC Def)
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    // Replace separators with spaces
    .replace(/[-_./\\]+/g, " ")
    // Collapse and trim
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(word: string): string {
  if (!word) return ""
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// ── Detection ─────────────────────────────────────────────────────────────────

export function detectCase(input: string): CaseType | null {
  if (!input.trim()) return null

  if (/^[A-Z0-9\s]+$/.test(input))            return "upper"
  if (/^[a-z0-9\s]+$/.test(input))            return "lower"
  if (/^[a-z][a-zA-Z0-9]*$/.test(input) &&
      /[A-Z]/.test(input))                     return "camel"
  if (/^[A-Z][a-zA-Z0-9]*$/.test(input) &&
      /[a-z]/.test(input))                     return "pascal"
  if (/^[a-z0-9]+(_[a-z0-9]+)+$/.test(input)) return "snake"
  if (/^[A-Z0-9]+(_[A-Z0-9]+)+$/.test(input)) return "screaming_snake"
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(input)) return "kebab"
  if (/^[A-Z][a-z0-9]*(-[A-Z][a-z0-9]*)+$/.test(input)) return "train"
  if (/^[a-z0-9]+(\.[a-z0-9]+)+$/.test(input)) return "dot"
  if (/^[a-z0-9]+(\/[a-z0-9]+)+$/.test(input)) return "path"

  return null
}