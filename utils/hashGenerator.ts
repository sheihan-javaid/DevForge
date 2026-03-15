// ── Types ─────────────────────────────────────────────────────────────────────

export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" | "MD5"

export type HashResult =
  | { ok: true;  algorithm: HashAlgorithm; hash: string; stats: HashStats }
  | { ok: false; error: string; hint: string }

export type HashStats = {
  inputBytes:  number
  outputBits:  number
  outputBytes: number
  outputChars: number
}

export type HashAllResult = Record<HashAlgorithm, HashResult>

export const ALGORITHMS: HashAlgorithm[] = [
  "MD5",
  "SHA-1",
  "SHA-256",
  "SHA-384",
  "SHA-512",
]

export type AlgorithmMeta = {
  bits:     number
  secure:   boolean
  warning?: string
  note:     string
}

export const ALGORITHM_META: Record<HashAlgorithm, AlgorithmMeta> = {
  "MD5": {
    bits:    128,
    secure:  false,
    warning: "Cryptographically broken — collision attacks are practical.",
    note:    "Only suitable for checksums and non-security use cases.",
  },
  "SHA-1": {
    bits:    160,
    secure:  false,
    warning: "Deprecated for security use — collision attacks demonstrated.",
    note:    "Still used in Git and some legacy systems.",
  },
  "SHA-256": {
    bits:   256,
    secure: true,
    note:   "Industry standard. Recommended for most use cases.",
  },
  "SHA-384": {
    bits:   384,
    secure: true,
    note:   "Stronger variant of SHA-2. Used in TLS certificates.",
  },
  "SHA-512": {
    bits:   512,
    secure: true,
    note:   "Maximum strength SHA-2. Preferred for password hashing pipelines.",
  },
}

// ── Single hash ───────────────────────────────────────────────────────────────

export async function generateHash(
  text:      string,
  algorithm: HashAlgorithm = "SHA-256",
  format:    "hex" | "base64" = "hex"
): Promise<HashResult> {
  if (!text) {
    return {
      ok:    false,
      error: "Input is empty",
      hint:  "Type or paste some text above to hash it.",
    }
  }

  try {
    const hash = algorithm === "MD5"
      ? await md5(text)
      : await subtleHash(text, algorithm, format)

    const inputBytes  = new TextEncoder().encode(text).length
    const outputBits  = ALGORITHM_META[algorithm].bits
    const outputBytes = outputBits / 8
    const outputChars = format === "hex"
      ? outputBytes * 2
      : Math.ceil(outputBytes / 3) * 4

    return {
      ok: true,
      algorithm,
      hash,
      stats: { inputBytes, outputBits, outputBytes, outputChars },
    }
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "Hashing failed",
      hint:  "An unexpected error occurred. Try refreshing the page.",
    }
  }
}

// ── Hash all algorithms ───────────────────────────────────────────────────────

export async function generateAllHashes(
  text:   string,
  format: "hex" | "base64" = "hex"
): Promise<HashAllResult> {
  const entries = await Promise.all(
    ALGORITHMS.map(async (alg) => [alg, await generateHash(text, alg, format)] as const)
  )
  return Object.fromEntries(entries) as HashAllResult
}

// ── File hashing ──────────────────────────────────────────────────────────────

export async function hashFile(
  file:      File,
  algorithm: HashAlgorithm = "SHA-256",
  format:    "hex" | "base64" = "hex"
): Promise<HashResult> {
  if (!file) {
    return {
      ok:    false,
      error: "No file provided",
      hint:  "Drop or select a file to hash.",
    }
  }

  try {
    const buffer = await file.arrayBuffer()

    if (algorithm !== "MD5") {
      const hashBuffer = await crypto.subtle.digest(algorithm, buffer)
      const hash       = format === "hex"
        ? bufferToHex(hashBuffer)
        : bufferToBase64(hashBuffer)

      const outputBits  = ALGORITHM_META[algorithm].bits
      const outputBytes = outputBits / 8
      const outputChars = format === "hex"
        ? outputBytes * 2
        : Math.ceil(outputBytes / 3) * 4

      return {
        ok: true,
        algorithm,
        hash,
        stats: {
          inputBytes:  buffer.byteLength,
          outputBits,
          outputBytes,
          outputChars,
        },
      }
    }

    const text = new TextDecoder().decode(new Uint8Array(buffer))
    return generateHash(text, "MD5", format)
  } catch (err) {
    return {
      ok:    false,
      error: err instanceof Error ? err.message : "File hashing failed",
      hint:  "Make sure the file is accessible and not corrupted.",
    }
  }
}

// ── Verify ────────────────────────────────────────────────────────────────────

export async function verifyHash(
  text:      string,
  expected:  string,
  algorithm: HashAlgorithm = "SHA-256"
): Promise<{ match: boolean; actual: string }> {
  const result = await generateHash(text, algorithm)
  if (!result.ok) return { match: false, actual: "" }
  const actual = result.hash.toLowerCase().trim()
  const match  = actual === expected.toLowerCase().trim()
  return { match, actual }
}

// ── Subtle crypto ─────────────────────────────────────────────────────────────

async function subtleHash(
  text:      string,
  algorithm: Exclude<HashAlgorithm, "MD5">,
  format:    "hex" | "base64"
): Promise<string> {
  const encoded    = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, encoded)
  return format === "hex" ? bufferToHex(hashBuffer) : bufferToBase64(hashBuffer)
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes  = new Uint8Array(buffer)
  const latin1 = Array.from(bytes, (b) => String.fromCodePoint(b)).join("")
  return btoa(latin1)
}

// ── MD5 (pure JS) ─────────────────────────────────────────────────────────────

async function md5(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  return md5Bytes(bytes)
}

function md5Bytes(input: Uint8Array): string {
  const T = Array.from({ length: 64 }, (_, i) =>
    Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0
  )

  const S = [
    7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
    5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
    4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
    6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,
  ]

  const len    = input.length
  const bitLen = len * 8
  const padded = new Uint8Array(Math.ceil((len + 9) / 64) * 64)
  padded.set(input)
  padded[len] = 0x80
  new DataView(padded.buffer).setUint32(padded.length - 8, bitLen >>> 0, true)
  new DataView(padded.buffer).setUint32(
    padded.length - 4,
    Math.floor(bitLen / 0x100000000) >>> 0,
    true
  )

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const view = new DataView(padded.buffer)

  for (let i = 0; i < padded.length; i += 64) {
    const M = Array.from({ length: 16 }, (_, j) =>
      view.getUint32(i + j * 4, true)
    )
    let [a, b, c, d] = [a0, b0, c0, d0]

    for (let j = 0; j < 64; j++) {
      let f: number
      let g: number

      if      (j < 16) { f = (b & c) | (~b & d);  g = j             }
      else if (j < 32) { f = (d & b) | (~d & c);  g = (5 * j + 1) % 16 }
      else if (j < 48) { f = b ^ c ^ d;            g = (3 * j + 5) % 16 }
      else             { f = c ^ (b | ~d);          g = (7 * j)     % 16 }

      f = (f + a + T[j] + M[g]) >>> 0
      a = d
      d = c
      c = b
      b = ((b + ((f << S[j]) | (f >>> (32 - S[j])))) >>> 0)
    }

    a0 = (a0 + a) >>> 0
    b0 = (b0 + b) >>> 0
    c0 = (c0 + c) >>> 0
    d0 = (d0 + d) >>> 0
  }

  return [a0, b0, c0, d0]
    .map((n) => {
      const hex = n.toString(16).padStart(8, "0")
      return hex.match(/../g)!.reverse().join("")
    })
    .join("")
}