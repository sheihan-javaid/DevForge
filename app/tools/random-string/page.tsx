"use client"

import { useState, useCallback } from "react"
import {
  generateRandomString,
  PRESETS,
  DEFAULT_OPTIONS,
  CHARSET_META,
} from "@/utils/randomString"
import type {
  StringOptions,
  StringCharset,
  StringFormat,
  StringResult,
} from "@/utils/randomString"
import CopyButton from "@/components/CopyButton"

// ── Sub-components ────────────────────────────────────────────────────────────

function StringRow({
  value,
  index,
}: {
  value: string
  index: number
}) {
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
      </div>
      <CopyButton text={value} size="sm" />
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
  const presets = [1, 5, 10, 25, 50]

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
        onChange={(e) => onChange(Math.max(1, Math.min(1000, Number(e.target.value))))}
        className="w-20 text-center text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RandomStringPage() {
  const [options,      setOptions]      = useState<StringOptions>(DEFAULT_OPTIONS)
  const [result,       setResult]       = useState<StringResult | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // ── Run ────────────────────────────────────────────────────────────────────

  const run = useCallback((opts: StringOptions) => {
    setResult(generateRandomString(opts))
  }, [])

  const updateOptions = (patch: Partial<StringOptions>) => {
    const next = { ...options, ...patch }
    setOptions(next)
    setActivePreset(null)
    if (result) run(next)
  }

  const applyPreset = (label: string, presetOpts: Partial<StringOptions>) => {
    const next = { ...DEFAULT_OPTIONS, ...presetOpts }
    setOptions(next)
    setActivePreset(label)
    run(next)
  }

  const handleGenerate = () => {
    run(options)
    setActivePreset(null)
  }

  const handleClear = () => {
    setResult(null)
    setActivePreset(null)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const allStrings = result?.strings.join("\n") ?? ""

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-sm">
            Aa
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Random String Generator
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate random strings with custom length, charset, and output format.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="section-label">Presets</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.label, preset.options)}
              className={`
                text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
                ${activePreset === preset.label
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400"
                }
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="card rounded-xl p-5 space-y-5">

        {/* Length */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="section-label">Length</span>
            <span className="text-sm font-mono font-semibold text-violet-700 dark:text-violet-400">
              {options.length}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={256}
            value={options.length}
            onChange={(e) => updateOptions({ length: Number(e.target.value) })}
            className="w-full accent-violet-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
            <span>1</span>
            <span>64</span>
            <span>128</span>
            <span>256</span>
          </div>
        </div>

        {/* Charset */}
        <div className="space-y-2">
          <span className="section-label">Charset</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(CHARSET_META) as StringCharset[])
              .filter((c) => c !== "custom")
              .map((charset) => {
                const meta = CHARSET_META[charset]
                return (
                  <button
                    key={charset}
                    onClick={() => updateOptions({ charset })}
                    className={`
                      flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border
                      text-left transition-colors
                      ${options.charset === charset
                        ? "border-violet-500 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700"
                      }
                    `}
                  >
                    <span className={`text-xs font-semibold ${
                      options.charset === charset
                        ? "text-violet-700 dark:text-violet-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                      {meta.example}
                    </span>
                  </button>
                )
              })}
          </div>

          {/* Custom charset input */}
          <button
            onClick={() => updateOptions({ charset: "custom" })}
            className={`
              w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border
              text-left transition-colors text-xs
              ${options.charset === "custom"
                ? "border-violet-500 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700"
              }
            `}
          >
            <span className={`font-semibold ${
              options.charset === "custom"
                ? "text-violet-700 dark:text-violet-400"
                : "text-gray-700 dark:text-gray-300"
            }`}>
              Custom
            </span>
            <span className="text-gray-400 dark:text-gray-500">
              Define your own characters
            </span>
          </button>

          {options.charset === "custom" && (
            <input
              type="text"
              value={options.customChars}
              onChange={(e) => updateOptions({ customChars: e.target.value })}
              placeholder="Enter characters to use e.g. ABC123!@#"
              spellCheck={false}
              autoComplete="off"
              className="
                w-full textarea-mono px-4 py-2.5 rounded-xl border text-sm
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                border-gray-200 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-offset-0
                focus:border-violet-400 dark:focus:border-violet-600
                focus:ring-violet-400/20 transition-colors
              "
            />
          )}
        </div>

        {/* Output format */}
        <div className="space-y-2">
          <span className="section-label">Output format</span>
          <div className="toggle-group">
            {(["lines", "array", "json", "csv"] as StringFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => updateOptions({ format: f })}
                className={options.format === f ? "toggle-item-active" : "toggle-item"}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="section-label">Count</span>
          <CountStepper
            value={options.count}
            onChange={(count) => updateOptions({ count })}
          />
        </div>

        {/* Advanced options */}
        <div className="space-y-0 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden px-4 pt-2 pb-0">
          <p className="section-label pb-2">Advanced</p>

          {/* No duplicate strings */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unique strings only
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                No duplicate strings in the batch
              </p>
            </div>
            <button
              role="switch"
              aria-checked={options.unique}
              onClick={() => updateOptions({ unique: !options.unique })}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full
                transition-colors shrink-0 cursor-pointer
                ${options.unique ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}
              `}
            >
              <span className={`
                inline-block h-3.5 w-3.5 rounded-full bg-white shadow
                transition-transform
                ${options.unique ? "translate-x-4.5" : "translate-x-0.5"}
              `} />
            </button>
          </div>

          {/* No duplicate chars */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No repeated characters
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Each character appears at most once per string
              </p>
            </div>
            <button
              role="switch"
              aria-checked={options.noDuplicateChars}
              onClick={() => updateOptions({ noDuplicateChars: !options.noDuplicateChars })}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full
                transition-colors shrink-0 cursor-pointer
                ${options.noDuplicateChars ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}
              `}
            >
              <span className={`
                inline-block h-3.5 w-3.5 rounded-full bg-white shadow
                transition-transform
                ${options.noDuplicateChars ? "translate-x-4.5" : "translate-x-0.5"}
              `} />
            </button>
          </div>

          {/* Prefix */}
          <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Prefix
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Prepended to every string
              </p>
            </div>
            <input
              type="text"
              value={options.prefix}
              onChange={(e) => updateOptions({ prefix: e.target.value })}
              placeholder="e.g. usr_"
              spellCheck={false}
              className="
                w-32 textarea-mono text-xs px-3 py-1.5 rounded-lg border
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                border-gray-200 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-violet-400/20
                transition-colors
              "
            />
          </div>

          {/* Suffix */}
          <div className="flex items-center justify-between gap-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Suffix
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Appended to every string
              </p>
            </div>
            <input
              type="text"
              value={options.suffix}
              onChange={(e) => updateOptions({ suffix: e.target.value })}
              placeholder="e.g. _token"
              spellCheck={false}
              className="
                w-32 textarea-mono text-xs px-3 py-1.5 rounded-lg border
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                border-gray-200 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-violet-400/20
                transition-colors
              "
            />
          </div>
        </div>

      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="btn-primary"
      >
        Generate {options.count} string{options.count > 1 ? "s" : ""}
      </button>

      {/* Results */}
      {result && result.strings.length > 0 && (
        <div className="space-y-3 animate-in">

          {/* Stats bar */}
          <div className="flex items-center justify-between">
            <div className="stats-bar flex-1">
              {[
                { label: "Count",    value: result.stats.count                        },
                { label: "Length",   value: result.stats.length                       },
                { label: "Pool",     value: `${result.stats.poolSize} chars`          },
                { label: "Entropy",  value: `${result.stats.entropy} bits`            },
                { label: "Unique",   value: result.stats.unique ? "Yes" : "No"        },
              ].map(({ label, value }) => (
                <span key={label}>
                  <span className="stats-label">{label}: </span>
                  {value}
                </span>
              ))}
            </div>
          </div>

          {/* Output card */}
          <div className="card rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <span className="section-label">
                {result.strings.length} string{result.strings.length > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
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
                <CopyButton text={allStrings} size="sm" />
              </div>
            </div>

            {/* String list */}
            <div className="max-h-80 overflow-y-auto">
              {result.strings.map((str, i) => (
                <StringRow key={i} value={str} index={i} />
              ))}
            </div>
          </div>

          {/* Formatted output */}
          {options.format !== "lines" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="section-label">
                  {options.format.toUpperCase()} output
                </span>
                <CopyButton text={result.output} size="sm" />
              </div>
              <pre className="
                card rounded-xl p-4
                textarea-mono text-xs
                text-gray-600 dark:text-gray-400
                overflow-x-auto whitespace-pre-wrap
                max-h-48 overflow-y-auto
              ">
                {result.output}
              </pre>
            </div>
          )}

        </div>
      )}

      {/* Empty pool warning */}
      {result && result.strings.length === 0 && (
        <div className="card rounded-xl p-5 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 animate-in">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            ⚠ Empty character pool
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
            Your custom charset is empty. Add some characters to generate strings.
          </p>
        </div>
      )}

    </div>
  )
}