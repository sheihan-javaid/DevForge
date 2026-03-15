"use client"

import { useState, useCallback } from "react"
import {
  generateUUID,
  generateBatch,
  validateUUID,
  NIL_UUID,
  MAX_UUID,
} from "@/utils/uuid"
import type {
  UUIDResult,
  UUIDVersion,
  GenerateOptions,
} from "@/utils/uuid"
import CopyButton from "@/components/CopyButton"

type Tab = "generate" | "validate"

// ── Sub-components ────────────────────────────────────────────────────────────

function UUIDRow({
  result,
  index,
  format,
}: {
  result: UUIDResult
  index:  number
  format: keyof UUIDResult["formatted"]
}) {
  const value = result.formatted[format]

  return (
    <div className="
      group flex items-center justify-between gap-3
      px-4 py-2.5
      border-b border-gray-100 dark:border-gray-800 last:border-0
      hover:bg-gray-50 dark:hover:bg-gray-900/60
      transition-colors
    ">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] text-gray-300 dark:text-gray-600 w-5 text-right shrink-0 select-none">
          {index + 1}
        </span>
        <span className="textarea-mono text-xs text-gray-800 dark:text-gray-200 truncate">
          {value}
        </span>
        {result.version === "v7" && result.timestamp && (
          <span className="hidden group-hover:inline text-[10px] text-amber-500 dark:text-amber-400 shrink-0">
            {new Date(result.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      <CopyButton text={value} size="sm" />
    </div>
  )
}

function FormatSelector({
  value,
  onChange,
}: {
  value:    keyof UUIDResult["formatted"]
  onChange: (v: keyof UUIDResult["formatted"]) => void
}) {
  const formats: { key: keyof UUIDResult["formatted"]; label: string; example: string }[] = [
    { key: "standard",  label: "Standard",  example: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
    { key: "uppercase", label: "Uppercase", example: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" },
    { key: "noHyphens", label: "No hyphens",example: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"       },
    { key: "urn",       label: "URN",       example: "urn:uuid:xxxxxxxx-..."                 },
    { key: "braces",    label: "Braces",    example: "{xxxxxxxx-...}"                        },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {formats.map(({ key, label, example }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          title={example}
          className={`
            text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
            ${value === key
              ? "bg-violet-600 border-violet-600 text-white"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400"
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function CountStepper({
  value,
  onChange,
}: {
  value:    number
  onChange: (v: number) => void
}) {
  const presets = [1, 5, 10, 25, 50, 100]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`
            w-10 h-8 rounded-lg text-xs font-medium border transition-colors
            ${value === n
              ? "bg-violet-600 border-violet-600 text-white"
              : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700"
            }
          `}
        >
          {n}
        </button>
      ))}
      <input
        type="number"
        min={1}
        max={1000}
        value={value}
        onChange={(e) => {
          const v = Math.max(1, Math.min(1000, Number(e.target.value)))
          onChange(v)
        }}
        className="w-20 text-center text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UUIDGeneratorPage() {
  const [tab,      setTab]      = useState<Tab>("generate")
  const [version,  setVersion]  = useState<UUIDVersion>("v4")
  const [count,    setCount]    = useState(1)
  const [format,   setFormat]   = useState<keyof UUIDResult["formatted"]>("standard")
  const [results,  setResults]  = useState<UUIDResult[]>([])
  const [validateInput, setValidateInput] = useState("")

  // ── Generate ───────────────────────────────────────────────────────────────

  const generate = useCallback((opts: Partial<GenerateOptions> = {}) => {
    const res = generateBatch({
      version,
      count,
      ...opts,
    })
    setResults(res)
  }, [version, count])

  const handleVersionChange = (v: UUIDVersion) => {
    setVersion(v)
    if (results.length > 0) {
      const res = generateBatch({ version: v, count })
      setResults(res)
    }
  }

  const handleCountChange = (n: number) => {
    setCount(n)
    if (results.length > 0) {
      const res = generateBatch({ version, count: n })
      setResults(res)
    }
  }

  const handleClear = () => setResults([])

  const allText = results
    .map((r) => r.formatted[format])
    .join("\n")

  // ── Validate ───────────────────────────────────────────────────────────────

  const validation = validateInput.trim()
    ? validateUUID(validateInput)
    : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-xs">
            #
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            UUID Generator
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate v4 (random) or v7 (time-ordered) UUIDs in bulk.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["generate", "validate"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`
              px-4 py-2 text-sm font-medium capitalize transition-colors
              border-b-2 -mb-px
              ${tab === t
                ? "border-violet-600 text-violet-700 dark:text-violet-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }
            `}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Generate tab ──────────────────────────────────────────────────── */}
      {tab === "generate" && (
        <div className="space-y-6">

          {/* Controls card */}
          <div className="card rounded-xl p-5 space-y-5">

            {/* Version */}
            <div className="space-y-2">
              <span className="section-label">Version</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(["v4", "v7"] as UUIDVersion[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => handleVersionChange(v)}
                    className={`
                      flex flex-col items-start gap-1 px-4 py-3 rounded-xl border
                      text-left transition-colors
                      ${version === v
                        ? "border-violet-500 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700"
                      }
                    `}
                  >
                    <span className={`text-sm font-semibold font-mono ${version === v ? "text-violet-700 dark:text-violet-400" : "text-gray-700 dark:text-gray-300"}`}>
                      UUID {v.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {v === "v4"
                        ? "Randomly generated — no time component"
                        : "Time-ordered — sortable by creation time"
                      }
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div className="space-y-2">
              <span className="section-label">Count</span>
              <CountStepper value={count} onChange={handleCountChange} />
            </div>

            {/* Format */}
            <div className="space-y-2">
              <span className="section-label">Output format</span>
              <FormatSelector value={format} onChange={setFormat} />
            </div>

          </div>

          {/* Generate button */}
          <button
            onClick={() => generate()}
            className="btn-primary"
          >
            Generate {count} UUID{count > 1 ? "s" : ""}
          </button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3 animate-in">

              {/* Stats + actions */}
              <div className="flex items-center justify-between">
                <div className="stats-bar">
                  <span>
                    <span className="stats-label">Count: </span>
                    {results.length}
                  </span>
                  <span>
                    <span className="stats-label">Version: </span>
                    {version.toUpperCase()}
                  </span>
                  <span>
                    <span className="stats-label">Format: </span>
                    {format}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => generate()}
                    className="toolbar-btn"
                  >
                    ↻ Regenerate
                  </button>
                  <button
                    onClick={handleClear}
                    className="toolbar-btn-danger"
                  >
                    Clear
                  </button>
                  <CopyButton text={allText} size="sm" />
                </div>
              </div>

              {/* UUID list */}
              <div className="card rounded-xl overflow-hidden">
                <div className="max-h-[480px] overflow-y-auto">
                  {results.map((result, i) => (
                    <UUIDRow
                      key={i}
                      result={result}
                      index={i}
                      format={format}
                    />
                  ))}
                </div>
              </div>

              {/* v7 timestamp note */}
              {version === "v7" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
                  ⚡ UUID v7 embeds a millisecond timestamp — hover any row to see its creation time.
                </p>
              )}

            </div>
          )}

          {/* Reference UUIDs */}
          <div className="space-y-2">
            <span className="section-label">Reference values</span>
            <div className="card rounded-xl overflow-hidden">
              {[
                { label: "Nil UUID",  value: NIL_UUID, note: "All zeros — represents absence of a UUID" },
                { label: "Max UUID",  value: MAX_UUID, note: "All f's — maximum possible UUID value"     },
              ].map(({ label, value, note }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {label}
                      </span>
                    </div>
                    <div className="textarea-mono text-xs text-gray-500 dark:text-gray-400 truncate">
                      {value}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500">
                      {note}
                    </div>
                  </div>
                  <CopyButton text={value} size="sm" />
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── Validate tab ──────────────────────────────────────────────────── */}
      {tab === "validate" && (
        <div className="space-y-4">

          <div className="space-y-2">
            <span className="section-label">UUID to validate</span>
            <input
              type="text"
              value={validateInput}
              onChange={(e) => setValidateInput(e.target.value)}
              placeholder="Paste a UUID, URN, or braced UUID..."
              spellCheck={false}
              autoComplete="off"
              className={`
                w-full px-4 py-3 rounded-xl border text-sm textarea-mono
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                focus:outline-none focus:ring-2 focus:ring-offset-0
                transition-colors
                ${validation
                  ? validation.valid
                    ? "border-green-400 dark:border-green-600 focus:ring-green-400/20"
                    : "border-red-300 dark:border-red-700 focus:ring-red-400/20"
                  : "border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-violet-400/20"
                }
              `}
            />
          </div>

          {/* Validation result */}
          {validation && (
            <div className={`
              card rounded-xl overflow-hidden animate-in
            `}>
              {/* Status banner */}
              <div className={`
                px-4 py-3 flex items-center gap-3
                ${validation.valid
                  ? "bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800"
                }
              `}>
                <span className={`text-lg ${validation.valid ? "text-green-600" : "text-red-500"}`}>
                  {validation.valid ? "✓" : "✕"}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${validation.valid ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {validation.valid ? "Valid UUID" : "Invalid UUID"}
                  </p>
                  {validation.error && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                      {validation.error}
                    </p>
                  )}
                </div>
              </div>

              {/* Details */}
              {validation.valid && (
                <div className="px-4 divide-y divide-gray-100 dark:divide-gray-800">
                  {[
                    { label: "Version",   value: `v${validation.version}` },
                    { label: "Variant",   value: validation.variant       },
                    { label: "Canonical", value: validation.canonical     },
                  ].map(({ label, value }) => value && (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 py-2.5"
                    >
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-24 shrink-0">
                        {label}
                      </span>
                      <span className="text-xs textarea-mono text-gray-700 dark:text-gray-300 flex-1 break-all">
                        {value}
                      </span>
                      <CopyButton text={String(value)} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formats reference */}
          <div className="space-y-2">
            <span className="section-label">Accepted formats</span>
            <div className="card rounded-xl overflow-hidden">
              {[
                { label: "Standard",   example: "550e8400-e29b-41d4-a716-446655440000" },
                { label: "Uppercase",  example: "550E8400-E29B-41D4-A716-446655440000" },
                { label: "No hyphens", example: "550e8400e29b41d4a716446655440000"     },
                { label: "URN",        example: "urn:uuid:550e8400-e29b-41d4-a716-446655440000" },
                { label: "Braces",     example: "{550e8400-e29b-41d4-a716-446655440000}" },
              ].map(({ label, example }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                  onClick={() => setValidateInput(example)}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0">
                    {label}
                  </span>
                  <span className="textarea-mono text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">
                    {example}
                  </span>
                  <span className="text-[10px] text-violet-500 dark:text-violet-400 shrink-0">
                    Try it →
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  )
}