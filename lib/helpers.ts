// ── String helpers ────────────────────────────────────────────────────────────

export function capitalize(str: string): string {
  if (!str) return ""
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncate(str: string, max: number, suffix = "..."): string {
  if (str.length <= max) return str
  return str.slice(0, max - suffix.length) + suffix
}

export function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "")
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;")
}

export function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

export function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length
}

export function countLines(str: string): number {
  if (!str) return 0
  return str.split("\n").length
}

export function countBytes(str: string): number {
  return new TextEncoder().encode(str).length
}

export function isPrintable(str: string): boolean {
  return /^[\x20-\x7E]*$/.test(str)
}

export function reverseString(str: string): string {
  return [...str].reverse().join("")
}

export function deduplicate(str: string): string {
  return [...new Set(str)].join("")
}

// ── Number helpers ────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function toFixed(value: number, decimals = 2): number {
  return parseFloat(value.toFixed(decimals))
}

export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value)
}

export function isNumeric(str: string): boolean {
  return !isNaN(Number(str)) && str.trim() !== ""
}

export function formatNumber(n: number): string {
  return n.toLocaleString()
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B"
  const k     = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i     = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

export function formatPercent(value: number, total: number, decimals = 1): string {
  if (total === 0) return "0%"
  return `${((value / total) * 100).toFixed(decimals)}%`
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Array helpers ─────────────────────────────────────────────────────────────

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function groupBy<T>(
  arr: T[],
  key: (item: T) => string
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

export function sortBy<T>(
  arr: T[],
  key: (item: T) => string | number,
  dir: "asc" | "desc" = "asc"
): T[] {
  return [...arr].sort((a, b) => {
    const ka = key(a)
    const kb = key(b)
    if (ka < kb) return dir === "asc" ? -1 :  1
    if (ka > kb) return dir === "asc" ?  1 : -1
    return 0
  })
}

export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((acc, val) => acc.concat(val), [])
}

export function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1]
}

export function first<T>(arr: T[]): T | undefined {
  return arr[0]
}

export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = []
  for (let i = start; i < end; i += step) result.push(i)
  return result
}

// ── Object helpers ────────────────────────────────────────────────────────────

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  for (const key of keys) delete result[key]
  return result
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  for (const key of keys) result[key] = obj[key]
  return result
}

export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined)  return true
  if (typeof value === "string")              return value.trim() === ""
  if (Array.isArray(value))                  return value.length === 0
  if (typeof value === "object")             return Object.keys(value).length === 0
  return false
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (typeof a !== "object" || a === null) return false
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  if (ka.length !== kb.length) return false
  return ka.every((k) =>
    deepEqual(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k]
    )
  )
}

// ── Date & time helpers ───────────────────────────────────────────────────────

export function formatDate(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(date).toLocaleDateString(undefined, {
    dateStyle: "medium",
    ...options,
  })
}

export function formatTime(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(date).toLocaleTimeString(undefined, {
    timeStyle: "short",
    ...options,
  })
}

export function formatDateTime(date: Date | number | string): string {
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function timeAgo(date: Date | number | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  const abs     = Math.abs(seconds)
  const past    = seconds >= 0

  if (abs < 60)          return past ? "just now"                         : "in a few seconds"
  if (abs < 3_600)       return past ? `${Math.floor(abs / 60)}m ago`     : `in ${Math.floor(abs / 60)}m`
  if (abs < 86_400)      return past ? `${Math.floor(abs / 3_600)}h ago`  : `in ${Math.floor(abs / 3_600)}h`
  if (abs < 2_592_000)   return past ? `${Math.floor(abs / 86_400)}d ago` : `in ${Math.floor(abs / 86_400)}d`
  if (abs < 31_536_000)  return past ? `${Math.floor(abs / 2_592_000)}mo ago` : `in ${Math.floor(abs / 2_592_000)}mo`
  return past
    ? `${Math.floor(abs / 31_536_000)}y ago`
    : `in ${Math.floor(abs / 31_536_000)}y`
}

export function unixNow(): number {
  return Math.floor(Date.now() / 1000)
}

export function unixToDate(unix: number): Date {
  return new Date(unix * 1000)
}

// ── Async helpers ─────────────────────────────────────────────────────────────

export function debounce<T extends (...args: unknown[]) => void>(
  fn:    T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn:       T,
  interval: number
): (...args: Parameters<T>) => void {
  let last = 0
  return (...args) => {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      fn(...args)
    }
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms:      number,
  message  = "Operation timed out"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  )
  return Promise.race([promise, timeout])
}

// ── Clipboard helpers ─────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    try {
      const el       = document.createElement("textarea")
      el.value       = text
      el.style.position = "fixed"
      el.style.opacity  = "0"
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      return true
    } catch {
      return false
    }
  }
}

export async function readFromClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText()
  } catch {
    return null
  }
}

// ── URL helpers ───────────────────────────────────────────────────────────────

export function isValidURL(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

export function getURLParams(url: string): Record<string, string> {
  try {
    return Object.fromEntries(new URL(url).searchParams.entries())
  } catch {
    return {}
  }
}

export function buildURL(
  base:   string,
  params: Record<string, string>
): string {
  const url = new URL(base)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

export function cryptoRandom(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / (0xffffffff + 1)
}

export function cryptoRandomInt(min: number, max: number): number {
  return Math.floor(cryptoRandom() * (max - min + 1)) + min
}

export function cryptoRandomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  return buf
}

// ── Download helpers ──────────────────────────────────────────────────────────

export function downloadText(
  content:  string,
  filename: string,
  mimeType  = "text/plain"
): void {
  const blob = new Blob([content], { type: mimeType })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadJSON(data: unknown, filename: string): void {
  downloadText(
    JSON.stringify(data, null, 2),
    filename.endsWith(".json") ? filename : `${filename}.json`,
    "application/json"
  )
}

// ── Type guards ───────────────────────────────────────────────────────────────

export function isString(value: unknown): value is string {
  return typeof value === "string"
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value)
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}