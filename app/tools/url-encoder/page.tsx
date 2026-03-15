"use client"

import { useState, useCallback } from "react"
import {
  encodeURL,
  decodeURL,
  parseURL,
  looksEncoded,
  PRESETS,
  VARIANT_META,
} from "@/utils/urlEncoder"
import type { URLMode, URLVariant, URLStats } from "@/utils/urlEncoder"
import CopyButton from "@/components/CopyButton"
import TextAreaBox from "@/components/TextAreaBox"

// ── Main page ─────────────────────────────────────────────────────────────────

export default function URLEncoderPage() {
  const [input,   setInput]   = useState("")
  const [mode,    setMode]    = useState<URLMode>("encode")
  const [variant, setVariant] = useState<URLVariant>("component")
  const [output,  setOutput]  = useState("")
  const [error,   setError]   = useState<string | undefined>()
  const [hint,    setHint]    = useState<string | undefined>()
  const [stats,   setStats]   = useState<URLStats | null>(null)

  // ── Core run ───────────────────────────────────────────────────────────────

  const run = useCallback((raw: string, m: URLMode, v: URLVariant) => {
    if (!raw.trim()) {
      setOutput(""); setError(undefined)
      setHint(undefined); setStats(null)
      return
    }

    const result = m === "encode"
      ? encodeURL(raw, v)
      : decodeURL(raw, v)

    if (result.ok) {
      setOutput(result.output)
      setStats(result.stats)
      setError(undefined)
      setHint(undefined)
    } else {
      setOutput("")
      setStats(null)
      setError(result.error)
      setHint(result.hint)
    }
  }, [])

  const handleInput = (val: string) => {
    setInput(val)
    // Auto-switch mode based on content
    const nextMode = looksEncoded(val.trim()) ? "decode" : mode
    if (nextMode !== mode) setMode(nextMode)
    run(val, nextMode, variant)
  }

  const handleModeChange = (m: URLMode) => {
    setMode(m); run(input, m, variant)
  }

  const handleVariantChange = (v: URLVariant) => {
    setVariant(v); run(input, mode, v)
  }

  const loadPreset = (index: number) => {
    const preset = PRESETS[index]
    setInput(preset.input)
    setMode(preset.mode)
    setVariant(preset.variant)
    run(preset.input, preset.mode, preset.variant)
  }

  const handleClear = () => {
    setInput(""); setOutput("")
    setError(undefined); setHint(undefined); setStats(null)
  }

  const swap = () => {
    if (output) {
      const nextMode = mode === "encode" ? "decode" : "encode"
      setInput(output)
      setMode(nextMode)
      run(output, nextMode, variant)
    }
  }

  // ── Parsed URL ─────────────────────────────────────────────────────────────

  const parsed = input.trim().startsWith("http") ? parseURL(input) : null

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-xs">
            %20
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            URL Encoder / Decoder
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Encode or decode URL components, full URLs, and form data.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="section-label">Presets</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => loadPreset(i)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Mode */}
        <div className="toggle-group">
          {(["encode", "decode"] as URLMode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={mode === m ? "toggle-item-active" : "toggle-item"}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        {/* Variant */}
        <div className="toggle-group">
          {(Object.keys(VARIANT_META) as URLVariant[]).map((v) => (
            <button
              key={v}
              onClick={() => handleVariantChange(v)}
              title={VARIANT_META[v].description}
              className={variant === v ? "toggle-item-active" : "toggle-item"}
            >
              {VARIANT_META[v].label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button onClick={handleClear} className="toolbar-btn-danger">
          Clear
        </button>
      </div>

      {/* Variant description */}
      <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 px-1">
        {VARIANT_META[variant].description}
      </p>

      {/* Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TextAreaBox
          label={mode === "encode" ? "Plain text" : "Encoded input"}
          value={input}
          onChange={handleInput}
          placeholder={
            mode === "encode"
              ? "Type or paste text to encode..."
              : "Paste a URL-encoded string to decode..."
          }
          rows={10}
          error={error}
          hint={hint}
        />
        <TextAreaBox
          label={mode === "encode" ? "Encoded output" : "Decoded text"}
          value={output}
          readOnly
          rows={10}
          placeholder="Output will appear here..."
          actions={
            output ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={swap}
                  className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ⇄ Swap
                </button>
                <CopyButton text={output} size="sm" />
              </div>
            ) : undefined
          }
        />
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="stats-bar">
          {[
            { label: "Input",   value: `${stats.inputLength} chars`  },
            { label: "Output",  value: `${stats.outputLength} chars` },
            { label: "Ratio",   value: stats.ratio                   },
            { label: "Variant", value: VARIANT_META[variant].label   },
          ].map(({ label, value }) => (
            <span key={label}>
              <span className="stats-label">{label}: </span>
              {value}
            </span>
          ))}
        </div>
      )}

      {/* Parsed URL breakdown */}
      {parsed && (
        <div className="space-y-2 animate-in">
          <span className="section-label">URL breakdown</span>
          <div className="card rounded-xl overflow-hidden">

            {/* Parts */}
            {[
              { label: "Protocol", value: parsed.protocol },
              { label: "Host",     value: parsed.host     },
              { label: "Path",     value: parsed.pathname },
              { label: "Search",   value: parsed.search   },
              { label: "Hash",     value: parsed.hash     },
            ].filter(({ value }) => value).map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <span className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">
                  {label}
                </span>
                <span className="textarea-mono text-xs text-gray-700 dark:text-gray-300 flex-1 break-all">
                  {value}
                </span>
                <CopyButton text={value} size="sm" />
              </div>
            ))}

            {/* Query params */}
            {parsed.params.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <span className="section-label">Query params</span>
                <div className="space-y-1.5">
                  {parsed.params.map(({ key, value, decoded }) => (
                    <div key={key} className="flex items-start gap-3">
                      <span className="textarea-mono text-xs text-violet-600 dark:text-violet-400 w-32 shrink-0 pt-0.5">
                        {key}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <div className="textarea-mono text-xs text-gray-700 dark:text-gray-300 break-all">
                          {value}
                        </div>
                        {decoded !== value && (
                          <div className="textarea-mono text-xs text-green-600 dark:text-green-400 break-all">
                            → {decoded}
                          </div>
                        )}
                      </div>
                      <CopyButton text={decoded} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}