// ── Types ─────────────────────────────────────────────────────────────────────

export type PasswordOptions = {
  length:       number
  uppercase:    boolean
  lowercase:    boolean
  numbers:      boolean
  symbols:      boolean
  excludeAmbiguous: boolean  // excludes 0, O, l, 1, I
  customSymbols?:   string
}

export type PasswordResult = {
  password:  string
  entropy:   number          // bits
  strength:  PasswordStrength
  label:     string
  crackTime: string
}

export type PasswordStrength = "weak" | "fair" | "good" | "strong" | "very-strong"

export const DEFAULT_OPTIONS: PasswordOptions = {
  length:           16,
  uppercase:        true,
  lowercase:        true,
  numbers:          true,
  symbols:          true,
  excludeAmbiguous: false,
}

// ── Character pools ───────────────────────────────────────────────────────────

const POOLS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers:   "0123456789",
  symbols:   "!@#$%^&*()-_=+[]{}|;:,.<>?",
} as const

const AMBIGUOUS = /[0Ol1I]/g

// ── Core generator ────────────────────────────────────────────────────────────

export function generatePassword(options: Partial<PasswordOptions> = {}): PasswordResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Build charset
  let charset = buildCharset(opts)

  if (!charset) {
    charset = POOLS.lowercase  // fallback — should never happen via the UI
  }

  // Use crypto.getRandomValues for cryptographically secure randomness
  const password = generateSecure(charset, opts.length, opts)

  const entropy  = calcEntropy(charset.length, opts.length)
  const strength = getStrength(entropy)

  return {
    password,
    entropy:   Math.round(entropy),
    strength:  strength.key,
    label:     strength.label,
    crackTime: estimateCrackTime(entropy),
  }
}

// ── Bulk generator ────────────────────────────────────────────────────────────

export function generateBatch(
  count: number,
  options: Partial<PasswordOptions> = {}
): PasswordResult[] {
  return Array.from({ length: count }, () => generatePassword(options))
}

// ── Passphrase generator ──────────────────────────────────────────────────────

const WORDS = [
  "apple","bridge","castle","dragon","echo","forest","glacier","harbor",
  "island","jungle","kernel","lagoon","meteor","nebula","orbit","planet",
  "quartz","rocket","signal","thunder","ultra","vertex","walrus","xenon",
  "yellow","zenith","anchor","blizzard","coral","delta","ember","falcon",
  "gravel","hollow","ignite","jasper","kraken","lancer","marble","nomad",
]

export function generatePassphrase(wordCount: number = 4, separator = "-"): PasswordResult {
  const chosen: string[] = []
  const buf = new Uint32Array(wordCount)
  crypto.getRandomValues(buf)

  for (let i = 0; i < wordCount; i++) {
    chosen.push(WORDS[buf[i] % WORDS.length])
  }

  // Add a number for extra entropy
  const numBuf = new Uint8Array(1)
  crypto.getRandomValues(numBuf)
  chosen.push(String(numBuf[0] % 100).padStart(2, "0"))

  const password = chosen.join(separator)
  const entropy  = calcEntropy(WORDS.length, wordCount) + calcEntropy(100, 1)
  const strength = getStrength(entropy)

  return {
    password,
    entropy:   Math.round(entropy),
    strength:  strength.key,
    label:     strength.label,
    crackTime: estimateCrackTime(entropy),
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCharset(opts: PasswordOptions): string {
  let charset = ""
  if (opts.uppercase) charset += POOLS.uppercase
  if (opts.lowercase) charset += POOLS.lowercase
  if (opts.numbers)   charset += POOLS.numbers
  if (opts.symbols)   charset += (opts.customSymbols ?? POOLS.symbols)

  if (opts.excludeAmbiguous) {
    charset = charset.replace(AMBIGUOUS, "")
  }

  // Deduplicate
  return [...new Set(charset)].join("")
}

function generateSecure(
  charset: string,
  length: number,
  opts: PasswordOptions
): string {
  const chars  = charset.split("")
  const result: string[] = []

  // Guarantee at least one char from each enabled pool
  const required: string[] = []
  if (opts.uppercase) required.push(pickRandom(POOLS.uppercase.replace(AMBIGUOUS, "")))
  if (opts.lowercase) required.push(pickRandom(POOLS.lowercase.replace(AMBIGUOUS, "")))
  if (opts.numbers)   required.push(pickRandom(POOLS.numbers.replace(AMBIGUOUS, "")))
  if (opts.symbols)   required.push(pickRandom((opts.customSymbols ?? POOLS.symbols)))

  // Fill remainder
  const remaining = length - required.length
  for (let i = 0; i < Math.max(0, remaining); i++) {
    result.push(pickRandom(chars.join("")))
  }

  // Shuffle required chars into result using crypto
  const combined = [...result, ...required]
  return cryptoShuffle(combined).join("")
}

function pickRandom(charset: string): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return charset[buf[0] % charset.length]
}

function cryptoShuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    const j = buf[0] % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function calcEntropy(poolSize: number, length: number): number {
  if (poolSize <= 0) return 0
  return length * Math.log2(poolSize)
}

function getStrength(entropy: number): { key: PasswordStrength; label: string } {
  if (entropy < 28)  return { key: "weak",        label: "Weak"        }
  if (entropy < 36)  return { key: "fair",         label: "Fair"        }
  if (entropy < 60)  return { key: "good",         label: "Good"        }
  if (entropy < 128) return { key: "strong",       label: "Strong"      }
  return               { key: "very-strong",  label: "Very strong" }
}

function estimateCrackTime(entropy: number): string {
  // Assumes 10 billion guesses/sec (modern GPU cluster)
  const guesses    = Math.pow(2, entropy)
  const seconds    = guesses / 10_000_000_000

  if (seconds < 1)           return "Less than a second"
  if (seconds < 60)          return `${Math.round(seconds)} seconds`
  if (seconds < 3_600)       return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86_400)      return `${Math.round(seconds / 3_600)} hours`
  if (seconds < 31_536_000)  return `${Math.round(seconds / 86_400)} days`
  if (seconds < 3.15e9)      return `${Math.round(seconds / 31_536_000)} years`
  if (seconds < 3.15e12)     return `${(seconds / 3.15e9).toFixed(1)}k years`
  if (seconds < 3.15e15)     return `${(seconds / 3.15e12).toFixed(1)}M years`
  return "Longer than the age of the universe"
}