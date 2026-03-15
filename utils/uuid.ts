// ── Types ─────────────────────────────────────────────────────────────────────

export type UUIDVersion = "v4" | "v7"

export type UUIDResult = {
  uuid:      string
  version:   UUIDVersion
  timestamp: string | null   // only for v7
  formatted: UUIDFormatted
}

export type UUIDFormatted = {
  standard:   string   // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  uppercase:  string   // XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
  noHyphens:  string   // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  urn:        string   // urn:uuid:xxxxxxxx-xxxx-...
  braces:     string   // {xxxxxxxx-xxxx-...}
}

export type GenerateOptions = {
  version:   UUIDVersion
  count:     number        // 1–1000
  uppercase: boolean
  hyphens:   boolean
}

export const DEFAULT_OPTIONS: GenerateOptions = {
  version:   "v4",
  count:     1,
  uppercase: false,
  hyphens:   true,
}

// ── Single UUID ───────────────────────────────────────────────────────────────

export function generateUUID(options: Partial<GenerateOptions> = {}): UUIDResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const uuid = opts.version === "v7" ? generateV7() : crypto.randomUUID()

  return buildResult(uuid, opts.version)
}

// ── Batch generator ───────────────────────────────────────────────────────────

export function generateBatch(options: Partial<GenerateOptions> = {}): UUIDResult[] {
  const opts  = { ...DEFAULT_OPTIONS, ...options }
  const count = Math.max(1, Math.min(opts.count, 1000))
  return Array.from({ length: count }, () => generateUUID(opts))
}

// ── Validator ─────────────────────────────────────────────────────────────────

export type ValidateResult = {
  valid:     boolean
  version:   number | null
  variant:   string | null
  canonical: string | null
  error?:    string
}

export function validateUUID(input: string): ValidateResult {
  const trimmed = input.trim()

  if (!trimmed) {
    return { valid: false, version: null, variant: null, canonical: null, error: "Input is empty." }
  }

  // Strip URN prefix and braces if present
  const cleaned = trimmed
    .replace(/^urn:uuid:/i, "")
    .replace(/^\{(.+)\}$/, "$1")
    .toLowerCase()

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

  if (!UUID_REGEX.test(cleaned)) {
    // Check if it's just missing hyphens
    const noHyphens = cleaned.replace(/-/g, "")
    if (/^[0-9a-f]{32}$/.test(noHyphens)) {
      const rehydrated = insertHyphens(noHyphens)
      return validateUUID(rehydrated)
    }
    return {
      valid:     false,
      version:   null,
      variant:   null,
      canonical: null,
      error:     "Not a valid UUID format.",
    }
  }

  const versionNibble = parseInt(cleaned[14], 16)
  const variantNibble = parseInt(cleaned[19], 16)

  const variant =
    (variantNibble & 0b1000) === 0 ? "NCS" :
    (variantNibble & 0b1100) === 0b1000 ? "RFC 4122" :
    (variantNibble & 0b1110) === 0b1100 ? "Microsoft" :
    "Reserved"

  return {
    valid:     true,
    version:   versionNibble,
    variant,
    canonical: cleaned,
  }
}

// ── UUID v7 (time-ordered) ────────────────────────────────────────────────────

function generateV7(): string {
  // UUID v7 structure (RFC 9562):
  // 48 bits unix_ts_ms | 4 bits ver (0111) | 12 bits rand_a | 2 bits var (10) | 62 bits rand_b
  const now    = BigInt(Date.now())
  const randA  = BigInt(cryptoRandInt(12))  // 12 bits
  const randB  = cryptoRandBigInt(62)       // 62 bits

  const ver    = BigInt(0x7)  // version 7
  const varBit = BigInt(0x2)  // variant 10xx

  // Pack into 128-bit value
  const hi = (now << BigInt(16)) | (ver << BigInt(12)) | randA
  const lo = (varBit << BigInt(62)) | randB

  const hiHex = hi.toString(16).padStart(16, "0")
  const loHex = lo.toString(16).padStart(16, "0")
  const full  = hiHex + loHex

  return insertHyphens(full)
}

function extractV7Timestamp(uuid: string): string | null {
  try {
    const clean = uuid.replace(/-/g, "")
    const tsBits = clean.slice(0, 12)
    const ms = parseInt(tsBits, 16)
    return new Date(ms).toISOString()
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildResult(uuid: string, version: UUIDVersion): UUIDResult {
  const lower = uuid.toLowerCase()
  const upper = uuid.toUpperCase()
  const noHyp = lower.replace(/-/g, "")

  return {
    uuid:      lower,
    version,
    timestamp: version === "v7" ? extractV7Timestamp(lower) : null,
    formatted: {
      standard:  lower,
      uppercase: upper,
      noHyphens: noHyp,
      urn:       `urn:uuid:${lower}`,
      braces:    `{${lower}}`,
    },
  }
}

function insertHyphens(hex: string): string {
  return [
    hex.slice(0,  8),
    hex.slice(8,  12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-")
}

function cryptoRandInt(bits: number): number {
  const bytes = Math.ceil(bits / 8)
  const buf   = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  let val = 0
  for (const b of buf) val = (val << 8) | b
  return val & ((1 << bits) - 1)
}

function cryptoRandBigInt(bits: number): bigint {
  const bytes = Math.ceil(bits / 8)
  const buf   = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  let val = BigInt(0)
  for (const b of buf) val = (val << BigInt(8)) | BigInt(b)
  return val & ((BigInt(1) << BigInt(bits)) - BigInt(1))
}

// ── Nil + Max UUIDs ───────────────────────────────────────────────────────────

export const NIL_UUID = "00000000-0000-0000-0000-000000000000"
export const MAX_UUID = "ffffffff-ffff-ffff-ffff-ffffffffffff"