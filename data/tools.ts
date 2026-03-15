export type Tool = {
  slug: string
  name: string
  description: string
  category: Category
  icon: string
  isNew?: boolean
  tags?: string[]
}

export type Category =
  | "Formatters & Validators"
  | "Encoders & Decoders"
  | "Generators"
  | "Converters"
  | "Text & String"
  | "Security"

export const tools: Tool[] = [
  // ── Formatters & Validators ──────────────────────────────
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    description: "Prettify, minify, and validate JSON with syntax highlighting.",
    category: "Formatters & Validators",
    icon: "{}",
    tags: ["json", "format", "validate", "prettify", "minify"],
  },
  {
    slug: "yaml-json",
    name: "YAML → JSON",
    description: "Convert YAML to JSON and back instantly.",
    category: "Formatters & Validators",
    icon: "⇄",
    tags: ["yaml", "json", "convert", "format"],
  },
  {
    slug: "regexp-tester",
    name: "Regex Tester",
    description: "Test and debug regular expressions with live match highlighting.",
    category: "Formatters & Validators",
    icon: ".*",
    tags: ["regex", "regexp", "pattern", "match", "test"],
  },
  {
    slug: "diff-checker",
    name: "Diff Checker",
    description: "Compare two blocks of text and highlight the differences.",
    category: "Formatters & Validators",
    icon: "±",
    tags: ["diff", "compare", "text", "changes"],
  },
  {
    slug: "cron-parser",
    name: "Cron Parser",
    description: "Parse and explain cron expressions in plain English.",
    category: "Formatters & Validators",
    icon: "⏱",
    tags: ["cron", "schedule", "crontab", "parse"],
  },

  // ── Encoders & Decoders ──────────────────────────────────
  {
    slug: "base64",
    name: "Base64 Encoder / Decoder",
    description: "Encode or decode Base64 strings and files.",
    category: "Encoders & Decoders",
    icon: "64",
    tags: ["base64", "encode", "decode"],
  },
  {
    slug: "url-encoder",
    name: "URL Encoder / Decoder",
    description: "Encode or decode URL components and query strings.",
    category: "Encoders & Decoders",
    icon: "%20",
    tags: ["url", "encode", "decode", "uri", "query"],
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode and inspect JWT header, payload, and signature.",
    category: "Encoders & Decoders",
    icon: "jwt",
    tags: ["jwt", "token", "decode", "auth", "bearer"],
  },

  // ── Generators ───────────────────────────────────────────
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    description: "Generate v4 UUIDs in bulk — copy one or all at once.",
    category: "Generators",
    icon: "#",
    isNew: true,
    tags: ["uuid", "guid", "generate", "unique", "id"],
  },
  {
    slug: "password-generator",
    name: "Password Generator",
    description: "Generate strong, customisable passwords with entropy score.",
    category: "Generators",
    icon: "🔑",
    tags: ["password", "generate", "secure", "random", "entropy"],
  },
  {
    slug: "lorem-ipsum",
    name: "Lorem Ipsum Generator",
    description: "Generate lorem ipsum placeholder text by words, sentences, or paragraphs.",
    category: "Generators",
    icon: "¶",
    tags: ["lorem", "ipsum", "placeholder", "text", "generate"],
  },
  {
    slug: "random-string",
    name: "Random String Generator",
    description: "Generate random strings with custom length, charset, and quantity.",
    category: "Generators",
    icon: "Aa",
    tags: ["random", "string", "generate", "token", "key"],
  },
  {
    slug: "hash-generator",
    name: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256, and SHA-512 hashes from any string.",
    category: "Security",
    icon: "##",
    tags: ["hash", "sha256", "md5", "sha1", "checksum", "crypto"],
  },

  // ── Converters ───────────────────────────────────────────
  {
    slug: "unix-timestamp",
    name: "Unix Timestamp Converter",
    description: "Convert Unix timestamps to human-readable dates and back.",
    category: "Converters",
    icon: "ts",
    tags: ["unix", "timestamp", "epoch", "date", "time", "convert"],
  },

  // ── Text & String ────────────────────────────────────────
  {
    slug: "string-case",
    name: "String Case Converter",
    description: "Convert strings between camelCase, snake_case, kebab-case, PascalCase, and more.",
    category: "Text & String",
    icon: "Aa",
    tags: ["string", "case", "camel", "snake", "kebab", "pascal", "convert"],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export const categories = [
  "Formatters & Validators",
  "Encoders & Decoders",
  "Generators",
  "Converters",
  "Text & String",
  "Security",
] as const satisfies Category[]

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug)
}

export function getToolsByCategory(category: Category): Tool[] {
  return tools.filter((t) => t.category === category)
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase().trim()
  if (!q) return tools
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.includes(q))
  )
}