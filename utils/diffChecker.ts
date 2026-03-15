// ── Types ─────────────────────────────────────────────────────────────────────

export type DiffOperation = "equal" | "insert" | "delete"

export type DiffChunk = {
  op:    DiffOperation
  value: string
  lines: number
}

export type LineDiff = {
  type:       DiffOperation
  lineNum:    { a: number | null; b: number | null }
  value:      string
  chunks?:    DiffChunk[]   // inline word-level diffs for changed lines
}

export type DiffResult = {
  chunks:      DiffChunk[]
  lines:       LineDiff[]
  stats:       DiffStats
  identical:   boolean
}

export type DiffStats = {
  added:       number   // lines added
  removed:     number   // lines removed
  unchanged:   number   // lines unchanged
  totalA:      number   // total lines in A
  totalB:      number   // total lines in B
  similarity:  number   // 0–100%
  charChanges: number   // total characters changed
}

export type DiffMode = "split" | "unified"
export type DiffUnit = "line" | "word" | "char"

// ── Main differ ───────────────────────────────────────────────────────────────

export function diffText(
  a: string,
  b: string,
  unit: DiffUnit = "line"
): DiffResult {
  if (a === b) {
    const lines = a.split("\n")
    return {
      identical: true,
      chunks: [{ op: "equal", value: a, lines: lines.length }],
      lines:  lines.map((value, i) => ({
        type:    "equal" as DiffOperation,
        lineNum: { a: i + 1, b: i + 1 },
        value,
      })),
      stats: buildStats(lines.length, lines.length, 0, 0, a, b),
    }
  }

  switch (unit) {
    case "word": return diffByUnit(a, b, splitWords)
    case "char": return diffByUnit(a, b, splitChars)
    case "line":
    default:     return diffByLines(a, b)
  }
}

// ── Line differ ───────────────────────────────────────────────────────────────

function diffByLines(a: string, b: string): DiffResult {
  const linesA = a.split("\n")
  const linesB = b.split("\n")
  const chunks = myersDiff(linesA, linesB)

  const lineDiffs: LineDiff[] = []
  let   numA = 1
  let   numB = 1

  for (const chunk of chunks) {
    const lines = chunk.value.split("\n").filter((_, i, arr) =>
      i < arr.length - 1 || arr[i] !== ""
    )

    for (const line of lines) {
      if (chunk.op === "equal") {
        lineDiffs.push({ type: "equal",  lineNum: { a: numA++, b: numB++ }, value: line })
      } else if (chunk.op === "insert") {
        lineDiffs.push({ type: "insert", lineNum: { a: null,   b: numB++ }, value: line })
      } else {
        lineDiffs.push({ type: "delete", lineNum: { a: numA++, b: null   }, value: line })
      }
    }
  }

  // Pair adjacent delete+insert lines and compute inline word diffs
  const enriched = enrichInlineDiffs(lineDiffs)

  let added = 0, removed = 0, unchanged = 0
  for (const l of enriched) {
    if      (l.type === "insert") added++
    else if (l.type === "delete") removed++
    else                          unchanged++
  }

  return {
    chunks,
    lines:     enriched,
    identical: false,
    stats:     buildStats(linesA.length, linesB.length, added, removed, a, b),
  }
}

// ── Word / char differ ────────────────────────────────────────────────────────

function diffByUnit(
  a: string,
  b: string,
  splitter: (s: string) => string[]
): DiffResult {
  const tokensA = splitter(a)
  const tokensB = splitter(b)
  const chunks  = myersDiff(tokensA, tokensB)

  const linesA  = a.split("\n").length
  const linesB  = b.split("\n").length

  let added = 0, removed = 0
  for (const c of chunks) {
    if      (c.op === "insert") added   += c.value.split("\n").length
    else if (c.op === "delete") removed += c.value.split("\n").length
  }

  return {
    chunks,
    lines:     [],
    identical: false,
    stats:     buildStats(linesA, linesB, added, removed, a, b),
  }
}

// ── Myers diff algorithm ──────────────────────────────────────────────────────

