"use client"

import { useState, useCallback, useRef } from "react"
import {
  generateAllHashes,
  hashFile,
  verifyHash,
  ALGORITHMS,
  ALGORITHM_META,
} from "@/utils/hashGenerator"
import type {
  HashAlgorithm,
  HashAllResult,
  HashResult,
} from "@/utils/hashGenerator"
import CopyButton from "@/components/CopyButton"

type Tab    = "text" | "file" | "verify"
type Format = "hex"  | "base64"

// ── Sub-components ────────────────────────────────────────────────────────────

function AlgorithmRow({
  algorithm,
  result,
  format,
  isExpanded,
  onToggle,
}: {
  algorithm:  HashAlgorithm
  result:     HashResult
  format:     Format
  isExpanded: boolean
  onToggle:   () => void
}) {
  const meta = ALGORITHM_META[algorithm]

  return (
    <div className={`
      border-b border-gray-100 dark:border-gray-800 last:border-0
      transition-colors
      ${!meta.secure ? "bg-red-50/30 dark:bg-red-900/5" : ""}
    `}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
        onClick={onToggle}
      >
        {/* Algorithm label */}
        <div className="w-20 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-semibold text-gray-700 dark:text-gray-300">
              {algorithm}
            </span>
            {!meta.secure && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                ⚠
              </span>
            )}
          </div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            {meta.bits} bits
          </div>
        </div>

        {/* Hash value */}
        <div className="flex-1 min-w-0">
          {result.ok ? (
            <span className="textarea-mono text-xs text-gray-700 dark:text-gray-300 break-all leading-relaxed">
              {result.hash}
            </span>
          ) : (
            <span className="text-xs text-red-500 dark:text-red-400 italic">
              {result.error}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {result.ok && <CopyButton text={result.hash} size="sm" />}
          <span className="text-gray-300 dark:text-gray-600 text-xs select-none">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="pt-2 space-y-1.5">
            <p className={`text-xs ${
              meta.secure
                ? "text-green-600 dark:text-green-400"
                : "text-red-500 dark:text-red-400"
            }`}>
              {meta.secure ? "✓ Cryptographically secure" : `⚠ ${meta.warning}`}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {meta.note}
            </p>
            {result.ok && (
              <div className="stats-bar pt-1">
                {[
                  { label: "Output bits",  value: result.stats.outputBits  },
                  { label: "Output bytes", value: result.stats.outputBytes },
                  { label: "Hash chars",   value: result.stats.outputChars },
                  { label: "Input bytes",  value: result.stats.inputBytes  },
                ].map(({ label, value }) => (
                  <span key={label}>
                    <span className="stats-label">{label}: </span>
                    {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FileDropZone({
  onFile,
  file,
  loading,
}: {
  onFile:  (f: File) => void
  file:    File | null
  loading: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
      onClick={() => inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-3
        border-2 border-dashed rounded-xl px-6 py-10
        cursor-pointer transition-colors
        ${dragging
          ? "border-violet-400 bg-violet-50 dark:bg-violet-900/20"
          : file
          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
          : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />

      {loading ? (
        <>
          <div className="w-8 h-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hashing file...
          </p>
        </>
      ) : file ? (
        <>
          <span className="text-2xl">📄</span>
          <div className="text-center space-y-0.5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {file.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {(file.size / 1024).toFixed(1)} KB — click to change
            </p>
          </div>
        </>
      ) : (
        <>
          <span className="text-2xl text-gray-300 dark:text-gray-600">
            📎
          </span>
          <div className="text-center space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drop a file here to hash it
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              or click to browse — any file type, up to 10MB
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HashGeneratorPage() {
  const [tab,             setTab]             = useState<Tab>("text")
  const [input,           setInput]           = useState("")
  const [format,          setFormat]          = useState<Format>("hex")
  const [results,         setResults]         = useState<HashAllResult | null>(null)
  const [expanded,        setExpanded]        = useState<HashAlgorithm | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [file,            setFile]            = useState<File | null>(null)
  const [fileResults,     setFileResults]     = useState<HashAllResult | null>(null)

  // ── Verify state (renamed to avoid conflict with verifyHash function) ──────
  const [verifyInput,     setVerifyInput]     = useState("")
  const [verifyHashInput, setVerifyHashInput] = useState("")   // ← renamed
  const [verifyAlgo,      setVerifyAlgo]      = useState<HashAlgorithm>("SHA-256")
  const [verifyResult,    setVerifyResult]    = useState<{ match: boolean; actual: string } | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Text hashing ───────────────────────────────────────────────────────────

  const runText = useCallback((text: string, fmt: Format) => {
    if (!text.trim()) { setResults(null); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const res = await generateAllHashes(text, fmt)
      setResults(res)
    }, 150)
  }, [])

  const handleInput = (val: string) => {
    setInput(val)
    runText(val, format)
  }

  const handleFormat = (fmt: Format) => {
    setFormat(fmt)
    runText(input, fmt)
    if (file) runFile(file, fmt)
  }

  // ── File hashing ───────────────────────────────────────────────────────────

  const runFile = useCallback(async (f: File, fmt: Format) => {
    setLoading(true)
    const entries = await Promise.all(
      ALGORITHMS.map(async (alg) => [alg, await hashFile(f, alg, fmt)] as const)
    )
    setFileResults(Object.fromEntries(entries) as HashAllResult)
    setLoading(false)
  }, [])

  const handleFile = (f: File) => {
    setFile(f)
    runFile(f, format)
  }

  // ── Verify ─────────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    if (!verifyInput.trim() || !verifyHashInput.trim()) return
    const res = await verifyHash(verifyInput, verifyHashInput, verifyAlgo)  // ← no conflict
    setVerifyResult(res)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeResults = tab === "file" ? fileResults : results
  const sha256        = activeResults?.["SHA-256"]
  const inputBytes    = sha256?.ok ? sha256.stats.inputBytes : null

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-xs">
            ##
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Hash Generator
          </h1>
          {activeResults && (
            <span className="badge badge-violet">
              {ALGORITHMS.length} algorithms
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text or files.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["text", "file", "verify"] as Tab[]).map((t) => (
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

      {/* Format toggle */}
      <div className="flex items-center gap-3">
        <span className="section-label">Output format</span>
        <div className="toggle-group">
          {(["hex", "base64"] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFormat(f)}
              className={format === f ? "toggle-item-active" : "toggle-item"}
            >
              {f === "hex" ? "Hex" : "Base64"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Text tab ──────────────────────────────────────────────────────── */}
      {tab === "text" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="section-label">Input</span>
              {inputBytes !== null && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {inputBytes.toLocaleString()} bytes
                </span>
              )}
            </div>
            <textarea
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Type or paste text to hash..."
              rows={5}
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

          {/* Sample inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">Try:</span>
            {[
              { label: "Empty string", value: ""                                              },
              { label: '"hello"',      value: "hello"                                         },
              { label: '"password"',   value: "password"                                      },
              { label: "Pangram",      value: "The quick brown fox jumps over the lazy dog"   },
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => handleInput(value)}
                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── File tab ──────────────────────────────────────────────────────── */}
      {tab === "file" && (
        <FileDropZone
          onFile={handleFile}
          file={file}
          loading={loading}
        />
      )}

      {/* ── Verify tab ────────────────────────────────────────────────────── */}
      {tab === "verify" && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="section-label">Input text</span>
            <textarea
              value={verifyInput}
              onChange={(e) => { setVerifyInput(e.target.value); setVerifyResult(null) }}
              placeholder="Enter the original text..."
              rows={4}
              spellCheck={false}
              className="
                w-full textarea-mono resize-none rounded-xl px-4 py-3
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="section-label">Expected hash</span>
              <div className="toggle-group">
                {ALGORITHMS.map((alg) => (
                  <button
                    key={alg}
                    onClick={() => { setVerifyAlgo(alg); setVerifyResult(null) }}
                    className={verifyAlgo === alg ? "toggle-item-active" : "toggle-item"}
                  >
                    {alg}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={verifyHashInput}
              onChange={(e) => { setVerifyHashInput(e.target.value); setVerifyResult(null) }}
              placeholder={`Paste expected ${verifyAlgo} hash...`}
              spellCheck={false}
              className="
                w-full textarea-mono px-4 py-3 rounded-xl border
                bg-white dark:bg-gray-900
                text-gray-900 dark:text-gray-100
                placeholder:text-gray-400 dark:placeholder:text-gray-600
                border-gray-200 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-offset-0
                focus:border-violet-400 dark:focus:border-violet-600
                focus:ring-violet-400/20 transition-colors
              "
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={!verifyInput.trim() || !verifyHashInput.trim()}
            className="btn-primary"
          >
            Verify hash
          </button>

          {verifyResult && (
            <div className={`
              card rounded-xl p-5 animate-in
              ${verifyResult.match
                ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
                : "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
              }
            `}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">
                  {verifyResult.match ? "✓" : "✕"}
                </span>
                <p className={`text-sm font-semibold ${
                  verifyResult.match
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {verifyResult.match ? "Hash matches!" : "Hash does not match"}
                </p>
              </div>
              {!verifyResult.match && verifyResult.actual && (
                <div className="space-y-2 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-gray-400 dark:text-gray-500">Expected:</p>
                    <p className="textarea-mono text-red-600 dark:text-red-400 break-all">
                      {verifyHashInput}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-gray-400 dark:text-gray-500">Actual:</p>
                    <p className="textarea-mono text-gray-700 dark:text-gray-300 break-all">
                      {verifyResult.actual}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {activeResults && (
        <div className="space-y-3 animate-in">
          <div className="flex items-center justify-between">
            <span className="section-label">
              {tab === "file" && file ? `Hashes for ${file.name}` : "All hashes"}
            </span>
            <button
              onClick={() => setExpanded(null)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Collapse all
            </button>
          </div>

          <div className="card rounded-xl overflow-hidden">
            {ALGORITHMS.map((alg) => (
              <AlgorithmRow
                key={alg}
                algorithm={alg}
                result={activeResults[alg]}
                format={format}
                isExpanded={expanded === alg}
                onToggle={() => setExpanded((prev) => prev === alg ? null : alg)}
              />
            ))}
          </div>

          {/* Security legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Secure
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Deprecated / broken
            </span>
          </div>
        </div>
      )}

    </div>
  )
}