export type Base64Result =
  | { ok: true;  output: string; stats: Base64Stats }
  | { ok: false; error: string;  hint:  string }

export type Base64Stats = {
  inputBytes:    number
  outputBytes:   number
  ratio:         string
  isPadded:      boolean
}

export type Base64Variant = "standard" | "urlsafe"

// ── Encoder ───────────────────────────────────────────────────────────────────

export function encodeBase64(input: string, variant: Base64Variant = "standard"): Base64Result {
  if (!input) {
    return { ok: false, error: "Input is empty", hint: "Type or paste some text above to encode." }
  }

  try {
    // Handle full Unicode — btoa() only handles latin1 by default
    const bytes   = new TextEncoder().encode(input)
    const latin1  = Array.from(bytes, (b) => String.fromCodePoint(b)).join("")
    let   encoded = btoa(latin1)

    if (variant === "urlsafe") {
      encoded = encoded.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
    }

    return {
      ok: true,
      output: encoded,
      stats: buildStats(input, encoded),
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Encoding failed",
      hint:  "Make sure the input is valid UTF-8 text.",
    }
  }
}

// ── Decoder ───────────────────────────────────────────────────────────────────

export function decodeBase64(input: string, variant: Base64Variant = "standard"): Base64Result {
  if (!input.trim()) {
    return { ok: false, error: "Input is empty", hint: "Paste a Base64 string above to decode." }
  }

  try {
    let normalized = input.trim()

    // Normalize URL-safe → standard before decoding
    if (variant === "urlsafe" || /[-_]/.test(normalized)) {
      normalized = normalized.replaceAll("-", "+").replaceAll("_", "/")
    }

    // Re-add padding if stripped
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)

    // Validate charset before attempting decode
    if (!/^[A-Za-z0-9+/=]+$/.test(padded)) {
      const bad = padded.match(/[^A-Za-z0-9+/=]/)?.[0]
      return {
        ok: false,
        error: `Invalid character: "${bad}"`,
        hint:  "Base64 strings may only contain A–Z, a–z, 0–9, +, /, and = for padding.",
      }
    }

    const latin1  = atob(padded)
    const bytes   = Uint8Array.from(latin1, (c) => c.codePointAt(0)!)
    const decoded = new TextDecoder().decode(bytes)

    return {
      ok: true,
      output: decoded,
      stats: buildStats(input.trim(), decoded),
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Decoding failed",
      hint:  getDecodeHint(input.trim()),
    }
  }
}

// ── File encoder ──────────────────────────────────────────────────────────────

export async function encodeFileBase64(file: File): Promise<Base64Result> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      const dataUrl = reader.result as string
      // Strip the "data:...;base64," prefix
      const encoded = dataUrl.split(",")[1] ?? ""
      resolve({
        ok: true,
        output: encoded,
        stats: buildStats(file.name, encoded),
      })
    }

    reader.onerror = () =>
      resolve({
        ok: false,
        error: "Failed to read file",
        hint:  "Make sure the file is accessible and not corrupted.",
      })

    reader.readAsDataURL(file)
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildStats(input: string, output: string): Base64Stats {
  const inputBytes  = new TextEncoder().encode(input).length
  const outputBytes = new TextEncoder().encode(output).length
  const ratio       = inputBytes > 0
    ? `${((outputBytes / inputBytes) * 100).toFixed(0)}%`
    : "—"

  return {
    inputBytes,
    outputBytes,
    ratio,
    isPadded: output.endsWith("="),
  }
}

function getDecodeHint(input: string): string {
  if (input.includes(" "))   return "Remove spaces — Base64 strings should have no whitespace."
  if (input.includes("\n"))  return "Remove line breaks from the Base64 string."
  if (input.startsWith("data:")) return 'Strip the "data:...;base64," prefix before decoding.'
  return "Check that the string is valid Base64 and try again."
}

// ── Detector ──────────────────────────────────────────────────────────────────

export function looksLikeBase64(input: string): boolean {
  const s = input.trim()
  if (s.length === 0 || s.length % 4 !== 0) return false
  return /^[A-Za-z0-9+/]+={0,2}$/.test(s)
}