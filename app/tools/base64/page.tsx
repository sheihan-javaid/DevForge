"use client"

import { useState, useCallback } from "react"
import {
  encodeBase64,
  decodeBase64,
  encodeFileBase64,
  looksLikeBase64,
} from "@/utils/base64"
import type { Base64Result, Base64Stats, Base64Variant } from "@/utils/base64"
import TextAreaBox from "@/components/TextAreaBox"
import CopyButton from "@/components/CopyButton"

type Mode = "encode" | "decode"

const SAMPLE_TEXT   = "Hello from DevForge! 🚀 Encode me."
const SAMPLE_BASE64 = "SGVsbG8gZnJvbSBEZXZGb3JnZSEg8J+agCBFbmNvZGUgbWUu"

export default function Base64Tool() {
  const [input,   setInput]   = useState("")
  const [mode,    setMode]    = useState<Mode>("encode")
  const [variant, setVariant] = useState<Base64Variant>("standard")
  const [result,  setResult]  = useState<Base64Result | null>(null)
  const [dragging, setDragging] = useState(false)

  // ── Core run ───────────────────────────────────────────────────────────────

  const run = useCallback((raw: string, m: Mode, v: Base64Variant) => {
    if (!raw.trim()) { setResult(null); return }
    setResult(m === "encode" ? encodeBase64(raw, v) : decodeBase64(raw, v))
  }, [])

  const handleInput = (val: string) => {
    setInput(val)
    // Auto-switch to decode when pasted input looks like Base64
    const nextMode = looksLikeBase64(val.trim()) ? "decode" : mode
    if (nextMode !== mode) setMode(nextMode)
    run(val, nextMode, variant)
  }

  const handleModeChange = (m: Mode) => {
    setMode(m)
    run(input, m, variant)
  }

  const handleVariantChange = (v: Base64Variant) => {
    setVariant(v)
    run(input, mode, v)
  }

  // ── File drop ──────────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    setMode("encode")
    setInput(`[File: ${file.name} — ${(file.size / 1024).toFixed(1)} KB]`)
    const res = await encodeFileBase64(file)
    setResult(res)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const loadSample = () => {
    const val = mode === "encode" ? SAMPLE_TEXT : SAMPLE_BASE64
    setInput(val)
    run(val, mode, variant)
  }

  const handleClear = () => {
    setInput("")
    setResult(null)
  }

  const swap = () => {
    if (result?.ok) {
      const next = mode === "encode" ? "decode" : "encode"
      setInput(result.output)
      setMode(next)
      run(result.output, next, variant)
    }
  }

  const output = result?.ok ? result.output : ""
  const error  = result && !result.ok ? result.error : undefined
  const hint   = result && !result.ok ? result.hint  : undefined
  const stats  = result?.ok ? result.stats : null

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-sm">
            64
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Base64 Encoder / Decoder
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Encode text or files to Base64, or decode Base64 strings back to plain text.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Mode */}
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          {(["encode", "decode"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
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

        {/* Variant */}
        <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          {(["standard", "urlsafe"] as Base64Variant[]).map((v) => (
            <button
              key={v}
              onClick={() => handleVariantChange(v)}
              className={`
                px-3.5 py-1.5 font-medium transition-colors
                ${variant === v
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              `}
            >
              {v === "urlsafe" ? "URL-safe" : "Standard"}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={loadSample}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Load sample
        </button>
        <button
          onClick={handleClear}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:text-red-400 dark:hover:border-red-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* File drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative flex items-center justify-center gap-3
          border-2 border-dashed rounded-xl px-6 py-4
          text-sm transition-colors cursor-default
          ${dragging
            ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
            : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
          }
        `}
      >
        <span className="text-base">📎</span>
        <span>Drop any file here to encode it to Base64</span>
        <label className="ml-1 underline underline-offset-2 cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
          or browse
          <input
            type="file"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </label>
      </div>

      {/* Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TextAreaBox
          label={mode === "encode" ? "Plain text" : "Base64 input"}
          value={input}
          onChange={handleInput}
          placeholder={
            mode === "encode"
              ? "Type or paste text to encode..."
              : "Paste a Base64 string to decode..."
          }
          rows={16}
          error={error}
          hint={hint}
        />
        <TextAreaBox
          label={mode === "encode" ? "Base64 output" : "Decoded text"}
          value={output}
          readOnly
          rows={16}
          placeholder="Output will appear here..."
          actions={
            output ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={swap}
                  title="Use output as new input"
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
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-400 dark:text-gray-500 px-1">
          {[
            { label: "Input",   value: `${stats.inputBytes.toLocaleString()} bytes` },
            { label: "Output",  value: `${stats.outputBytes.toLocaleString()} bytes` },
            { label: "Ratio",   value: stats.ratio },
            { label: "Padding", value: stats.isPadded ? "Yes" : "No" },
            { label: "Variant", value: variant === "urlsafe" ? "URL-safe" : "Standard" },
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