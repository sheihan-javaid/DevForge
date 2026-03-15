// ── App ───────────────────────────────────────────────────────────────────────

export const APP_NAME        = "DevForge"
export const APP_DESCRIPTION = "Free developer tools for everyday tasks"
export const APP_URL         = "https://devforge.io"
export const APP_GITHUB      = "https://github.com/yourusername/devforge"
export const APP_VERSION     = "1.0.0"

// ── SEO ───────────────────────────────────────────────────────────────────────

export const SEO_KEYWORDS = [
  "developer tools",
  "json formatter",
  "base64 encoder",
  "jwt decoder",
  "uuid generator",
  "hash generator",
  "regex tester",
  "password generator",
  "url encoder",
  "unix timestamp",
  "diff checker",
  "lorem ipsum",
  "cron parser",
  "string case converter",
  "yaml to json",
  "random string generator",
  "free developer tools",
  "online developer tools",
]

export const OG_IMAGE = `${APP_URL}/og.png`

// ── Navigation ────────────────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: "Home",   href: "/"       },
  { label: "Tools",  href: "/#tools" },
  { label: "GitHub", href: APP_GITHUB, external: true },
] as const

// ── Tool categories ───────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Formatters & Validators",
  "Encoders & Decoders",
  "Generators",
  "Converters",
  "Text & String",
  "Security",
] as const

export type Category = (typeof CATEGORIES)[number]

// ── Limits ────────────────────────────────────────────────────────────────────

export const LIMITS = {
  // TextAreaBox
  MAX_INPUT_CHARS:       500_000,

  // UUID generator
  MAX_UUID_BATCH:        1_000,

  // Password generator
  MAX_PASSWORD_LENGTH:   128,
  MIN_PASSWORD_LENGTH:   4,
  MAX_PASSWORD_BATCH:    100,

  // Random string
  MAX_STRING_LENGTH:     4_096,
  MAX_STRING_BATCH:      1_000,

  // Lorem ipsum
  MAX_LOREM_PARAGRAPHS:  200,
  MAX_LOREM_SENTENCES:   100,
  MAX_LOREM_WORDS:       500,

  // Hash
  MAX_HASH_INPUT_BYTES:  10_000_000,  // 10MB

  // Diff checker
  MAX_DIFF_CHARS:        100_000,

  // Regex tester
  MAX_REGEX_MATCHES:     1_000,
  REGEX_TIMEOUT_MS:      500,
} as const

// ── Debounce timings (ms) ─────────────────────────────────────────────────────

export const DEBOUNCE = {
  DEFAULT:  300,
  FAST:     120,
  SLOW:     500,
  TYPING:   150,
} as const

// ── Local storage keys ────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  THEME:             "devforge:theme",
  LAST_TOOL:         "devforge:last-tool",
  JSON_INDENT:       "devforge:json-indent",
  PASSWORD_OPTIONS:  "devforge:password-options",
  UUID_VERSION:      "devforge:uuid-version",
  REGEX_FLAGS:       "devforge:regex-flags",
  DIFF_UNIT:         "devforge:diff-unit",
  DIFF_VIEW:         "devforge:diff-view",
} as const

// ── Keyboard shortcuts ────────────────────────────────────────────────────────

export const SHORTCUTS = {
  FORMAT:     "Mod+Enter",
  COPY:       "Mod+Shift+C",
  CLEAR:      "Mod+Shift+X",
  GENERATE:   "Mod+G",
} as const

// ── Themes ────────────────────────────────────────────────────────────────────

export const THEMES = ["light", "dark", "system"] as const
export type Theme = (typeof THEMES)[number]

// ── Hash algorithms ───────────────────────────────────────────────────────────

export const HASH_ALGORITHMS = [
  "MD5",
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
] as const

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

// ── Common timezones ──────────────────────────────────────────────────────────

