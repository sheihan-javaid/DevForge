"use client"

import { useState, useCallback } from "react"
import {
  convertCase,
  convertAll,
  detectCase,
  CASE_META,
  CASE_GROUPS,
  ALL_CASES,
} from "@/utils/stringCase"
import type {
  CaseType,
  CaseGroup,
} from "@/utils/stringCase"
import CopyButton from "@/components/CopyButton"

// ── Sub-components ────────────────────────────────────────────────────────────

function CaseCard({
  caseType,
  value,
  isActive,
  onClick,
}: {
  caseType: CaseType
  value:    string
  isActive: boolean
  onClick:  () => void
}) {
  const meta = CASE_META[caseType]

  return (
    <div
      onClick={onClick}
      className={`
        group relative card rounded-xl p-4 cursor-pointer
        transition-all duration-150
        ${isActive
          ? "border-violet-500 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500 dark:ring-violet-600"
          : "hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
        }
      `}
    >
      {/* Label */}
      <div className={`
        text-xs font-semibold mb-1.5 font-mono
        ${isActive
          ? "text-violet-700 dark:text-violet-400"
          : "text-gray-500 dark:text-gray-400"
        }
      `}>
        {meta.label}
      </div>

      {/* Output value */}
      <div className={`
        text-sm font-mono break-all leading-relaxed mb-3
        ${value
          ? isActive
            ? "text-violet-900 dark:text-violet-100"
            : "text-gray-800 dark:text-gray-200"
          : "text-gray-300 dark:text-gray-600 italic text-xs"
        }
      `}>
        {value || meta.example}
      </div>

      {/* Description */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
        {meta.description}
      </p>

      {/* Copy button — shown on hover or when active */}
      {value && (
        <div
          className={`
            absolute top-3 right-3
            opacity-0 group-hover:opacity-100 transition-opacity
            ${isActive ? "opacity-100" : ""}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <CopyButton text={value} size="sm" />
        </div>
      )}
    </div>
  )
}

function GroupSection({
  group,
  cases,
  results,
  activeCase,
  onSelect,
}: {
  group:      CaseGroup
  cases:      CaseType[]
  results:    Record<CaseType, string>
  activeCase: CaseType | null
  onSelect:   (c: CaseType) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="section-label">{group}</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cases.map((caseType) => (
          <CaseCard
            key={caseType}
            caseType={caseType}
            value={results[caseType] ?? ""}
            isActive={activeCase === caseType}
            onClick={() => onSelect(caseType)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StringCasePage() {
  const [input,      setInput]      = useState("")
  const [results,    setResults]    = useState<Record<CaseType, string>>({} as Record<CaseType, string>)
  const [activeCase, setActiveCase] = useState<CaseType | null>(null)
  const [detected,   setDetected]   = useState<CaseType | null>(null)
  const [hasRun,     setHasRun]     = useState(false)

  // ── Run ────────────────────────────────────────────────────────────────────

  const run = useCallback((text: string) => {
    if (!text.trim()) {
      setResults({} as Record<CaseType, string>)
      setDetected(null)
      setHasRun(false)
      return
    }
    setResults(convertAll(text))
    setDetected(detectCase(text))
    setHasRun(true)
  }, [])

  const handleInput = (val: string) => {
    setInput(val)
    run(val)
  }

  const handleClear = () => {
    setInput("")
    setResults({} as Record<CaseType, string>)
    setDetected(null)
    setActiveCase(null)
    setHasRun(false)
  }

  const loadSample = (sample: string) => {
    setInput(sample)
    run(sample)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeResult = activeCase ? results[activeCase] : null
  const activeStats  = activeCase && input
    ? convertCase(input, activeCase).stats
    : null

  const SAMPLES = [
    { label: "camelCase",   value: "myVariableName"     },
    { label: "snake_case",  value: "my_variable_name"   },
    { label: "kebab-case",  value: "my-variable-name"   },
    { label: "Sentence",    value: "Hello world example" },
    { label: "PascalCase",  value: "MyVariableName"     },
  ]

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-sm">
            Aa
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            String Case Converter
          </h1>
          {detected && (
            <span className="badge badge-violet">
              Detected: {CASE_META[detected].label}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Convert strings between camelCase, snake_case, kebab-case, PascalCase, and more.
        </p>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="section-label">Input</span>
          <button onClick={handleClear} className="toolbar-btn-danger">
            Clear
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Type or paste your string here..."
          rows={3}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
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

        {/* Sample inputs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Try:
          </span>
          {SAMPLES.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => loadSample(value)}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 font-mono transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Active selection panel */}
      {activeCase && activeResult && (
        <div className="card rounded-xl overflow-hidden animate-in">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-violet-50 dark:bg-violet-900/20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-widest">
                {CASE_META[activeCase].label}
              </span>
              {activeStats && (
                <span className="text-xs text-violet-500 dark:text-violet-500">
                  — {activeStats.changed} chars changed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCase(null)}
                className="text-xs text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                Dismiss
              </button>
              <CopyButton text={activeResult} size="sm" />
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="textarea-mono text-sm text-gray-900 dark:text-gray-100 break-all leading-relaxed">
              {activeResult}
            </p>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {hasRun && input && (
        <div className="stats-bar">
          {[
            { label: "Characters", value: input.length.toLocaleString()                   },
            { label: "Words",      value: input.trim().split(/\s+/).filter(Boolean).length },
            { label: "Cases",      value: ALL_CASES.length                                 },
            ...(detected ? [{ label: "Detected", value: CASE_META[detected].label }] : []),
          ].map(({ label, value }) => (
            <span key={label}>
              <span className="stats-label">{label}: </span>
              {value}
            </span>
          ))}
        </div>
      )}

      {/* Case grid grouped by category */}
      {hasRun && (
        <div className="space-y-8 animate-in">
          {CASE_GROUPS.map((group) => {
            const groupCases = ALL_CASES.filter(
              (c) => CASE_META[c].group === group
            )
            return (
              <GroupSection
                key={group}
                group={group}
                cases={groupCases}
                results={results}
                activeCase={activeCase}
                onSelect={(c) =>
                  setActiveCase((prev) => (prev === c ? null : c))
                }
              />
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!hasRun && (
        <div className="text-center py-16 space-y-3">
          <div className="text-4xl font-mono text-gray-200 dark:text-gray-700">
            Aa
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Type something above to see all {ALL_CASES.length} case conversions instantly.
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            Supports camelCase, snake_case, kebab-case, PascalCase, SCREAMING_SNAKE, slug, and more.
          </p>
        </div>
      )}

    </div>
  )
}