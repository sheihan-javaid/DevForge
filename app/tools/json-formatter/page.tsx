"use client"

import { useState, useEffect, useCallback } from "react"
import TextAreaBox from "@/components/TextAreaBox"
import CopyButton from "@/components/CopyButton"
import { formatJSON, minifyJSON, validateJSON } from "@/utils/jsonFormatter"
import type { JSONStats, JSONValueType } from "@/utils/jsonFormatter"

type Mode = "prettify" | "minify"
type Indent = 2 | 4 | "tab"

const SAMPLE_JSON = `{
  "name": "DevForge",
  "version": "1.0.0",
  "tools": ["JSON Formatter", "Base64", "JWT Decoder"],
  "meta": {
    "free": true,
    "requiresLogin": false
  }
}`

export default function JsonFormatter() {
  const [input,  setInput]  = useState("")
  const [output, setOutput] = useState("")
  const [mode,   setMode]   = useState<Mode>("prettify")
  const [indent, setIndent] = useState<Indent>(2)
  const [error,  setError]  = useState<string | undefined>()
  const [hint,   setHint]   = useState<string | undefined>()
  const [stats,  setStats]  = useState<JSONStats | null>(null)
  const [type,   setType]   = useState<JSONValueType | null>(null)
  const [autoFormat, setAutoFormat] = useState(false)

  const run = useCallback((raw: string, m: Mode, ind: Indent) => {
    if (!raw.trim()) {
      setOutput(""); setError(undefined); setHint(undefined); setStats(null); setType(null)
      return
    }

    const result = m === "minify" ? minifyJSON(raw) : formatJSON(raw, ind)

    if (result.ok) {
      setOutput(result.output)
      setStats(result.stats)
      setType(result.type)
      setError(undefined)
      setHint(undefined)
    } else {
      setOutput("")
      setStats(null)
      setType(null)
      setError(result.error)
      setHint(result.hint)
    }
  }, [])

  // Auto-format as user types
  useEffect(() => {
    if (autoFormat) run(input, mode, indent)
  }, [input, mode, indent, autoFormat, run])

  const handleFormat = () => run(input, mode, indent)

  const handleClear = () => {
    setInput(""); setOutput(""); setError(undefined)
    setHint(undefined); setStats(null); setType(null)
  }

  const loadSample = () => {
    setInput(SAMPLE_JSON)
    run(SAMPLE_JSON, mode, indent)
  }

  const validation = input.trim() ? validateJSON(input) : null

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-sm">
            {"{}"}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            JSON Formatter
          </h1>
          {validation && (
            <span className={`
              text-xs font-medium px-2.5 py-1 rounded-full
              ${validation.valid
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }
            `}>
              {validation.valid ? "✓ Valid JSON" : "✕ Invalid JSON"}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Prettify, minify, and validate JSON instantly.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Mode toggle */}
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          {(["prettify", "minify"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`
                px-3.5 py-1.5 font-medium capitalize transition-colors
                ${mode === m
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              `}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Indent (only when prettifying) */}
        {mode === "prettify" && (
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
            {([2, 4, "tab"] as Indent[]).map((ind) => (
              <button
                key={ind}
                onClick={() => setIndent(ind)}
                className={`
                  px-3 py-1.5 font-medium font-mono transition-colors
                  ${indent === ind
                    ? "bg-violet-600 text-white"
                    : "bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }
                `}
              >
                {ind === "tab" ? "Tab" : `${ind}s`}
              </button>
            ))}
          </div>
        )}

        {/* Auto-format toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={autoFormat}
              onChange={(e) => setAutoFormat(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 rounded-full bg-gray-200 dark:bg-gray-700 peer-checked:bg-violet-600 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
          </div>
          Auto-format
        </label>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Utility buttons */}
        <button
          onClick={loadSample}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Load sample
        </button>
        <button
          onClick={handleClear}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-red-500 hover:border-red-200 dark:hover:text-red-400 dark:hover:border-red-800 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TextAreaBox
          label="Input"
          value={input}
          onChange={setInput}
          placeholder={`Paste your JSON here...\n\nOr click "Load sample" to try it out.`}
          rows={18}
          error={error}
          hint={hint ?? "Supports JSON5 and trailing commas"}
        />
        <TextAreaBox
          label="Output"
          value={output}
          readOnly
          rows={18}
          placeholder="Formatted output will appear here..."
          actions={output ? <CopyButton text={output} size="sm" /> : undefined}
        />
      </div>

      {/* Format button (shown when auto-format is off) */}
      {!autoFormat && (
        <button
          onClick={handleFormat}
          disabled={!input.trim()}
          className="
            w-full py-2.5 rounded-xl text-sm font-medium
            bg-violet-600 hover:bg-violet-700
            disabled:opacity-40 disabled:cursor-not-allowed
            text-white transition-colors
          "
        >
          {mode === "minify" ? "Minify JSON" : "Format JSON"}
        </button>
      )}

      {/* Stats bar */}
      {stats && type && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400 dark:text-gray-500 px-1">
          {[
            { label: "Type",       value: type },
            { label: "Keys",       value: stats.keys.toLocaleString() },
            { label: "Depth",      value: `${stats.depth} levels` },
            { label: "Lines",      value: stats.lines.toLocaleString() },
            { label: "Characters", value: stats.characters.toLocaleString() },
          ].map(({ label, value }) => (
            <span key={label}>
              <span className="text-gray-300 dark:text-gray-600">{label}: </span>
              {value}
            </span>
          ))}
        </div>
      )}

    </div>
  )
}