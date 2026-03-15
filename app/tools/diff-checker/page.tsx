"use client"

import { useState, useCallback } from "react"
import {
  diffText,
  formatDiffAsUnified,
  getSimilarityLabel,
} from "@/utils/diffChecker"
import type {
  DiffResult,
  DiffUnit,
  DiffMode,
  LineDiff,
  DiffChunk,
} from "@/utils/diffChecker"
import CopyButton from "@/components/CopyButton"

// ── Sub-components ────────────────────────────────────────────────────────────

function DiffLine({
  line,
  showLineNumbers,
}: {
  line:            LineDiff
  showLineNumbers: boolean
}) {
  const bg = {
    insert:  "bg-green-50  dark:bg-green-900/20",
    delete:  "bg-red-50    dark:bg-red-900/20",
    equal:   "",
  }[line.type]

  const prefix = {
    insert: "+",
    delete: "−",
    equal:  " ",
  }[line.type]

  const prefixColor = {
    insert: "text-green-600 dark:text-green-400",
    delete: "text-red-500   dark:text-red-400",
    equal:  "text-gray-300  dark:text-gray-600",
  }[line.type]

  // Render inline word-level diff chunks if available
  const renderInline = (chunks: DiffChunk[], type: "delete" | "insert") => {
    const relevantOp = type === "delete" ? "delete" : "insert"
    return chunks.map((chunk, i) => {
      if (chunk.op === "equal") {
        return (
          <span key={i} className="text-gray-700 dark:text-gray-300">
            {chunk.value}
          </span>
        )
      }
      if (chunk.op === relevantOp) {
        return (
          <mark
            key={i}
            className={
              type === "delete"
                ? "bg-red-200 dark:bg-red-800/60 text-red-900 dark:text-red-100 rounded-sm px-0.5"
                : "bg-green-200 dark:bg-green-800/60 text-green-900 dark:text-green-100 rounded-sm px-0.5"
            }
          >
            {chunk.value}
          </mark>
        )
      }
      return null
    })
  }

  return (
    <div className={`flex items-start gap-0 font-mono text-xs leading-6 ${bg}`}>

      {/* Line numbers */}
      {showLineNumbers && (
        <div className="flex shrink-0 select-none">
          <span className="w-10 text-right px-2 text-gray-300 dark:text-gray-600 border-r border-gray-100 dark:border-gray-800">
            {line.lineNum.a ?? ""}
          </span>
          <span className="w-10 text-right px-2 text-gray-300 dark:text-gray-600 border-r border-gray-100 dark:border-gray-800">
            {line.lineNum.b ?? ""}
          </span>
        </div>
      )}

      {/* Prefix */}
      <span className={`w-6 text-center shrink-0 select-none ${prefixColor}`}>
        {prefix}
      </span>

      {/* Content */}
      <span className="flex-1 px-2 whitespace-pre-wrap break-all py-0.5">
        {line.chunks && (line.type === "delete" || line.type === "insert")
          ? renderInline(line.chunks, line.type)
          : (
            <span className={
              line.type === "insert" ? "text-green-800 dark:text-green-200" :
              line.type === "delete" ? "text-red-800   dark:text-red-200"   :
              "text-gray-700 dark:text-gray-300"
            }>
              {line.value || <span className="opacity-30 select-none">↵</span>}
            </span>
          )
        }
      </span>
    </div>
  )
}