export const TIMEZONES = [
  { label: "UTC",             value: "UTC"                  },
  { label: "New York",        value: "America/New_York"     },
  { label: "Los Angeles",     value: "America/Los_Angeles"  },
  { label: "Chicago",         value: "America/Chicago"      },
  { label: "London",          value: "Europe/London"        },
  { label: "Paris",           value: "Europe/Paris"         },
  { label: "Berlin",          value: "Europe/Berlin"        },
  { label: "Tokyo",           value: "Asia/Tokyo"           },
  { label: "Shanghai",        value: "Asia/Shanghai"        },
  { label: "Kolkata",         value: "Asia/Kolkata"         },
  { label: "Dubai",           value: "Asia/Dubai"           },
  { label: "Sydney",          value: "Australia/Sydney"     },
  { label: "Auckland",        value: "Pacific/Auckland"     },
] as const

// ── Regex flags ───────────────────────────────────────────────────────────────

export const REGEX_FLAGS = [
  { flag: "g", label: "Global",      description: "Find all matches"              },
  { flag: "i", label: "Ignore case", description: "Case-insensitive matching"     },
  { flag: "m", label: "Multiline",   description: "^ and $ match line boundaries" },
  { flag: "s", label: "Dot all",     description: ". matches newlines"            },
  { flag: "u", label: "Unicode",     description: "Full Unicode support"          },
  { flag: "y", label: "Sticky",      description: "Match from lastIndex only"     },
] as const

// ── Base64 variants ───────────────────────────────────────────────────────────

export const BASE64_VARIANTS = [
  { value: "standard", label: "Standard",  description: "Uses + and / with = padding"        },
  { value: "urlsafe",  label: "URL-safe",  description: "Uses - and _ with no padding"       },
] as const

// ── String cases ──────────────────────────────────────────────────────────────

export const STRING_CASES = [
  { value: "upper",          label: "UPPER CASE",     group: "Basic"   },
  { value: "lower",          label: "lower case",     group: "Basic"   },
  { value: "title",          label: "Title Case",     group: "Basic"   },
  { value: "sentence",       label: "Sentence case",  group: "Basic"   },
  { value: "camel",          label: "camelCase",      group: "Code"    },
  { value: "pascal",         label: "PascalCase",     group: "Code"    },
  { value: "snake",          label: "snake_case",     group: "Code"    },
  { value: "screaming_snake",label: "SCREAMING_SNAKE",group: "Code"    },
  { value: "kebab",          label: "kebab-case",     group: "Code"    },
  { value: "train",          label: "Train-Case",     group: "Code"    },
  { value: "dot",            label: "dot.case",       group: "Code"    },
  { value: "path",           label: "path/case",      group: "Code"    },
  { value: "constant",       label: "CONSTANT_CASE",  group: "Code"    },
  { value: "inverse",        label: "iNVERSE cASE",   group: "Special" },
  { value: "alternating",    label: "aLtErNaTiNg",    group: "Special" },
  { value: "slug",           label: "url-slug",       group: "Special" },
] as const

// ── Cron presets ──────────────────────────────────────────────────────────────

export const CRON_PRESETS = [
  { label: "Every minute",       expression: "* * * * *"    },
  { label: "Every 5 minutes",    expression: "*/5 * * * *"  },
  { label: "Every hour",         expression: "0 * * * *"    },
  { label: "Every day midnight", expression: "0 0 * * *"    },
  { label: "Every weekday",      expression: "0 9 * * 1-5"  },
  { label: "Every Monday",       expression: "0 9 * * 1"    },
  { label: "Every month",        expression: "0 0 1 * *"    },
  { label: "Every year",         expression: "0 0 1 1 *"    },
] as const

// ── HTTP status codes (for future tools) ──────────────────────────────────────

export const HTTP_STATUS = {
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
} as const

export type HTTPStatus = keyof typeof HTTP_STATUS

// ── Colours ───────────────────────────────────────────────────────────────────

export const BRAND_COLORS = {
  primary:   "#7C3AED",   // violet-600
  secondary: "#6D28D9",   // violet-700
  success:   "#16A34A",   // green-600
  warning:   "#D97706",   // amber-600
  danger:    "#DC2626",   // red-600
  info:      "#2563EB",   // blue-600
} as const