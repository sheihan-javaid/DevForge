// ── Types ─────────────────────────────────────────────────────────────────────

export type URLResult =
  | { ok: true;  output: string; stats: URLStats }
  | { ok: false; error: string;  hint:  string   }

export type URLStats = {
  inputLength:  number
  outputLength: number
  changedChars: number
  ratio:        string
}

export type URLMode    = "encode" | "decode"
export type URLVariant = "component" | "full" | "form"

export const VARIANT_META: Record<URLVariant, { label: string; description: string }> = {
  component: {
    label:       "Component",
    description: "Encodes a single query value — escapes everything except A–Z a–z 0–9 - _ . !  ~ * ' ( )",
  },
  full: {
    label:       "Full URL",
    description: "Encodes a complete URL — preserves :// ? = & # / and other URL structure chars",
  },
  form: {
    label:       "Form data",
    description: "application/x-www-form-urlencoded — spaces become + instead of %20",
  },
}

// ── Encoder ───────────────────────────────────────────────────────────────────

export function encodeURL(input: string, variant: URLVariant = "component"): URLResult {
  if (!input) {
    return { ok: false, error: "Input is empty", hint: "Enter a string to encode." }
  }

  try {
    let output: string

    switch (variant) {
      case "full":
        output = encodeURI(input)
        break
      case "form":
        output = encodeURIComponent(input).replaceAll("%20", "+")
        break
      case "component":
      default:
        output = encodeURIComponent(input)
        break
    }

    return { ok: true, output, stats: buildStats(input, output) }
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "Encoding failed",
      hint:  "Make sure the input is valid UTF-8 text.",
    }
  }
}

// ── Decoder ───────────────────────────────────────────────────────────────────

export function decodeURL(input: string, variant: URLVariant = "component"): URLResult {
  if (!input.trim()) {
    return { ok: false, error: "Input is empty", hint: "Enter a URL-encoded string to decode." }
  }

  try {
    let normalized = input.trim()
    let output: string

    switch (variant) {
      case "full":
        output = decodeURI(normalized)
        break
      case "form":
        // Replace + back to spaces before decoding
        output = decodeURIComponent(normalized.replaceAll("+", " "))
        break
      case "component":
      default:
        output = decodeURIComponent(normalized)
        break
    }

    return { ok: true, output, stats: buildStats(input, output) }
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "Decoding failed",
      hint:  getDecodeHint(input.trim()),
    }
  }
}

// ── URL parser ────────────────────────────────────────────────────────────────

export type ParsedURL = {
  protocol: string
  host:     string
  pathname: string
  search:   string
  hash:     string
  params:   { key: string; value: string; decoded: string }[]
}

export function parseURL(input: string): ParsedURL | null {
  try {
    const url    = new URL(input.trim())
    const params = [...url.searchParams.entries()].map(([key, value]) => ({
      key,
      value,
      decoded: decodeURIComponent(value),
    }))

    return {
      protocol: url.protocol,
      host:     url.host,
      pathname: url.pathname,
      search:   url.search,
      hash:     url.hash,
      params,
    }
  } catch {
    return null
  }
}

// ── Auto-detect mode ──────────────────────────────────────────────────────────

export function looksEncoded(input: string): boolean {
  return /%[0-9A-Fa-f]{2}/.test(input) || input.includes("+")
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildStats(input: string, output: string): URLStats {
  const changedChars = [...input].filter((c, i) => c !== output[i]).length

  return {
    inputLength:  input.length,
    outputLength: output.length,
    changedChars,
    ratio: input.length > 0
      ? `${((output.length / input.length) * 100).toFixed(0)}%`
      : "—",
  }
}

function getDecodeHint(input: string): string {
  if (input.includes("%"))  return "Check that all % sequences are valid hex pairs like %20 or %2F."
  if (input.includes(" "))  return "Spaces cannot appear in encoded URLs — they should be %20 or +."
  return "Make sure the string is a valid URL-encoded value."
}

// ── Presets ───────────────────────────────────────────────────────────────────

export type URLPreset = {
  label:   string
  input:   string
  mode:    URLMode
  variant: URLVariant
}

export const PRESETS: URLPreset[] = [
  {
    label:   "Query string",
    input:   "hello world & foo=bar",
    mode:    "encode",
    variant: "component",
  },
  {
    label:   "Full URL",
    input:   "https://example.com/path?q=hello world&lang=en",
    mode:    "encode",
    variant: "full",
  },
  {
    label:   "Form data",
    input:   "name=John Doe&email=john@example.com",
    mode:    "encode",
    variant: "form",
  },
  {
    label:   "Decode %20",
    input:   "hello%20world%20%26%20foo%3Dbar",
    mode:    "decode",
    variant: "component",
  },
  {
    label:   "Decode full URL",
    input:   "https://example.com/path%3Fq%3Dhello%20world",
    mode:    "decode",
    variant: "full",
  },
]