function SplitView({
  lines,
  showLineNumbers,
}: {
  lines:           LineDiff[]
  showLineNumbers: boolean
}) {
  const leftLines  = lines.filter((l) => l.type !== "insert")
  const rightLines = lines.filter((l) => l.type !== "delete")

  const renderSide = (sidelines: LineDiff[], side: "left" | "right") => (
    <div className="flex-1 min-w-0 overflow-x-auto">
      {sidelines.map((line, i) => {
        const bg =
          side === "left"  && line.type === "delete" ? "bg-red-50   dark:bg-red-900/20"   :
          side === "right" && line.type === "insert" ? "bg-green-50 dark:bg-green-900/20" :
          ""

        const numKey = side === "left" ? "a" : "b"

        return (
          <div key={i} className={`flex items-start gap-0 font-mono text-xs leading-6 ${bg}`}>
            {showLineNumbers && (
              <span className="w-10 text-right px-2 shrink-0 select-none text-gray-300 dark:text-gray-600 border-r border-gray-100 dark:border-gray-800">
                {line.lineNum[numKey] ?? ""}
              </span>
            )}
            <span className="flex-1 px-3 whitespace-pre-wrap break-all py-0.5">
              {line.chunks && (
                (side === "left"  && line.type === "delete") ||
                (side === "right" && line.type === "insert")
              )
                ? line.chunks.map((chunk, ci) => {
                    const relevantOp = side === "left" ? "delete" : "insert"
                    if (chunk.op === "equal") {
                      return <span key={ci} className="text-gray-700 dark:text-gray-300">{chunk.value}</span>
                    }
                    if (chunk.op === relevantOp) {
                      return (
                        <mark key={ci} className={
                          side === "left"
                            ? "bg-red-200 dark:bg-red-800/60 text-red-900 dark:text-red-100 rounded-sm px-0.5"
                            : "bg-green-200 dark:bg-green-800/60 text-green-900 dark:text-green-100 rounded-sm px-0.5"
                        }>
                          {chunk.value}
                        </mark>
                      )
                    }
                    return null
                  })
                : (
                  <span className={
                    side === "left"  && line.type === "delete" ? "text-red-800   dark:text-red-200"   :
                    side === "right" && line.type === "insert" ? "text-green-800 dark:text-green-200" :
                    "text-gray-700 dark:text-gray-300"
                  }>
                    {line.value || <span className="opacity-30 select-none">↵</span>}
                  </span>
                )
              }
            </span>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex divide-x divide-gray-100 dark:divide-gray-800 overflow-x-auto">
      {renderSide(leftLines,  "left")}
      {renderSide(rightLines, "right")}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DiffCheckerPage() {
  const [textA,       setTextA]       = useState("")
  const [textB,       setTextB]       = useState("")
  const [unit,        setUnit]        = useState<DiffUnit>("line")
  const [viewMode,    setViewMode]    = useState<DiffMode>("unified")
  const [showLineNums,setShowLineNums] = useState(true)
  const [result,      setResult]      = useState<DiffResult | null>(null)

  // ── Run diff ───────────────────────────────────────────────────────────────

  const run = useCallback((a: string, b: string, u: DiffUnit) => {
    if (!a && !b) { setResult(null); return }
    setResult(diffText(a, b, u))
  }, [])

  const handleCompare = () => run(textA, textB, unit)

  const handleClear = () => {
    setTextA(""); setTextB(""); setResult(null)
  }

  const handleSwap = () => {
    setTextA(textB); setTextB(textA)
    if (result) run(textB, textA, unit)
  }

  const loadSample = () => {
    const a = `function greet(name) {
  console.log("Hello, " + name)
  return true
}

const user = "Alice"
greet(user)`

    const b = `function greet(name, greeting = "Hello") {
  console.log(greeting + ", " + name + "!")
  return name.length > 0
}

const user = "Bob"
greet(user, "Hi")`

    setTextA(a); setTextB(b)
    run(a, b, unit)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const stats     = result?.stats
  const simLabel  = stats ? getSimilarityLabel(stats.similarity) : null
  const unified   = result ? formatDiffAsUnified(result) : ""

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-sm">
            ±
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Diff Checker
          </h1>
          {simLabel && (
            <span className={`badge ${
              simLabel.color === "green" ? "badge-green" :
              simLabel.color === "amber" ? "badge-amber" :
              "badge-red"
            }`}>
              {simLabel.label}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Compare two blocks of text and highlight the differences line by line.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Diff unit */}
        <div className="toggle-group">
          {(["line", "word", "char"] as DiffUnit[]).map((u) => (
            <button
              key={u}
              onClick={() => { setUnit(u); if (result) run(textA, textB, u) }}
              className={unit === u ? "toggle-item-active" : "toggle-item"}
            >
              {u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>

        {/* View mode */}
        <div className="toggle-group">
          {(["unified", "split"] as DiffMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={viewMode === m ? "toggle-item-active" : "toggle-item"}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Line numbers toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={showLineNums}
              onChange={(e) => setShowLineNums(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 rounded-full bg-gray-200 dark:bg-gray-700 peer-checked:bg-violet-600 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
          </div>
          Line numbers
        </label>

        <div className="flex-1" />

        <button onClick={loadSample} className="toolbar-btn">
          Load sample
        </button>
        <button onClick={handleSwap} className="toolbar-btn">
          ⇄ Swap
        </button>
        <button onClick={handleClear} className="toolbar-btn-danger">
          Clear
        </button>
      </div>

      {/* Text inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { label: "Original",  value: textA, onChange: setTextA, side: "A" },
          { label: "Modified",  value: textB, onChange: setTextB, side: "B" },
        ].map(({ label, value, onChange, side }) => (
          <div key={side} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="section-label">{label}</label>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {value.split("\n").length} lines
              </span>
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Paste ${label.toLowerCase()} text here...`}
              rows={12}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              className="
                w-full textarea-mono resize-y rounded-xl px-4 py-3
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                border border-gray-200 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-offset-0
                focus:border-violet-400 dark:focus:border-violet-600
                focus:ring-violet-400/20 transition-colors
              "
            />
          </div>
        ))}
      </div>

      {/* Compare button */}
      <button
        onClick={handleCompare}
        disabled={!textA && !textB}
        className="btn-primary"
      >
        Compare
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-in">

          {/* Stats bar */}
          {stats && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="stats-bar flex-1">
                {[
                  { label: "Added",     value: stats.added,     color: "text-green-600 dark:text-green-400" },
                  { label: "Removed",   value: stats.removed,   color: "text-red-500   dark:text-red-400"   },
                  { label: "Unchanged", value: stats.unchanged,  color: ""                                   },
                  { label: "Similarity",value: `${stats.similarity}%`, color: "" },
                ].map(({ label, value, color }) => (
                  <span key={label}>
                    <span className="stats-label">{label}: </span>
                    <span className={color}>{value}</span>
                  </span>
                ))}
              </div>
              <CopyButton text={unified} size="sm" />
            </div>
          )}

          {/* Identical state */}
          {result.identical && (
            <div className="text-center py-10 space-y-2 card rounded-xl">
              <div className="text-3xl">≡</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Texts are identical
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Both inputs contain exactly the same content.
              </p>
            </div>
          )}

          {/* Diff view */}
          {!result.identical && result.lines.length > 0 && (
            <div className="card rounded-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" />
                    <span className="text-gray-500 dark:text-gray-400">Added</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-800" />
                    <span className="text-gray-500 dark:text-gray-400">Removed</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
                    <span className="text-gray-500 dark:text-gray-400">Unchanged</span>
                  </span>
                </div>
                <span className="section-label">
                  {viewMode} view
                </span>
              </div>

              {/* Diff lines */}
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                {viewMode === "unified"
                  ? result.lines.map((line, i) => (
                      <DiffLine
                        key={i}
                        line={line}
                        showLineNumbers={showLineNums}
                      />
                    ))
                  : <SplitView
                      lines={result.lines}
                      showLineNumbers={showLineNums}
                    />
                }
              </div>
            </div>
          )}

          {/* Unified patch */}
          {!result.identical && unified && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="section-label">Unified patch</span>
                <CopyButton text={unified} size="sm" />
              </div>
              <pre className="card rounded-xl p-4 textarea-mono text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre max-h-48">
                {unified}
              </pre>
            </div>
          )}

        </div>
      )}

    </div>
  )
}