// ── Types ─────────────────────────────────────────────────────────────────────

export type JWTResult =
  | { ok: true;  decoded: JWTDecoded }
  | { ok: false; error: string; hint: string }

export type JWTDecoded = {
  header:    JWTHeader
  payload:   JWTPayload
  signature: string
  raw: {
    header:    string
    payload:   string
    signature: string
  }
  meta: JWTMeta
}

export type JWTHeader = {
  alg:  string
  typ?: string
  kid?: string
  [key: string]: unknown
}

export type JWTPayload = {
  // Registered claims (RFC 7519)
  iss?: string   // issuer
  sub?: string   // subject
  aud?: string | string[]  // audience
  exp?: number   // expiration
  nbf?: number   // not before
  iat?: number   // issued at
  jti?: string   // JWT ID
  // Custom claims
  [key: string]: unknown
}

export type JWTMeta = {
  isExpired:    boolean
  expiresAt:    string | null
  issuedAt:     string | null
  notBefore:    string | null
  timeUntilExp: string | null
  algorithm:    string
  hasKid:       boolean
  claimCount:   number
}

// ── Main decoder ──────────────────────────────────────────────────────────────

export function decodeJWT(token: string): JWTResult {
  const trimmed = token.trim()

  if (!trimmed) {
    return { ok: false, error: "Input is empty", hint: "Paste a JWT token above to decode it." }
  }

  // Strip "Bearer " prefix if present
  const cleaned = trimmed.replace(/^Bearer\s+/i, "")

  const parts = cleaned.split(".")

  if (parts.length !== 3) {
    return {
      ok: false,
      error: `Expected 3 parts, got ${parts.length}`,
      hint: parts.length < 3
        ? "A JWT must have three dot-separated parts: header.payload.signature."
        : "Make sure you copied the full token without extra characters.",
    }
  }

  const [rawHeader, rawPayload, rawSignature] = parts

  // Decode header
  const headerResult = decodeSegment<JWTHeader>(rawHeader)
  if (!headerResult.ok) {
    return {
      ok: false,
      error: "Failed to decode header",
      hint: headerResult.hint,
    }
  }

  // Decode payload
  const payloadResult = decodeSegment<JWTPayload>(rawPayload)
  if (!payloadResult.ok) {
    return {
      ok: false,
      error: "Failed to decode payload",
      hint: payloadResult.hint,
    }
  }

  const header  = headerResult.data
  const payload = payloadResult.data

  // Validate header has alg
  if (!header.alg) {
    return {
      ok: false,
      error: "Missing algorithm in header",
      hint: "The header must contain an 'alg' field (e.g. HS256, RS256).",
    }
  }

  return {
    ok: true,
    decoded: {
      header,
      payload,
      signature: rawSignature,
      raw: {
        header:    rawHeader,
        payload:   rawPayload,
        signature: rawSignature,
      },
      meta: buildMeta(header, payload),
    },
  }
}

// ── Segment decoder ───────────────────────────────────────────────────────────

function decodeSegment<T>(segment: string): { ok: true; data: T } | { ok: false; hint: string } {
  try {
    // Restore base64url → base64 and add padding
    const base64 = segment
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(segment.length + (4 - (segment.length % 4)) % 4, "=")

    const json = new TextDecoder().decode(
      Uint8Array.from(atob(base64), (c) => c.codePointAt(0)!)
    )

    return { ok: true, data: JSON.parse(json) as T }
  } catch {
    return {
      ok: false,
      hint: "The segment is not valid base64url-encoded JSON.",
    }
  }
}

// ── Meta builder ──────────────────────────────────────────────────────────────

function buildMeta(header: JWTHeader, payload: JWTPayload): JWTMeta {
  const now = Math.floor(Date.now() / 1000)

  const expiresAt    = payload.exp ? formatUnix(payload.exp) : null
  const issuedAt     = payload.iat ? formatUnix(payload.iat) : null
  const notBefore    = payload.nbf ? formatUnix(payload.nbf) : null
  const isExpired    = payload.exp !== undefined && payload.exp < now
  const timeUntilExp = payload.exp
    ? isExpired
      ? `Expired ${formatRelative(now - payload.exp)} ago`
      : `Expires in ${formatRelative(payload.exp - now)}`
    : null

  return {
    isExpired,
    expiresAt,
    issuedAt,
    notBefore,
    timeUntilExp,
    algorithm:  header.alg,
    hasKid:     Boolean(header.kid),
    claimCount: Object.keys(payload).length,
  }
}

// ── Claim helpers ─────────────────────────────────────────────────────────────

export function getClaimDescription(key: string): string {
  const map: Record<string, string> = {
    iss: "Issuer — who issued the token",
    sub: "Subject — who the token is about",
    aud: "Audience — who the token is intended for",
    exp: "Expiration — when the token expires",
    nbf: "Not before — earliest valid time",
    iat: "Issued at — when the token was issued",
    jti: "JWT ID — unique identifier for this token",
  }
  return map[key] ?? "Custom claim"
}

export function isTimestampClaim(key: string): boolean {
  return ["exp", "nbf", "iat"].includes(key)
}

export function formatClaimValue(key: string, value: unknown): string {
  if (isTimestampClaim(key) && typeof value === "number") {
    return `${value} — ${formatUnix(value)}`
  }
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

// ── Algorithm info ────────────────────────────────────────────────────────────

export type AlgorithmInfo = {
  family: string
  secure: boolean
  note:   string
}

export function getAlgorithmInfo(alg: string): AlgorithmInfo {
  const map: Record<string, AlgorithmInfo> = {
    HS256: { family: "HMAC",    secure: true,  note: "Symmetric — same secret signs and verifies." },
    HS384: { family: "HMAC",    secure: true,  note: "Symmetric — same secret signs and verifies." },
    HS512: { family: "HMAC",    secure: true,  note: "Symmetric — same secret signs and verifies." },
    RS256: { family: "RSA",     secure: true,  note: "Asymmetric — private key signs, public key verifies." },
    RS384: { family: "RSA",     secure: true,  note: "Asymmetric — private key signs, public key verifies." },
    RS512: { family: "RSA",     secure: true,  note: "Asymmetric — private key signs, public key verifies." },
    ES256: { family: "ECDSA",   secure: true,  note: "Elliptic curve — smaller keys, same security as RSA." },
    ES384: { family: "ECDSA",   secure: true,  note: "Elliptic curve — smaller keys, same security as RSA." },
    ES512: { family: "ECDSA",   secure: true,  note: "Asymmetric elliptic curve with 512-bit key." },
    PS256: { family: "RSA-PSS", secure: true,  note: "RSA with probabilistic signature scheme." },
    EdDSA: { family: "EdDSA",   secure: true,  note: "Modern elliptic curve — fast and secure." },
    none:  { family: "None",    secure: false, note: "⚠ No signature — token is completely unsigned and unverified." },
  }
  return map[alg] ?? { family: "Unknown", secure: false, note: "Unrecognised algorithm." }
}

// ── Private utils ─────────────────────────────────────────────────────────────

function formatUnix(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatRelative(seconds: number): string {
  if (seconds < 60)          return `${seconds}s`
  if (seconds < 3_600)       return `${Math.floor(seconds / 60)}m`
  if (seconds < 86_400)      return `${Math.floor(seconds / 3_600)}h`
  return                            `${Math.floor(seconds / 86_400)}d`
}