function myersDiff(a: string[], b: string[]): DiffChunk[] {
  const n = a.length
  const m = b.length
  const max = n + m

  if (max === 0) return []

  // V array — furthest reaching D-path endpoints
  const v: number[] = new Array(2 * max + 1).fill(0)
  const trace: number[][] = []

  outer: for (let d = 0; d <= max; d++) {
    trace.push([...v])
    for (let k = -d; k <= d; k += 2) {
      const idx = k + max
      let x: number

      if (k === -d || (k !== d && v[idx - 1] < v[idx + 1])) {
        x = v[idx + 1]
      } else {
        x = v[idx - 1] + 1
      }

      let y = x - k
      while (x < n && y < m && a[x] === b[y]) { x++; y++ }
      v[idx] = x
      if (x >= n && y >= m) break outer
    }
  }

  // Backtrack to find edit path
  let x = n
  let y = m
  const edits: Array<{ op: DiffOperation; val: string }> = []

  for (let d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
    const vv  = trace[d]
    const max2 = n + m
    const k   = x - y
    const idx = k + max2

    let prevK: number
    if (k === -d || (k !== d && vv[idx - 1] < vv[idx + 1])) {
      prevK = k + 1
    } else {
      prevK = k - 1
    }

    const prevX = vv[prevK + max2]
    const prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      edits.push({ op: "equal", val: a[x - 1] })
      x--; y--
    }

    if (d > 0) {
      if (x === prevX) {
        edits.push({ op: "insert", val: b[y - 1] })
        y--
      } else {
        edits.push({ op: "delete", val: a[x - 1] })
        x--
      }
    }
  }

  edits.reverse()

  // Merge consecutive same-op edits into chunks
  const chunks: DiffChunk[] = []
  for (const { op, val } of edits) {
    const last = chunks[chunks.length - 1]
    if (last && last.op === op) {
      last.value += "\n" + val
      last.lines++
    } else {
      chunks.push({ op, value: val, lines: 1 })
    }
  }

  return chunks
}

// ── Inline word diff enrichment ───────────────────────────────────────────────

function enrichInlineDiffs(lines: LineDiff[]): LineDiff[] {
  const result: LineDiff[] = []
  let i = 0

  while (i < lines.length) {
    const curr = lines[i]
    const next = lines[i + 1]

    // When a delete is immediately followed by an insert, compute word-level diff
    if (curr.type === "delete" && next?.type === "insert") {
      const wordChunks = myersDiff(
        splitWords(curr.value),
        splitWords(next.value)
      )
      result.push({ ...curr, chunks: wordChunks })
      result.push({ ...next, chunks: wordChunks })
      i += 2
    } else {
      result.push(curr)
      i++
    }
  }

  return result
}

// ── Stats builder ─────────────────────────────────────────────────────────────

function buildStats(
  totalA:   number,
  totalB:   number,
  added:    number,
  removed:  number,
  textA:    string,
  textB:    string,
): DiffStats {
  const unchanged   = totalA - removed
  const longer      = Math.max(textA.length, textB.length)
  const charChanges = levenshteinDistance(textA, textB)
  const similarity  = longer === 0
    ? 100
    : Math.round(((longer - charChanges) / longer) * 100)

  return {
    added,
    removed,
    unchanged,
    totalA,
    totalB,
    similarity: Math.max(0, similarity),
    charChanges,
  }
}

// ── Levenshtein distance ──────────────────────────────────────────────────────

function levenshteinDistance(a: string, b: string): number {
  // Cap at 10k chars to keep it snappy
  const s1 = a.slice(0, 10_000)
  const s2 = b.slice(0, 10_000)
  const m  = s1.length
  const n  = s2.length

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)

  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      dp[j] = s1[i - 1] === s2[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = temp
    }
  }

  return dp[n]
}

// ── Tokenisers ────────────────────────────────────────────────────────────────

function splitWords(s: string): string[] {
  return s.match(/\S+|\s+/g) ?? []
}

function splitChars(s: string): string[] {
  return [...s]
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export function formatDiffAsUnified(result: DiffResult, context = 3): string {
  const lines   = result.lines
  const output: string[] = []
  let   i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.type !== "equal") {
      // Find the range to show with context
      const start = Math.max(0, i - context)
      const end   = Math.min(lines.length, i + context + 1)

      // Header
      const aStart = lines[start].lineNum.a ?? 0
      const bStart = lines[start].lineNum.b ?? 0
      output.push(`@@ -${aStart},${end - start} +${bStart},${end - start} @@`)

      for (let j = start; j < end; j++) {
        const l = lines[j]
        const prefix = l.type === "insert" ? "+" : l.type === "delete" ? "-" : " "
        output.push(`${prefix}${l.value}`)
      }

      i = end
    } else {
      i++
    }
  }

  return output.join("\n")
}

export function getSimilarityLabel(similarity: number): {
  label: string
  color: string
} {
  if (similarity === 100) return { label: "Identical",     color: "green"  }
  if (similarity >= 80)   return { label: "Very similar",  color: "green"  }
  if (similarity >= 60)   return { label: "Similar",       color: "amber"  }
  if (similarity >= 40)   return { label: "Somewhat different", color: "amber" }
  if (similarity >= 20)   return { label: "Very different", color: "red"   }
  return                         { label: "Completely different", color: "red" }
}